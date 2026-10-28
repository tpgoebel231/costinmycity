/**
 * Permit pages link to other permit pages. Dollars in that block are the
 * peer's recorded roof-replacement fee, formatted like permits-page-check
 * (usd or moneyExact). Does not import the page helper.
 *
 *   node scripts/qa/permit-mesh-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const permitDir = path.join(outDir, "permits");

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

function sectionById(html, id) {
  const at = html.indexOf('id="' + id + '"');
  if (at < 0) return "";
  const start = html.lastIndexOf("<section", at);
  if (start < 0 || at - start > 300) return "";
  const end = html.indexOf("</section>", at);
  if (end < 0) return "";
  return html.slice(start, end + "</section>".length);
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
      .filter((name) => fs.existsSync(path.join(permitDir, name, "index.html")))
      .sort()
  : [];

if (pageSlugs.length !== 100) fail("permit page count " + pageSlugs.length + " (expected 100)");

let linkTotal = 0;
let sameStateTotal = 0;

for (const slug of pageSlugs) {
  const html = pageHtml(slug);
  const label = slug;
  const city = cityBySlug.get(slug);
  if (!city) fail(label + " missing city");

  const faqAt = html.indexOf('id="faq"');
  const meshAt = html.indexOf('id="permit-mesh"');
  if (faqAt < 0) fail(label + " missing #faq");
  if (meshAt < 0) fail(label + " missing #permit-mesh");
  if (faqAt >= 0 && meshAt >= 0 && faqAt > meshAt) fail(label + " #permit-mesh is before #faq");

  const section = sectionById(html, "permit-mesh");
  if (!section) {
    fail(label + " #permit-mesh section missing");
    continue;
  }
  const h2 = section.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i);
  if (!h2 || !textOf(h2[1])) fail(label + " #permit-mesh missing h2");
  if (DASH.test(section) || DASH.test(textOf(section))) fail(label + " em or en dash in #permit-mesh");

  const hrefs = [];
  const hrefRe = /<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi;
  let hrefMatch;
  while ((hrefMatch = hrefRe.exec(section))) hrefs.push(decode(hrefMatch[1]));

  const items = [];
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRe.exec(section))) items.push(liMatch[1]);

  if (hrefs.length < 4 || hrefs.length > 6) fail(label + " link count " + hrefs.length);
  if (items.length !== hrefs.length) fail(label + " list items " + items.length + " vs links " + hrefs.length);

  const seen = new Set();
  hrefs.forEach((href, index) => {
    const parsed = PERMIT_HREF.exec(href);
    if (!parsed) {
      fail(label + " bad href " + href);
      return;
    }
    const peerSlug = parsed[1];
    if (peerSlug === slug) fail(label + " links to itself");
    if (seen.has(peerSlug)) fail(label + " duplicate " + peerSlug);
    seen.add(peerSlug);
    const peerFile = path.join(permitDir, peerSlug, "index.html");
    if (!fs.existsSync(peerFile)) fail(label + " missing target " + peerSlug);
    const peerCity = cityBySlug.get(peerSlug);
    if (!peerCity) fail(label + " unknown city " + peerSlug);

    linkTotal += 1;
    if (city && peerCity && city.stateAbbr === peerCity.stateAbbr) sameStateTotal += 1;

    const line = textOf(items[index] || "");
    const lineDollars = dollarsIn(line);
    const roof = roofByCity.get(peerSlug);
    const exempt = roof && roof.permitRequired === false;
    if (exempt) {
      if (!line.includes("usually no city permit needed")) {
        fail(label + " " + peerSlug + " exempt line missing no-permit phrase: " + line);
      }
      if (lineDollars.length) fail(label + " " + peerSlug + " exempt line has a dollar: " + line);
      return;
    }
    if (!roof || roof.feeTypicalUsd == null) {
      if (lineDollars.length) fail(label + " " + peerSlug + " null fee has a dollar: " + line);
      return;
    }
    const allowed = new Set([usd(roof.feeTypicalUsd), moneyExact(roof.feeTypicalUsd)]);
    const peerHtml = pageHtml(peerSlug);
    for (const token of lineDollars) {
      if (!allowed.has(token)) {
        fail(label + " " + peerSlug + " dollar " + token + " is not the roof fee " + [...allowed].join(" or "));
      } else if (!containsMoney(peerHtml, token)) {
        fail(label + " " + peerSlug + " dollar " + token + " missing on peer permit page");
      }
    }
  });

  const sectionDollars = dollarsIn(textOf(section));
  const itemDollars = items.flatMap((item) => dollarsIn(textOf(item)));
  if (sectionDollars.join("|") !== itemDollars.join("|")) {
    fail(label + " dollar outside a link line");
  }
}

if (failures.length) {
  console.error("permit-mesh-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "permit-mesh-check: " + pageSlugs.length + " permit pages OK, " + linkTotal + " links (" + sameStateTotal + " same-state)",
);
