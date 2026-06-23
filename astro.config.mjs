// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://nextfour.app',
  // Output flat files (privacy.html, terms.html, ...) instead of directories
  // (privacy/index.html). This preserves the existing public URLs that are
  // already submitted to the App Store / Play Store and linked across the site.
  build: { format: 'file' },
});
