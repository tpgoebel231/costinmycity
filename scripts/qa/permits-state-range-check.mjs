/**
 * Lowest/highest sentences on /permits/ state fee tables.
 * Expected text is recomputed from the rendered td labels (not from a fee
 * formula). Each dollar in a summary must be that city's td, that city's
 * fee in data/permits.json, and present on the city permit page. Ordering
 * uses integer cents only. The printed dollar stays the original label.
 *
 *   node scripts/qa/permits-state-range-check.mjs
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
const JOBS = [
  { slug: "roof-replacement", name: "roof replacement" },
  { slug: "deck", name: "deck" },
  { slug: "kitchen-remodel", name: "kitchen remodel" },
  { slug: "hvac-replacement", name: "HVAC replacement" },
];

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

function idCount(html, id) {
  const re = new RegExp("\\bid=\"" + id + "\"", "gi");
  return (html.match(re) || []).length;
}

function isNoPermit(row) {
  if (!row) return false;
  return row.permitRequired === false || row.feeModel === "none" || row.feeModel === "exemption";
}

/** Integer cents for ordering only. Does not round or rewrite the label. */
function labelCents(label) {
  const stripped = label.replace(/\$/g, "").replace(/,/g, "").trim();
  const negative = stripped.startsWith("-");
  const body = negative ? stripped.slice(1) : stripped;
  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? "" : body.slice(dot + 1);
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -cents : cents;
}

function joinCityList(names) {
  if (names.length <= 1) return names[0] || "";
  if (names.length === 2) return names[0] + " and " + names[1];
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}

const htmlCache = new Map();
function pageHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug);
  const file = path.join(permitDir, slug, "index.html");
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  htmlCache.set(slug, html);
  return html;
}

/**
 * Sentences and fee claims from one state's rendered cells.
 * claims are the min, max, or equal dollar, each with every city that shares it.
 */
function summaryFromRows(state, rows) {
  const sentences = [];
  const claims = [];
  let range = 0;
  let equal = 0;
  let exemptNotes = 0;
  JOBS.forEach((job, index) => {
    const fee = [];
    const exempt = [];
    for (const row of rows) {
      const td = row.tds[index];
      if (td === EXEMPT_TEXT) {
        if (dollarsIn(td).length) fail(state + " " + job.slug + " exempt cell has a dollar");
        exempt.push(row);
        continue;
      }
      if (td === NONE_TEXT) {
        if (dollarsIn(td).length) fail(state + " " + job.slug + " see-permit cell has a dollar");
        continue;
      }
      const tokens = dollarsIn(td);
      if (tokens.length !== 1 || tokens[0] !== td) {
        fail(state + " " + row.slug + " " + job.slug + " fee cell is not one dollar label: " + td);
        continue;
      }
      fee.push({ city: row.city, slug: row.slug, td, label: td, cents: labelCents(td) });
    }
    if (fee.length < 2) return;
    let minCents = fee[0].cents;
    let maxCents = fee[0].cents;
    for (const item of fee) {
      if (item.cents < minCents) minCents = item.cents;
      if (item.cents > maxCents) maxCents = item.cents;
    }
    const lowest = fee.filter((item) => item.cents === minCents);
    const highest = fee.filter((item) => item.cents === maxCents);
    if (minCents === maxCents) {
      const label = fee[0].label;
      const cities = joinCityList(fee.map((item) => item.city));
      if (fee.length === 2) {
        sentences.push(
          "In " + state + ", the " + job.name + " permit fee in our data is " + label + " in both " + cities + ".",
        );
      } else {
        sentences.push(
          "In " +
            state +
            ", the " +
            job.name +
            " permit fee in our data is " +
            label +
            " in each of " +
            cities +
            ".",
        );
      }
      equal += 1;
      claims.push({ job: job.slug, label, cities: fee, role: "equal", fee });
    } else {
      sentences.push(
        "In " +
          state +
          ", the lowest " +
          job.name +
          " permit fee in our data is " +
          lowest[0].label +
          " in " +
          joinCityList(lowest.map((item) => item.city)) +
          " and the highest is " +
          highest[0].label +
          " in " +
          joinCityList(highest.map((item) => item.city)) +
          ".",
      );
      range += 1;
      claims.push({ job: job.slug, label: lowest[0].label, cities: lowest, role: "min", fee });
      claims.push({ job: job.slug, label: highest[0].label, cities: highest, role: "max", fee });
    }
    if (exempt.length > 0) {
      const verb = exempt.length === 1 ? "needs" : "need";
      sentences.push(joinCityList(exempt.map((item) => item.city)) + " usually " + verb + " no city permit for this job.");
      exemptNotes += 1;
    }
  });
  return { sentences, claims, range, equal, exemptNotes };
}

