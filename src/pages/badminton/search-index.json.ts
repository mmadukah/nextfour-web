// /badminton/search-index.json: what the club finder searches in the
// browser. The same facts the pages show, cut down to what a result needs;
// prices and visitor terms stay on the club pages. Drop-in venues come after
// the clubs, marked y: 'd', with their own row shape.
import type { APIRoute } from 'astro';
import { getDirectory, tintIndex, groupedRows, sessionCountText, daysPlural, timeRange, durationText, levelBars, dropInRows } from '../../data/directory';

export const GET: APIRoute = async () => {
  const dir = await getDirectory();
  const rows = dir.clubs.map((c) => ({
    n: c.name,
    u: c.url,
    a: c.areaName,
    v: c.venue.name,
    lat: Math.round(c.venue.lat * 1000) / 1000,
    lng: Math.round(c.venue.lng * 1000) / 1000,
    d: [...new Set(c.nights.flatMap((x) => x.days))].sort(),
    // Lowest and highest level across its nights, 1 Beginner .. 5 Professional.
    l: [Math.min(...c.nights.map((x) => x.levelRange[0])), Math.max(...c.nights.map((x) => x.levelRange[1]))],
    o: c.takingNewPlayers ? 1 : 0,
    x: c.claimed ? 1 : 0,
    // Visitor terms listed; the card's court tint, as an index into TINTS.
    t: c.visitorPolicy ? 1 : 0,
    p: tintIndex(c.id),
    // The card's grouped session rows, as the area pages draw them: days
    // (Monday first), a one-off's date label, the strip's text alternative,
    // time, duration, level bars, level words, and the venue when it is not
    // the club's usual one.
    s: groupedRows(c).map((r) => [
      r.days, r.label, daysPlural(r.days), timeRange(r.night), durationText(r.night), levelBars(r.night), r.night.levels,
      r.night.venue.name !== c.venue.name ? r.night.venue.name : null,
    ]),
    k: sessionCountText(c),
  }));
  const dropIns = dir.dropIns.map((v) => {
    const rowsOf = dropInRows(v);
    return {
      y: 'd',
      n: v.name,
      w: v.venueName,
      p: tintIndex(v.id),
      // Its venue's page: every venue has one, whether or not its area does.
      u: v.venueUrl,
      a: v.areaName,
      v: v.operators.join(' and '),
      lat: Math.round(v.venue.lat * 1000) / 1000,
      lng: Math.round(v.venue.lng * 1000) / 1000,
      d: [...new Set(rowsOf.flatMap((r) => r.days))].sort(),
      x: v.sessions.some((s) => s.claimed) ? 1 : 0,
      o: 1,
      // Drop-in rows: days, one-off date label, days in words, time,
      // duration, price, and the level bars and words when the feed gave a level.
      s: rowsOf.map((r) => [
        r.days, r.label, daysPlural(r.days), timeRange(r.session.night), durationText(r.session.night),
        r.session.night.price?.replace(' a session', '') ?? null,
        r.session.levelKnown ? levelBars(r.session.night) : null, r.session.levelKnown ? r.session.night.levels : null,
      ]),
    };
  });
  return new Response(JSON.stringify([...rows, ...dropIns]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
