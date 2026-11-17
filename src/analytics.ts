// Cookieless visit and click counting through GoatCounter (goatcounter.com),
// to see where visitors drop off between a page and the app stores.
//
// Null switches it off: no requests are made. Set it to the site code, the
// "<code>" in https://<code>.goatcounter.com, once the account exists. The
// privacy policy (section 9) describes this, so keep the two in step.
//
// Nothing is stored in the browser. Each request sends the page path (with
// only its ?src=, never a club or session id), the referring site, the
// screen width and the page title; GoatCounter sees the IP address and
// browser but keeps neither against the visit.
export const GOATCOUNTER_CODE: string | null = null;
