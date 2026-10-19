/**
 * Batch 3: updated dates, same-job cards, and budget FAQ bands.
 * Math mirrors lib/estimates.ts, lib/page-dates.ts, and lib/same-job.ts.
 * Does not import those modules.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = (Array.isArray(costsFile) ? costsFile : costsFile.projects).filter((item) => item?.projectSlug);

const ORDER = ["roof-replacement", "hvac-replacement", "deck", "kitchen-remodel"];
const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16, min: 8, max: 60, step: 1 },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1, min: 1, max: 4, step: 1 },
  deck: { pricing: "per-unit", defaultQuantity: 320, min: 80, max: 1200, step: 10 },
  "kitchen-remodel": { pricing: "per-unit", defaultQuantity: 200, min: 80, max: 500, step: 10 },
};
const SAME_JOB_MIN = 4;
const SAME_JOB_MAX = 6;
const REGION_ORDER = ["Northeast", "Midwest", "South", "West"];
const CENSUS_REGION = {
  CT: "Northeast", ME: "Northeast", MA: "Northeast", NH: "Northeast", RI: "Northeast", VT: "Northeast",
  NJ: "Northeast", NY: "Northeast", PA: "Northeast",
  IL: "Midwest", IN: "Midwest", MI: "Midwest", OH: "Midwest", WI: "Midwest", IA: "Midwest", KS: "Midwest",
  MN: "Midwest", MO: "Midwest", NE: "Midwest", ND: "Midwest", SD: "Midwest",
  DE: "South", FL: "South", GA: "South", MD: "South", NC: "South", SC: "South", VA: "South", DC: "South",
  WV: "South", AL: "South", KY: "South", MS: "South", TN: "South", AR: "South", LA: "South", OK: "South", TX: "South",
  AZ: "West", CO: "West", ID: "West", MT: "West", NV: "West", NM: "West", UT: "West", WY: "West", AK: "West",
  CA: "West", HI: "West", OR: "West", WA: "West",
};
const OLD_TRIPLE =
  /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) low, \$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) typical, and \$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) high/g;

const failures = [];

function fail(message) {
  failures.push(message);
}

function launchSlugs() {
  const fromData = projects.map((item) => item.projectSlug);
  const ordered = ORDER.filter((slug) => fromData.includes(slug));
  const extra = fromData.filter((slug) => !ORDER.includes(slug));
  return [...ordered, ...extra];
}

function htmlFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) htmlFiles(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function scaleBase(amount, multiplier, quantity, defaultQuantity, pricing) {
  if (pricing === "job") {
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

function buildEstimate(project, city, permit, quantity) {
  const meta = META[project.projectSlug] || { pricing: "job", defaultQuantity: 1, min: 1, max: 1, step: 1 };
  const qty = quantity ?? meta.defaultQuantity;
  const multiplier = project.cityAdjustments?.[city.slug]?.multiplier ?? 1;
  const jobLow = scaleBase(project.nationalLow, multiplier, qty, meta.defaultQuantity, meta.pricing);
  const jobTypical = scaleBase(project.nationalTypical, multiplier, qty, meta.defaultQuantity, meta.pricing);
  const jobHigh = scaleBase(project.nationalHigh, multiplier, qty, meta.defaultQuantity, meta.pricing);
  const scaled = scalePermit(permit, qty, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pLow = scaled.low ?? scaled.typical ?? 0;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  const pHigh = scaled.high ?? scaled.typical ?? 0;
  const common =
    typeof project.commonLow === "number" && typeof project.commonHigh === "number"
      ? { low: project.commonLow, high: project.commonHigh }
      : null;
  const bandJobLow = common
    ? scaleBase(common.low, multiplier, qty, meta.defaultQuantity, meta.pricing)
    : jobLow;
  const bandJobHigh = common
    ? scaleBase(common.high, multiplier, qty, meta.defaultQuantity, meta.pricing)
    : jobHigh;
  const addLow = permitKnown ? pLow : 0;
  const addHigh = permitKnown ? pHigh : 0;
  return {
    allInLow: jobLow + addLow,
    allInTypical: jobTypical + (permitKnown ? pTyp : 0),
    allInHigh: jobHigh + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
  };
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

function retrievedDay(raw) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(raw || "").trim());
  return match ? match[1] : null;
}

function latestRetrievedDate(values) {
  let latest = "";
  for (const raw of values) {
    const day = retrievedDay(raw);
    if (day && day > latest) latest = day;
  }
  return latest || null;
}

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function permitFor(citySlug, projectSlug) {
  return permits.find((item) => item.citySlug === citySlug && item.projectSlug === projectSlug);
}

function costUpdatedIso(project, permit) {
  const dates = [];
  if (permit) {
    dates.push(permit.retrievedDate);
    dates.push(permit.exemptionSource?.retrievedDate);
  }
  for (const source of project.sources || []) dates.push(source.retrievedDate);
  return latestRetrievedDate(dates);
}

function cityUpdatedIso(citySlug) {
  const dates = [];
  for (const slug of launchSlugs()) {
    const permit = permitFor(citySlug, slug);
    if (!permit) continue;
    dates.push(permit.retrievedDate);
    dates.push(permit.exemptionSource?.retrievedDate);
  }
  return latestRetrievedDate(dates);
}

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trustText(html) {
  const match = html.match(/<p class="[^"]*\btrust-line\b[^"]*">([\s\S]*?)<\/p>/);
  return match ? visibleText(match[1]) : "";
}

function jsonBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      fail("invalid JSON-LD");
    }
  }
  return blocks;
}

function collectType(node, type, acc) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectType(item, type, acc);
    return;
  }
  if (node["@type"] === type) acc.push(node);
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectType(value, type, acc);
  }
}

function compareCities(a, b) {
  const byName = a.name.localeCompare(b.name, "en");
  if (byName !== 0) return byName;
  return a.slug.localeCompare(b.slug, "en");
}

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

// Parsed from lib/city-hub-deepen.ts so the check cannot drift from the template.
const STATE_CENTER = (() => {
  const src = fs.readFileSync(path.join(root, "lib/city-hub-deepen.ts"), "utf8");
  const block = src.slice(src.indexOf("const STATE_CENTER"), src.indexOf("};", src.indexOf("const STATE_CENTER")));
  const out = {};
  for (const m of block.matchAll(/([A-Z]{2}): \[(-?[0-9.]+), (-?[0-9.]+)\]/g)) out[m[1]] = [Number(m[2]), Number(m[3])];
  if (cities.some((c) => !out[c.stateAbbr])) throw new Error("batch3-check: could not parse STATE_CENTER");
  return out;
})();

function stateDistance(a, b) {
  const p = STATE_CENTER[a];
  const q = STATE_CENTER[b];
  if (!p || !q) return Number.POSITIVE_INFINITY;
  const dLat = p[0] - q[0];
  const dLng = (p[1] - q[1]) * Math.cos(((p[0] + q[0]) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
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
    const rest = others
      .filter((item) => !have.has(item.slug) && CENSUS_REGION[item.stateAbbr] === regionName);
    for (const item of sortByCloseness(city, rest)) {
      if (picked.length >= SAME_JOB_MIN) break;
      picked.push(item);
      have.add(item.slug);
    }
    if (picked.length >= SAME_JOB_MIN) break;
  }
  return picked.slice(0, SAME_JOB_MAX);
}

function honestHeading(city, peers) {
  if (peers.length && peers.every((item) => item.stateAbbr === city.stateAbbr)) {
    return "Other " + city.state + " cities";
  }
  const region = CENSUS_REGION[city.stateAbbr];
  if (region && peers.length && peers.every((item) => CENSUS_REGION[item.stateAbbr] === region)) {
    return region === "West" || region === "South" ? "Other cities in the " + region : "Other " + region + " cities";
  }
  return "Other cities to compare";
}

function quantitiesFor(project) {
  const meta = META[project.projectSlug];
  if (!meta) return [1];
  const list = [meta.defaultQuantity];
  if (meta.step > 0) {
    for (let qty = meta.min; qty <= meta.max + 1e-9; qty += meta.step) {
      const rounded = Math.round(qty * 1000) / 1000;
      if (!list.includes(rounded)) list.push(rounded);
    }
  }
  return list;
}

function estimateLabels(project, city, permit, quantity) {
  const est = buildEstimate(project, city, permit, quantity);
  return {
    quantity,
    low: usd(est.allInLow),
    typical: usd(est.allInTypical),
    high: usd(est.allInHigh),
    bandLow: usd(est.bandLow),
    bandHigh: usd(est.bandHigh),
    bandFallsBack: est.bandLow === est.allInLow && est.bandHigh === est.allInHigh,
  };
}

function checkDates(rel, html, iso) {
  const label = iso ? formatDate(iso) : null;
  const trust = trustText(html);
  const shown = trust.match(/Updated\s+([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})/);
  if (!label) {
    if (shown) fail(rel + " shows Updated " + shown[1] + " but data has no retrievedDate");
  } else if (!shown) {
    fail(rel + " missing visible Updated " + label);
  } else if (shown[1] !== label) {
    fail(rel + " Updated html=" + shown[1] + " data=" + label);
  }
  const pages = [];
  for (const block of jsonBlocks(html)) collectType(block, "WebPage", pages);
  if (pages.length !== 1) fail(rel + " WebPage count " + pages.length);
  const modified = pages[0] ? pages[0].dateModified : undefined;
  if (!label) {
    if (modified) fail(rel + " dateModified " + modified + " but no retrievedDate");
  } else if (modified !== iso) {
    fail(rel + " dateModified html=" + modified + " data=" + iso);
  }
}

function faqAnswers(html) {
  const pages = [];
  for (const block of jsonBlocks(html)) collectType(block, "FAQPage", pages);
  const answers = [];
  for (const page of pages) {
    for (const entity of page.mainEntity || []) {
      answers.push(String(entity?.acceptedAnswer?.text || ""));
    }
  }
  return answers;
}

function checkFaqBands(rel, answers, labeled) {
  for (const answer of answers) {
    const re = new RegExp(OLD_TRIPLE.source, "g");
    let match;
    while ((match = re.exec(answer))) {
      const low = "$" + match[1];
      const typical = "$" + match[2];
      const high = "$" + match[3];
      for (const est of labeled) {
        if (est.bandFallsBack) continue;
        if (low === est.low && typical === est.typical && high === est.high) {
          if (low !== est.bandLow || high !== est.bandHigh) {
            fail(
              rel +
                " FAQ quotes " +
                low +
                " low, " +
                typical +
                " typical, and " +
                high +
                " high at quantity " +
                est.quantity +
                " but band is " +
                est.bandLow +
                " to " +
                est.bandHigh,
            );
          }
        }
      }
    }
  }
}

function checkSameJob(rel, html, city, project) {
  if (!html.includes('id="same-job"')) fail(rel + " missing #same-job");
  if (!html.includes('href="#same-job"')) fail(rel + " TOC missing #same-job");
  const section = html.match(/<section\b[^>]*\bid="same-job"[^>]*>([\s\S]*?)<\/section>/);
  if (!section) {
    fail(rel + " same-job section not parseable");
    return;
  }
  const headingMatch = section[1].match(/<h2>([^<]*)<\/h2>/);
  const heading = headingMatch ? visibleText(headingMatch[1]) : "";
  const anchors = [...section[1].matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  if (anchors.length < SAME_JOB_MIN || anchors.length > SAME_JOB_MAX) {
    fail(rel + " same-job card count " + anchors.length);
  }
  const peers = sameJobPeers(city);
  const expectedHeading = honestHeading(city, peers);
  if (heading !== expectedHeading) fail(rel + " heading html=" + JSON.stringify(heading) + " data=" + JSON.stringify(expectedHeading));
  if (/nearby/i.test(heading)) fail(rel + " heading uses Nearby without a distance sort");
  const self = "/cost/" + project.projectSlug + "/" + city.slug + "/";
  const slugs = [];
  anchors.forEach((anchor, index) => {
    const href = anchor[1];
    if (!href.endsWith("/")) fail(rel + " same-job link missing trailing slash " + href);
    if (href === self || href.endsWith("/" + city.slug + "/")) fail(rel + " same-job links to itself " + href);
    const slugMatch = href.match(/\/cost\/[^/]+\/([^/]+)\/$/);
    const slug = slugMatch ? slugMatch[1] : "";
    slugs.push(slug);
    const peer = cities.find((item) => item.slug === slug);
    const text = visibleText(anchor[2]);
    const typicalMatch = text.match(/Typical\s+(\$[\d,]+(?:\.\d{2})?)/);
    if (!peer) {
      fail(rel + " same-job unknown city " + href);
      return;
    }
    const est = buildEstimate(project, peer, permitFor(slug, project.projectSlug));
    const expected = usd(est.allInTypical);
    if (!typicalMatch) fail(rel + " card " + index + " missing Typical");
    else if (typicalMatch[1] !== expected) {
      fail(rel + " card " + slug + " typical html=" + typicalMatch[1] + " data=" + expected);
    }
  });
  const expectedSlugs = peers.map((item) => item.slug);
  if (slugs.join(",") !== expectedSlugs.join(",")) {
    fail(rel + " same-job cities html=" + slugs.join(",") + " data=" + expectedSlugs.join(","));
  }
}

if (!fs.existsSync(outDir)) {
  console.error("batch3-check: missing out/. Run next build first.");
  process.exit(1);
}

let costPages = 0;
let hubPages = 0;
let permitPages = 0;

for (const file of htmlFiles(outDir)) {
  const rel = path.relative(outDir, file).split(path.sep).join("/");
  const cost = rel.match(/^cost\/([^/]+)\/([^/]+)\/index\.html$/);
  const hub = rel.match(/^city\/([^/]+)\/index\.html$/);
  const permitPage = rel.match(/^permits\/([^/]+)\/index\.html$/);
  if (!cost && !hub && !permitPage) continue;
  const html = fs.readFileSync(file, "utf8");
  if (cost) {
    costPages += 1;
    const project = projects.find((item) => item.projectSlug === cost[1]);
    const city = cities.find((item) => item.slug === cost[2]);
    if (!project || !city) {
      fail(rel + " missing project or city data");
      continue;
    }
    const permit = permitFor(city.slug, project.projectSlug);
    checkDates(rel, html, costUpdatedIso(project, permit));
    checkSameJob(rel, html, city, project);
    const labeled = quantitiesFor(project).map((qty) => estimateLabels(project, city, permit, qty));
    checkFaqBands(rel, faqAnswers(html), labeled);
  } else if (hub) {
    hubPages += 1;
    const city = cities.find((item) => item.slug === hub[1]);
    if (!city) {
      fail(rel + " missing city");
      continue;
    }
    checkDates(rel, html, cityUpdatedIso(city.slug));
    const labeled = [];
    for (const slug of launchSlugs()) {
      const project = projects.find((item) => item.projectSlug === slug);
      if (!project) continue;
      labeled.push(...quantitiesFor(project).map((qty) => estimateLabels(project, city, permitFor(city.slug, slug), qty)));
    }
    checkFaqBands(rel, faqAnswers(html), labeled);
  } else if (permitPage) {
    permitPages += 1;
    const city = cities.find((item) => item.slug === permitPage[1]);
    if (!city) {
      fail(rel + " missing city");
      continue;
    }
    checkDates(rel, html, cityUpdatedIso(city.slug));
    const labeled = [];
    for (const slug of launchSlugs()) {
      const project = projects.find((item) => item.projectSlug === slug);
      if (!project) continue;
      labeled.push(...quantitiesFor(project).map((qty) => estimateLabels(project, city, permitFor(city.slug, slug), qty)));
    }
    checkFaqBands(rel, faqAnswers(html), labeled);
  }
}

if (costPages < 1 || hubPages < 1 || permitPages < 1) {
  fail("expected cost, hub, and permit pages in out/; got cost=" + costPages + " hub=" + hubPages + " permit=" + permitPages);
}

if (failures.length) {
  console.error("batch3-check: " + failures.length + " problem(s)");
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}
console.log(
  "batch3-check: " +
    costPages +
    " cost pages, " +
    hubPages +
    " hubs, " +
    permitPages +
    " permit pages match dates, same-job cards, and FAQ bands",
);
