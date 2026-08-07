// Single source of truth for the app store listings.
//
// Both are null until the listings are public. Pages must handle null rather
// than linking to a dead URL: the Play and App Store pages 404 before release,
// and a broken "Get the app" button on an invite page is worse than none.
//
// When each goes live, set it here. Landing.astro still hardcodes `href="#"`
// with TODOs in four places and should be switched over at the same time.
export const PLAY_URL: string | null =
  'https://play.google.com/store/apps/details?id=app.nextfour.mobile';

// No country segment: Apple redirects to the visitor's own storefront, so a
// hardcoded /gb/ would send everyone else through a needless bounce.
export const APP_STORE_URL: string | null =
  'https://apps.apple.com/app/id6778069129';
