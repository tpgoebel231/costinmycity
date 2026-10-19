/**
 * Dataset JSON-LD on permit fee pages.
 * Dates mirror scripts/qa/batch3-check.mjs (latest retrieved day among
 * launch-job permit rows plus exemptionSource.retrievedDate).
 * Does not import the page modules.
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
const DASH = /\u2013|\u2014|\\u2013|\\u2014|&ndash;|&mdash;|&#8211;|&#8212;|&#x2013;|&#x2014;/i;

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

function permitFor(citySlug, projectSlug) {
  return permits.find((item) => item.citySlug === citySlug && item.projectSlug === projectSlug);
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

function expectedSourceUrls(citySlug) {
  const urls = [];
  const seen = new Set();
  for (const slug of launchSlugs()) {
    const permit = permitFor(citySlug, slug);
    if (!permit) continue;
    for (const raw of [permit.sourceUrl, permit.exemptionSource?.url]) {
      const url = String(raw || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function dataBacksKey(citySlug, key) {
  for (const slug of launchSlugs()) {
    const permit = permitFor(citySlug, slug);
    if (!permit || permit[key] == null || permit[key] === "") continue;
    return true;
  }
  return false;
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

function visibleText(html) {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function canonical(html) {
  const match = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i);
  if (!match) return "";
  const href = match[0].match(/\bhref="([^"]+)"/i);
  return href ? decode(href[1]) : "";
}

function typeIs(node, type) {
  const value = node && node["@type"];
  if (value === type) return true;
  return Array.isArray(value) && value.includes(type);
}

function collectType(node, type, acc) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectType(item, type, acc);
    return;
  }
  if (typeIs(node, type)) acc.push(node);
  for (const value of Object.values(node)) {
    if (value && typeof value === "object") collectType(value, type, acc);
  }
}

function jsonScripts(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) blocks.push(match[1].trim());
  return blocks;
}

function parseBlocks(rel, rawBlocks) {
  const parsed = [];
  for (const raw of rawBlocks) {
    try {
      parsed.push(JSON.parse(raw));
    } catch {
      fail(rel + " invalid JSON-LD");
    }
  }
  return parsed;
}

function rootsOf(blocks) {
  const roots = [];
  for (const block of blocks) {
    if (Array.isArray(block)) roots.push(...block);
    else if (block && Array.isArray(block["@graph"])) roots.push(...block["@graph"]);
    else roots.push(block);
  }
  return roots;
}

function urlsOf(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  const urls = [];
  for (const item of list) {
    if (typeof item === "string") urls.push(item.trim());
    else if (item && typeof item === "object" && typeof item.url === "string") urls.push(item.url.trim());
  }
  return urls;
}

function sameList(a, b) {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function feeColumnText(html) {
  const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!body) return "";
  const rows = body[1].match(/<tr\b[\s\S]*?<\/tr>/g) || [];
  const chunks = [];
  for (const row of rows) {
    const cells = row.match(/<td\b[\s\S]*?<\/td>/g) || [];
    if (cells[0]) chunks.push(visibleText(cells[0]));
  }
  return chunks.join(" ");
}

function bandsFromFeeColumn(text) {
  const normalized = text.replace(/\s+/g, " ");
  const pairRange = /\bRange\s+\$[\d,]+(?:\.\d+)?\s+to\s+\$/.test(normalized);
  return {
    typical: /\bTypical\b/.test(normalized),
    low: /\bLow\s+\$/.test(normalized) || /\bRange\s+from\b/.test(normalized) || pairRange,
    high: /\bHigh\s+\$/.test(normalized) || /\bRange\s+up to\b/.test(normalized) || pairRange,
  };
}

function jobLabels(html) {
  const table = html.match(/<table\b[\s\S]*?<\/table>/);
  if (!table) return [];
  const labels = [];
  const re = /<th\b[^>]*\bscope="row"[^>]*>[\s\S]*?<a\b[^>]*>([\s\S]*?)<\/a>/g;
  let match;
  while ((match = re.exec(table[0]))) labels.push(visibleText(match[1]));
  return labels;
}

function orgWithName(node) {
  return Boolean(node && typeIs(node, "Organization") && typeof node.name === "string" && node.name.trim());
}

function checkDataset(rel, html, rawBlocks, blocks, dataset, citySlug) {
  const city = cities.find((item) => item.slug === citySlug);
  if (!city) {
    fail(rel + " Dataset city not in data/cities.json");
    return;
  }

  const rawDash = rawBlocks.some((raw) => raw.includes('"@type":"Dataset"') && DASH.test(raw));
  if (rawDash || DASH.test(JSON.stringify(dataset))) fail(rel + " Dataset has an em or en dash");

  if (typeof dataset.name !== "string" || !dataset.name.trim()) fail(rel + " Dataset missing name");
  const expectedName = city.name + ", " + city.stateAbbr + " residential building permit fees";
  if (dataset.name !== expectedName) fail(rel + " Dataset name " + JSON.stringify(dataset.name));

  const description = typeof dataset.description === "string" ? dataset.description : "";
  if (description.length < 50 || description.length > 5000) {
    fail(rel + " description length " + description.length);
  }

  const canon = canonical(html);
  if (typeof dataset.url !== "string" || dataset.url !== canon) {
    fail(rel + " Dataset url " + JSON.stringify(dataset.url) + " canonical " + JSON.stringify(canon));
  }

  if (!orgWithName(dataset.creator)) fail(rel + " creator is not an Organization with a name");
  if (!orgWithName(dataset.publisher)) fail(rel + " publisher is not an Organization with a name");
  const layoutOrg = rootsOf(blocks).find((node) => typeIs(node, "Organization"));
  if (!layoutOrg) fail(rel + " missing layout Organization");
  else if (
    dataset.creator?.name !== layoutOrg.name ||
    dataset.creator?.url !== layoutOrg.url ||
    dataset.publisher?.name !== layoutOrg.name ||
    dataset.publisher?.url !== layoutOrg.url
  ) {
    fail(rel + " creator or publisher does not match the layout Organization");
  }

  const place = dataset.spatialCoverage;
  if (!place || !typeIs(place, "Place") || typeof place.name !== "string" || !place.name.trim()) {
    fail(rel + " spatialCoverage is not a Place with a name");
  } else {
    const expectedPlace = city.name + ", " + city.stateAbbr;
    if (place.name !== expectedPlace) fail(rel + " spatialCoverage name " + JSON.stringify(place.name));
    const address = place.address || {};
    if (address.addressLocality !== city.name) fail(rel + " addressLocality " + JSON.stringify(address.addressLocality));
    if (address.addressRegion !== city.stateAbbr) fail(rel + " addressRegion " + JSON.stringify(address.addressRegion));
    if (address.addressCountry !== "US") fail(rel + " addressCountry " + JSON.stringify(address.addressCountry));
  }

  if (dataset.isAccessibleForFree !== true) fail(rel + " isAccessibleForFree is not true");

  const iso = cityUpdatedIso(citySlug);
  const label = iso ? formatDate(iso) : null;
  const trust = html.match(/<p class="[^"]*\btrust-line\b[^"]*">([\s\S]*?)<\/p>/);
  const trustText = trust ? visibleText(trust[1]) : "";
  const shown = trustText.match(/Updated\s+([A-Z][a-z]{2,8}\s+\d{1,2},\s+\d{4})/);
  if (!label) fail(rel + " no retrievedDate in data");
  else if (!shown) fail(rel + " missing visible Updated " + label);
  else if (shown[1] !== label) fail(rel + " Updated html=" + shown[1] + " data=" + label);

  const pages = [];
  for (const block of blocks) collectType(block, "WebPage", pages);
  if (pages.length !== 1) fail(rel + " WebPage count " + pages.length);
  else if (pages[0].dateModified !== iso) {
    fail(rel + " WebPage dateModified " + pages[0].dateModified + " data=" + iso);
  }
  if (dataset.dateModified !== iso) fail(rel + " Dataset dateModified " + dataset.dateModified + " data=" + iso);

  const expectedUrls = expectedSourceUrls(citySlug);
  const basedOn = urlsOf(dataset.isBasedOn);
  const citation = urlsOf(dataset.citation);
  if (!sameList(basedOn, expectedUrls)) {
    fail(rel + " isBasedOn " + JSON.stringify(basedOn) + " expected " + JSON.stringify(expectedUrls));
  }
  if (!sameList(citation, expectedUrls)) {
    fail(rel + " citation " + JSON.stringify(citation) + " expected " + JSON.stringify(expectedUrls));
  }

  for (const key of ["license", "distribution"]) {
    if (key in dataset && !dataBacksKey(citySlug, key)) fail(rel + " Dataset " + key + " is not backed by data");
  }

  const keywords = Array.isArray(dataset.keywords) ? dataset.keywords : [];
  for (const word of [city.name, city.state, "building permit fees", ...jobLabels(html)]) {
    if (!keywords.includes(word)) fail(rel + " keywords missing " + JSON.stringify(word));
  }

  const bands = bandsFromFeeColumn(feeColumnText(html));
  const expectedMeasured = [];
  if (bands.typical) expectedMeasured.push("Typical permit fee");
  if (bands.low) expectedMeasured.push("Low permit fee");
  if (bands.high) expectedMeasured.push("High permit fee");
  expectedMeasured.push("Fee calculation basis");
  if (html.includes("Official source")) expectedMeasured.push("Official source");
  if (/\bRetrieved\b/.test(visibleText(html))) expectedMeasured.push("Retrieved date");
  const measured = Array.isArray(dataset.variableMeasured) ? dataset.variableMeasured : [];
  const names = measured.map((item) => item && item.name);
  if (!sameList(names, expectedMeasured)) {
    fail(rel + " variableMeasured " + JSON.stringify(names) + " expected " + JSON.stringify(expectedMeasured));
  }
  measured.forEach((item, index) => {
    if (!item || item["@type"] !== "PropertyValue") fail(rel + " variableMeasured[" + index + "] is not a PropertyValue");
    if (typeof item.description !== "string" || !item.description.trim()) {
      fail(rel + " variableMeasured[" + index + "] missing description");
    }
    const money = typeof item.name === "string" && item.name.endsWith("permit fee");
    if (money && item.unitText !== "USD") fail(rel + " " + item.name + " unitText " + JSON.stringify(item.unitText));
    if (!money && item.unitText != null) fail(rel + " " + item.name + " should not have unitText");
  });
}

if (!fs.existsSync(outDir)) {
  console.error("dataset-check: missing out/. Run next build first.");
  process.exit(1);
}

const files = htmlFiles(outDir);
let permitPages = 0;

for (const file of files) {
  const rel = path.relative(outDir, file).split(path.sep).join("/");
  const html = fs.readFileSync(file, "utf8");
  const rawBlocks = jsonScripts(html);
  const blocks = parseBlocks(rel, rawBlocks);
  const datasets = [];
  for (const block of blocks) collectType(block, "Dataset", datasets);
  const permitPage = rel.match(/^permits\/([^/]+)\/index\.html$/);
  const costPage = rel.startsWith("cost/");

  if (costPage) {
    if (datasets.length) fail(rel + " cost page has a Dataset");
    continue;
  }

  if (!permitPage) {
    if (datasets.length) fail(rel + " unexpected Dataset outside permit pages");
    continue;
  }

  permitPages += 1;
  if (datasets.length !== 1) {
    fail(rel + " Dataset count " + datasets.length);
    continue;
  }
  checkDataset(rel, html, rawBlocks, blocks, datasets[0], permitPage[1]);
}

if (permitPages < 1) fail("no permit pages in out/");

if (failures.length) {
  console.error("dataset-check: " + failures.length + " problem(s)");
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log("dataset-check: " + permitPages + " permit pages OK");
