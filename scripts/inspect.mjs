#!/usr/bin/env node
/**
 * Bloom runtime inspector.
 *
 * Drives the sandbox's chromium binary over the Chrome DevTools Protocol so a
 * single invocation produces BOTH a screenshot and a list of runtime errors
 * the app emitted while rendering. Replaces the legacy one-shot
 * `chromium --screenshot=...` invocation which was console-blind (Metro's
 * bundle log only sees compile-time errors; the running app's console is
 * where render failures, missing-import "ReferenceError"s, hooks-rule
 * violations, etc. surface).
 *
 * Output (stdout, one JSON object):
 *   { ok: true, screenshotPath, runtimeErrors: [...], console: [...] }
 *
 * Error semantics:
 *   - Anything the page logged via console.error / console.warn becomes a
 *     runtime error with `kind: "console-error" | "console-warn"`.
 *   - Uncaught exceptions (Runtime.exceptionThrown) become
 *     `kind: "uncaught-exception"`.
 *   - Failed network requests become `kind: "network-failed"`.
 *
 * Exit code is 0 even when errors are found — the caller decides how to
 * react. Non-zero exit means the inspector itself failed (chromium didn't
 * start, WebSocket couldn't connect, etc.).
 */
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const URL = process.env.BLOOM_INSPECT_URL ?? "http://localhost:3000/";
const SCREENSHOT_PATH = process.env.BLOOM_SCREENSHOT_PATH ?? "/tmp/bloom-shot.png";
// TES-108: ONE canonical device logical size shared across the whole pipeline —
// the live preview pane (Bloom app PreviewIframe DEVICE_W×DEVICE_H), the /apps
// card aspect, and this capture viewport all use 390×844 (iPhone 14/15). Keeping
// them identical means the screenshot the visual critic grades, the persisted
// gallery thumbnail, and the live phone preview all show the same RN-Web reflow.
const VIEWPORT_W = 390;
const VIEWPORT_H = 844;
const SETTLE_MS = Number(process.env.BLOOM_SETTLE_MS ?? 8000);
const HARD_TIMEOUT_MS = 30000;

// Chromium flags. `--remote-debugging-port=0` makes chromium pick a free port
// and print `DevTools listening on ws://...` to stderr; we parse that.
// `--user-data-dir` avoids singleton-lock issues across rapid re-invocations.
const CHROMIUM_BIN = process.env.CHROMIUM_BIN ?? "chromium";
const CHROMIUM_ARGS = [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--hide-scrollbars",
  `--window-size=${VIEWPORT_W},${VIEWPORT_H}`,
  "--remote-debugging-port=0",
  `--user-data-dir=/tmp/bloom-chrome-${Date.now()}`,
  "about:blank",
];

function fail(stage, err) {
  process.stdout.write(
    JSON.stringify({ ok: false, stage, error: String(err?.message ?? err) }) + "\n",
  );
  process.exit(1);
}

// 1. Spawn chromium and parse its stderr for the DevTools WebSocket URL.
const proc = spawn(CHROMIUM_BIN, CHROMIUM_ARGS, { stdio: ["ignore", "pipe", "pipe"] });
let stderrBuf = "";
let wsUrl = null;
const wsReady = new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("chromium did not advertise DevTools within 10s")), 10000);
  proc.stderr.on("data", (chunk) => {
    stderrBuf += chunk.toString();
    const m = stderrBuf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m && !wsUrl) {
      wsUrl = m[1];
      clearTimeout(timer);
      resolve(wsUrl);
    }
  });
  proc.on("error", reject);
  proc.on("exit", (code) => {
    if (!wsUrl) {
      clearTimeout(timer);
      reject(new Error(`chromium exited (code=${code}) before DevTools was ready. stderr: ${stderrBuf.slice(-400)}`));
    }
  });
});

let browserWs;
try {
  await wsReady;
} catch (err) {
  fail("chromium-launch", err);
}

