/**
 * Denver hub editorial gate. The #denver-guide section is Denver-only.
 * Dollars in it must match Denver fees, extras, valuations, and project
 * costs as formatted on the site (usd / moneyExact / wage hourly), or a
 * dollar token already written in the Denver city notes or permit row text
 * (the $2,000 plan-review threshold lives in that prose, not in a fee field).
 *
 *   node scripts/qa/denver-hub-editorial-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outCity = path.join(root, "out", "city");
const outRoot = path.join(root, "out");

/** before-out city/denver-co: 5 FAQPage questions and 5 details.faq-item. */
const FAQ_BASELINE = 5;
const CITY = "denver-co";
const PRICING = {
  "roof-replacement": { pricing: "job", qty: 16 },
  "hvac-replacement": { pricing: "job", qty: 1 },
  deck: { pricing: "per-unit", qty: 320 },
  "kitchen-remodel": { pricing: "per-unit", qty: 200 },
};

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(root, "data", name), "utf8"));
}

function decode(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function usd(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return null;
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

function moneyExactCents(n) {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = String(abs % 100).padStart(2, "0");
  return (negative ? "-$" : "$") + dollars + "." + rem;
}

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "").trim());
  if (!match) return null;
  const d = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(d);
}

const DOLLAR_RE = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?|\$\d+(?:\.\d+)?/g;
const DATE_RE = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\b/g;
const ISO_RE = /\b\d{4}-\d{2}-\d{2}\b/g;

function dollarsIn(text) {
  return [...String(text || "").matchAll(DOLLAR_RE)].map((match) => match[0]);
}

function addMoney(set, n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return;
  const values = [usd(n), moneyExact(n), moneyExactCents(n), "$" + n.toFixed(2), usd(Math.round(n))];
  for (const value of values) {
    if (value) set.add(value);
  }
}

