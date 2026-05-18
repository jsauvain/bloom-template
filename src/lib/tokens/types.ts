// DesignTokens type. Mirrors the Zod schema in convex/designTokensSchema.ts —
// keep in lockstep with that file when fields change.

export const FONT_WHITELIST = [
  'Inter',
  'Geist',
  'Be Vietnam Pro',
  'Outfit',
  'Space Grotesk',
  'Manrope',
  'Plus Jakarta Sans',
  'Fraunces',
  'Crimson Pro',
  'Instrument Serif',
  'JetBrains Mono',
  'Geist Mono',
] as const;

export type FontFamily = (typeof FONT_WHITELIST)[number];

export type DesignTokens = {
  palette: {
    mode: 'light' | 'dark';
    background: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textMuted: string;
    primary: string;
    accent: string;
    border: string;
    semantic: { success: string; warn: string; error: string };
  };
  typography: {
    headingFamily: FontFamily;
    bodyFamily: FontFamily;
    character: 'geometric' | 'humanist' | 'serif' | 'editorial-mix' | 'technical';
    scaleRatio: number;
    weightContrast: 'subtle' | 'moderate' | 'strong';
  };
  spacing: {
    baseUnit: 4 | 8;
    density: 'airy' | 'comfortable' | 'dense';
  };
  radius: {
    character: 'sharp' | 'soft' | 'pill';
    base: number;
  };
  surfaces: {
    treatment: 'flat' | 'subtle-shadow' | 'glassmorphic' | 'textured' | 'grainy';
  };
  motion: {
    vibe: 'snappy' | 'soft' | 'playful' | 'still';
    springStiffness: number;
    springDamping: number;
  };
  layout: {
    grammar: 'feed' | 'dashboard' | 'canvas' | 'carded' | 'list-dense' | 'grid-loose';
    navStyle: 'bottom-tabs' | 'top-tabs' | 'drawer' | 'stack-only' | 'custom-floating';
  };
  iconography: {
    style: 'line' | 'fill' | 'duotone' | 'rounded' | 'geometric';
    weight: 'thin' | 'regular' | 'bold';
  };
  vibe: {
    descriptors: string[];
    referenceApps: string[];
  };
};
