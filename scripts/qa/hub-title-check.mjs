/**
 * City hub <title> phrases. The 20 CITY_HUB_SERP_SLUGS hubs and the
 * PRIORITY_CLUSTER hubs use "Home renovation cost in {city}, {ST}".
 * Chicago keeps its 2026 title. Every other hub stays generic.
 *
 *   node scripts/qa/hub-title-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outCity = path.join(root, "out", "city");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));

const SUFFIX = " \u2013 CostInMyCity";
const RENOVATION = "Home renovation cost in ";
const GENERIC = "Home project costs in ";
const CHICAGO_SLUG = "chicago-il";
const CHICAGO_TITLE = "Chicago home project costs 2026: typical cost and permit fees" + SUFFIX;
const CLUSTER_DESC_SLUGS = ["austin-tx", "raleigh-nc", "nashville-tn"];

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function stringList(filePath, exportName) {
  const src = fs.readFileSync(filePath, "utf8");
  const re = new RegExp("export const " + exportName + "\\b[^=]*=\\s*\\[([\\s\\S]*?)\\]");
  const match = src.match(re);
  if (!match) return [];
  return [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((item) => item[1]);
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

function titleText(html) {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? textOf(match[1]) : "";
}

function metaDescription(html) {
  const tag = html.match(/<meta\b[^>]*\bname="description"[^>]*>/i);
  if (!tag) return "";
  const content = tag[0].match(/\bcontent="([^"]*)"/i);
  return content ? decode(content[1]) : "";
}

function cityLabel(city) {
  return city.name + ", " + city.stateAbbr;
}

const retitled = stringList(path.join(root, "lib/serp-retitle-keys.ts"), "CITY_HUB_SERP_SLUGS");
const cluster = stringList(path.join(root, "lib/related-links.ts"), "PRIORITY_CLUSTER");
const retitledSet = new Set(retitled);
const clusterSet = new Set(cluster);
const renovationSet = new Set([...retitled, ...cluster]);

if (retitled.length !== 20 || retitledSet.size !== 20) fail("CITY_HUB_SERP_SLUGS count " + retitled.length);
if (cluster.length !== 12 || clusterSet.size !== 12) fail("PRIORITY_CLUSTER count " + cluster.length);
if (retitledSet.has(CHICAGO_SLUG) || clusterSet.has(CHICAGO_SLUG)) fail("chicago-il is in a renovation set");

const descSlugs = CLUSTER_DESC_SLUGS.filter((slug) => retitledSet.has(slug) && clusterSet.has(slug));
if (descSlugs.length !== 3 || descSlugs.join() !== CLUSTER_DESC_SLUGS.join()) {
  fail("cluster description slugs " + descSlugs.join(","));
}

const hubFiles = fs.existsSync(outCity)
  ? fs.readdirSync(outCity).filter((name) => fs.existsSync(path.join(outCity, name, "index.html")))
  : [];
if (cities.length !== 100) fail("cities.json count " + cities.length);
if (hubFiles.length !== 100) fail("rendered hub count " + hubFiles.length);

let renovationTitles = 0;
let restored = 0;
let genericTitles = 0;
let chicagoKept = 0;
let maxLength = 0;

for (const city of cities) {
  if (!city || !city.slug) {
    fail("city missing slug");
    continue;
  }
  const slug = city.slug;
  const file = path.join(outCity, slug, "index.html");
  if (!fs.existsSync(file)) {
    fail(slug + " missing hub");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const title = titleText(html);
  const label = cityLabel(city);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) fail(slug + " h1 count " + h1s.length);
  const h1 = h1s.length === 1 ? textOf(h1s[0][1]) : "";
  const wantH1 = (clusterSet.has(slug) ? RENOVATION : GENERIC) + label;
  if (h1 !== wantH1) fail(slug + " h1 " + h1);

  if (slug === CHICAGO_SLUG) {
    chicagoKept += title === CHICAGO_TITLE ? 1 : 0;
    if (title !== CHICAGO_TITLE) fail(slug + " title " + title);
  } else if (renovationSet.has(slug)) {
    const want = RENOVATION + label + SUFFIX;
    if (title === want) renovationTitles += 1;
    else fail(slug + " title " + title);
    if (retitledSet.has(slug) && title === want) restored += 1;
    if (title.length > 60) fail(slug + " title length " + title.length);
    if (title.length > maxLength) maxLength = title.length;
  } else {
    const want = GENERIC + label + SUFFIX;
    if (title === want) genericTitles += 1;
    else fail(slug + " title " + title);
  }

  if (CLUSTER_DESC_SLUGS.includes(slug)) {
    const desc = metaDescription(html);
    if (!desc.startsWith("How much does home renovation cost in ")) {
      fail(slug + " description " + desc.slice(0, 80));
    }
  }
}

if (restored !== 20) fail("restored retitled titles " + restored);
if (chicagoKept !== 1) fail("chicago kept " + chicagoKept);
if (renovationTitles + chicagoKept + genericTitles !== 100) {
  fail("title buckets " + renovationTitles + "+" + chicagoKept + "+" + genericTitles);
}

if (failures.length) {
  console.error("hub-title-check: " + failures.length + " failure(s)");
  for (const failure of failures.slice(0, 30)) console.error(failure);
  process.exit(1);
}

console.log(
  "hub-title-check: 100 hubs, " +
    renovationTitles +
    " with home renovation cost title (20 retitled restored), 1 Chicago kept, " +
    genericTitles +
    " generic, max length " +
    maxLength +
    " OK",
);
