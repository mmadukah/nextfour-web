// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const LOCALES = ['en', 'fr'];

/**
 * Astro reports every route in directory form (/privacy/), but `format:
 * 'preserve'` below writes flat files, so /privacy/ is a 404 and
 * /privacy.html is the real URL. Only the locale homepages are true
 * directories. The same conversion lives in src/layouts/Base.astro for the
 * canonical and og:url tags; both have to agree or the sitemap advertises
 * pages that do not resolve.
 */
const toPublicUrl = (url) => {
  const { pathname, origin } = new URL(url);
  // Normalise first: the sitemap reports '/fr' where Astro.url reports '/fr/'.
  const path = pathname.replace(/\/$/, '');
  const isLocaleRoot = path === '' || LOCALES.some((loc) => path === `/${loc}`);
  return isLocaleRoot ? `${origin}${path}/` : `${origin}${path}.html`;
};

// https://astro.build/config
export default defineConfig({
  site: 'https://nextfour.app',
  integrations: [
    sitemap({
      serialize: (item) => ({ ...item, url: toPublicUrl(item.url) }),
    }),
  ],
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
