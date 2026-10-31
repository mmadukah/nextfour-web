# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: players looking for a game.** People who play racket sports and want a session near them: a club night, an open play session or a drop-in. They usually arrive from search, often on a phone, and want the day, time, venue, level and visitor terms before deciding to turn up. When player and organiser needs conflict on the website, players win.

**Secondary: organisers of sessions.** The people who run the courts, the queue and the picks on the night, whether a club night or an open session. They mostly reach the site through their players ("show your organiser, they can claim it"), through a club listing they can claim, or through Home and How it works.

## Product Purpose

nextfour.app is the website for NextFour, the app for finding and running racket sport sessions (badminton, squash, tennis, padel, table tennis). It is not only for clubs and not only for badminton; the site says "sessions" rather than "club nights" except where it means a club's own nights. The site does three things:

1. **The directory:** a UK finder for badminton clubs and drop-in sessions (`/badminton.html`), with an area page per council area, a page per club and a page per drop-in venue. It is badminton-only for now and exists mainly for search and to bring players to the app, so it should not dominate the rest of the site.
2. **Getting the app:** Home, the get page, store badges, a QR code for desktop visitors, and hand-off pages (`claim`, `club-claim`, `join`, `open`) that open clubs and sessions in the app.
3. **Trust and legal:** How it works (the published rules behind the queue and the picks), privacy, terms, support, account deletion and Data sources. The store listings link to these pages; account deletion is linked from Privacy and Support rather than the footer.

Success means a player finds a real session near them and gets the app, and an organiser whose night is listed claims it and runs it on NextFour.

## Positioning

A digital version of the pegboard that clubs already use: players peg on, the next picker gets a nudge and chooses three players for the free court. Live courts, fair picks, and a courtside tablet board (Terminal mode). The site adds a public directory of sessions that are not on NextFour yet, which gives players a reason to come and gives organisers a listing to claim. The fairness rules are published openly so anyone can check them.

## Operating Context

- A session: players check in, wait in a queue ordered by waiting time, get picked onto courts, and an organiser (or deputies) oversees it. The app runs the night; the website points people to it.
- Players search by postcode, town, club name or "Near me", filter by night, level and kind (club or drop-in), and see results as a list or a map.
- Organisers create a session (date, courts, picking method: Pegboard, Manual, Skill-based or King of the Court), share it, and let the board run.
- Plans: Free, Performance (players), Pro (organisers) and Club. The site names the plans but never shows prices: "You'll see the prices in the app before you subscribe."

## Capabilities and Constraints

- **Stack:** Astro, a static build deployed to GitHub Pages from `main`. URLs are flat `*.html` files that the App Store and Play Store listings already link to, so they must not change.
- **Languages:** English (bare URLs) and French (`/fr/`). The directory is English only. A footer language menu exists.
- **Directory data:** fetched at build time from the app's `web-directory` function and never committed, because the repo is public. Council areas (ONS) and postcode districts (Doogal) are committed under the Open Government Licence. The attributions for these and for the OpenActive drop-in feeds (CC BY 4.0) live on `/data-sources.html`, which the footer links to; venue pages also credit their own operator.
- **Privacy:** postcode search runs in the browser against `/postcode-districts.json`, so a postcode never leaves the visitor's device. "Near me" uses the browser's location prompt.
- **SEO:** directory pages are crawlable without JavaScript (every area and club is a plain link). Hand-off pages stay out of the sitemap.
- **Themes:** light, dark and Auto.
- **Undecided:** whether the directory expands beyond badminton or the UK; whether more languages are coming; a required accessibility standard.

## Brand Commitments

- Name: **NextFour**. There is a logo mark (`src/components/LogoMark.astro`, `public/favicon.svg`).
- Voice: plain, warm and specific to a night on court ("Less faff at the door. More time on court.", "nobody argued about who was next"). Uses British English and the sport's own words: pegboard, court, peg on. Says "session" for the general case; "club night" only for a club's own nights.
- Support contact: support@nextfour.app.

## Evidence on Hand

- Real app screenshots in `public/screens/`: `board-tablet`, `pick-nudge`, `pick-sheet`, `map`, `loop-checkin` (the check-in QR), `loop-pick`, `loop-waiting` (the waiting queue). New tablet captures can be taken from a connected tablet over adb.
- Store badges in `public/badges/` and QR codes in `public/get-app-qr.svg` and `public/get-qr.svg`.
- Live directory counts (clubs, weekly club nights, drop-in sessions), computed at build time. Locally the data comes from a saved `.cache/directory.json`, which can be older than the live data.
- The published fairness rules in `src/content/legal/*/how-it-works.md`.
- **None yet:** testimonials, named customer clubs, user or download numbers, press, ratings. The product is at an early stage ("Be one of the first clubs"). Do not invent any of these.

## Product Principles

1. **Players first.** Answer a player's question (where, when, what level, can I just turn up) before anything else. Organiser messages come after it, or come through the player.
2. **Real data only.** Every claim and number on the site comes from the directory build or the app itself. Leave a gap empty rather than fill it with an invented quote or figure.
3. **The night is the product.** Describe NextFour through a real night on court (check in, pick, play), not through abstract features.
4. **Fairness is open.** The picking rules are public and checkable. Never imply the system decides in secret.
5. **Respect the visitor.** Keep data on the device where possible, make pages crawlable and fast without scripts, and keep URLs stable.
