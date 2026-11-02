// Shared pieces of the schema.org SportsEvent markup on the directory pages.

/** The first amount in a price ("£4.50 members, £6 visitors" is 4.50; "Free" is 0), or null. */
export function offerPrice(price: string): string | null {
  if (/^\s*free\b/i.test(price)) return '0';
  return price.match(/\d+(?:\.\d{1,2})?/)?.[0] ?? null;
}

/** An Offer for a night's price, or nothing when the price has no amount in it. */
export function offerLd(price: string | null, url: string) {
  const amount = price ? offerPrice(price) : null;
  if (amount == null) return {};
  return {
    offers: {
      '@type': 'Offer', price: amount, priceCurrency: 'GBP', url,
      availability: 'https://schema.org/InStock',
    },
  };
}

/** The operator as organiser. No url: the booking link belongs to the booking system, not the operator. */
export function organizerLd(name: string | null) {
  return name ? { organizer: { '@type': 'Organization', name } } : {};
}
