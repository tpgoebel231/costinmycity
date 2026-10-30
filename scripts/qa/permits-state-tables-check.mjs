/**
 * /permits/ state fee tables and the state jump list.
 * Dollars match data/permits.json the way state-job-permits-check formats
 * them (usd, moneyExact, or moneyExactCents) and must appear on that city's
 * permit page. A no-permit row (permitRequired false, or feeModel none /
 * exemption) prints the exempt sentence and no dollar.
 *
 *   node scripts/qa/permits-state-tables-check.mjs
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
const EXEMPT_TEXT = "Usually no city permit needed";
const NONE_TEXT = "See permit page";
const HEADERS = ["City", "Roof replacement", "Deck", "Kitchen remodel", "HVAC replacement"];
const JOBS = ["roof-replacement", "deck", "kitchen-remodel", "hvac-replacement"];

const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const permitByKey = new Map(permits.map((row) => [row.citySlug + "|" + row.projectSlug, row]));

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

function moneyExactCents(n) {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = String(abs % 100).padStart(2, "0");
  return (negative ? "-$" : "$") + dollars + "." + rem;
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

function stateSlug(state) {
  return state.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isNoPermit(row) {
  if (!row) return false;
  return row.permitRequired === false || row.feeModel === "none" || row.feeModel === "exemption";
}

const htmlCache = new Map();
function pageHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug);
  const file = path.join(permitDir, slug, "index.html");
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  htmlCache.set(slug, html);
  return html;
}

function idCount(html, id) {
  const re = new RegExp("\\bid=\"" + id + "\"", "gi");
  return (html.match(re) || []).length;
}

if (!fs.existsSync(indexFile)) fail("missing out/permits/index.html");

const html = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "";
const h1s = [...html.matchAll(/<h1\b[^>]*>/gi)];
if (h1s.length !== 1) fail("h1 count " + h1s.length);

if (idCount(html, "permits-index") !== 1) fail("#permits-index count " + idCount(html, "permits-index"));
const indexSection = elementById(html, "permits-index");
if (!indexSection) fail("#permits-index missing");

const indexHrefs = [];
const indexHrefRe = /<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi;
let indexHrefMatch;
while ((indexHrefMatch = indexHrefRe.exec(indexSection))) indexHrefs.push(decode(indexHrefMatch[1]));

const pageCities = cities.filter((city) => fs.existsSync(path.join(permitDir, city.slug, "index.html")));
const byState = new Map();
for (const city of pageCities) {
  if (!byState.has(city.state)) byState.set(city.state, []);
  byState.get(city.state).push(city);
}
const expectedStates = [...byState.keys()].sort((a, b) => a.localeCompare(b, "en"));
for (const state of expectedStates) {
  byState.get(state).sort((a, b) => a.name.localeCompare(b.name, "en") || a.slug.localeCompare(b.slug, "en"));
}
const expectedIds = expectedStates.map((state) => "state-" + stateSlug(state));

if (idCount(html, "permit-fee-tables") !== 1) fail("#permit-fee-tables count " + idCount(html, "permit-fee-tables"));
const tables = elementById(html, "permit-fee-tables");
if (!tables) fail("#permit-fee-tables missing");

const sectionIds = [];
if (tables) {
  const sectionRe = /<section\b[^>]*\bid="(state-[a-z0-9-]+)"[^>]*>/gi;
  let sectionMatch;
  while ((sectionMatch = sectionRe.exec(tables))) sectionIds.push(sectionMatch[1]);
}
if (sectionIds.length !== expectedIds.length) {
  fail("state section count " + sectionIds.length + " expected " + expectedIds.length);
}
if (sectionIds.join("\0") !== expectedIds.join("\0")) {
  fail("state section ids " + sectionIds.join(", ") + " expected " + expectedIds.join(", "));
}

let rowTotal = 0;
let cellTotal = 0;
let withFee = 0;
let exemptCount = 0;
let seeCount = 0;
const rowHrefs = [];

expectedStates.forEach((state, index) => {
  const id = expectedIds[index];
  if (sectionIds[index] !== id) return;
  const section = elementById(html, id);
  if (!section) {
    fail("missing section " + id);
    return;
  }
  const h2s = [...section.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const wantHeading = state + " permit fees by city";
  if (h2s.length !== 1) fail(state + " h2 count " + h2s.length);
  else if (textOf(h2s[0][1]) !== wantHeading) fail(state + " h2 " + textOf(h2s[0][1]));

  const tableMatches = [...section.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)];
  if (tableMatches.length !== 1) {
    fail(state + " table count " + tableMatches.length);
    return;
  }
  const table = tableMatches[0][0];
  const captions = [...table.matchAll(/<caption\b[^>]*>([\s\S]*?)<\/caption>/gi)];
  if (captions.length !== 1 || !textOf(captions[0][1])) fail(state + " caption count " + captions.length);

  const cols = [...table.matchAll(/<th\b[^>]*\bscope="col"[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => textOf(match[1]));
  if (cols.join("\0") !== HEADERS.join("\0")) fail(state + " headers " + cols.join(" | "));

  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(table);
  if (!tbody) {
    fail(state + " missing tbody");
    return;
  }
  const trs = [...tbody[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const wantCities = byState.get(state);
  if (trs.length !== wantCities.length) fail(state + " row count " + trs.length + " expected " + wantCities.length);

  trs.forEach((trMatch, rowIndex) => {
    const tr = trMatch[1];
    rowTotal += 1;
    const rowTh = /<th\b[^>]*\bscope="row"[^>]*>([\s\S]*?)<\/th>/i.exec(tr);
    if (!rowTh) {
      fail(state + " row " + rowIndex + " missing th scope=row");
      return;
    }
    const link = /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(rowTh[1]);
    if (!link) {
      fail(state + " row " + rowIndex + " missing city link");
      return;
    }
    const href = decode(link[1]);
    const label = textOf(link[2]);
    const want = wantCities[rowIndex];
    const wantHref = want ? "/permits/" + want.slug + "/" : "";
    if (href !== wantHref) fail(state + " href " + href + " expected " + wantHref);
    const parsed = PERMIT_HREF.exec(href);
    if (!parsed) {
      fail(state + " bad href " + href);
      return;
    }
    const slug = parsed[1];
    rowHrefs.push(href);
    if (!cityBySlug.has(slug)) fail(state + " unknown city " + slug);
    if (label !== (want ? want.name : "")) fail(state + " label " + label + " expected " + (want ? want.name : ""));
    if (!fs.existsSync(path.join(permitDir, slug, "index.html"))) fail(state + " missing target " + slug);

    const tds = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textOf(match[1]));
    if (tds.length !== JOBS.length) fail(state + " " + slug + " td count " + tds.length);
    tds.forEach((tdText, cellIndex) => {
      const job = JOBS[cellIndex];
      if (!job) return;
      cellTotal += 1;
      const permit = permitByKey.get(slug + "|" + job);
      const dollars = dollarsIn(tdText);
      if (isNoPermit(permit)) {
        exemptCount += 1;
        if (tdText !== EXEMPT_TEXT) fail(slug + " " + job + " exempt text " + tdText);
        if (dollars.length) fail(slug + " " + job + " exempt cell has a dollar: " + tdText);
        return;
      }
      if (!dollars.length) {
        if (tdText !== NONE_TEXT && tdText !== EXEMPT_TEXT) {
          fail(slug + " " + job + " empty cell text " + tdText);
        }
        if (tdText === EXEMPT_TEXT) exemptCount += 1;
        else seeCount += 1;
        return;
      }
      withFee += 1;
      if (!permit || permit.feeTypicalUsd == null) {
        fail(slug + " " + job + " dollar with no fee: " + tdText);
        return;
      }
      const allowed = new Set([
        usd(permit.feeTypicalUsd),
        moneyExact(permit.feeTypicalUsd),
        moneyExactCents(permit.feeTypicalUsd),
      ]);
      const cityHtml = pageHtml(slug);
      for (const token of dollars) {
        if (!allowed.has(token)) {
          fail(slug + " " + job + " dollar " + token + " is not the fee " + [...allowed].join(" or "));
        } else if (!containsMoney(cityHtml, token)) {
          fail(slug + " " + job + " dollar " + token + " missing on city permit page");
        }
      }
    });
  });
});

if (rowTotal !== 100) fail("row count " + rowTotal + " expected 100");

const rowSet = rowHrefs.slice().sort().join("\0");
const indexSet = indexHrefs.slice().sort().join("\0");
if (indexHrefs.length !== 100) fail("#permits-index link count " + indexHrefs.length);
if (rowSet !== indexSet) fail("table hrefs do not match #permits-index hrefs");

if (tables) {
  // Range paragraphs repeat fee labels already printed in the tds. Ignore them for this comparison only.
  const tablesForDollars = tables.replace(
    /<p\b[^>]*\bid="state-[a-z0-9-]+-range"[^>]*>[\s\S]*?<\/p>/gi,
    "",
  );
  const sectionDollars = dollarsIn(textOf(tablesForDollars));
  const tdDollars = [];
  const tdRe = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;
  let tdMatch;
  while ((tdMatch = tdRe.exec(tables))) tdDollars.push(...dollarsIn(textOf(tdMatch[1])));
  if (sectionDollars.join("|") !== tdDollars.join("|")) fail("dollar outside a td in #permit-fee-tables");
}

if (idCount(html, "state-jump") !== 1) fail("#state-jump count " + idCount(html, "state-jump"));
const jump = elementById(html, "state-jump");
if (!jump) fail("#state-jump missing");
const jumpHrefs = [];
if (jump) {
  const jumpRe = /<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi;
  let jumpMatch;
  while ((jumpMatch = jumpRe.exec(jump))) jumpHrefs.push(decode(jumpMatch[1]));
}
if (jumpHrefs.length !== expectedIds.length) {
  fail("jump link count " + jumpHrefs.length + " expected " + expectedIds.length);
}
jumpHrefs.forEach((href, index) => {
  const want = "#" + expectedIds[index];
  if (href !== want) fail("jump href " + href + " expected " + want);
  const id = href.startsWith("#") ? href.slice(1) : "";
  if (!id || idCount(html, id) !== 1) fail("jump target missing " + href);
});

if (tables && (DASH.test(tables) || DASH.test(textOf(tables)))) fail("em or en dash in #permit-fee-tables");
if (jump && (DASH.test(jump) || DASH.test(textOf(jump)))) fail("em or en dash in #state-jump");

if (withFee + exemptCount + seeCount !== cellTotal) {
  fail("cell buckets " + withFee + " + " + exemptCount + " + " + seeCount + " != " + cellTotal);
}

if (failures.length) {
  console.error("permits-state-tables-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "permits-state-tables-check: " +
    sectionIds.length +
    " state tables, " +
    rowTotal +
    " rows, " +
    cellTotal +
    " cells (" +
    withFee +
    " with fee, " +
    exemptCount +
    " exempt, " +
    seeCount +
    " see permit page), " +
    jumpHrefs.length +
    " jump links OK",
);
