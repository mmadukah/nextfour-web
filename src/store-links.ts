// Single source of truth for the app store listings.
//
// Both are null until the listings are public. Pages must handle null rather
// than linking to a dead URL: the Play and App Store pages 404 before release,
// and a broken "Get the app" button on an invite page is worse than none.
//
export const PLAY_URL: string | null =
  'https://play.google.com/store/apps/details?id=app.nextfour.mobile';

// The country segment is required: https://apps.apple.com/app/id<id> returns
// 404. Apple redirects visitors from other storefronts, so /gb/ is a safe
// default rather than a restriction.
export const APP_STORE_URL: string | null =
  'https://apps.apple.com/gb/app/id6778069129';

// App Store Connect only counts a campaign link that carries the provider
// token (pt) as well as the campaign (ct); a ct on its own is ignored. Copy
// the pt= number from App Store Connect: Apps > App Analytics > Campaigns >
// Generate a campaign link. Null leaves the ct-only links, which still work
// as links.
export const APPLE_PROVIDER_TOKEN: string | null = '128896747';

/** The App Store link with what comes before the campaign name: append it, URI-encoded. */
export const APP_STORE_CAMPAIGN_PREFIX: string | null = APP_STORE_URL
  && `${APP_STORE_URL}?${APPLE_PROVIDER_TOKEN ? `pt=${APPLE_PROVIDER_TOKEN}&mt=8&` : ''}ct=`;

/** The App Store link for one campaign (the ?src= of the button). */
export const appStoreLink = (campaign: string): string | null =>
  APP_STORE_CAMPAIGN_PREFIX && APP_STORE_CAMPAIGN_PREFIX + encodeURIComponent(campaign);
