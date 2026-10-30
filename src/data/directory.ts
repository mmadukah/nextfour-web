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

/** A session with no club, from a leisure operator's feed (web_directory().sessions). */
interface RawDropIn {
  id: string;
  title: string;
  sport: string;
  claimed: boolean;
  operator: string | null;
  booking_url: string | null;
  days: number[] | null;
  recurring: boolean;
  date: string | null;
  start: string;
  end: string | null;
  price: number | null;
  currency: string | null;
  levels: string[];
  accepting_new_players: boolean;
  venue: RawVenue;
  last_checked: string | null;
}

interface RawDirectory { generated_at: string; clubs: RawClub[]; sessions?: RawDropIn[] }

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

/** One drop-in session: a leisure operator's session anyone can book onto. */
export interface DropIn {
  id: string;
  /** The operator's title, without the day and time some feeds add to it. */
  title: string;
  /** Claimed by its organiser, who now runs it on NextFour. */
  claimed: boolean;
  bookingUrl: string | null;
  /** The feed gave a level; otherwise the card shows no level bar. */
  levelKnown: boolean;
  /** Who runs it ("Everyone Active"). */
  operator: string | null;
  lastChecked: Date | null;
  night: Night;
}

/**
 * A drop-in listing: one session name at one venue ("No Strings Badminton"
 * at Waddon Leisure Centre), with all the times it runs. Its card matches a
 * club's: the name first, then where.
 */
export interface DropInVenue {
  id: string;
  /** The session's name, the card's title. */
  name: string;
  /** Where it is, the card's pin line. */
  venueName: string;
  /** Who runs them ("Everyone Active"), for the card and the attribution. */
  operators: string[];
  venue: RawVenue;
  areaSlug: string;
  areaName: string;
  /** In-page anchor on the area page. */
  anchor: string;
  /** Its venue's page. */
  venueUrl: string;
  sessions: DropIn[];
}

/**
 * A venue page ("Badminton at Eclipse Leisure Centre"): every drop-in at one
 * leisure centre, with the clubs that play in the same hall. One page per
 * venue, not per session, so each page has enough on it to be worth finding.
 */
export interface Venue {
  id: string;
  name: string;
  slug: string;
  url: string;
  areaSlug: string;
  areaName: string;
  venue: RawVenue;
  operators: string[];
  sessions: DropIn[];
  /** Clubs whose nights are at this venue. */
  clubs: Club[];
  lastChecked: Date | null;
}

export interface Area {
  slug: string;
  name: string;
  nation: string;
  url: string;
  clubs: Club[];
  dropIns: DropInVenue[];
  venues: Venue[];
  /** Mean position of its listings, for "nearby areas". */
  lat: number;
  lng: number;
  hasPage: boolean;
}

