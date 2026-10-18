/**
 * Compare origin/main HTML in /tmp/rd-old/out with this build's out/.
 * Fails on title, meta description, canonical, cost-page H1, existing JSON-LD,
 * OG, lost internal paths, or a dollar amount that disappeared.
 * Homepage H1, the added Organization block, and dollar counts are reported.
 */
import fs from "fs";
import path from "path";

const oldRoot = process.env.OLD_OUT || "/tmp/rd-old/out";
const newRoot = process.env.NEW_OUT || path.resolve(import.meta.dirname, "../../out");

const PHASE = [
  "/",
  "/cost/roof-replacement/chicago-il/",
  "/cost/roof-replacement/charlotte-nc/",
  "/cost/roof-replacement/st-louis-mo/",
  "/cost/hvac-replacement/indianapolis-in/",
];

const SAMPLE = [
  "/",
  "/cost/roof-replacement/charlotte-nc/",
  "/cost/roof-replacement/chicago-il/",
  "/cost/roof-replacement/st-louis-mo/",
  "/cost/roof-replacement/denver-co/",
  "/cost/roof-replacement/seattle-wa/",
  "/cost/roof-replacement/phoenix-az/",
  "/cost/roof-replacement/austin-tx/",
  "/cost/hvac-replacement/indianapolis-in/",
  "/cost/hvac-replacement/charlotte-nc/",
  "/cost/hvac-replacement/denver-co/",
  "/cost/hvac-replacement/seattle-wa/",
  "/cost/hvac-replacement/phoenix-az/",
  "/cost/kitchen-remodel/phoenix-az/",
  "/cost/kitchen-remodel/charlotte-nc/",
  "/cost/kitchen-remodel/chicago-il/",
  "/cost/deck/boston-ma/",
  "/cost/deck/denver-co/",
  "/cost/deck/atlanta-ga/",
  "/cost/deck/seattle-wa/",
];

const HOME_H1 = "What will your project cost in your city?";

function fileFor(root, urlPath) {
  const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
  return path.join(root, rel);
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
  let visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  visible = visible.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  visible = visible.replace(/<[^>]+>/g, " ");
  return decode(visible).replace(/\s+/g, " ").trim();
}

function tagContent(html, re) {
  const match = html.match(re);
  return match ? decode(match[1]).replace(/\s+/g, " ").trim() : "";
}

function metaContent(html, key) {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:name|property)="([^"]+)"/i);
    if (!name || name[1].toLowerCase() !== key.toLowerCase()) continue;
    const content = tag.match(/\bcontent="([^"]*)"/i);
    if (content) return decode(content[1]);
  }
  return "";
}

function canonical(html) {
  const match = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i);
  if (!match) return "";
  const href = match[0].match(/\bhref="([^"]+)"/i);
  return href ? href[1] : "";
}

function h1(html) {
  return tagContent(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
}

function jsonLd(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) blocks.push(match[1].trim());
  return blocks;
}

function isOrganization(raw) {
  try {
    const data = JSON.parse(raw);
    return data && data["@type"] === "Organization";
  } catch {
    return false;
  }
}

function dollars(html) {
  const found = textOf(html).match(/\$\d[\d,]*(?:\.\d+)?/g) || [];
  return found.sort();
}

function counts(list) {
  const map = new Map();
  for (const item of list) map.set(item, (map.get(item) || 0) + 1);
  return map;
}

function internalPaths(html) {
  const paths = [];
  const re = /href="([^"]+)"/g;
  let match;
  while ((match = re.exec(html))) {
    let href = match[1];
    if (href.startsWith("https://costinmycity.com")) href = href.slice("https://costinmycity.com".length) || "/";
    if (!href.startsWith("/")) continue;
    href = href.split("#")[0].split("?")[0];
    if (!href) href = "/";
    if (/\.(js|css|png|jpe?g|webp|avif|svg|ico|xml|txt|json|pdf|woff2?)$/i.test(href)) continue;
    if (!href.endsWith("/")) href += "/";
    paths.push(href);
  }
  return paths;
}

const pages = [...new Set([...PHASE, ...SAMPLE])];
const failures = [];
const notes = [];

