// TokenProvider — wraps the app, exposes useTokens() to primitives + screens.
//
// Why a context (not a module-level import): screens that grab tokens via
// useTokens() get re-rendered when the active token set changes. Reading the
// `ACTIVE_TOKENS` constant directly would skip the re-render and leave Metro's
// fast-refresh path needing a full reload to pick up the new theme.
import React, { createContext, useContext, useMemo } from 'react';
import { ACTIVE_TOKENS } from './active';
import type { DesignTokens } from './types';

const TokenContext = createContext<DesignTokens>(ACTIVE_TOKENS);

export function TokenProvider({
  tokens,
  children,
}: {
  tokens?: DesignTokens;
  children: React.ReactNode;
}) {
  // Allow an override via prop (useful for previews / tests). Defaults to the
  // module-level ACTIVE_TOKENS which the agent owns.
  const value = useMemo(() => tokens ?? ACTIVE_TOKENS, [tokens]);
  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useTokens(): DesignTokens {
  return useContext(TokenContext);
}