export interface Directory {
  generatedAt: Date;
  clubs: Club[];
  dropIns: DropInVenue[];
  venues: Venue[];
  areas: Area[];
  /** Operators whose feed data the site shows, for the CC BY attribution. */
  operators: string[];
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_LEVELS = 5;
const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Professional'];

function levelRange(levels: string[]): [number, number] {
  const ranks = levels.map((l) => LEVEL_ORDER.indexOf(l) + 1).filter((r) => r > 0);
  return ranks.length ? [Math.min(...ranks), Math.max(...ranks)] : [1, ALL_LEVELS];
}
/** An area gets its own page at two listings: clubs and drop-in venues together. */
const MIN_LISTINGS_FOR_AREA_PAGE = 2;

let cached: Directory | null = null;

/** The directory, fetched and shaped once per build. */
export async function getDirectory(): Promise<Directory> {
  if (cached) return cached;
  const raw = await loadRaw();
  cached = shape(raw);
  return cached;
}

async function loadRaw(): Promise<RawDirectory> {
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

function shape(raw: RawDirectory): Directory {
  const byArea = new Map<string, { name: string; code: string; clubs: Club[]; dropIns: DropInVenue[] }>();

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
    const entry = byArea.get(areaSlug) ?? { name, code: district.code, clubs: [], dropIns: [] };
    entry.clubs.push(club);
    byArea.set(areaSlug, entry);
  }

  for (const v of dropInVenues(raw.sessions ?? [])) {
    const district = districtAt(v.venue.lat, v.venue.lng);
    if (!district) continue;
    const name = areaName(district.name);
    const areaSlug = slugify(name);
    v.areaSlug = areaSlug;
    v.areaName = name;
    const entry = byArea.get(areaSlug) ?? { name, code: district.code, clubs: [], dropIns: [] };
    entry.dropIns.push(v);
    byArea.set(areaSlug, entry);
  }

  const areas: Area[] = [];
  for (const [slug, { name, code, clubs, dropIns }] of byArea) {
    dropIns.sort((a, b) => a.venueName.localeCompare(b.venueName) || a.name.localeCompare(b.name));
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
    const venues = venuesOf(dropIns, slug, name);
    const points = [...clubs.map((c) => c.venue), ...dropIns.map((d) => d.venue)];
    areas.push({
      slug,
      name,
      nation: nationOf(code),
      url: `/badminton/${slug}.html`,
      clubs,
      dropIns,
      venues,
      lat: points.reduce((t, p) => t + p.lat, 0) / points.length,
      lng: points.reduce((t, p) => t + p.lng, 0) / points.length,
      hasPage: clubs.length + dropIns.length >= MIN_LISTINGS_FOR_AREA_PAGE,
    });
  }
  areas.sort((a, b) => a.name.localeCompare(b.name));
  const clubs = areas.flatMap((a) => a.clubs).sort((a, b) => a.name.localeCompare(b.name));
  const dropIns = areas.flatMap((a) => a.dropIns);
  const venues = areas.flatMap((a) => a.venues);
  for (const v of venues) v.clubs = clubs.filter((c) => c.nights.some((n) => sameVenue(n.venue, v.venue)));
  const operators = [...new Set(dropIns.flatMap((d) => d.operators))].sort();
  return { generatedAt: new Date(raw.generated_at), clubs, dropIns, venues, areas, operators };
}

/** An area's drop-in listings gathered into venue pages, slugs unique in the area. */
function venuesOf(dropIns: DropInVenue[], areaSlug: string, areaName: string): Venue[] {
  const byKey = new Map<string, Venue>();
  for (const d of dropIns) {
    const key = `${d.venueName.toLowerCase()}|${d.venue.lat}|${d.venue.lng}`;
    let v = byKey.get(key);
    if (!v) {
      v = { id: d.id, name: d.venueName, slug: '', url: '', areaSlug, areaName, venue: d.venue, operators: [], sessions: [], clubs: [], lastChecked: null };
      byKey.set(key, v);
    }
    v.sessions.push(...d.sessions);
    for (const o of d.operators) if (!v.operators.includes(o)) v.operators.push(o);
    d.venueUrl = key;
  }
  const used = new Set<string>();
  for (const [key, v] of byKey) {
    let s = slugify(v.name) || 'venue';
    for (let n = 2; used.has(s); n++) s = `${slugify(v.name)}-${n}`;
    used.add(s);
    v.slug = s;
    v.url = `/badminton/${areaSlug}/venues/${s}.html`;
    const checked = v.sessions.map((x) => x.lastChecked?.getTime() ?? 0);
    v.lastChecked = Math.max(...checked) ? new Date(Math.max(...checked)) : null;
    for (const d of dropIns) if (d.venueUrl === key) d.venueUrl = v.url;
  }
  return [...byKey.values()];
}

/** "White Oak L C" and "White Oak Leisure Centre" are one hall; so is anywhere within 100 m. */
const venueWords = (name: string) => name.toLowerCase()
  .replace(/\b(leisure|sports?|centre|center|lc|l c|complex|the)\b/g, '').replace(/[^a-z0-9]/g, '');
function sameVenue(a: RawVenue, b: RawVenue): boolean {
  const km = distanceKm(a.lat, a.lng, b.lat, b.lng);
  return km < 0.1 || (km < 2 && venueWords(a.name) !== '' && venueWords(a.name) === venueWords(b.name));
}

/** "Everyone Active (UK)" reads as "Everyone Active". */
function operatorName(raw: string | null): string | null {
  return raw ? raw.replace(/\s*\((UK|England)\)$/i, '').trim() : null;
}

/** "Badminton Snr Thu 10:00" reads as "Badminton Snr": the row shows the day and time. */
function dropInTitle(raw: string): string {
  return raw.replace(/\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\w*\s+\d{1,2}:?\d{2}\s*$/i, '').trim() || raw.trim();
}

/** "White Oak Lc" and "Chilterns Lifestyle Centr", as the feeds shorten them, written out. */
function venueName(raw: string): string {
  return raw.trim().replace(/\s+L\s?C$/i, ' Leisure Centre').replace(/\bCentr$/i, 'Centre');
}

/** Badminton drop-ins grouped by venue, one card each. */
function dropInVenues(raw: RawDropIn[]): DropInVenue[] {
  const byVenue = new Map<string, DropInVenue>();
  for (const s of raw) {
    if (s.sport.toLowerCase() !== 'badminton' || !s.venue) continue;
    const title = dropInTitle(s.title);
    const key = `${s.venue.name}|${s.venue.lat}|${s.venue.lng}|${title.toLowerCase()}`;
    let v = byVenue.get(key);
    if (!v) {
      v = { id: s.id, name: title, venueName: venueName(s.venue.name), operators: [], venue: s.venue, areaSlug: '', areaName: '', anchor: '', venueUrl: '', sessions: [] };
      byVenue.set(key, v);
    }
    const operator = operatorName(s.operator);
    if (operator && !v.operators.includes(operator)) v.operators.push(operator);
    v.sessions.push({
      id: s.id,
      title,
      claimed: s.claimed,
      bookingUrl: s.booking_url && /^https?:\/\//i.test(s.booking_url) ? s.booking_url : null,
      levelKnown: s.levels.length > 0,
      operator,
      lastChecked: s.last_checked ? new Date(s.last_checked) : null,
      night: {
        id: s.id,
        days: s.recurring ? (s.days ?? []) : [],
        date: s.recurring ? null : s.date,
        start: s.start,
        end: s.end,
        price: priceText(s.price, s.currency),
        levels: levelsText(s.levels),
        levelRange: levelRange(s.levels),
        takingNewPlayers: s.accepting_new_players,
        venue: s.venue,
      },
    });
  }
  const venues = [...byVenue.values()];
  for (const v of venues) v.anchor = `drop-in-${slugify(`${v.venueName} ${v.name}`)}`;
  return venues;
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

/**
 * The link that opens a club or session in the app (racket-manager-app,
 * docs/plans/WEB_APP_LINKS.md): an App Link when the app is installed, the
 * /open page with the store buttons when not. `src` is the button, for the
 * install tracking /get.html also does.
 */
export function openLink(kind: 'club' | 'session', id: string, src: string): string {
  return `/open?${new URLSearchParams({ [kind]: id, src })}`;
}

/** A claimed session at the listing, the one its Join in the app opens. */
export function claimedSessionId(v: DropInVenue): string | null {
  return v.sessions.find((s) => s.claimed)?.id ?? null;
}

/** The nearest other venues and clubs, for the venue page. */
export function nearbyPlaces(dir: Directory, venue: Venue, count = 4): ({ venue: Venue; km: number } | { club: Club; km: number })[] {
  const from = venue.venue;
  const here = new Set(venue.clubs.map((c) => c.id));
  return [
    ...dir.venues.filter((v) => v.url !== venue.url).map((v) => ({ venue: v, km: distanceKm(from.lat, from.lng, v.venue.lat, v.venue.lng) })),
    ...dir.clubs.filter((c) => !here.has(c.id)).map((c) => ({ club: c, km: distanceKm(from.lat, from.lng, c.venue.lat, c.venue.lng) })),
  ].sort((x, y) => x.km - y.km).slice(0, count);
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

// ---------------------------------------------------------------------------
// Club details page
// ---------------------------------------------------------------------------

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/i;

/**
 * The venue's address as lines for an <address>: the venue name dropped when
 * the address repeats it, and the postcode in capitals ("BS31 1HE", never
 * "Bs31 1he", which some sources send).
 */
export function addressLines(venue: RawVenue): string[] {
  const parts = (venue.address ?? '').split(',').map((p) => p.trim()).filter(Boolean);
  const lines = parts.filter((p, i) => !(i === 0 && p.toLowerCase() === venue.name.toLowerCase()))
    .filter((p) => !/^(UK|United Kingdom|England|Wales|Scotland|Northern Ireland)$/i.test(p));
  return lines.map((p) => p.replace(POSTCODE, (_, out: string, inn: string) => `${out.toUpperCase()} ${inn.toUpperCase()}`));
}

/**
 * A steady tint for the club's court illustration, from its id (the mockups'
 * palette). The finder's script gets the index and the list, so its cards
 * match the area pages'.
 */
export const TINTS = ['#1F4D3A', '#2C5873', '#7A4A2A', '#4B3F72', '#5E5B22'];
export function tintIndex(id: string): number {
  const value = parseInt(id.replace(/-/g, '').slice(-8), 16);
  return Number.isNaN(value) ? 0 : value % TINTS.length;
}
export function clubTint(id: string): string {
  return TINTS[tintIndex(id)];
}

/** The fact strip's time: the one time every night shares, or "Varies". */
export function clubTimeText(club: Club): string {
  const times = [...new Set(club.nights.map(timeRange))];
  return times.length === 1 ? times[0] : 'Varies';
}

/** The fact strip's days, short: "Mondays", "Tue and Thu". */
export function clubDaysShort(club: Club): string {
  const days = [...new Set(club.nights.flatMap((n) => n.days))].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 0) return 'One-off';
  if (days.length === 1) return `${DAY_NAMES[days[0]]}s`;
  return listText(days.map((d) => SHORT_DAYS[d]));
}

// ---------------------------------------------------------------------------
// Grouped session rows (REDESIGN-BRIEF, "Grouping sessions")
// ---------------------------------------------------------------------------

/**
 * One row for sessions that differ only in their day: same start, end, level
 * and venue (and price and membership rule, so a merged row never shows the
 * wrong price). A one-off keeps its own row, labelled with its date.
 */
export interface GroupRow {
  /** 0 Sunday .. 6 Saturday, Monday first; a dated one-off has its weekday. */
  days: number[];
  /**
   * Text in place of the day strip: a one-off's date ("Sat 8 Nov"), or the
   * day name on the club page's one-row-per-day list (dayRows). Null shows
   * the strip.
   */
  label: string | null;
  night: Night;
}

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const mondayFirst = (d: number) => (d + 6) % 7;

export function groupedRows(club: Club): GroupRow[] {
  const rows: GroupRow[] = [];
  const byKey = new Map<string, GroupRow>();
  for (const r of nightRows(club)) {
    const n = r.night;
    if (n.days.length === 0) {
      rows.push({ days: r.day == null ? [] : [r.day], label: r.label, night: n });
      continue;
    }
    const key = [n.start, n.end ?? '', n.levels, n.venue.name, n.price ?? '', n.takingNewPlayers].join('|');
    let row = byKey.get(key);
    if (!row) {
      row = { days: [], label: null, night: n };
      byKey.set(key, row);
      rows.push(row);
    }
    if (r.day != null && !row.days.includes(r.day)) row.days.push(r.day);
  }
  for (const row of rows) row.days.sort((a, b) => mondayFirst(a) - mondayFirst(b));
  // By first day, then start time; one-offs after the weekly rows.
  const rank = (row: GroupRow) => (row.label || row.days.length === 0 ? 7 : mondayFirst(row.days[0]));
  return rows.sort((a, b) => rank(a) - rank(b) || a.night.start.localeCompare(b.night.start));
}

/**
 * One row per session and day, each named ("Monday"), in week order: the club
 * page keeps this list rather than the grouped day strips.
 */
export function dayRows(club: Club): GroupRow[] {
  return sortedRows(club).map((r) => ({ days: r.day == null ? [] : [r.day], label: r.label, night: r.night }));
}

/** "Mondays and Wednesdays": the day strip's text alternative. */
export function daysPlural(days: number[]): string {
  return listText(days.map((d) => `${DAY_NAMES[d]}s`));
}

/** "8 sessions a week, 6 nights", for clubs with three or more weekly sessions; else null. */
export function sessionCountText(club: Club): string | null {
  const rows = nightRows(club).filter((r) => r.night.days.length > 0);
  if (rows.length < 3) return null;
  const nights = new Set(rows.map((r) => r.day)).size;
  return `${rows.length} sessions a week, ${nights} night${nights === 1 ? '' : 's'}`;
}

// ---------------------------------------------------------------------------
// Drop-in sessions on the page
// ---------------------------------------------------------------------------

/** One row on a drop-in card: sessions with the same title, time and price share it, like a club's rows. */
export interface DropInRow {
  days: number[];
  /** A one-off's date in place of the day strip. */
  label: string | null;
  session: DropIn;
}

export function dropInRows(v: DropInVenue): DropInRow[] {
  const rows: DropInRow[] = [];
  const byKey = new Map<string, DropInRow>();
  for (const s of v.sessions) {
    const n = s.night;
    if (n.days.length === 0) {
      const date = n.date ? new Date(`${n.date}T12:00:00`) : null;
      rows.push({
        days: date ? [date.getDay()] : [],
        label: date ? date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : 'One-off',
        session: s,
      });
      continue;
    }
    const key = [s.title, n.start, n.end ?? '', n.price ?? '', s.claimed].join('|');
    let row = byKey.get(key);
    if (!row) {
      row = { days: [], label: null, session: s };
      byKey.set(key, row);
      rows.push(row);
    }
    for (const d of n.days) if (!row.days.includes(d)) row.days.push(d);
  }
  for (const row of rows) row.days.sort((a, b) => mondayFirst(a) - mondayFirst(b));
  const rank = (row: DropInRow) => (row.label || row.days.length === 0 ? 7 : mondayFirst(row.days[0]));
  return rows.sort((a, b) => rank(a) - rank(b) || a.session.night.start.localeCompare(b.session.night.start));
}

/** Drop-in sessions on each weekday, indexed 0 Sunday .. 6 Saturday. */
export function dropInsPerDay(venues: DropInVenue[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const row of venues.flatMap(dropInRows)) for (const d of row.days) counts[d]++;
  return counts;
}

/** Weekly drop-in sessions: one on two weekdays counts as two. */
export function weeklyDropIns(venues: DropInVenue[]): number {
  return venues.reduce((t, v) => t + v.sessions.reduce((u, s) => u + Math.max(s.night.days.length, 1), 0), 0);
}

// ---------------------------------------------------------------------------
// Search result fitting
// ---------------------------------------------------------------------------

/** Google shows about this much of a title, and of a description. */
const TITLE_MAX = 65;
const DESCRIPTION_MAX = 160;

/** The first title that fits, longest and most useful first; the last one regardless. */
export function fitTitle(candidates: string[]): string {
  return candidates.find((t) => t.length <= TITLE_MAX) ?? candidates[candidates.length - 1];
}

/**
 * Sentences joined until the next would run past what Google shows; the
 * first always stays, cut at a word with an ellipsis if it alone is too long.
 */
export function fitDescription(sentences: string[]): string {
  const parts = sentences.filter(Boolean);
  let out = parts[0] ?? '';
  if (out.length > DESCRIPTION_MAX) return `${out.slice(0, DESCRIPTION_MAX - 1).replace(/\s+\S*$/, '')}…`;
  for (const s of parts.slice(1)) {
    if (`${out} ${s}`.length > DESCRIPTION_MAX) break;
    out = `${out} ${s}`;
  }
  return out;
}
