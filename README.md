# bloom-template

The Expo scaffold the [Bloom](https://github.com/jsauvain/BloomAssessment) AI
coding agent clones into a Daytona sandbox at the start of every thread.
Forked from [`expo/expo-template-default`](https://github.com/expo/expo-template-default)
(SDK 55, React Native 0.83) and extended with a token-driven design system
the agent composes against.

## The deal

The agent generates Mobbin-tier Expo apps from a natural-language prompt plus
an optional reference image. The reference image is reduced to a `DesignTokens`
object (palette, typography, motion, layout grammar, surface treatment, …) by a
vision pass. The agent's job is then to compose **screens** out of token-aware
primitives — it does not rebuild the design system per app.

That's the contract this template enforces.

## What's in the box

```
src/
  app/
    _layout.tsx        Root: TokenProvider + safe-area + gesture root + stack
    +html.tsx          Web-only: injects the curated Google Fonts whitelist
    index.tsx          Warm-canvas placeholder; agent overwrites
  lib/
    tokens/
      types.ts         DesignTokens type (mirrors the Zod schema)
      defaults.ts      BLOOM_DEFAULT_TOKENS — sage / charcoal / Geist
      active.ts        The agent overwrites THIS file per thread
      TokenProvider.tsx
      index.ts
    primitives/
      index.tsx        Surface, Stack, Display, Body, Caption, Press, Sheet,
                       Field, Icon, Motion, Pill, Divider (12 primitives)
```

## How the agent uses it

1. The Convex codegen system prompt instructs the agent to call
   `listFiles("/src/app")` + `readFile("/src/lib/primitives/index.tsx")` first.
2. The agent writes the chosen `DesignTokens` once to `src/lib/tokens/active.ts`.
3. The agent writes screen files under `src/app/` composed from `@/lib/primitives`.
4. Metro hot-reloads, the Daytona preview URL reflects the change.

The single-file write to `active.ts` retheme the whole app — the primitives
read tokens via `useTokens()`.

## Why no `expo-font` for the font whitelist

Loading a per-font npm package per family in the whitelist is high-friction for
zero demo benefit. The preview is web-only; injecting one stylesheet `<link>`
in `+html.tsx` covers all 12 families with no additional deps and no native-only
side effects.

## Run it locally

```bash
pnpm install      # or npm install
pnpm dev          # expo start --port 3000
```

Open `http://localhost:3000` in a browser. The warm-canvas placeholder renders
with the Bloom default theme. To preview a different theme without running the
agent, edit `src/lib/tokens/active.ts` and watch fast refresh.
