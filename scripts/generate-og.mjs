// Generates the static social-preview images and app icons in public/.
//
// Run with: npm run og
//
// The output PNGs are committed, so this only needs re-running when the
// wording or the brand colours change. Keeping it as a script rather than a
// build step means the site build stays dependency-free and GitHub Pages does
// not need to rasterise anything.
//
// The palette and type treatment deliberately mirror the landing page hero in
// src/components/Landing.astro so a shared link looks like the site it opens.

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const ACCENT = '#ff5a5a';
const MUTED = '#c9c9d1';
const FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** The hero's radial gradient, plus the pegboard motif used on the right. */
function backdrop() {
  return `
    <defs>
      <radialGradient id="bg" cx="80%" cy="0%" r="120%">
        <stop offset="0%" stop-color="#1b1c22" />
        <stop offset="55%" stop-color="#0c0c0f" />
      </radialGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)" />
    ${pegboard()}
    <rect x="0" y="626" width="1200" height="4" fill="${ACCENT}" />
  `;
}

/**
 * A grid of peg holes with a few pegged in, echoing the digital pegboard.
 * Sits behind the right edge at low contrast so it never fights the text.
 */
function pegboard() {
  const cols = 5;
  const rows = 7;
  const gap = 62;
  const originX = 880;
  const originY = 96;
  // Scattered but fixed, so regenerating the image never reshuffles it.
  const pegged = new Set(['1,1', '2,3', '0,4', '3,2', '4,5', '2,6']);

  let out = '';
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const on = pegged.has(`${c},${r}`);
      out += `<circle cx="${originX + c * gap}" cy="${originY + r * gap}" r="${on ? 13 : 9}" `
        + `fill="${on ? ACCENT : '#ffffff'}" opacity="${on ? 0.85 : 0.07}" />`;
    }
  }
  return out;
}

function wordmark(y = 104) {
  return `<text x="80" y="${y}" font-family="${FONT}" font-size="23" font-weight="700"
    letter-spacing="8" fill="#ffffff" opacity="0.92">NEXTFOUR</text>`;
}

/** 1200x630 social card. `lines` are the two big headline rows. */
function card({ line1, line2, lead }) {
  const leadRows = lead
    .map((text, i) => `<text x="80" y="${452 + i * 44}" font-family="${FONT}" font-size="30"
      fill="${MUTED}">${escapeXml(text)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    ${backdrop()}
    ${wordmark()}
    <text x="80" y="286" font-family="${FONT}" font-size="92" font-weight="800"
      letter-spacing="-2" fill="#ffffff">${escapeXml(line1)}</text>
    <text x="80" y="386" font-family="${FONT}" font-size="92" font-weight="800"
      letter-spacing="-2" fill="${ACCENT}">${escapeXml(line2)}</text>
    ${leadRows}
    <text x="80" y="576" font-family="${FONT}" font-size="24" fill="#ffffff" opacity="0.55">
      App Store &#183; Google Play</text>
  </svg>`;
}

/** Square mark used for the favicon and the apple touch icon. */
function icon(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="112" fill="#0c0c0f" />
    <circle cx="176" cy="176" r="46" fill="#ffffff" opacity="0.22" />
    <circle cx="336" cy="176" r="46" fill="#ffffff" opacity="0.22" />
    <circle cx="176" cy="336" r="46" fill="#ffffff" opacity="0.22" />
    <circle cx="336" cy="336" r="62" fill="${ACCENT}" />
  </svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

async function png(svg, name) {
  const path = join(publicDir, name);
  await sharp(Buffer.from(svg)).png().toFile(path);
  console.log(`wrote public/${name}`);
}

await mkdir(publicDir, { recursive: true });

await png(card({
  line1: 'Fair picks.',
  line2: 'Every night.',
  lead: [
    'The racket sport club manager.',
    'Live courts, a digital pegboard and your whole crew.',
  ],
}), 'og.png');

await png(card({
  line1: 'You’re invited.',
  line2: 'Come and play.',
  lead: [
    'Someone has invited you to their session.',
    'Open the invite to see who is playing.',
  ],
}), 'og-join.png');

await png(icon(180), 'apple-touch-icon.png');

await writeFile(join(publicDir, 'favicon.svg'), icon(512), 'utf8');
console.log('wrote public/favicon.svg');
