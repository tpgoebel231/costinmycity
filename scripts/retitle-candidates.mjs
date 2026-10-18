#!/usr/bin/env node
/**
 * Build data/retitle-candidates.csv from GSC Pages.csv.
 * Criteria: 0 clicks, avg position <= 15. Excludes /city/chicago-il/ (PR #224).
 * Prefers /workspace/gsc-export-2026-10-18/site/, falls back to 2026-10-16.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://costinmycity.com";
const EXCLUDE = new Set(["https://costinmycity.com/city/chicago-il/"]);

const PAGES_CANDIDATES = [
  "/workspace/gsc-export-2026-10-18/site/Pages.csv",
  "/workspace/gsc-export-2026-10-16/site/Pages.csv",
];
const QUERIES_CANDIDATES = [
  "/workspace/gsc-export-2026-10-18/site/Queries.csv",
  "/workspace/gsc-export-2026-10-16/site/Queries.csv",
];

function pickExisting(paths) {
  for (const p of paths) if (existsSync(p)) return p;
  throw new Error("No GSC CSV found among: " + paths.join(", "));
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQ = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function normUrl(url) {
  let u = (url || "").trim();
  if (!u) return "";
  u = u.replace(/^http:\/\//i, "https://");
  u = u.replace(/^https:\/\/www\./i, "https://");
  if (!u.endsWith("/")) u += "/";
  return u;
}

function pathFromUrl(url) {
  return normUrl(url).replace(SITE, "") || "/";
}

function htmlPathFor(urlPath) {
  // /city/austin-tx/ -> out/city/austin-tx/index.html
  const p = urlPath === "/" ? "/index.html" : urlPath.replace(/\/$/, "") + "/index.html";
  return join(ROOT, "out" + p);
}

function extractMeta(html) {
  const titleM = html.match(/<title>([^<]*)<\/title>/i);
  const descM =
    html.match(/name=["']description["']\s+content=["']([^"']*)["']/i) ||
    html.match(/content=["']([^"']*)["']\s+name=["']description["']/i);
  return {
    title: titleM ? titleM[1].trim() : "",
    description: descM ? descM[1].trim() : "",
  };
}

function stripBrand(title) {
  return title
    .replace(/\s*[–—-]\s*CostInMyCity\s*$/i, "")
    .trim();
}

const PROJECT_ALIASES = [
  {
    slug: "roof-replacement",
    words: ["roof", "roofing", "reroof", "re-roof"],
  },
  {
    slug: "hvac-replacement",
    words: ["hvac", "ac unit", "air conditioning", "furnace", "heat pump"],
  },
  {
    slug: "deck",
    words: ["deck", "decking"],
  },
  {
    slug: "kitchen-remodel",
    words: ["kitchen", "kitchen remodel", "kitchen renovation", "kitchen reno"],
  },
];

function loadCities() {
  const raw = JSON.parse(readFileSync(join(ROOT, "data/cities.json"), "utf8"));
  const list = Array.isArray(raw) ? raw : raw.cities || [];
  return list.map((c) => ({
    slug: c.slug,
    name: c.name,
    state: c.state || c.stateCode || "",
    nameLower: String(c.name || "").toLowerCase(),
  }));
}

function matchTopQuery(urlPath, queries, cities) {
  // urlPath like /cost/roof-replacement/chicago-il/ or /city/austin-tx/
  const money = urlPath.match(/^\/cost\/([^/]+)\/([^/]+)\/$/);
  const hub = urlPath.match(/^\/city\/([^/]+)\/$/);
  const projectHub = urlPath.match(/^\/cost\/([^/]+)\/$/);

  let projectSlug = null;
  let citySlug = null;
  if (money) {
    projectSlug = money[1];
    citySlug = money[2];
  } else if (hub) {
    citySlug = hub[1];
  } else if (projectHub) {
    projectSlug = projectHub[1];
  }

  const city = citySlug ? cities.find((c) => c.slug === citySlug) : null;
  const proj = projectSlug
    ? PROJECT_ALIASES.find((p) => p.slug === projectSlug)
    : null;

  let best = null;
  for (const q of queries) {
    const text = q.query;
    const lower = text.toLowerCase();
    let score = 0;
    if (city) {
      if (lower.includes(city.nameLower)) score += 3;
      else continue; // city pages/money need city name in query when city known
    }
    if (proj) {
      if (proj.words.some((w) => lower.includes(w))) score += 2;
      else if (money) continue; // money page: require project word
    }
    if (hub && !proj) {
      // city hub: prefer renovation / home / permit / remodel queries
      if (/\brenovat|\bremodel|\bhome (project|repair|cost)|\bpermit/.test(lower))
        score += 1;
    }
    if (score <= 0) continue;
    const candidate = {
      query: text,
      impressions: q.impressions,
      position: q.position,
      score,
    };
    if (
      !best ||
      candidate.score > best.score ||
      (candidate.score === best.score && candidate.impressions > best.impressions)
    ) {
      best = candidate;
    }
  }
  return best ? best.query : "";
}

function main() {
  const pagesPath = pickExisting(PAGES_CANDIDATES);
  const queriesPath = pickExisting(QUERIES_CANDIDATES);
  console.log("Pages:", pagesPath);
  console.log("Queries:", queriesPath);

  const pageRows = parseCsv(readFileSync(pagesPath, "utf8"));
  const queryRows = parseCsv(readFileSync(queriesPath, "utf8")).map((r) => ({
    query: (r["Top queries"] || "").replace(/^"+|"+$/g, ""),
    clicks: Number(r.Clicks || 0),
    impressions: Number(r.Impressions || 0),
    position: Number(r.Position || 0),
  }));

  // Aggregate by normalized URL (GSC sometimes lists slash and no-slash)
  const agg = new Map();
  for (const row of pageRows) {
    const url = normUrl(row["Top pages"]);
    if (!url.startsWith(SITE)) continue;
    const clicks = Number(row.Clicks || 0);
    const impr = Number(row.Impressions || 0);
    const pos = Number(row.Position || 0);
    if (!impr) continue;
    const cur = agg.get(url) || { clicks: 0, impr: 0, posW: 0 };
    cur.clicks += clicks;
    cur.posW += pos * impr;
    cur.impr += impr;
    agg.set(url, cur);
  }

  const cities = loadCities();
  const outRows = [];

  for (const [url, d] of agg) {
    if (EXCLUDE.has(url)) continue;
    if (d.clicks !== 0) continue;
    const position = d.posW / d.impr;
    if (position > 15) continue;

    const urlPath = pathFromUrl(url);
    const htmlFile = htmlPathFor(urlPath);
    let currentTitle = "";
    let currentDescription = "";
    if (existsSync(htmlFile)) {
      const meta = extractMeta(readFileSync(htmlFile, "utf8"));
      currentTitle = stripBrand(meta.title);
      currentDescription = meta.description;
    }

    const topQuery = matchTopQuery(urlPath, queryRows, cities);

    outRows.push({
      url,
      path: urlPath,
      top_query: topQuery,
      position: Math.round(position * 100) / 100,
      impressions: d.impr,
      current_title: currentTitle,
      current_description: currentDescription,
    });
  }

  outRows.sort((a, b) => b.impressions - a.impressions || a.position - b.position);

  const outDir = join(ROOT, "data");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, "retitle-candidates.csv");
  const header = [
    "url",
    "path",
    "top_query",
    "position",
    "impressions",
    "current_title",
    "current_description",
  ];
  const body = outRows
    .map((r) =>
      header
        .map((h) => csvEscape(r[h]))
        .join(","),
    )
    .join("\n");
  writeFileSync(outFile, header.join(",") + "\n" + body + "\n", "utf8");
  console.log("Wrote", outFile, "(" + outRows.length + " rows)");
  console.log(
    "By kind:",
    JSON.stringify(
      outRows.reduce((acc, r) => {
        let k = "other";
        if (r.path.startsWith("/cost/") && r.path.split("/").filter(Boolean).length === 3)
          k = "money";
        else if (r.path.startsWith("/city/")) k = "city_hub";
        else if (r.path.startsWith("/cost/") && r.path.split("/").filter(Boolean).length === 2)
          k = "project_hub";
        else if (["/about/", "/contact/", "/cities/", "/methodology/", "/privacy/"].includes(r.path))
          k = "static";
        acc[k] = (acc[k] || 0) + 1;
        return acc;
      }, {}),
    ),
  );
}

main();
