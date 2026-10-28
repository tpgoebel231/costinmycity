/**
 * /permits/ index: 100 city permit links, state order, and roof-fee dollars
 * only. Dollars match data/permits.json the way permit-mesh-check formats
 * them (usd or moneyExact) and must appear on that city's permit page.
 *
 *   node scripts/qa/permits-index-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const permitDir = path.join(outDir, "permits");
const indexFile = path.join(permitDir, "index.html");

const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));

const DASH = /\u2014|\u2013|&mdash;|&ndash;|&#8212;|&#x2014;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/g;
const PERMIT_HREF = /^\/permits\/([a-z0-9-]+)\/$/;

const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const roofByCity = new Map(
  permits.filter((row) => row.projectSlug === "roof-replacement").map((row) => [row.citySlug, row]),
);

const failures = [];
function fail(msg) {
  failures.push(msg);
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

function moneyExact(n) {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (negative ? "-$" : "$") + body;
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
  return decode(String(html || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function dollarsIn(text) {
  return text.match(DOLLAR) || [];
}

function containsMoney(text, formatted) {
  if (!formatted) return false;
  const escaped = formatted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped + "(?!\\d)").test(text);
}

function elementById(html, id) {
  const re = new RegExp("<([a-zA-Z][\\w:-]*)\\b[^>]*\\bid=\"" + id + "\"[^>]*>", "i");
  const open = re.exec(html);
  if (!open) return "";
  const tag = open[1];
  const tokenRe = new RegExp("<(/?)" + tag + "\\b[^>]*>", "gi");
  tokenRe.lastIndex = open.index;
  let depth = 0;
  let match;
  while ((match = tokenRe.exec(html))) {
    if (match[1] === "/") {
      depth -= 1;
      if (depth === 0) return html.slice(open.index, match.index + match[0].length);
    } else {
      depth += 1;
    }
  }
  return "";
}

function mainHtml(html) {
  const start = html.search(/<main\b/i);
  const end = html.toLowerCase().lastIndexOf("</main>");
  if (start < 0 || end < 0) return "";
  return html.slice(start, end + "</main>".length);
}

function metaContent(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    if (!new RegExp("\\bname=\"" + name + "\"", "i").test(tag)) continue;
    const content = tag.match(/\bcontent="([^"]*)"/i);
    return content ? decode(content[1]) : "";
  }
  return null;
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      fail("JSON-LD parse error");
    }
  }
  return blocks;
}

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  visit(node);
  for (const value of Object.values(node)) walk(value, visit);
}

function typesOf(node) {
  const kind = node["@type"];
  if (Array.isArray(kind)) return kind;
  return kind ? [kind] : [];
}

function itemUrl(item) {
  if (!item || typeof item !== "object") return "";
  if (typeof item.url === "string") return item.url;
  if (typeof item.item === "string") return item.item;
  if (item.item && typeof item.item.url === "string") return item.item.url;
  return "";
}

function footerHtml(html) {
  const start = html.search(/<footer\b/i);
  const end = html.toLowerCase().lastIndexOf("</footer>");
  if (start < 0 || end < 0) return "";
  return html.slice(start, end + "</footer>".length);
}

function hasLink(html, href, text) {
  const re = /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const gotHref = decode(match[1]);
    const gotText = textOf(match[2]);
    if (gotHref === href && (!text || gotText === text)) return true;
  }
  return false;
}

const htmlCache = new Map();
function pageHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug);
  const file = path.join(permitDir, slug, "index.html");
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  htmlCache.set(slug, html);
  return html;
}

const pageSlugs = fs.existsSync(permitDir)
  ? fs
      .readdirSync(permitDir)
      .filter((name) => {
        const dir = path.join(permitDir, name);
        return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, "index.html"));
      })
      .sort()
  : [];

if (!fs.existsSync(indexFile)) fail("missing out/permits/index.html");

const html = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "";
const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
if (h1s.length !== 1) fail("h1 count " + h1s.length);
else if (textOf(h1s[0][1]) !== "Building permit fees by city") fail("h1 text " + textOf(h1s[0][1]));

const title = html.match(/<title>([\s\S]*?)<\/title>/i);
if (!title || !textOf(title[1])) fail("missing title");
else if (!textOf(title[1]).includes("Building permit fees by city 2026")) {
  fail("title " + textOf(title[1]));
}

const description = metaContent(html, "description");
if (description == null || !description.trim()) fail("missing meta description");
else if (description.length > 160) fail("meta description length " + description.length);

const canonicalTag = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i);
const canonicalHref = canonicalTag && canonicalTag[0].match(/\bhref="([^"]+)"/i);
if (!canonicalHref || !canonicalHref[1].endsWith("/permits/")) {
  fail("canonical " + (canonicalHref ? canonicalHref[1] : "missing"));
}

const blocks = html ? jsonLdBlocks(html) : [];
let hasBreadcrumb = false;
let listUrls = null;
for (const block of blocks) {
  walk(block, (node) => {
    const kinds = typesOf(node);
    if (kinds.includes("BreadcrumbList")) hasBreadcrumb = true;
    if (!kinds.includes("ItemList") && !kinds.includes("CollectionPage")) return;
    const elements = Array.isArray(node.itemListElement)
      ? node.itemListElement
      : node.mainEntity && Array.isArray(node.mainEntity.itemListElement)
        ? node.mainEntity.itemListElement
        : null;
    if (!elements) return;
    const urls = elements.map(itemUrl).filter(Boolean);
    if (urls.length === 100) listUrls = urls;
  });
}
if (!hasBreadcrumb) fail("missing BreadcrumbList JSON-LD");
if (!listUrls) fail("missing ItemList/CollectionPage JSON-LD with 100 items");

const section = elementById(html, "permits-index");
if (!section) fail("#permits-index missing");

const stateNames = [];
const h2Re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
let h2Match;
while ((h2Match = h2Re.exec(section))) stateNames.push(textOf(h2Match[1]));
const stateSorted = stateNames.slice().sort((a, b) => a.localeCompare(b, "en"));
if (stateNames.join("\0") !== stateSorted.join("\0")) fail("states not alphabetical: " + stateNames.join(", "));

const h2Ends = [];
h2Re.lastIndex = 0;
while ((h2Match = h2Re.exec(section))) h2Ends.push({ name: textOf(h2Match[1]), end: h2Match.index + h2Match[0].length, at: h2Match.index });
for (let i = 0; i < h2Ends.length; i++) {
  const chunk = section.slice(h2Ends[i].end, i + 1 < h2Ends.length ? h2Ends[i + 1].at : section.length);
  const labels = [];
  const anchorRe = /<a\b[^>]*\bhref="[^"]+"[^>]*>([\s\S]*?)<\/a>/gi;
  let anchorMatch;
  while ((anchorMatch = anchorRe.exec(chunk))) labels.push(textOf(anchorMatch[1]));
  const sortedLabels = labels.slice().sort((a, b) => a.localeCompare(b, "en"));
  if (labels.join("\0") !== sortedLabels.join("\0")) {
    fail(h2Ends[i].name + " cities not alphabetical: " + labels.join(", "));
  }
}

const hrefs = [];
const hrefRe = /<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi;
let hrefMatch;
while ((hrefMatch = hrefRe.exec(section))) hrefs.push(decode(hrefMatch[1]));

const items = [];
const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
let liMatch;
while ((liMatch = liRe.exec(section))) items.push(liMatch[1]);

const linkSlugs = [];
const seen = new Set();
if (hrefs.length !== 100) fail("link count " + hrefs.length);
if (items.length !== hrefs.length) fail("list items " + items.length + " vs links " + hrefs.length);

let withRoofFee = 0;
let exemptCount = 0;

hrefs.forEach((href, index) => {
  const parsed = PERMIT_HREF.exec(href);
  if (!parsed) {
    fail("bad href " + href);
    return;
  }
  const slug = parsed[1];
  if (seen.has(slug)) fail("duplicate " + slug);
  seen.add(slug);
  linkSlugs.push(slug);
  if (!cityBySlug.has(slug)) fail("unknown city " + slug);
  const target = path.join(permitDir, slug, "index.html");
  if (!fs.existsSync(target)) fail("missing target " + slug);

  const line = textOf(items[index] || "");
  const lineDollars = dollarsIn(line);
  const roof = roofByCity.get(slug);
  const exempt = roof && roof.permitRequired === false;
  if (exempt) {
    exemptCount += 1;
    if (!line.includes("usually no city permit needed")) {
      fail(slug + " exempt line missing no-permit phrase: " + line);
    }
    if (lineDollars.length) fail(slug + " exempt line has a dollar: " + line);
    return;
  }
  if (!roof || roof.feeTypicalUsd == null) {
    if (lineDollars.length) fail(slug + " null fee has a dollar: " + line);
    return;
  }
  const allowed = new Set([usd(roof.feeTypicalUsd), moneyExact(roof.feeTypicalUsd)]);
  const cityHtml = pageHtml(slug);
  if (lineDollars.length) withRoofFee += 1;
  for (const token of lineDollars) {
    if (!allowed.has(token)) {
      fail(slug + " dollar " + token + " is not the roof fee " + [...allowed].join(" or "));
    } else if (!containsMoney(cityHtml, token)) {
      fail(slug + " dollar " + token + " missing on city permit page");
    }
  }
});

if (listUrls) {
  const jsonSlugs = [];
  for (const url of listUrls) {
    if (!/^https?:\/\//i.test(url)) {
      fail("JSON-LD item is not absolute: " + url);
      continue;
    }
    const parsed = /\/permits\/([a-z0-9-]+)\/$/.exec(url);
    if (!parsed) fail("JSON-LD item is not a permit URL: " + url);
    else jsonSlugs.push(parsed[1]);
  }
  const want = pageSlugs.slice().sort().join("\0");
  if (jsonSlugs.slice().sort().join("\0") !== want) fail("JSON-LD permit URLs do not match permit pages");
}

const linkSet = linkSlugs.slice().sort().join("\0");
const pageSet = pageSlugs.slice().sort().join("\0");
if (pageSlugs.length !== 100) fail("permit page count " + pageSlugs.length + " (expected 100)");
if (linkSet !== pageSet) fail("index links do not match out/permits/*/");

