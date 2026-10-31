// /badminton/places.json: every council area in the UK as [name, lat, lng],
// for the club finder's place search. The finder already knows the areas
// that have clubs; this lets it place a search for one that has none
// ("Hackney") and for London as a whole. Built from data/lad.geojson (OGL).
import type { APIRoute } from 'astro';
import { districtCentres } from '../../data/geo';
import { areaName } from '../../data/directory';

const round = (n: number) => Math.round(n * 1000) / 1000;

export const GET: APIRoute = () => {
  const centres = districtCentres();
  // London is no council area: it is the 33 whose codes start E09.
  const london = centres.filter((c) => c.code.startsWith('E09'));
  const places = [
    ...centres.flatMap((c) => {
      const name = areaName(c.name);
      // "City of Edinburgh" and "Glasgow City" are searched as Edinburgh and Glasgow.
      const short = name.replace(/^City of\s+|\s+City$/, '');
      return (short === name ? [name] : [name, short]).map((n) => [n, round(c.lat), round(c.lng)]);
    }),
    ['London', round(london.reduce((s, c) => s + c.lat, 0) / london.length), round(london.reduce((s, c) => s + c.lng, 0) / london.length)],
  ];
  return new Response(JSON.stringify(places), { headers: { 'Content-Type': 'application/json' } });
};
