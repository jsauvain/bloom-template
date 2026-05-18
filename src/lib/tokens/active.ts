// The agent overwrites THIS file (only this file) with the tokens chosen for
// the current thread. TokenProvider imports `ACTIVE_TOKENS` from here, so
// changing this file is sufficient to retheme the whole app — primitives,
// typography, motion, and chrome all re-render off the new values.
import type { DesignTokens } from './types';
import { BLOOM_DEFAULT_TOKENS } from './defaults';

export const ACTIVE_TOKENS: DesignTokens = BLOOM_DEFAULT_TOKENS;
