// The public club directory, built once per site build.
//
// The data comes from the `web-directory` edge function on the app's
// Supabase project (racket-manager-app, supabase/functions/web-directory),
// which applies the quality gate and returns only what the pages publish:
// no contact details, no names, no stored descriptions. See
// racket-manager-app/docs/plans/WEB_CLUB_DIRECTORY.md.
//
//   CI:    DIRECTORY_URL and DIRECTORY_SECRET (GitHub Actions secrets). A
//          failed fetch fails the build, so an empty directory never
//          replaces a good one.
//   Local: the same two variables, or a saved response at
//          .cache/directory.json (gitignored: this repo is public, so the
//          data is never committed).
//
// Areas are council areas (ONS Local Authority Districts), worked out from
// each club's venue. An area gets its own page once it has two clubs.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { districtAt, distanceKm } from './geo';

// ---------------------------------------------------------------------------
// The function's response
// ---------------------------------------------------------------------------

interface RawVenue { name: string; address: string | null; lat: number; lng: number }
interface RawSession {
  id: string;
  days: number[] | null;
  recurring: boolean;
  date: string | null;
  start: string;
  end: string | null;
  price: number | null;
  currency: string | null;
  levels: string[];
  accepting_new_players: boolean;
  venue: RawVenue | null;
}
interface RawClub {
  id: string;
  name: string;
  sport: string;
  claimed: boolean;
  accepting_new_players: boolean;
  court_count: number | null;
  fees: string | null;
  visitor_policy: string | null;
  levels: string[];
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  venue: RawVenue | null;
  last_checked: string | null;
  sessions: RawSession[];
}

// ---------------------------------------------------------------------------
// What the pages use
// ---------------------------------------------------------------------------

export interface Night {
  id: string;
  /** 0 Sunday .. 6 Saturday; empty for a one-off. */
  days: number[];
  date: string | null;
  start: string;
  end: string | null;
  price: string | null;
  levels: string;
  /** Lowest and highest level, 1 Beginner .. 5 Professional. */
  levelRange: [number, number];
  takingNewPlayers: boolean;
  venue: RawVenue;
}

export interface Club {
  id: string;
  name: string;
  slug: string;
  url: string;
  areaSlug: string;
  areaName: string;
  claimed: boolean;
  takingNewPlayers: boolean;
  courts: number | null;
  fees: string | null;
  visitorPolicy: string | null;
  levels: string;
  links: { label: string; href: string }[];
  venue: RawVenue;
  lastChecked: Date | null;
  nights: Night[];
}

export interface Area {
  slug: string;
  name: string;
  nation: string;
  url: string;
  clubs: Club[];
  /** Mean position of its clubs, for "nearby areas". */
  lat: number;
  lng: number;
  hasPage: boolean;
}

