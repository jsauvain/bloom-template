// Bloom house-default tokens. Mirrors convex/defaultTokens.ts so the template
// renders coherently before the agent overwrites src/lib/tokens/active.ts with
// the vision-extracted tokens for the user's reference image.
import type { DesignTokens } from './types';

export const BLOOM_DEFAULT_TOKENS: DesignTokens = {
  palette: {
    mode: 'dark',
    background: '#0E0E10',
    surface: '#16161A',
    surfaceElevated: '#1E1E23',
    text: '#EDECE8',
    textMuted: '#8E8E94',
    primary: '#9DBF9E',
    accent: '#D4B896',
    border: '#26262C',
    semantic: { success: '#7CB7A0', warn: '#E0B176', error: '#D88787' },
  },
  typography: {
    headingFamily: 'Geist',
    bodyFamily: 'Geist',
    character: 'humanist',
    scaleRatio: 1.25,
    weightContrast: 'moderate',
  },
  spacing: { baseUnit: 8, density: 'comfortable' },
  radius: { character: 'soft', base: 12 },
  surfaces: { treatment: 'subtle-shadow' },
  motion: { vibe: 'snappy', springStiffness: 300, springDamping: 24 },
  layout: { grammar: 'dashboard', navStyle: 'bottom-tabs' },
  iconography: { style: 'line', weight: 'regular' },
  vibe: {
    descriptors: ['editorial', 'studio', 'muted'],
    referenceApps: ['Linear', 'Things 3'],
  },
};
