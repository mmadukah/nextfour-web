# nextfour-web

The marketing site and legal pages for [NextFour](https://nextfour.app) — the
racket sport club manager. Built with [Astro](https://astro.build) and deployed
to GitHub Pages.

## Editing content (no code needed)

The legal / prose pages live as Markdown in `src/content/legal/`:

| File | Published at |
| --- | --- |
| `privacy.md` | `/privacy.html` |
| `terms.md` | `/terms.html` |
| `support.md` | `/support.html` |
| `delete-account.md` | `/delete-account.html` |

Each file starts with a small frontmatter block:

```markdown
---
title: Privacy Policy
meta: "Last updated: 7 May 2026"
---

Body text in Markdown...
```

- `title` — the page heading (rendered as "NextFour — {title}") and `<title>`.
- `meta` — the small grey line under the heading.

Edit the Markdown, commit, and push to `main` — the site rebuilds and deploys
automatically. The filename is the URL slug, so renaming a file changes its URL.

The landing page is `src/pages/index.astro` (custom layout, not Markdown).

## Running locally

Requires **Node 22.12+** (see `.nvmrc` — `nvm use` picks it up).

```bash
npm install      # first time only
npm run dev      # local preview at http://localhost:4321
npm run build    # production build into dist/
npm run preview  # serve the built dist/ locally
```

## How it's wired up

- `src/layouts/Base.astro` — the HTML shell.
- `src/layouts/Legal.astro` — wraps the Markdown pages in the shared prose styling.
- `src/pages/[slug].astro` — renders each `legal` Markdown entry.
- `src/content.config.ts` — defines the `legal` content collection + frontmatter schema.
- `astro.config.mjs` — `build.format: 'file'` keeps flat `*.html` URLs.
- `public/` — files served as-is (`CNAME` for the custom domain, `app-ads.txt`).

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site
and publishes it to GitHub Pages. The Pages **Source** must be set to
**GitHub Actions** (repo → Settings → Pages).
