// /badminton/search-index.json: what the club finder searches in the
// browser. The same facts the pages show, cut down to what a result needs;
// prices and visitor terms stay on the club pages.
import type { APIRoute } from 'astro';
import { getDirectory } from '../../data/directory';

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
  }));
  return new Response(JSON.stringify(rows), {
    headers: { 'Content-Type': 'application/json' },
  });
};