export interface Directory {
  generatedAt: Date;
  clubs: Club[];
  areas: Area[];
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_LEVELS = 5;
const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Professional'];

function levelRange(levels: string[]): [number, number] {
  const ranks = levels.map((l) => LEVEL_ORDER.indexOf(l) + 1).filter((r) => r > 0);
  return ranks.length ? [Math.min(...ranks), Math.max(...ranks)] : [1, ALL_LEVELS];
}
const MIN_CLUBS_FOR_AREA_PAGE = 2;

let cached: Directory | null = null;

/** The directory, fetched and shaped once per build. */
export async function getDirectory(): Promise<Directory> {
  if (cached) return cached;
  const raw = await loadRaw();
  cached = shape(raw);
  return cached;
}

async function loadRaw(): Promise<{ generated_at: string; clubs: RawClub[] }> {
  const url = process.env.DIRECTORY_URL;
  const secret = process.env.DIRECTORY_SECRET;
  // From the project root: the build bundles this file into dist/, so a path
  // relative to import.meta.url would point inside the build output.
  const cacheDir = join(process.cwd(), '.cache');
  const cachePath = join(cacheDir, 'directory.json');
  if (url && secret) {
    const res = await fetch(url, { headers: { 'x-directory-secret': secret } });
    if (!res.ok) throw new Error(`Directory fetch failed: HTTP ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body?.clubs) || body.clubs.length === 0) {
      throw new Error('Directory fetch returned no clubs; refusing to build an empty directory.');
    }
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(cachePath, JSON.stringify(body));
    return body;
  }
  if (process.env.CI) {
    throw new Error('DIRECTORY_URL and DIRECTORY_SECRET are not set; the directory cannot be built.');
  }
  if (!existsSync(cachePath)) {
    throw new Error('No directory data: set DIRECTORY_URL and DIRECTORY_SECRET, or save a response to .cache/directory.json.');
  }
  return JSON.parse(readFileSync(cachePath, 'utf-8'));
}

// ---------------------------------------------------------------------------
// Shaping
// ---------------------------------------------------------------------------

export function slugify(s: string): string {
  return s
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** "Bristol, City of" reads as "Bristol". */
function areaName(ladName: string): string {
  return ladName.replace(/,\s*(City|County) of$/i, '').trim();
}

function nationOf(code: string): string {
  return { E: 'England', W: 'Wales', S: 'Scotland', N: 'Northern Ireland' }[code[0]] ?? 'United Kingdom';
}

function levelsText(levels: string[]): string {
  if (levels.length === 0 || levels.length >= ALL_LEVELS) return 'All levels';
  if (levels.length === 1) return levels[0];
  return `${levels[0]} to ${levels[levels.length - 1]}`;
}

function priceText(price: number | null, currency: string | null): string | null {
  if (price == null) return null;
  const symbol = { GBP: '£', EUR: '€', USD: '$' }[currency ?? 'GBP'] ?? '£';
  const amount = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return `${symbol}${amount} a session`;
}

function linksOf(c: RawClub): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [];
  const add = (label: string, href: string | null) => {
    if (href && /^https?:\/\//i.test(href)) links.push({ label, href });
  };
  add('Club website', c.website);
  add('Facebook', c.facebook_url);
  add('Instagram', c.instagram_url);
  return links;
}

function shape(raw: { generated_at: string; clubs: RawClub[] }): Directory {
  const byArea = new Map<string, { name: string; code: string; clubs: Club[] }>();

  for (const c of raw.clubs) {
    if (c.sport.toLowerCase() !== 'badminton') continue;
    const venue = c.venue ?? c.sessions.find((s) => s.venue)?.venue ?? null;
    if (!venue) continue;
    const district = districtAt(venue.lat, venue.lng);
    if (!district) continue;
    const name = areaName(district.name);
    const areaSlug = slugify(name);
    const nights: Night[] = c.sessions.map((s) => ({
      id: s.id,
      days: s.recurring ? (s.days ?? []) : [],
      date: s.recurring ? null : s.date,
      start: s.start,
      end: s.end,
      price: priceText(s.price, s.currency),
      levels: levelsText(s.levels),
      levelRange: levelRange(s.levels),
      takingNewPlayers: s.accepting_new_players,
      venue: s.venue ?? venue,
    }));
    // Week order from Monday, as UK clubs list their nights; one-offs last.
    const weekRank = (n: Night) => (n.days.length ? (n.days[0] + 6) % 7 : 7);
    nights.sort((a, b) => weekRank(a) - weekRank(b) || a.start.localeCompare(b.start));
    const club: Club = {
      id: c.id,
      name: c.name.trim(),
      slug: '',
      url: '',
      areaSlug,
      areaName: name,
      claimed: c.claimed,
      takingNewPlayers: c.accepting_new_players,
      courts: c.court_count,
      fees: c.fees,
      visitorPolicy: c.visitor_policy,
      levels: levelsText(c.levels),
      links: linksOf(c),
      venue,
      lastChecked: c.last_checked ? new Date(c.last_checked) : null,
      nights,
    };
    const entry = byArea.get(areaSlug) ?? { name, code: district.code, clubs: [] };
    entry.clubs.push(club);
    byArea.set(areaSlug, entry);
  }

  const areas: Area[] = [];
  for (const [slug, { name, code, clubs }] of byArea) {
    clubs.sort((a, b) => a.name.localeCompare(b.name));
    // Slugs are unique within an area; a namesake gets a number.
    const used = new Set<string>();
    for (const club of clubs) {
      let s = slugify(club.name) || 'club';
      for (let n = 2; used.has(s); n++) s = `${slugify(club.name)}-${n}`;
      used.add(s);
      club.slug = s;
      club.url = `/badminton/${slug}/${s}.html`;
    }
    areas.push({
      slug,
      name,
      nation: nationOf(code),
      url: `/badminton/${slug}.html`,
      clubs,
      lat: clubs.reduce((t, c) => t + c.venue.lat, 0) / clubs.length,
      lng: clubs.reduce((t, c) => t + c.venue.lng, 0) / clubs.length,
      hasPage: clubs.length >= MIN_CLUBS_FOR_AREA_PAGE,
    });
  }
  areas.sort((a, b) => a.name.localeCompare(b.name));
  const clubs = areas.flatMap((a) => a.clubs).sort((a, b) => a.name.localeCompare(b.name));
  return { generatedAt: new Date(raw.generated_at), clubs, areas };
}

// ---------------------------------------------------------------------------
// Words for the pages
// ---------------------------------------------------------------------------

/** "19:00 to 21:00", or "from 19:00" when the club publishes no finish. */
export function timeText(n: Night): string {
  return n.end ? `${n.start} to ${n.end}` : `from ${n.start}`;
}

/** "Tuesday", "Monday and Thursday", or a one-off's date. */
export function dayText(n: Night): string {
  if (n.days.length === 0) {
    return n.date
      ? new Date(`${n.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'One-off';
  }
  return listText(n.days.map((d) => DAY_NAMES[d]));
}

export function listText(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** The weekdays a club plays, in week order from Monday: "Tuesdays and Fridays". */
export function clubDaysText(club: Club): string {
  const days = [...new Set(club.nights.flatMap((n) => n.days))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  return listText(days.map((d) => `${DAY_NAMES[d]}s`));
}

/** Weekly nights: a session on two weekdays counts as two. */
export function weeklyNights(clubs: Club[]): number {
  return clubs.reduce((t, c) => t + c.nights.reduce((u, n) => u + Math.max(n.days.length, 1), 0), 0);
}

export function checkedText(d: Date | null): string | null {
  return d ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
}

/** The town for a page title: the last part of an address before the postcode. */
export function townOf(venue: RawVenue, fallback: string): string {
  const parts = (venue.address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const postcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  const usable = parts.filter((p) => !postcode.test(p) && !/^(UK|United Kingdom|England|Wales|Scotland)$/i.test(p));
  return usable.length > 1 ? usable[usable.length - 1] : fallback;
}

/** The nearest other areas that have pages, for internal links. */
export function nearbyAreas(dir: Directory, area: { lat: number; lng: number; slug: string }, count = 6): Area[] {
  return dir.areas
    .filter((a) => a.hasPage && a.slug !== area.slug)
    .map((a) => ({ a, km: distanceKm(area.lat, area.lng, a.lat, a.lng) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, count)
    .map((x) => x.a);
}

/** The nearest other clubs, for the club page. */
export function nearbyClubs(dir: Directory, club: Club, count = 5): { club: Club; km: number }[] {
  return dir.clubs
    .filter((c) => c.id !== club.id)
    .map((c) => ({ club: c, km: distanceKm(club.venue.lat, club.venue.lng, c.venue.lat, c.venue.lng) }))
    .sort((x, y) => x.km - y.km)
    .slice(0, count);
}

/** The next date a weekly night runs, on or after [from], as YYYY-MM-DD. */
export function nextDate(day: number, from: Date): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + ((day - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Pieces for the page design
// ---------------------------------------------------------------------------

export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** Monday first, as UK clubs list their week. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** One line per night and weekday: a Tuesday-and-Thursday session is two rows. */
export interface NightRow {
  night: Night;
  /** 0 Sunday .. 6 Saturday, or the weekday a one-off falls on. */
  day: number | null;
  label: string;
}

export function nightRows(club: Club): NightRow[] {
  return club.nights.flatMap((n) => {
    if (n.days.length) return n.days.map((d) => ({ night: n, day: d, label: DAY_NAMES[d] }));
    if (!n.date) return [{ night: n, day: null, label: 'One-off' }];
    const date = new Date(`${n.date}T12:00:00`);
    const label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return [{ night: n, day: date.getDay(), label }];
  });
}

/** Rows a day at a time, in week order from Monday; one-offs last. */
export function sortedRows(club: Club): NightRow[] {
  const rank = (r: NightRow) => (r.night.days.length && r.day != null ? (r.day + 6) % 7 : 7);
  return nightRows(club).sort((a, b) => rank(a) - rank(b) || a.night.start.localeCompare(b.night.start));
}

/** Nights on each weekday across [clubs], indexed 0 Sunday .. 6 Saturday. */
export function nightsPerDay(clubs: Club[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const c of clubs) for (const r of nightRows(c)) if (r.day != null) counts[r.day]++;
  return counts;
}

/** "2h 30m", or null when the club publishes no finish time. */
export function durationText(n: Night): string | null {
  if (!n.end) return null;
  const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  let d = mins(n.end) - mins(n.start);
  if (d <= 0) d += 24 * 60;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
}

/** "19:15 – 21:45", or "from 19:15". */
export function timeRange(n: Night): string {
  return n.end ? `${n.start} – ${n.end}` : `from ${n.start}`;
}

/**
 * The level range on three bars, Beginner, Intermediate, Advanced: upper
 * intermediate counts as intermediate, professional as advanced.
 */
export function levelBars(n: Night): [number, number] {
  const bar = (rank: number) => (rank <= 1 ? 1 : rank <= 3 ? 2 : 3);
  return [bar(n.levelRange[0]), bar(n.levelRange[1])];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "19 Sep 2026" (en-GB's own short month is "Sept"). */
export function shortDate(d: Date | null): string | null {
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : null;
}

/** The newest "last checked" date among [clubs]. */
export function newestCheck(clubs: Club[]): Date | null {
  const t = clubs.reduce((m, c) => Math.max(m, c.lastChecked?.getTime() ?? 0), 0);
  return t ? new Date(t) : null;
}

/**
 * The club's card photo: the same picture the app shows for that club, picked
 * from its id exactly as racket-manager-app's backgroundVariantIndex does
 * (lib/shared/utils/sport_background.dart), in the same order. `position` is
 * the app's crop alignment as CSS object-position.
 */
export const PHOTOS = [
  { src: '/photos/badminton-grip.webp', position: '50% 50%' },
  { src: '/photos/badminton-shuttle.webp', position: '50% 25%' },
  { src: '/photos/badminton-jump.webp', position: '50% 50%' },
  { src: '/photos/badminton-strings.webp', position: '50% 80%' },
];
export function photoIndex(id: string): number {
  const value = parseInt(id.replace(/-/g, '').slice(-8), 16);
  return Number.isNaN(value) ? 0 : value % PHOTOS.length;
}
export function clubPhoto(id: string): { src: string; position: string } {
  return PHOTOS[photoIndex(id)];
}
