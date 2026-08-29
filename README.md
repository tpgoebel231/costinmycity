# CostInMyCity

City-level home project cost plus cited municipal permit fees.

CostInMyCity is a static Next.js site at [costinmycity.com](https://costinmycity.com). Each city × project page shows a typical job cost (labor + materials, wage-adjusted for that metro) plus the local permit fee when the official schedule has been recorded. If we do not have the official fee, that line stays blank. We do not invent permit or cost numbers.

This is an **estimate, not a quote**. We are not a contractor marketplace and we do not send you to contractors.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build
```

Produces a static export in `out/` (see `next.config.ts`: `output: "export"`, `images.unoptimized`, `trailingSlash`). There is no `basePath`; the site is meant to live at the root of **costinmycity.com**.

`npm start` is not used for production. GitHub Pages serves the files in `out/`.

## GitHub Pages deploy

The workflow in `.github/workflows/pages.yml` builds the static export and deploys it with the official Pages actions (`upload-pages-artifact`, then `deploy-pages`).

1. Push this repo to GitHub.
2. In the repository: **Settings → Pages**.
   - Source: **GitHub Actions**.
   - Custom domain: `costinmycity.com`.
   - Enable **Enforce HTTPS** after DNS has propagated and the certificate is ready.
3. Push to `main` (or run the workflow manually). The job runs `npm ci`, `npm run build`, uploads `out/`, and deploys.

`public/CNAME` contains `costinmycity.com`. Next copies it into `out/` so Pages keeps the custom domain on every deploy.

Do not commit `node_modules` or `.next`. They are gitignored, along with `out/`, `build/`, and `.env*`.

## DNS (Porkbun → GitHub Pages)

Register **costinmycity.com** at Porkbun, then point the domain at GitHub Pages.

Apex (`costinmycity.com`) — four A records (delete conflicting A/AAAA/CNAME on `@`):

| Type | Host | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Optional IPv6 (AAAA) on `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

`www` — CNAME to your GitHub Pages host:

| Type | Host | Value |
|------|------|--------|
| CNAME | `www` | `<user-or-org>.github.io` |

Replace `<user-or-org>` with the GitHub user or organization that owns this repository. In GitHub Pages settings, add `costinmycity.com` and wait for DNS checks to pass. HTTPS usually provisions within minutes to a few hours after the domain verifies.

No `basePath`. The site is served from the domain root.

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

- `/` home
- `/cities` and `/city/[slug]`
- `/cost/[project]` hub and `/cost/[project]/[city]` money page
- `/tools/deck-materials`
- `/about`, `/methodology`
- `/sitemap.xml`