if (!fs.existsSync(indexFile)) fail("missing out/permits/index.html");
const html = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "";
const tables = html ? elementById(html, "permit-fee-tables") : "";
if (!tables) fail("#permit-fee-tables missing");

const sectionIds = [];
if (tables) {
  const sectionRe = /<section\b[^>]*\bid="(state-[a-z0-9-]+)"[^>]*>/gi;
  let sectionMatch;
  while ((sectionMatch = sectionRe.exec(tables))) sectionIds.push(sectionMatch[1]);
}
if (sectionIds.length !== 38) fail("state section count " + sectionIds.length + " expected 38");

let statesWithSummary = 0;
let statesWithoutSummary = 0;
let sentenceTotal = 0;
let rangeTotal = 0;
let equalTotal = 0;
let exemptTotal = 0;
let valuesChecked = 0;

for (const id of sectionIds) {
  const section = elementById(html, id);
  if (!section) {
    fail("missing section " + id);
    continue;
  }
  const h2s = [...section.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  if (h2s.length !== 1) {
    fail(id + " h2 count " + h2s.length);
    continue;
  }
  const heading = textOf(h2s[0][1]);
  const state = heading.endsWith(" permit fees by city") ? heading.slice(0, -" permit fees by city".length) : "";
  if (!state) fail(id + " heading " + heading);

  const tableMatches = [...section.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)];
  if (tableMatches.length !== 1) {
    fail(id + " table count " + tableMatches.length);
    continue;
  }
  const table = tableMatches[0][0];
  const cols = [...table.matchAll(/<th\b[^>]*\bscope="col"[^>]*>([\s\S]*?)<\/th>/gi)].map((match) => textOf(match[1]));
  if (cols.join("\0") !== HEADERS.join("\0")) fail(id + " headers " + cols.join(" | "));

  const tbody = /<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i.exec(table);
  if (!tbody) {
    fail(id + " missing tbody");
    continue;
  }
  const trs = [...tbody[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const rows = [];
  trs.forEach((trMatch, rowIndex) => {
    const tr = trMatch[1];
    const rowTh = /<th\b[^>]*\bscope="row"[^>]*>([\s\S]*?)<\/th>/i.exec(tr);
    const link = rowTh && /<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(rowTh[1]);
    if (!link) {
      fail(id + " row " + rowIndex + " missing city link");
      return;
    }
    const href = decode(link[1]);
    const cityName = textOf(link[2]);
    const parsed = PERMIT_HREF.exec(href);
    if (!parsed) {
      fail(id + " bad href " + href);
      return;
    }
    const slug = parsed[1];
    const city = cityBySlug.get(slug);
    if (!city) fail(id + " unknown city " + slug);
    else {
      if (city.name !== cityName) fail(slug + " label " + cityName + " expected " + city.name);
      if (state && city.state !== state) fail(slug + " state " + city.state + " expected " + state);
    }
    const tds = [...tr.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => textOf(match[1]));
    if (tds.length !== JOBS.length) fail(id + " " + slug + " td count " + tds.length);
    rows.push({ city: cityName, slug, tds });
  });

  const expected = summaryFromRows(state, rows);
  const expectedText = expected.sentences.join(" ");
  const rangeId = id + "-range";
  const paragraphRe = new RegExp("<p\\b[^>]*\\bid=\"" + rangeId + "\"[^>]*>([\\s\\S]*?)<\\/p>", "gi");
  const paragraphs = [...section.matchAll(paragraphRe)];
  const pageCount = idCount(html, rangeId);

  if (!expectedText) {
    statesWithoutSummary += 1;
    if (paragraphs.length || pageCount) fail(id + " summary paragraph present but none expected");
  } else {
    statesWithSummary += 1;
    sentenceTotal += expected.sentences.length;
    rangeTotal += expected.range;
    equalTotal += expected.equal;
    exemptTotal += expected.exemptNotes;
    if (paragraphs.length !== 1 || pageCount !== 1) {
      fail(id + " summary paragraph count " + paragraphs.length + " page " + pageCount);
    }
    if (DASH.test(expectedText)) fail(id + " em or en dash in expected summary");
    if (paragraphs.length === 1) {
      const paragraphHtml = paragraphs[0][0];
      const rendered = textOf(paragraphs[0][1]);
      if (DASH.test(paragraphHtml) || DASH.test(rendered)) fail(id + " em or en dash in summary");
      if (rendered !== expectedText) fail(id + " summary text mismatch");
      const h2Close = section.search(/<\/h2>/i);
      const tableAt = section.search(/<table\b/i);
      const pAt = paragraphs[0].index;
      if (!(h2Close !== -1 && pAt > h2Close && tableAt !== -1 && pAt < tableAt)) {
        fail(id + " summary is not between the h2 and the table");
      }
      const renderedDollars = dollarsIn(rendered);
      const claimDollars = expected.claims.map((claim) => claim.label);
      if (renderedDollars.join("|") !== claimDollars.join("|")) {
        fail(id + " summary dollars are not the min/max labels");
      }
    }
  }

  for (const claim of expected.claims) {
    const centsValues = claim.fee.map((item) => item.cents);
    const minCents = Math.min(...centsValues);
    const maxCents = Math.max(...centsValues);
    const wantCents = claim.role === "min" ? minCents : claim.role === "max" ? maxCents : minCents;
    if (claim.role === "equal" && minCents !== maxCents) fail(state + " " + claim.job + " equal claim is not flat");
    if (labelCents(claim.label) !== wantCents) {
      fail(state + " " + claim.job + " " + claim.role + " " + claim.label + " is not the extreme");
    }
    const wantCities = claim.fee.filter((item) => item.cents === wantCents);
    if (wantCities.map((item) => item.slug).join("\0") !== claim.cities.map((item) => item.slug).join("\0")) {
      fail(state + " " + claim.job + " " + claim.role + " cities are not every tie");
    }
    for (const city of claim.cities) {
      if (city.td === EXEMPT_TEXT || city.td === NONE_TEXT || dollarsIn(city.td).length === 0) {
        fail(state + " " + city.slug + " " + claim.job + " dollar from an exempt or see-permit cell");
        continue;
      }
      if (city.td !== claim.label) {
        fail(state + " " + city.slug + " " + claim.job + " " + claim.label + " is not the td " + city.td);
        continue;
      }
      const permit = permitByKey.get(city.slug + "|" + claim.job);
      if (!permit || permit.feeTypicalUsd == null || isNoPermit(permit)) {
        fail(state + " " + city.slug + " " + claim.job + " dollar with no fee: " + claim.label);
        continue;
      }
      const allowed = new Set([
        usd(permit.feeTypicalUsd),
        moneyExact(permit.feeTypicalUsd),
        moneyExactCents(permit.feeTypicalUsd),
      ]);
      if (!allowed.has(claim.label)) {
        fail(state + " " + city.slug + " " + claim.job + " dollar " + claim.label + " is not the fee " + [...allowed].join(" or "));
        continue;
      }
      const cityHtml = pageHtml(city.slug);
      if (!cityHtml) {
        fail(state + " " + city.slug + " missing permit page");
        continue;
      }
      if (!containsMoney(cityHtml, claim.label)) {
        fail(state + " " + city.slug + " " + claim.job + " dollar " + claim.label + " missing on city permit page");
        continue;
      }
      valuesChecked += 1;
    }
  }
}

if (statesWithSummary + statesWithoutSummary !== sectionIds.length) {
  fail("summary state tally " + statesWithSummary + " + " + statesWithoutSummary);
}
if (sentenceTotal !== rangeTotal + equalTotal + exemptTotal) {
  fail("sentence tally " + sentenceTotal + " != " + rangeTotal + " + " + equalTotal + " + " + exemptTotal);
}

if (failures.length) {
  console.error("permits-state-range-check: FAIL " + failures.length + " mismatches");
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "permits-state-range-check: " +
    statesWithSummary +
    " states with summary, " +
    sentenceTotal +
    " sentences (" +
    rangeTotal +
    " range, " +
    equalTotal +
    " equal, " +
    exemptTotal +
    " exemption notes), " +
    valuesChecked +
    " values checked, 0 mismatches, " +
    statesWithoutSummary +
    " states without summary OK",
);
