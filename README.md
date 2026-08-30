# CostInMyCity

City-level home project cost plus cited municipal permit fees.

CostInMyCity is a static Next.js site at [https://costinmycity.com/](https://costinmycity.com/). The live site is a GitHub Pages custom-domain root (no `basePath`). Each city × project page shows a typical job cost (labor + materials, wage-adjusted for that metro) plus the local permit fee when the official schedule has been recorded. If we do not have the official fee, that line stays blank. We do not invent permit or cost numbers. Example estimate: [https://costinmycity.com/cost/roof-replacement/seattle-wa/](https://costinmycity.com/cost/roof-replacement/seattle-wa/).

This is an **estimate, not a quote**. We are not a contractor marketplace and we do not send you to contractors.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open http://localhost:3000/ (no `basePath`).

```bash
npm run build
```

Produces a static export in `out/` (see `next.config.ts`: `output: "export"`, `images.unoptimized`, `trailingSlash`; no `basePath` or `assetPrefix`). The site is a GitHub Pages **custom-domain root** at https://costinmycity.com/.

`npm start` is not used for production. GitHub Pages serves the files in `out/`.

## GitHub Pages deploy

The live site is **https://costinmycity.com/**.

The workflow in `.github/workflows/pages.yml` builds the static export and deploys it with the official Pages actions (`upload-pages-artifact`, then `deploy-pages`). GitHub Pages is deployed via GitHub Actions.

1. Push this repo to GitHub.
2. In the repository: **Settings → Pages**.
   - Source: **GitHub Actions**.
   - Custom domain: **costinmycity.com**.
3. Push to `main` (or run the workflow manually). The job runs `npm ci`, `npm run build`, uploads `out/`, and deploys.

`public/CNAME` contains exactly `costinmycity.com`. Next.js static export copies `public/` into `out/`, so GitHub Pages receives the CNAME.

Do not commit `node_modules` or `.next`. They are gitignored, along with `out/`, `build/`, and `.env*`.

## What the numbers are

- Typical labor and materials for that city, then the permit as its own line from the city’s published fee schedule, with a source link.
- If the official fee is unknown, the cell stays blank. We do not guess.
- An estimate, not a contractor quote. Permit fees change. Verify with your city before you pull a permit.

## Data files

The app reads JSON from `data/` at build time. No database. No seed fallbacks for these files:

- `cities.json` — cities, permit department, portal, fee schedule.
- `permits.json` — one row per city × project. Null fees stay null.
- `project-costs.json` — national ranges, labor/material shares, BLS city multipliers.
- `deck-materials.json` — calculator coverage, lumber types, fasteners, editable default prices.
- `SOURCES.md` — primary citations.

## Pages

- `/` home — https://costinmycity.com/
- `/cities/` and `/city/[slug]/`
- `/cost/[project]/` hub and `/cost/[project]/[city]/` money page, e.g. https://costinmycity.com/cost/roof-replacement/seattle-wa/
- `/tools/deck-materials/`
- `/about/`, `/methodology/`, `/privacy/`
- `/sitemap.xml`
