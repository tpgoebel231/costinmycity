/**
 * "Where these numbers come from" and same-job permit lines on every cost page.
 * Math is a plain-JS mirror of lib/estimates.ts (same approach as hvac-paa-check).
 *
 *   node scripts/qa/trust-samejob-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;
const nationalWage = costsFile.nationalWageIndex || {};
const JOBS = ["roof-replacement", "hvac-replacement", "kitchen-remodel", "deck"];

const EM = /\u2014|&mdash;|&#8212;|&#x2014;/i;
const EN = /\u2013|&ndash;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/g;
const DATE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/g;

const META = Object.fromEntries(JOBS.map((slug) => [slug, readMeta(slug)]));
const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const cityByLabel = new Map(cities.map((city) => [city.name + ", " + city.stateAbbr, city.slug]));
const permitByKey = new Map(permits.map((row) => [row.citySlug + "|" + row.projectSlug, row]));

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readMeta(slug) {
  const src = fs.readFileSync(path.join(root, "lib/projects.ts"), "utf8");
  const roof = fs.readFileSync(path.join(root, "lib/roof-size.ts"), "utf8");
  const roofTypical = Number(roof.match(/typical:\s*(\d+)/)[1]);
  const start = src.indexOf('"' + slug + '": {');
  if (start < 0) throw new Error("missing meta " + slug);
  const from = src.slice(start);
  const end = from.indexOf("\n  },");
  const block = end >= 0 ? from.slice(0, end) : from;
  const pricing = block.match(/pricing:\s*"(job|per-unit)"/);
  if (!pricing) throw new Error("missing pricing " + slug);
  const literal = block.match(/defaultQuantity:\s*(\d+)/);
  const defaultQuantity = literal
    ? Number(literal[1])
    : /ROOF_SQUARES\.typical/.test(block)
      ? roofTypical
      : null;
  if (defaultQuantity == null) throw new Error("missing quantity " + slug);
  return { pricing: pricing[1], defaultQuantity };
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function textOf(html) {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

/** Drop tags and comments without inserting spaces, so glued link labels stay visible. */
function rawText(html) {
  return decode(html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, ""));
}

function assertSpacing(line, label) {
  if (/\.[A-Z][a-z]/.test(line)) fail(label + " glued sentence");
  if (/OEWS\S/.test(line)) fail(label + " glued BLS");
  if (/job\.BLS/.test(line)) fail(label + " glued labor");
  if (/from[A-Za-z]/.test(line)) fail(label + " glued from-source");
  if (/per[A-Z]/.test(line)) fail(label + " glued per-source");
  if (/\S\(retrieved/.test(line)) fail(label + " glued retrieved");
  if (/\)does not/.test(line)) fail(label + " glued unknown fee");
}

