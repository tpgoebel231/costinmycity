/**
 * Cost pages link to other permit pages in the same state for the same job.
 * Dollars in that block are the linked city's recorded fee for this project,
 * formatted the way state-permits-hub-check formats them (usd or moneyExact),
 * and must appear on that city's permit page. Sacramento HVAC's table label
 * is the recorded whole dollar with cents ($213.00); moneyExactCents accepts
 * that token without rounding.
 *
 *   node scripts/qa/state-job-permits-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const costDir = path.join(outDir, "cost");
const permitDir = path.join(outDir, "permits");

const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));

const DASH = /\u2014|\u2013|&mdash;|&ndash;|&#8212;|&#x2014;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/g;
const PERMIT_HREF = /^\/permits\/([a-z0-9-]+)\/$/;
const JOB_LABEL = {
  "roof-replacement": "Roof replacement",
  deck: "Deck",
  "kitchen-remodel": "Kitchen remodel",
  "hvac-replacement": "HVAC replacement",
};

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

function costPages() {
  const pages = [];
  if (!fs.existsSync(costDir)) return pages;
  for (const project of fs.readdirSync(costDir)) {
    const projectDir = path.join(costDir, project);
    if (!fs.statSync(projectDir).isDirectory()) continue;
    for (const city of fs.readdirSync(projectDir)) {
      const file = path.join(projectDir, city, "index.html");
      if (fs.existsSync(file)) pages.push({ project, city, file });
    }
  }
  return pages;
}

const pages = costPages();
if (pages.length !== 400) fail("cost page count " + pages.length + " expected 400");

let pagesWithBlock = 0;
let linkTotal = 0;
let withFee = 0;
let exemptCount = 0;
let noDetail = 0;
let pagesWithout = 0;

for (const page of pages) {
  const project = page.project;
  const slug = page.city;
  const city = cityBySlug.get(slug);
  const job = JOB_LABEL[project];
  const label = project + "/" + slug;
  if (!city) {
    fail(label + " unknown city");
    continue;
  }
  if (!job) {
    fail(label + " unknown project");
    continue;
  }
  const html = fs.readFileSync(page.file, "utf8");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1s.length !== 1) fail(label + " h1 count " + h1s.length);

  const peers = expectedPeers(city);
  const section = elementById(html, "state-job-permits");
  const phrase = html.includes("permit fees in other") || textOf(html).includes("permit fees in other");

  if (!peers.length) {
    pagesWithout += 1;
    if (section || /id="state-job-permits"/i.test(html)) fail(label + " has #state-job-permits with no siblings");
    if (phrase) fail(label + " has permit fees in other text with no siblings");
    continue;
  }

  pagesWithBlock += 1;
  if (!section) {
    fail(label + " missing #state-job-permits");
    continue;
  }
  const idHits = html.match(/id="state-job-permits"/gi) || [];
  if (idHits.length !== 1) fail(label + " #state-job-permits count " + idHits.length);
  if (DASH.test(section) || DASH.test(textOf(section))) fail(label + " em or en dash in #state-job-permits");

  const h2s = [...section.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const wantHeading = job + " permit fees in other " + city.state + " cities";
  if (h2s.length !== 1) fail(label + " h2 count " + h2s.length);
  else if (textOf(h2s[0][1]) !== wantHeading) fail(label + " h2 " + textOf(h2s[0][1]));

  const rows = [];
  const liRe = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRe.exec(section))) {
    const li = liMatch[1];
    const anchors = [...li.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    rows.push({ li, anchors });
  }
  const sectionAnchors = [...section.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)];
  if (rows.length !== peers.length) fail(label + " link count " + rows.length + " expected " + peers.length);
  if (sectionAnchors.length !== rows.length) fail(label + " anchors " + sectionAnchors.length + " vs list items " + rows.length);

  rows.forEach((row, index) => {
    const peer = peers[index];
    if (!peer) return;
    linkTotal += 1;
    if (row.anchors.length !== 1) {
      fail(label + " list item " + index + " has " + row.anchors.length + " links");
      return;
    }
    const href = decode(row.anchors[0][1]);
    const linkLabel = textOf(row.anchors[0][2]);
    const wantHref = "/permits/" + peer.slug + "/";
    if (href !== wantHref) fail(label + " href " + href + " expected " + wantHref);
    const parsed = PERMIT_HREF.exec(href);
    if (!parsed) {
      fail(label + " bad href " + href);
      return;
    }
    const peerSlug = parsed[1];
    if (peerSlug === slug) fail(label + " links to itself");
    if (!cityBySlug.has(peerSlug)) fail(label + " unknown city " + peerSlug);
    if (!permitPageExists(peerSlug)) fail(label + " missing target " + peerSlug);
    if (linkLabel !== peer.name) fail(label + " label " + linkLabel + " expected " + peer.name);

    const line = textOf(row.li);
    const lineDollars = dollarsIn(line);
    const permit = permitByKey.get(peerSlug + "|" + project);
    const exempt = Boolean(permit && (permit.permitRequired === false || permit.feeModel === "none" || permit.feeModel === "exemption"));
    if (exempt) {
      exemptCount += 1;
      if (!line.includes("usually no city permit needed")) {
        fail(label + " " + peerSlug + " exempt line missing no-permit phrase: " + line);
      }
      if (lineDollars.length) fail(label + " " + peerSlug + " exempt line has a dollar: " + line);
      return;
    }
    if (!permit || permit.feeTypicalUsd == null) {
      noDetail += 1;
      if (lineDollars.length) fail(label + " " + peerSlug + " null fee has a dollar: " + line);
      if (line !== peer.name) fail(label + " " + peerSlug + " no-detail line is not the city name: " + line);
      return;
    }
    if (!lineDollars.length) {
      noDetail += 1;
      if (line !== peer.name) fail(label + " " + peerSlug + " no-detail line is not the city name: " + line);
      return;
    }
    withFee += 1;
    if (!line.includes(job + " permit ")) fail(label + " " + peerSlug + " fee line missing job permit prefix: " + line);
    const allowed = new Set([usd(permit.feeTypicalUsd), moneyExact(permit.feeTypicalUsd), moneyExactCents(permit.feeTypicalUsd)]);
    const cityHtml = pageHtml(peerSlug);
    for (const token of lineDollars) {
      if (!allowed.has(token)) {
        fail(label + " " + peerSlug + " dollar " + token + " is not the " + project + " fee " + [...allowed].join(" or "));
      } else if (!containsMoney(cityHtml, token)) {
        fail(label + " " + peerSlug + " dollar " + token + " missing on city permit page");
      }
    }
  });
}

if (pagesWithBlock + pagesWithout !== 400) {
  fail("pages checked " + (pagesWithBlock + pagesWithout) + " expected 400");
}
if (pagesWithBlock !== 344) fail("pages with block " + pagesWithBlock + " expected 344");
if (pagesWithout !== 56) fail("pages without peers " + pagesWithout + " expected 56");
if (!pagesWithBlock || !linkTotal) fail("no cost page rendered #state-job-permits");
if (withFee + exemptCount + noDetail !== linkTotal) {
  fail("link buckets " + withFee + " + " + exemptCount + " + " + noDetail + " != " + linkTotal);
}

if (failures.length) {
  console.error("state-job-permits-check: FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  process.exit(1);
}

console.log(
  "state-job-permits-check: " +
    pagesWithBlock +
    " cost pages with block, " +
    linkTotal +
    " links (" +
    withFee +
    " with fee, " +
    exemptCount +
    " exempt, " +
    noDetail +
    " no detail), " +
    pagesWithout +
    " pages without peers OK",
);