const sectionDollars = dollarsIn(textOf(section));
const itemDollars = items.flatMap((item) => dollarsIn(textOf(item)));
if (sectionDollars.join("|") !== itemDollars.join("|")) fail("dollar outside a link line");

const main = mainHtml(html);
if (!main) fail("missing main");
if (DASH.test(main) || DASH.test(textOf(main))) fail("em or en dash in main content");

function readOut(rel) {
  const file = path.join(outDir, rel);
  if (!fs.existsSync(file)) {
    fail("missing " + rel);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

for (const rel of ["index.html", "city/denver-co/index.html", "cost/roof-replacement/denver-co/index.html"]) {
  const page = readOut(rel);
  if (page && !hasLink(footerHtml(page), "/permits/", "Permit fees by city")) {
    fail(rel + " footer missing /permits/ link");
  }
}

const hub = readOut("city/denver-co/index.html");
if (hub && !hasLink(hub, "/permits/", "See permit fees in all cities")) {
  fail("denver hub missing See permit fees in all cities");
}

const sitemapPath = path.join(outDir, "sitemap.xml");
if (!fs.existsSync(sitemapPath)) fail("missing sitemap.xml");
else {
  const sm = fs.readFileSync(sitemapPath, "utf8");
  const citiesLoc = sm.match(/<loc>([^<]+)\/cities\/<\/loc>/);
  if (!citiesLoc) fail("sitemap missing /cities/ URL");
  else {
    const want = citiesLoc[1] + "/permits/";
    if (!sm.includes("<loc>" + want + "</loc>")) fail("sitemap missing " + want);
  }
}

if (failures.length) {
  console.error("permits-index-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "permits-index-check: " +
    hrefs.length +
    " permit links OK (" +
    stateNames.length +
    " states, " +
    withRoofFee +
    " with roof fee, " +
    exemptCount +
    " exempt)",
);