// 2. CDP client. Bare-bones request/response + event dispatch over a single
//    WebSocket. We multiplex by `sessionId` to talk to a page target.
async function openCdp(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true });
    ws.addEventListener("error", (e) => reject(new Error(`WS error: ${e.message ?? "unknown"}`)), { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const listeners = new Set();
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${msg.error.code}: ${msg.error.message}`));
      else resolve(msg.result);
    } else if (msg.method) {
      for (const l of listeners) l(msg);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  const on = (cb) => listeners.add(cb);
  const close = () => ws.close();
  return { send, on, close };
}

let cdp;
try {
  cdp = await openCdp(browserWs ?? wsUrl);
} catch (err) {
  proc.kill("SIGKILL");
  fail("cdp-connect", err);
}

// 3. Open a target on the dev server URL and attach a session to it.
const runtimeErrors = [];
const consoleLog = [];

try {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });

  // Subscribe to domains. Order matters: enable Console + Runtime BEFORE
  // navigation so we don't miss errors fired during the initial bundle eval.
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  await cdp.send("Log.enable", {}, sessionId);

  cdp.on((msg) => {
    if (msg.sessionId !== sessionId) return;
    if (msg.method === "Runtime.exceptionThrown") {
      const ex = msg.params.exceptionDetails;
      runtimeErrors.push({
        kind: "uncaught-exception",
        text: ex.text ?? "Uncaught exception",
        message: ex.exception?.description ?? ex.exception?.value ?? "",
        url: ex.url,
        line: ex.lineNumber,
        column: ex.columnNumber,
      });
    } else if (msg.method === "Runtime.consoleAPICalled") {
      const { type, args, stackTrace } = msg.params;
      const text = (args ?? [])
        .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
        .join(" ");
      consoleLog.push({ type, text: text.slice(0, 800) });
      if (type === "error" || type === "warning") {
        runtimeErrors.push({
          kind: type === "error" ? "console-error" : "console-warn",
          text,
          stack: stackTrace?.callFrames?.slice(0, 3).map((f) => `${f.functionName}@${f.url}:${f.lineNumber}`).join("\n"),
        });
      }
    } else if (msg.method === "Log.entryAdded") {
      const e = msg.params.entry;
      if (e.level === "error" || e.level === "warning") {
        runtimeErrors.push({
          kind: e.level === "error" ? "log-error" : "log-warn",
          text: e.text,
          url: e.url,
        });
      }
    } else if (msg.method === "Network.loadingFailed") {
      // Ignore canceled requests; surface only true network failures.
      const { errorText, type, requestId } = msg.params;
      if (errorText && !errorText.includes("ERR_ABORTED")) {
        runtimeErrors.push({
          kind: "network-failed",
          text: `${type ?? "request"} failed: ${errorText}`,
          requestId,
        });
      }
    }
  });

  // Navigate. `Page.navigate` resolves once the load is initiated, not on
  // DOMContentLoaded — we wait for that via a Page.loadEventFired race
  // against SETTLE_MS so a hung page doesn't lock the inspector.
  const loadEvent = new Promise((resolve) => {
    cdp.on((m) => {
      if (m.sessionId === sessionId && m.method === "Page.loadEventFired") resolve();
    });
  });
  await cdp.send("Page.navigate", { url: URL }, sessionId);
  await Promise.race([loadEvent, sleep(HARD_TIMEOUT_MS).then(() => null)]);

  // Settle: give the app time to mount, fetch any data, and throw whatever
  // it's going to throw. The first React mount of an Expo Router app often
  // settles 1-3s after loadEventFired.
  await sleep(SETTLE_MS);

  // Capture screenshot via CDP.
  const shot = await cdp.send(
    "Page.captureScreenshot",
    { format: "png", captureBeyondViewport: false },
    sessionId,
  );
  writeFileSync(SCREENSHOT_PATH, Buffer.from(shot.data, "base64"));

  cdp.close();
  proc.kill("SIGKILL");
} catch (err) {
  proc.kill("SIGKILL");
  fail("cdp-session", err);
}

// 4. Emit one JSON line to stdout. Caller (convex/screenshot.ts) parses this.
process.stdout.write(
  JSON.stringify({
    ok: true,
    screenshotPath: SCREENSHOT_PATH,
    runtimeErrors,
    console: consoleLog.slice(0, 50),
  }) + "\n",
);
