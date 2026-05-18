// Web-only root document. Injects the curated Google Fonts whitelist as a
// single stylesheet link so primitives can use { fontFamily: 'Geist' } etc.
// without per-font npm packages. The Bloom preview ships only the web bundle;
// native font loading (expo-font) is out of scope for v1 and would add a
// per-family dependency for a target we don't demo.
//
// expo-router 55.0.14's `expo-router/html` exports ONLY `ScrollViewStyleReset`
// — `useServerDocumentContext` was added in a later SDK. The simpler pattern
// below is what 55.0.14 actually supports: no dynamic head/body attrs, just
// a fixed <html><head><link…/></head><body>{children}</body></html>.
import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2' +
  '?family=Inter:wght@400;500;600;700' +
  '&family=Geist:wght@400;500;600;700;800' +
  '&family=Be+Vietnam+Pro:wght@400;500;600;700' +
  '&family=Outfit:wght@400;500;600;700;800' +
  '&family=Space+Grotesk:wght@400;500;600;700' +
  '&family=Manrope:wght@400;500;600;700;800' +
  '&family=Plus+Jakarta+Sans:wght@400;500;600;700;800' +
  '&family=Fraunces:wght@300;400;500;600' +
  '&family=Crimson+Pro:wght@300;400;500;600' +
  '&family=Instrument+Serif' +
  '&family=JetBrains+Mono:wght@400;500;600' +
  '&family=Geist+Mono:wght@400;500;600' +
  '&display=swap';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={GOOGLE_FONTS_HREF} />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