function textOf(html) {
  return decode(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function guideHtml(html) {
  const match = html.match(/<section\b[^>]*\bid="denver-guide"[^>]*>[\s\S]*?<\/section>/i);
  return match ? match[0] : "";
}

function pageForHref(href) {
  const pathOnly = href.split("#")[0].split("?")[0];
  if (!pathOnly.startsWith("/")) return null;
  let rel = pathOnly.replace(/^\//, "");
  if (rel.endsWith("/")) rel = rel.slice(0, -1);
  if (!rel) return path.join(outRoot, "index.html");
  return path.join(outRoot, rel, "index.html");
}

const cities = readJson("cities.json");
const permits = readJson("permits.json");
const costsFile = readJson("project-costs.json");
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects || [];
const denver = cities.find((city) => city && city.slug === CITY);
const denverPermits = permits.filter((permit) => permit && permit.citySlug === CITY);

if (!denver) fail("denver-co missing from cities.json");
if (denverPermits.length !== 4) fail("denver permit rows " + denverPermits.length);

const allowedDollars = new Set();
const allowedDates = new Set();

function addDate(iso) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(iso || "").trim());
  if (!match) return;
  allowedDates.add(match[1]);
  const label = formatDate(match[1]);
  if (label) allowedDates.add(label);
}

if (denver) {
  for (const token of dollarsIn(denver.notes || "")) allowedDollars.add(token);
}

for (const permit of denverPermits) {
  addMoney(allowedDollars, permit.feeLowUsd);
  addMoney(allowedDollars, permit.feeTypicalUsd);
  addMoney(allowedDollars, permit.feeHighUsd);
  addMoney(allowedDollars, permit.typicalProjectValueUsd);
  const assumed = permit.assumedValuationUsd || {};
  addMoney(allowedDollars, assumed.low);
  addMoney(allowedDollars, assumed.typical);
  addMoney(allowedDollars, assumed.high);
  addDate(permit.retrievedDate);
  addDate(permit.exemptionSource && permit.exemptionSource.retrievedDate);
  const blobs = [
    permit.caveat,
    permit.sourceName,
    permit.exemptionSource && permit.exemptionSource.name,
    permit.exemptionSource && permit.exemptionSource.what,
  ];
  for (const extra of permit.extras || []) {
    addMoney(allowedDollars, extra.feeUsd);
    addMoney(allowedDollars, extra.amountUsd);
    blobs.push(extra.name, extra.note);
  }
  for (const blob of blobs) {
    for (const token of dollarsIn(blob)) allowedDollars.add(token);
  }
}

const national = costsFile && costsFile.nationalWageIndex;
if (national) addMoney(allowedDollars, national.nationalMeanHourlyUsd);

for (const project of projects) {
  if (!project || !project.cityAdjustments || !project.cityAdjustments[CITY]) continue;
  addMoney(allowedDollars, project.nationalLow);
  addMoney(allowedDollars, project.nationalTypical);
  addMoney(allowedDollars, project.nationalHigh);
  addMoney(allowedDollars, project.commonLow);
  addMoney(allowedDollars, project.commonHigh);
  addMoney(allowedDollars, project.nationalJobLow);
  addMoney(allowedDollars, project.nationalJobTypical);
  addMoney(allowedDollars, project.nationalJobHigh);
  addMoney(allowedDollars, project.nationalPerSqftLow);
  addMoney(allowedDollars, project.nationalPerSqftHigh);
  for (const source of project.sources || []) addDate(source.retrievedDate);
  const adj = project.cityAdjustments[CITY];
  addMoney(allowedDollars, adj.blsConstructionMeanHourlyUsd);
  addMoney(allowedDollars, adj.lowUsd);
  addMoney(allowedDollars, adj.typicalUsd);
  addMoney(allowedDollars, adj.highUsd);
  const meta = PRICING[project.projectSlug];
  if (!meta) {
    fail("no pricing mirror for " + project.projectSlug);
    continue;
  }
  const multiplier = typeof adj.multiplier === "number" ? adj.multiplier : 1;
  const laborShare = typeof project.laborShare === "number" ? project.laborShare : 0.5;
  const scale = (amount) => {
    if (typeof amount !== "number") return null;
    if (meta.pricing === "job") return Math.round(amount * multiplier);
    return Math.round(amount * multiplier * meta.qty);
  };
  const low = scale(project.nationalLow);
  const typical = scale(project.nationalTypical);
  const high = scale(project.nationalHigh);
  addMoney(allowedDollars, low);
  addMoney(allowedDollars, typical);
  addMoney(allowedDollars, high);
  if (typeof typical === "number") {
    const labor = Math.round(typical * laborShare);
    addMoney(allowedDollars, labor);
    addMoney(allowedDollars, typical - labor);
  }
  const permit = denverPermits.find((row) => row.projectSlug === project.projectSlug);
  if (permit && typeof typical === "number") {
    const fee = typeof permit.feeTypicalUsd === "number" ? Math.round(permit.feeTypicalUsd) : 0;
    const feeLow = typeof permit.feeLowUsd === "number" ? Math.round(permit.feeLowUsd) : fee;
    const feeHigh = typeof permit.feeHighUsd === "number" ? Math.round(permit.feeHighUsd) : fee;
    addMoney(allowedDollars, typical + fee);
    if (typeof low === "number") addMoney(allowedDollars, low + feeLow);
    if (typeof high === "number") addMoney(allowedDollars, high + feeHigh);
  }
}

const hubFiles = fs.existsSync(outCity)
  ? fs.readdirSync(outCity).filter((name) => fs.existsSync(path.join(outCity, name, "index.html")))
  : [];
if (hubFiles.length !== 100) fail("rendered hub count " + hubFiles.length);

let guideCount = 0;
let dollarCount = 0;
let dateCount = 0;
let linkCount = 0;
let denverHtml = "";

for (const slug of hubFiles) {
  const html = fs.readFileSync(path.join(outCity, slug, "index.html"), "utf8");
  const count = (html.match(/\bid="denver-guide"/g) || []).length;
  if (slug === CITY) {
    guideCount = count;
    denverHtml = html;
    if (count !== 1) fail("denver-co #denver-guide count " + count);
  } else if (count) {
    fail(slug + " has #denver-guide");
  }
}

const section = guideHtml(denverHtml);
if (!section) fail("denver-co section html missing");

if (section) {
  const h2 = section.match(/<h2\b/gi) || [];
  const h3 = section.match(/<h3\b/gi) || [];
  if (h2.length !== 1) fail("denver guide h2 count " + h2.length);
  if (h3.length) fail("denver guide has h3");
  if (/[\u2013\u2014]|&mdash;|&ndash;|&#8211;|&#8212;|&#x2013;|&#x2014;/i.test(section)) {
    fail("em or en dash in #denver-guide");
  }

  const prose = textOf(section);
  const seenDollars = dollarsIn(prose);
  dollarCount = seenDollars.length;
  for (const token of seenDollars) {
    if (!allowedDollars.has(token)) fail("dollar not in Denver data: " + token);
  }

  const dates = [...prose.matchAll(DATE_RE)].map((match) => match[0]).concat(
    [...prose.matchAll(ISO_RE)].map((match) => match[0]),
  );
  dateCount = dates.length;
  for (const date of dates) {
    if (!allowedDates.has(date)) fail("date not a Denver retrievedDate: " + date);
  }

  const hrefs = [...section.matchAll(/\shref="([^"]*)"/g)].map((match) => decode(match[1]));
  for (const href of hrefs) {
    if (!href) {
      fail("empty href");
      continue;
    }
    if (/^https?:\/\//i.test(href)) continue;
    if (href.startsWith("#")) {
      const id = href.slice(1);
      if (!new RegExp('\\bid="' + id + '"').test(denverHtml)) fail("missing anchor " + href);
      continue;
    }
    if (!href.startsWith("/")) {
      fail("bad href " + href);
      continue;
    }
    linkCount += 1;
    const file = pageForHref(href);
    if (!file || !fs.existsSync(file)) fail("internal link missing " + href);
  }
}

// List typicals must match Projects card all-in typicals on the same page.
if (section && denverHtml) {
  const cardTypical = new Map();
  const cardRe = /<article\b[^>]*\bclass="[^"]*\bhub-card\b[^"]*"[^>]*\bdata-typical="(\d+)"[^>]*>[\s\S]*?<h3\b[\s\S]*?href="\/cost\/([^/"']+)\/denver-co\/"[\s\S]*?<p\b[^>]*\bclass="[^"]*\bhub-price\b[^"]*"[^>]*>([^<]+)<\/p>/gi;
  let cardMatch;
  while ((cardMatch = cardRe.exec(denverHtml))) {
    const allInNum = Number(cardMatch[1]);
    const slug = cardMatch[2];
    const priceText = textOf(cardMatch[3]);
    cardTypical.set(slug, { allInNum, priceText });
  }
  if (cardTypical.size !== 4) fail("Projects cards with data-typical " + cardTypical.size);

  const listItems = [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => textOf(m[1]));
  if (listItems.length !== 4) fail("denver-guide list items " + listItems.length);

  const slugFromHref = [...section.matchAll(/href="\/cost\/([^/"']+)\/denver-co\/"/g)].map((m) => m[1]);
  // Prefer pairing by link inside each li
  const liBlocks = [...section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)];
  for (const block of liBlocks) {
    const html = block[1];
    const slugMatch = html.match(/href="\/cost\/([^/"']+)\/denver-co\/"/);
    if (!slugMatch) {
      fail("list item missing cost link");
      continue;
    }
    const slug = slugMatch[1];
    const card = cardTypical.get(slug);
    if (!card) {
      fail("no Projects card for list job " + slug);
      continue;
    }
    const itemText = textOf(html);
    const typicalMatch = itemText.match(/typical\s+(\$\d{1,3}(?:,\d{3})*)/i);
    if (!typicalMatch) {
      fail("list item missing typical for " + slug + ": " + itemText);
      continue;
    }
    if (typicalMatch[1] !== card.priceText) {
      fail(
        "list typical for " +
          slug +
          " is " +
          typicalMatch[1] +
          " but Projects card shows " +
          card.priceText,
      );
    }
  }
}

let faqItems = 0;
let faqLd = 0;
if (denverHtml) {
  const faqBlock = denverHtml.match(/<section\b[^>]*\bid="faq"[^>]*>[\s\S]*?<\/section>/i);
  faqItems = faqBlock ? (faqBlock[0].match(/<details\b[^>]*\bclass="faq-item"/g) || []).length : 0;
  const ldRe = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = ldRe.exec(denverHtml))) {
    let json;
    try {
      json = JSON.parse(decode(match[1]));
    } catch {
      fail("FAQ JSON-LD parse");
      continue;
    }
    const type = json["@type"];
    const isFaq = type === "FAQPage" || (Array.isArray(type) && type.indexOf("FAQPage") !== -1);
    if (!isFaq) continue;
    faqLd = Array.isArray(json.mainEntity) ? json.mainEntity.length : 0;
  }
}
if (faqItems !== FAQ_BASELINE) fail("Denver FAQ items " + faqItems + " baseline " + FAQ_BASELINE);
if (faqLd !== FAQ_BASELINE) fail("Denver FAQPage items " + faqLd + " baseline " + FAQ_BASELINE);

if (failures.length) {
  console.error("denver-hub-editorial-check: " + failures.length + " failure(s)");
  for (const failure of failures.slice(0, 30)) console.error(failure);
  process.exit(1);
}

console.log(
  "denver-hub-editorial-check: #denver-guide on denver-co only (" +
    guideCount +
    "), " +
    dollarCount +
    " dollars, " +
    dateCount +
    " dates, " +
    linkCount +
    " internal links, FAQ " +
    faqItems +
    " OK",
);
