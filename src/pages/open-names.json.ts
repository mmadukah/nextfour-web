// The names /open shows for a club or session id, fetched by that page so it
// stays small: club name; a club night by club and day; a drop-in by title
// and venue, never a title a player wrote.
import type { APIRoute } from 'astro';
import { getDirectory, dayText } from '../data/directory';

export const GET: APIRoute = async () => {
  const dir = await getDirectory();
  const club = Object.fromEntries(dir.clubs.map((c) => [c.id, c.name]));
  const session = Object.fromEntries([
    ...dir.clubs.flatMap((c) => c.nights.map((n) => [n.id, `${c.name}, ${dayText(n)} at ${n.start}`])),
    ...dir.dropIns.flatMap((v) => v.sessions.map((s) => [s.id, `${s.title} at ${v.venueName}`])),
  ]);
  return new Response(JSON.stringify({ club, session }), { headers: { 'Content-Type': 'application/json' } });
};
