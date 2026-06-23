// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://nextfour.app',
  // 'preserve' keeps each route's on-disk shape: index pages stay as
  // index.html (so / and /fr/ work), while the legal routes emit flat files
  // (privacy.html, fr/privacy.html, ...). This preserves the existing public
  // URLs already submitted to the App Store / Play Store and linked across the
  // site, and gives the per-locale homepages clean /fr/ URLs.
  build: { format: 'preserve' },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: {
      // English keeps the bare URLs (/privacy.html); other locales are
      // prefixed (/fr/privacy.html).
      prefixDefaultLocale: false,
    },
  },
});
