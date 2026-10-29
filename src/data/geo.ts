// Geometry for the club directory: which council area a venue sits in, and
// how far apart two places are. Runs at build time only.
//
// The areas are the ONS Local Authority Districts (May 2024, UK, ultra
// generalised), committed as data/lad.geojson. Open Government Licence:
// the pages credit "Contains OS data © Crown copyright and database right".
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Ring = [number, number][];
type Polygon = Ring[];

interface District {
  code: string;
  name: string;
  polygons: Polygon[];
  bbox: [number, number, number, number];
}

let districts: District[] | null = null;

function load(): District[] {
  if (districts) return districts;
  // From the project root; the build bundles this file into dist/.
  const path = join(process.cwd(), 'data', 'lad.geojson');
  const geo = JSON.parse(readFileSync(path, 'utf-8'));
  districts = geo.features.map((f: any) => {
    const polygons: Polygon[] =
      f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of polygons) for (const [x, y] of poly[0]) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return {
      code: f.properties.LAD24CD,
      name: f.properties.LAD24NM,
      polygons,
      bbox: [minX, minY, maxX, maxY],
    };
  });
  return districts!;
}

/** Ray casting: whether [x, y] is inside the ring. */
function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(p: [number, number], poly: Polygon): boolean {
  if (!inRing(p, poly[0])) return false;
  return !poly.slice(1).some((hole) => inRing(p, hole));
}

/** Kilometres between two points (haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/**
 * The district a point sits in. The boundaries are generalised, so a venue on
 * the coast or a border can fall just outside every polygon; it then takes the
 * district whose outline passes nearest.
 */
export function districtAt(lat: number, lng: number): { code: string; name: string } | null {
  const p: [number, number] = [lng, lat];
  const all = load();
  const hit = all.find((d) =>
    lng >= d.bbox[0] && lng <= d.bbox[2] && lat >= d.bbox[1] && lat <= d.bbox[3] &&
    d.polygons.some((poly) => inPolygon(p, poly)));
  if (hit) return { code: hit.code, name: hit.name };
  let best: District | null = null;
  let bestKm = Infinity;
  for (const d of all) for (const poly of d.polygons) for (const [x, y] of poly[0]) {
    const km = distanceKm(lat, lng, y, x);
    if (km < bestKm) { bestKm = km; best = d; }
  }
  return best && bestKm < 15 ? { code: best.code, name: best.name } : null;
}