function usd(n) {
  if (n == null || Number.isNaN(n)) return "\u2013";
  const cents = Math.round(n * 100);
  if (Math.abs(n) < 1000 && cents % 100 !== 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatDate(iso) {
  if (!iso) return "";
  const trimmed = String(iso).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!dateOnly) return trimmed;
  const d = new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function parseMoney(token) {
  return Math.round(parseFloat(token.replace(/[$,]/g, "")) * 100);
}

function scaleBase(amount, multiplier, quantity, defaultQuantity, pricing, asJobTotal) {
  if (pricing === "job" || asJobTotal) {
    const factor = defaultQuantity > 0 ? quantity / defaultQuantity : 1;
    return Math.round(amount * multiplier * factor);
  }
  return Math.round(amount * multiplier * quantity);
}

function scalePermit(permit, quantity, defaultQty) {
  if (!permit) return { low: null, typical: null, high: null };
  const model = permit.feeModel;
  const qtyRatio = defaultQty > 0 ? quantity / defaultQty : 1;
  const scale = (n) => {
    if (n == null) return null;
    if (model === "flat" || model === "none") return Math.round(n);
    if (model === "valuation" || model === "sliding") return Math.round(n);
    if (model === "per_sqft" || model === "per_square" || model === "per-sqft") return Math.round(n * qtyRatio);
    return Math.round(n);
  };
  return { low: scale(permit.feeLowUsd), typical: scale(permit.feeTypicalUsd), high: scale(permit.feeHighUsd) };
}

function buildEstimate(project, city, permit) {
  const meta = META[project.projectSlug];
  const qty = meta.defaultQuantity;
  const multiplier = project.cityAdjustments?.[city.slug]?.multiplier ?? 1;
  const jobLow = scaleBase(project.nationalLow, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const jobTypical = scaleBase(project.nationalTypical, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const jobHigh = scaleBase(project.nationalHigh, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const scaled = scalePermit(permit, qty, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pLow = scaled.low ?? scaled.typical ?? 0;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  const pHigh = scaled.high ?? scaled.typical ?? 0;
  const common =
    typeof project.commonLow === "number" &&
    Number.isFinite(project.commonLow) &&
    typeof project.commonHigh === "number" &&
    Number.isFinite(project.commonHigh)
      ? { low: project.commonLow, high: project.commonHigh }
      : null;
  const bandJobLow = common
    ? scaleBase(common.low, multiplier, qty, meta.defaultQuantity, meta.pricing, false)
    : jobLow;
  const bandJobHigh = common
    ? scaleBase(common.high, multiplier, qty, meta.defaultQuantity, meta.pricing, false)
    : jobHigh;
  const addLow = permitKnown ? pLow : 0;
  const addHigh = permitKnown ? pHigh : 0;
  return {
    jobLow,
    jobTypical,
    jobHigh,
    permitLow: scaled.low,
    permitTypical: scaled.typical,
    permitHigh: scaled.high,
    allInLow: jobLow + addLow,
    allInTypical: jobTypical + (permitKnown ? pTyp : 0),
    allInHigh: jobHigh + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
    permitKnown,
    multiplier,
    permit,
  };
}

function permitDisplayUsd(est) {
  const t = est.permitTypical;
  const recorded = est.permit?.feeTypicalUsd;
  if (t != null && typeof recorded === "number" && Math.round(recorded) === t) return recorded;
  return t;
}

function moneyExactCents(n) {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = String(abs % 100).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + dollars + "." + rem;
}

function feeKnown(permit) {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}

function compactPermitFeeLabel(permit, feeLabel) {
  if (permit?.permitRequired === false && permit.feeTypicalUsd === 0) return feeLabel + ", no permit";
  return feeLabel;
}

function sameMoney(n, expected) {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

function sacramentoHvacExact(permit) {
  if (!permit || permit.citySlug !== "sacramento-ca" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 206.5) || !sameMoney(permit.feeTypicalUsd, 213)) return false;
  if (!sameMoney(permit.feeHighUsd, 235.1)) return false;
  return true;
}

/** Same label the compare table prints. Sacramento HVAC keeps "$213.00". */
function recomputedPermitLabel(permit) {
  if (!permit || !feeKnown(permit) || permit.feeTypicalUsd == null) return "Blank";
  if (sacramentoHvacExact(permit)) return moneyExactCents(permit.feeTypicalUsd);
  return compactPermitFeeLabel(permit, usd(permit.feeTypicalUsd));
}

function isDashLabel(label) {
  const compact = label.replace(/\s/g, "");
  return compact === "-" || compact === "\u2013" || compact === "\u2014";
}

const STATE_CENTER = {
  AL: [32.8, -86.8], AR: [34.9, -92.4], AZ: [34.3, -111.7], CA: [37.2, -119.5], CO: [39.0, -105.5],
  DC: [38.9, -77.0], FL: [28.6, -82.4], GA: [32.7, -83.4], HI: [20.8, -156.3], IA: [42.1, -93.5],
  ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], KS: [38.5, -98.4], KY: [37.5, -85.3],
  LA: [31.1, -92.0], MA: [42.3, -71.8], MD: [39.0, -76.8], MI: [44.3, -85.4], MN: [46.3, -94.3],
  MO: [38.4, -92.5], NC: [35.6, -79.4], NE: [41.5, -99.8], NJ: [40.2, -74.7], NM: [34.4, -106.1],
  NV: [39.3, -116.6], NY: [42.9, -75.5], OH: [40.3, -82.8], OK: [35.6, -97.5], OR: [43.9, -120.6],
  PA: [40.9, -77.8], RI: [41.7, -71.5], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7],
  VA: [37.5, -78.9], WA: [47.4, -120.5], WI: [44.6, -89.9],
};

const CENSUS_REGION = {
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast", RI: "Northeast", VT: "Northeast",
  NJ: "Northeast", NY: "Northeast", PA: "Northeast",
  IL: "Midwest", IN: "Midwest", MI: "Midwest", OH: "Midwest", WI: "Midwest", IA: "Midwest",
  KS: "Midwest", MN: "Midwest", MO: "Midwest", NE: "Midwest", ND: "Midwest", SD: "Midwest",
  DE: "South", FL: "South", GA: "South", MD: "South", NC: "South", SC: "South", VA: "South",
  DC: "South", WV: "South", AL: "South", KY: "South", MS: "South", TN: "South", AR: "South",
  LA: "South", OK: "South", TX: "South",
  AZ: "West", CO: "West", ID: "West", MT: "West", NV: "West", NM: "West", UT: "West", WY: "West",
  AK: "West", CA: "West", HI: "West", OR: "West", WA: "West",
};

const REGION_ORDER = ["Northeast", "Midwest", "South", "West"];
const SAME_JOB_MIN = 4;
const SAME_JOB_MAX = 6;

function hasCoords(city) {
  return typeof city.lat === "number" && Number.isFinite(city.lat) && typeof city.lng === "number" && Number.isFinite(city.lng);
}

function distanceMiles(a, b) {
  const radius = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function stateDistance(a, b) {
  const p = STATE_CENTER[a];
  const q = STATE_CENTER[b];
  if (!p || !q) return Number.POSITIVE_INFINITY;
  const dLat = p[0] - q[0];
  const dLng = (p[1] - q[1]) * Math.cos(((p[0] + q[0]) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

function compareCities(a, b) {
  const byName = a.name.localeCompare(b.name, "en");
  if (byName !== 0) return byName;
  return a.slug.localeCompare(b.slug, "en");
}

function sortByCloseness(origin, list) {
  return [...list].sort((a, b) => {
    if (hasCoords(origin) && hasCoords(a) && hasCoords(b)) {
      const delta = distanceMiles(origin, a) - distanceMiles(origin, b);
      if (delta !== 0) return delta;
    }
    const byState = stateDistance(origin.stateAbbr, a.stateAbbr) - stateDistance(origin.stateAbbr, b.stateAbbr);
    if (Number.isFinite(byState) && byState !== 0) return byState;
    return (b.population || 0) - (a.population || 0) || compareCities(a, b);
  });
}

function sameJobPeers(city) {
  const others = cities.filter((item) => item.slug !== city.slug);
  const sameState = others.filter((item) => item.stateAbbr === city.stateAbbr).sort(compareCities);
  const picked = sameState.slice(0, SAME_JOB_MAX);
  if (picked.length >= SAME_JOB_MIN) return picked;
  const region = CENSUS_REGION[city.stateAbbr];
  const seen = () => new Set(picked.map((item) => item.slug));
  if (region) {
    const rest = others.filter((item) => !seen().has(item.slug) && CENSUS_REGION[item.stateAbbr] === region);
    for (const item of sortByCloseness(city, rest)) {
      if (picked.length >= SAME_JOB_MAX) break;
      picked.push(item);
    }
  }
  if (picked.length >= SAME_JOB_MIN) return picked.slice(0, SAME_JOB_MAX);
  const have = seen();
  for (const regionName of REGION_ORDER) {
    if (regionName === region) continue;
    const rest = others.filter((item) => !have.has(item.slug) && CENSUS_REGION[item.stateAbbr] === regionName);
    for (const item of sortByCloseness(city, rest)) {
      if (picked.length >= SAME_JOB_MIN) break;
      picked.push(item);
      have.add(item.slug);
    }
    if (picked.length >= SAME_JOB_MIN) break;
  }
  return picked.slice(0, SAME_JOB_MAX);
}

function block(html, id, closeTag) {
  const marker = 'id="' + id + '"';
  const at = html.indexOf(marker);
  if (at < 0) return "";
  const end = html.indexOf(closeTag, at);
  if (end < 0) return "";
  return html.slice(at, end + closeTag.length);
}

function hashLinks(blockHtml) {
  return [...blockHtml.matchAll(/<a\b[^>]*href="(#[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map((match) => ({
    href: match[1],
    label: textOf(match[2]),
  }));
}

function allowedNumbers(project, city, permit, est) {
  const values = [
    project.nationalLow,
    project.nationalTypical,
    project.nationalHigh,
    project.commonLow,
    project.commonHigh,
    project.nationalPerSqftLow,
    project.nationalPerSqftHigh,
    project.nationalJobLow,
    project.nationalJobTypical,
    project.nationalJobHigh,
    nationalWage.nationalMeanHourlyUsd,
    project.cityAdjustments?.[city.slug]?.blsConstructionMeanHourlyUsd,
    permit?.feeLowUsd,
    permit?.feeTypicalUsd,
    permit?.feeHighUsd,
    permit?.typicalProjectValueUsd,
    permitDisplayUsd(est),
    est.permitLow,
    est.permitTypical,
    est.permitHigh,
    est.jobLow,
    est.jobTypical,
    est.jobHigh,
    est.allInLow,
    est.allInTypical,
    est.allInHigh,
    est.bandLow,
    est.bandHigh,
  ];
  return values.filter((n) => typeof n === "number" && Number.isFinite(n));
}

function sourceNameBlob(name) {
  return String(name || "").replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
}

function dollarAllowed(cents, values) {
  for (const n of values) {
    if (Math.round(n * 100) === cents) return true;
    if (parseMoney(usd(n)) === cents) return true;
  }
  return false;
}

function tocBlock(html, kind) {
  if (kind === "desk") {
    const match = html.match(/<nav class="toc-desk"[^>]*>[\s\S]*?<\/nav>/);
    return match ? match[0] : "";
  }
  const match = html.match(/<details class="toc-mob[\s\S]*?<\/details>/);
  return match ? match[0] : "";
}

function checkPage(job, city) {
  const rel = "cost/" + job + "/" + city.slug + "/index.html";
  const file = path.join(outDir, "cost", job, city.slug, "index.html");
  if (!fs.existsSync(file)) {
    fail(rel + " missing");
    return { steps: 0, cards: 0 };
  }
  const html = fs.readFileSync(file, "utf8");
  const project = projects.find((item) => item.projectSlug === job);
  const permit = permitByKey.get(city.slug + "|" + job) || null;
  const est = buildEstimate(project, city, permit);
  const label = job + "/" + city.slug;

  if ((html.split('id="numbers-source"').length - 1) !== 1) {
    fail(label + " #numbers-source count");
  }
  const section = block(html, "numbers-source", "</section>");
  if (!section) fail(label + " missing #numbers-source");
  const h2 = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  if (!h2 || textOf(h2[1]) !== "Where these numbers come from") fail(label + " numbers h2");
  const ol = section.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/);
  const steps = ol ? [...ol[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)] : [];
  if (steps.length < 3) fail(label + " steps " + steps.length);
  for (const match of steps) assertSpacing(rawText(match[1]), label);

  if (EM.test(section) || EN.test(section)) fail(label + " em/en dash in #numbers-source");

  for (const kind of ["desk", "mob"]) {
    const links = hashLinks(tocBlock(html, kind));
    const sourceAt = links.findIndex((item) => item.href === "#numbers-source");
    const citeAt = links.findIndex((item) => item.href === "#citations");
    if (sourceAt < 0 || citeAt < 0 || sourceAt > citeAt) fail(label + " TOC order " + kind);
    const tocItem = links[sourceAt];
    if (tocItem && tocItem.label !== "Where numbers come from") fail(label + " TOC label " + kind);
  }

  const costSource = project.sources?.[0];
  const visible = textOf(section);
  const values = allowedNumbers(project, city, permit, est);
  const nameBlobs = [sourceNameBlob(costSource?.name), sourceNameBlob(permit?.sourceName)].filter(Boolean);
  const dollars = visible.match(DOLLAR) || [];
  for (const token of dollars) {
    const inName = nameBlobs.some((name) => name.includes(token));
    if (!inName && !dollarAllowed(parseMoney(token), values)) fail(label + " unexpected dollar " + token);
  }

  const hero = html.match(/data-hero-typical="([0-9.]+)"/);
  const heroN = hero ? Number(hero[1]) : NaN;
  if (heroN !== est.allInTypical) fail(label + " hero typical " + heroN + " vs " + est.allInTypical);

  const totalLi = steps.map((match) => textOf(match[1])).find((line) => line.includes("Typical all in"));
  const shown = permitDisplayUsd(est);
  const closes = est.permitKnown
    ? shown != null && Math.abs(est.jobTypical + shown - est.allInTypical) < 0.001
    : est.allInTypical === est.jobTypical;
  if (closes) {
    if (!totalLi) fail(label + " missing step 5");
    else {
      const totalDollars = totalLi.match(DOLLAR) || [];
      const last = totalDollars[totalDollars.length - 1];
      if (!last || parseMoney(last) !== parseMoney(usd(heroN))) fail(label + " step 5 total " + last + " vs hero " + usd(heroN));
    }
  } else if (totalLi) {
    fail(label + " step 5 present but sum does not close");
  }

  const sourceDate = formatDate(costSource?.retrievedDate);
  const permitDate = formatDate(permit?.retrievedDate);
  if (sourceDate && !visible.includes(sourceDate)) fail(label + " missing source date " + sourceDate);
  if (permit?.retrievedDate && permitDate && !visible.includes(permitDate)) fail(label + " missing permit date " + permitDate);
  for (const found of visible.match(DATE) || []) {
    const fromRetrieved = found === sourceDate || found === permitDate;
    const inName = nameBlobs.some((name) => name.includes(found));
    if (!fromRetrieved && !inName) fail(label + " unexpected date " + found);
  }

  const hrefs = [...section.matchAll(/\bhref="([^"]+)"/g)].map((match) => decode(match[1]));
  const allowedLinks = new Set(
    [costSource?.url, permit?.sourceUrl, project.cityAdjustments?.[city.slug]?.source, nationalWage.sourceUrl, "/methodology/", "/methodology"]
      .filter(Boolean)
      .map((href) => decode(String(href))),
  );
  for (const href of hrefs) {
    if (!allowedLinks.has(href)) fail(label + " unexpected link " + href);
  }
  if (costSource?.url && !hrefs.includes(costSource.url)) fail(label + " missing national source link");
  if (permit?.sourceUrl && !hrefs.includes(permit.sourceUrl)) fail(label + " missing permit link");
  const bls = project.cityAdjustments?.[city.slug]?.source;
  if (visible.includes("BLS OEWS") && bls && !hrefs.includes(bls)) fail(label + " missing BLS link");
  const hasTotal = Boolean(totalLi);
  const hasMethod = hrefs.includes("/methodology/") || hrefs.includes("/methodology");
  if (hasTotal !== hasMethod) fail(label + " methodology link " + hasMethod + " total " + hasTotal);

  const same = block(html, "same-job", "</section>");
  const peers = sameJobPeers(city);
  const expectedHrefs = peers.map((peer) => "/cost/" + job + "/" + peer.slug + "/");
  const cards = same
    ? [...same.matchAll(/<a\b[^>]*class="[^"]*nearby-card[^"]*"[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0])
    : [];
  const gotHrefs = cards.map((card) => {
    const href = card.match(/\bhref="([^"]+)"/);
    return href ? decode(href[1]) : "";
  });
  if (gotHrefs.join("|") !== expectedHrefs.join("|")) {
    fail(label + " same-job hrefs\n    got " + gotHrefs.join(" ") + "\n    exp " + expectedHrefs.join(" "));
  }

  const compare = block(html, "compare", "</details>");
  const tablePermit = new Map();
  if (compare) {
    const rows = [...compare.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)].map((match) => match[0]);
    for (const row of rows) {
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
      if (cells.length < 3) continue;
      const link = cells[0].match(/\bhref="([^"]+)"/);
      let slug = "";
      if (link) {
        const parts = decode(link[1]).split("/").filter(Boolean);
        slug = parts[parts.length - 1];
      } else {
        slug = cityByLabel.get(textOf(cells[0])) || "";
      }
      if (slug) tablePermit.set(slug, textOf(cells[2]));
    }
  }

  cards.forEach((card, index) => {
    const peer = peers[index];
    if (!peer) return;
    const metas = [...card.matchAll(/<span class="meta">([\s\S]*?)<\/span>/g)].map((match) => textOf(match[1]));
    const peerPermit = permitByKey.get(peer.slug + "|" + job) || null;
    const peerEst = buildEstimate(project, peer, peerPermit);
    const typical = "Typical " + usd(peerEst.allInTypical);
    if (metas[0] !== typical) fail(label + " " + peer.slug + " typical " + JSON.stringify(metas[0]) + " vs " + JSON.stringify(typical));
    const expected = tablePermit.has(peer.slug) ? tablePermit.get(peer.slug) : recomputedPermitLabel(peerPermit);
    if (isDashLabel(expected)) {
      if (metas.length > 1) fail(label + " " + peer.slug + " should omit permit line");
      return;
    }
    const permitText = metas[1] || "";
    const feeText = permitText.startsWith("Permit ") ? permitText.slice("Permit ".length) : permitText;
    if (feeText !== expected) {
      fail(label + " " + peer.slug + " permit " + JSON.stringify(permitText) + " vs " + JSON.stringify(expected));
    }
  });

  return { steps: steps.length, cards: cards.length };
}

let pages = 0;
let stepTotal = 0;
let cardTotal = 0;
for (const job of JOBS) {
  for (const city of cities) {
    pages += 1;
    const counted = checkPage(job, city);
    stepTotal += counted.steps;
    cardTotal += counted.cards;
  }
}

if (pages !== 400) fail("page count " + pages);

if (failures.length) {
  console.error("trust-samejob-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log("trust-samejob-check: 400 cost pages OK, " + stepTotal + " steps, " + cardTotal + " cards");
