/**
 * City hubs link to other permit pages in the same state. Dollars in that
 * block are the linked city's recorded roof-replacement fee, formatted the
 * way permit-mesh-check formats them (usd or moneyExact), and must appear
 * on that city's permit page.
 *
 *   node scripts/qa/state-permits-hub-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cityDir = path.join(outDir, "city");
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

function permitPageExists(slug) {
  return fs.existsSync(path.join(permitDir, slug, "index.html"));
}

function expectedPeers(city) {
  return cities
    .filter((peer) => peer.slug !== city.slug && peer.state === city.state && permitPageExists(peer.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .slice(0, 6);
}

const htmlCache = new Map();
function pageHtml(slug) {
  if (htmlCache.has(slug)) return htmlCache.get(slug);
  const file = path.join(permitDir, slug, "index.html");
  const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  htmlCache.set(slug, html);
  return html;
}

let hubsWithBlock = 0;
let linkTotal = 0;
let withRoofFee = 0;
let exemptCount = 0;
let noDetail = 0;
let hubsWithout = 0;

for (const city of cities) {
  if (!city || !city.slug) {
    fail("city missing slug");
    continue;
  }
  const slug = city.slug;
  const file = path.join(cityDir, slug, "index.html");
  if (!fs.existsSync(file)) {
    fail(slug + " missing hub");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) fail(slug + " h1 count " + h1s.length);

  const peers = expectedPeers(city);
  const section = elementById(html, "state-permits");
  const phrase = html.includes("Permit fees in other") || textOf(html).includes("Permit fees in other");

  if (!peers.length) {
    hubsWithout += 1;
    if (section || /id="state-permits"/i.test(html)) fail(slug + " has #state-permits with no siblings");
    if (phrase) fail(slug + " has Permit fees in other text with no siblings");
    continue;
  }

  hubsWithBlock += 1;
  if (!section) {
    fail(slug + " missing #state-permits");
    continue;
  }
  const idHits = html.match(/id="state-permits"/gi) || [];
  if (idHits.length !== 1) fail(slug + " #state-permits count " + idHits.length);
  if (DASH.test(section) || DASH.test(textOf(section))) fail(slug + " em or en dash in #state-permits");

  const h2s = [...section.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const wantHeading = "Permit fees in other " + city.state + " cities";
  if (h2s.length !== 1) fail(slug + " h2 count " + h2s.length);
  else if (textOf(h2s[0][1]) !== wantHeading) fail(slug + " h2 " + textOf(h2s[0][1]));

  const rows = [];
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRe.exec(section))) {
    const li = liMatch[1];
    const anchors = [...li.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    rows.push({ li, anchors });
  }
  const sectionAnchors = [...section.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)];
  if (rows.length !== peers.length) fail(slug + " link count " + rows.length + " expected " + peers.length);
  if (sectionAnchors.length !== rows.length) fail(slug + " anchors " + sectionAnchors.length + " vs list items " + rows.length);

  rows.forEach((row, index) => {
    const peer = peers[index];
    if (!peer) return;
    linkTotal += 1;
    if (row.anchors.length !== 1) {
      fail(slug + " list item " + index + " has " + row.anchors.length + " links");
      return;
    }
    const href = decode(row.anchors[0][1]);
    const label = textOf(row.anchors[0][2]);
    const wantHref = "/permits/" + peer.slug + "/";
    if (href !== wantHref) fail(slug + " href " + href + " expected " + wantHref);
    const parsed = PERMIT_HREF.exec(href);
    if (!parsed) {
      fail(slug + " bad href " + href);
      return;
    }
    const peerSlug = parsed[1];
    if (peerSlug === slug) fail(slug + " links to itself");
    if (!cityBySlug.has(peerSlug)) fail(slug + " unknown city " + peerSlug);
    if (!permitPageExists(peerSlug)) fail(slug + " missing target " + peerSlug);
    if (label !== peer.name) fail(slug + " label " + label + " expected " + peer.name);

    const line = textOf(row.li);
    const lineDollars = dollarsIn(line);
    const roof = roofByCity.get(peerSlug);
    const exempt = roof && roof.permitRequired === false;
    if (exempt) {
      exemptCount += 1;
      if (!line.includes("usually no city permit needed")) {
        fail(slug + " " + peerSlug + " exempt line missing no-permit phrase: " + line);
      }
      if (lineDollars.length) fail(slug + " " + peerSlug + " exempt line has a dollar: " + line);
      return;
    }
    if (!roof || roof.feeTypicalUsd == null) {
      noDetail += 1;
      if (lineDollars.length) fail(slug + " " + peerSlug + " null fee has a dollar: " + line);
      return;
    }
    if (!lineDollars.length) {
      noDetail += 1;
      return;
    }
    withRoofFee += 1;
    const allowed = new Set([usd(roof.feeTypicalUsd), moneyExact(roof.feeTypicalUsd)]);
    const cityHtml = pageHtml(peerSlug);
    for (const token of lineDollars) {
      if (!allowed.has(token)) {
        fail(slug + " " + peerSlug + " dollar " + token + " is not the roof fee " + [...allowed].join(" or "));
      } else if (!containsMoney(cityHtml, token)) {
        fail(slug + " " + peerSlug + " dollar " + token + " missing on city permit page");
      }
    }
  });
}

if (hubsWithBlock + hubsWithout !== cities.length) {
  fail("hubs checked " + (hubsWithBlock + hubsWithout) + " expected " + cities.length);
}
if (!hubsWithBlock || !linkTotal) fail("no hub rendered #state-permits");
if (withRoofFee + exemptCount + noDetail !== linkTotal) {
  fail("link buckets " + withRoofFee + " + " + exemptCount + " + " + noDetail + " != " + linkTotal);
}

if (failures.length) {
  console.error("state-permits-hub-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "state-permits-hub-check: " +
    hubsWithBlock +
    " hubs with block, " +
    linkTotal +
    " links (" +
    withRoofFee +
    " with roof fee, " +
    exemptCount +
    " exempt, " +
    noDetail +
    " no detail), " +
    hubsWithout +
    " hubs without siblings OK",
);