for (const urlPath of pages) {
  const oldFile = fileFor(oldRoot, urlPath);
  const newFile = fileFor(newRoot, urlPath);
  const label = urlPath;
  if (!fs.existsSync(oldFile) || !fs.existsSync(newFile)) {
    failures.push(label + " missing html old=" + fs.existsSync(oldFile) + " new=" + fs.existsSync(newFile));
    continue;
  }
  const oldHtml = fs.readFileSync(oldFile, "utf8");
  const newHtml = fs.readFileSync(newFile, "utf8");
  const group = PHASE.includes(urlPath) && SAMPLE.includes(urlPath) ? "phase+sample" : PHASE.includes(urlPath) ? "phase" : "sample";

  const pairs = [
    ["title", tagContent(oldHtml, /<title>([\s\S]*?)<\/title>/i), tagContent(newHtml, /<title>([\s\S]*?)<\/title>/i)],
    ["description", metaContent(oldHtml, "description"), metaContent(newHtml, "description")],
    ["canonical", canonical(oldHtml), canonical(newHtml)],
    ["og:title", metaContent(oldHtml, "og:title"), metaContent(newHtml, "og:title")],
    ["og:description", metaContent(oldHtml, "og:description"), metaContent(newHtml, "og:description")],
    ["og:url", metaContent(oldHtml, "og:url"), metaContent(newHtml, "og:url")],
    ["og:image", metaContent(oldHtml, "og:image"), metaContent(newHtml, "og:image")],
  ];
  for (const [name, before, after] of pairs) {
    if (before !== after) failures.push(label + " " + name + "\n    old: " + before + "\n    new: " + after);
  }

  const oldH1 = h1(oldHtml);
  const newH1 = h1(newHtml);
  if (oldH1 !== newH1) {
    if (urlPath === "/" && newH1 === HOME_H1) notes.push(label + " H1 intentional: " + JSON.stringify(oldH1) + " -> " + JSON.stringify(newH1));
    else failures.push(label + " H1\n    old: " + oldH1 + "\n    new: " + newH1);
  }

  const oldLd = jsonLd(oldHtml);
  const newLd = jsonLd(newHtml).filter((block) => !isOrganization(block));
  if (oldLd.length !== newLd.length || oldLd.some((block, i) => block !== newLd[i])) {
    failures.push(label + " JSON-LD changed (" + oldLd.length + " old blocks, " + newLd.length + " new non-org blocks)");
  } else {
    const orgCount = jsonLd(newHtml).length - newLd.length;
    if (orgCount !== 1) notes.push(label + " Organization JSON-LD count=" + orgCount);
  }

  const oldDollars = dollars(oldHtml);
  const newDollars = dollars(newHtml);
  const newCounts = counts(newDollars);
  const missing = [];
  for (const [value, count] of counts(oldDollars)) {
    if ((newCounts.get(value) || 0) < 1) missing.push(value + " x" + count);
  }
  if (missing.length) failures.push(label + " lost dollar values: " + missing.join(", "));
  if (oldDollars.length !== newDollars.length) {
    notes.push(label + " dollar count " + oldDollars.length + " -> " + newDollars.length);
  }

  const oldPaths = internalPaths(oldHtml);
  const newPaths = internalPaths(newHtml);
  const newSet = new Set(newPaths);
  const lost = [...new Set(oldPaths)].filter((item) => !newSet.has(item));
  if (lost.length) failures.push(label + " lost internal paths: " + lost.join(", "));
  if (newPaths.length < oldPaths.length) {
    failures.push(label + " internal link count dropped " + oldPaths.length + " -> " + newPaths.length);
  } else if (newPaths.length !== oldPaths.length) {
    notes.push(label + " internal links " + oldPaths.length + " -> " + newPaths.length + " (" + group + ")");
  }
}

console.log("seo-diff: " + pages.length + " pages (" + PHASE.length + " phase, " + SAMPLE.length + " sample, union " + pages.length + ")");
if (notes.length) {
  console.log("notes:");
  for (const line of notes) console.log("  " + line);
}
if (failures.length) {
  console.error("seo-diff: " + failures.length + " failure(s)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}
console.log("seo-diff: no blocking differences");
