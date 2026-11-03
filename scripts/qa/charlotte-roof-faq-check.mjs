/**
 * Charlotte roof FAQ exception only.
 * The 20-year question and the asphalt vs metal question stay on
 * /cost/roof-replacement/charlotte-nc/. Dollars in those answers must be
 * Charlotte buildEstimate output or a roof project / Charlotte permit field
 * already on this page. Invented metal bands such as $7 or $25 fail.
 *
 *   node scripts/qa/charlotte-roof-faq-check.mjs
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;

const AGE_Q = "Should a 20-year-old roof be replaced?";
const METAL_Q = "How much does asphalt vs metal roofing cost per square foot in Charlotte?";
const EXISTING_Q = [
  "How much does a roof replacement cost on a 2,000 sq ft home in Charlotte?",
  "Is $30,000 too much for a roof replacement in Charlotte?",
  "Do I need a permit to replace my roof in Charlotte?",
];

const DASH = /[\u2013\u2014]|&ndash;|&mdash;|&#8211;|&#8212;|&#x201[34];/i;
// Thousands commas stay in the token. A comma after the amount does not.
const DOLLAR_RE = /\$\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$\d+(?:\.\d+)?/g;

const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16, min: 8, max: 60, step: 1 },
};
const ROOF_TYPICAL = readConst("lib/roof-size.ts", "typical");

function readConst(rel, name) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const match = src.match(new RegExp("\\b" + name + "\\s*[:=]\\s*(\\d+)"));
  if (!match) throw new Error("missing " + name + " in " + rel);
  return Number(match[1]);
}

function scaleBase(amount, multiplier, quantity, defaultQuantity, pricing, asJobTotal) {
  if (pricing === "job" || asJobTotal) {
    const factor = defaultQuantity > 0 ? quantity / defaultQuantity : 1;
    return Math.round(amount * multiplier * factor);
  }
  return Math.round(amount * multiplier * quantity);
}

function scalePermit(permit, quantity, defaultQty) {
  if (!permit) return { low: null, typical: null, high: null };
  const model = permit.feeModel;
  const qtyRatio = defaultQty > 0 ? quantity / defaultQty : 1;
  const scale = (n) => {
    if (n == null) return null;
    if (model === "flat" || model === "none") return Math.round(n);
    if (model === "valuation" || model === "sliding") return Math.round(n);
    if (model === "per_sqft" || model === "per_square" || model === "per-sqft") return Math.round(n * qtyRatio);
    return Math.round(n);
  };
  return { low: scale(permit.feeLowUsd), typical: scale(permit.feeTypicalUsd), high: scale(permit.feeHighUsd) };
}

function buildEstimate(project, city, permit, quantity) {
  const meta = META[project.projectSlug];
  const qty = quantity ?? meta.defaultQuantity;
  const multiplier = project.cityAdjustments?.[city.slug]?.multiplier ?? 1;
  const jobLow = scaleBase(project.nationalLow, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const jobTypical = scaleBase(project.nationalTypical, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const jobHigh = scaleBase(project.nationalHigh, multiplier, qty, meta.defaultQuantity, meta.pricing, false);
  const scaled = scalePermit(permit, qty, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pLow = scaled.low ?? scaled.typical ?? 0;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  const pHigh = scaled.high ?? scaled.typical ?? 0;
  const common =
    typeof project.commonLow === "number" && typeof project.commonHigh === "number"
      ? { low: project.commonLow, high: project.commonHigh }
      : null;
  const bandJobLow = common
    ? scaleBase(common.low, multiplier, qty, meta.defaultQuantity, meta.pricing, false)
    : jobLow;
  const bandJobHigh = common
    ? scaleBase(common.high, multiplier, qty, meta.defaultQuantity, meta.pricing, false)
    : jobHigh;
  const addLow = permitKnown ? pLow : 0;
  const addHigh = permitKnown ? pHigh : 0;
  return {
    jobTypical,
    permitLow: scaled.low,
    permitTypical: scaled.typical,
    permitHigh: scaled.high,
    allInLow: jobLow + addLow,
    allInTypical: jobTypical + (permitKnown ? pTyp : 0),
    allInHigh: jobHigh + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
  };
}

function usd(n) {
  if (n == null || Number.isNaN(n)) return "";
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
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      blocks.push(null);
    }
  }
  return blocks;
}

function faqPages(html) {
  const found = [];
  for (const block of jsonLdBlocks(html)) {
    const items = Array.isArray(block) ? block : [block];
    for (const item of items) {
      if (item && item["@type"] === "FAQPage") found.push(item);
    }
  }
  return found;
}

function visibleFaqItems(html) {
  const items = [];
  const re = /<details\b[^>]*class="[^"]*faq-item[^"]*"[^>]*>\s*<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = re.exec(html))) {
    items.push({ question: stripTags(match[1]), answer: stripTags(match[2]) });
  }
  return items;
}

function ldFaqItems(page) {
  const entity = page?.mainEntity || [];
  return entity.map((item) => ({
    question: String(item.name || "").replace(/\s+/g, " ").trim(),
    answer: String(item.acceptedAnswer?.text || "").replace(/\s+/g, " ").trim(),
  }));
}

function dollarsIn(text) {
  return [...String(text || "").matchAll(DOLLAR_RE)].map((match) => match[0]);
}

function addMoney(set, n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return;
  const formatted = usd(n);
  const exact = moneyExact(n);
  if (formatted) set.add(formatted);
  if (exact) set.add(exact);
}

function addTextDollars(set, text) {
  for (const token of dollarsIn(text)) set.add(token);
}

const failures = [];
function fail(msg) {
  failures.push(msg);
}

const charlotte = cities.find((item) => item.slug === "charlotte-nc");
const roof = projects.find((item) => item.projectSlug === "roof-replacement");
const permit = permits.find((item) => item.citySlug === "charlotte-nc" && item.projectSlug === "roof-replacement");
if (!charlotte || !roof || !permit) fail("missing Charlotte roof city, project, or permit");
if (ROOF_TYPICAL !== META["roof-replacement"].defaultQuantity) {
  fail("roof typical squares " + ROOF_TYPICAL + " != calculator default");
}

const allowed = new Set();
if (roof && permit && charlotte) {
  addMoney(allowed, roof.nationalPerSqftLow);
  addMoney(allowed, roof.nationalPerSqftHigh);
  addMoney(allowed, roof.commonLow);
  addMoney(allowed, roof.commonHigh);
  addMoney(allowed, roof.nationalLow);
  addMoney(allowed, roof.nationalTypical);
  addMoney(allowed, roof.nationalHigh);
  addTextDollars(allowed, roof.scopeNote);
  addTextDollars(allowed, roof.unitNote);
  addTextDollars(allowed, roof.laborShareNote);
  for (const source of roof.sources || []) addTextDollars(allowed, source.what);
  addMoney(allowed, permit.feeLowUsd);
  addMoney(allowed, permit.feeTypicalUsd);
  addMoney(allowed, permit.feeHighUsd);
  addMoney(allowed, permit.typicalProjectValueUsd);
  if (permit.assumedValuationUsd) {
    addMoney(allowed, permit.assumedValuationUsd.low);
    addMoney(allowed, permit.assumedValuationUsd.typical);
    addMoney(allowed, permit.assumedValuationUsd.high);
  }
  addTextDollars(allowed, permit.caveat);
  addTextDollars(allowed, permit.calculationNote);
  addTextDollars(allowed, permit.sourceName);
  for (const extra of permit.extras || []) {
    addMoney(allowed, extra.feeUsd);
    addTextDollars(allowed, extra.name);
    addTextDollars(allowed, extra.note);
  }
  const est = buildEstimate(roof, charlotte, permit, ROOF_TYPICAL);
  addMoney(allowed, est.jobTypical);
  addMoney(allowed, est.permitLow);
  addMoney(allowed, est.permitTypical);
  addMoney(allowed, est.permitHigh);
  addMoney(allowed, est.allInLow);
  addMoney(allowed, est.allInTypical);
  addMoney(allowed, est.allInHigh);
  addMoney(allowed, est.bandLow);
  addMoney(allowed, est.bandHigh);
  if (ROOF_TYPICAL > 0) addMoney(allowed, Math.round(est.allInTypical / ROOF_TYPICAL));
}

const file = path.join(outDir, "cost/roof-replacement/charlotte-nc/index.html");
const html = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
if (!html) fail("missing cost/roof-replacement/charlotte-nc/index.html");

const pages = html ? faqPages(html) : [];
if (html && pages.length !== 1) fail("FAQPage count=" + pages.length + " (want 1)");
const visible = html ? visibleFaqItems(html) : [];
const ld = pages[0] ? ldFaqItems(pages[0]) : [];

function pair(question) {
  const vis = visible.filter((row) => row.question === question);
  const schema = ld.filter((row) => row.question === question);
  if (vis.length !== 1) fail("visible count " + vis.length + " for " + question);
  if (schema.length !== 1) fail("FAQPage count " + schema.length + " for " + question);
  if (vis[0] && schema[0] && vis[0].answer !== schema[0].answer) {
    fail("visible and FAQPage answers differ for " + question);
  }
  return vis[0] && schema[0] && vis[0].answer === schema[0].answer ? vis[0].answer : "";
}

const ageAnswer = html ? pair(AGE_Q) : "";
const metalAnswer = html ? pair(METAL_Q) : "";

function checkAnswer(label, answer, phrases) {
  if (!answer) return;
  if (DASH.test(answer)) fail(label + " has an em or en dash");
  if (answer.includes("25%")) fail(label + " mentions 25%");
  for (const phrase of phrases) {
    if (!answer.includes(phrase)) fail(label + " missing " + phrase);
  }
  const invented = dollarsIn(answer).filter((token) => !allowed.has(token));
  if (invented.length) fail(label + " invented dollar " + invented.join(", "));
}

checkAnswer(AGE_Q, ageAnswer, [
  "Age alone is not a replacement rule",
  "do not set a roof age limit",
  "inspection signs",
  "N.C.G.S. 160D-1110(c)(5)",
  "$40,000",
  "$0",
  "permit section",
  "Mecklenburg County Code Enforcement (LUESA)",
  "like-for-like single-family reroof",
]);
if (ageAnswer && (/\bIRC\b/.test(ageAnswer) || /\bTMC\b/.test(ageAnswer))) {
  fail("age FAQ uses Tacoma permit text");
}

checkAnswer(METAL_Q, metalAnswer, [
  "$4 to $11",
  "$5,800 to $20,000",
  "Metal is not separately priced",
  "$46,000",
  "steep or premium materials",
  "asphalt-shingle roof replacement",
  "not a published metal rate",
]);

for (const question of EXISTING_Q) {
  if (!visible.some((row) => row.question === question)) fail("missing existing question: " + question);
  if (!ld.some((row) => row.question === question)) fail("missing existing FAQPage question: " + question);
}

const roofDir = path.join(outDir, "cost/roof-replacement");
let otherCities = 0;
if (fs.existsSync(roofDir)) {
  for (const name of fs.readdirSync(roofDir)) {
    if (name === "charlotte-nc") continue;
    const other = path.join(roofDir, name, "index.html");
    if (!fs.existsSync(other)) continue;
    otherCities += 1;
    const text = fs.readFileSync(other, "utf8");
    if (text.includes(AGE_Q) || text.includes(METAL_Q)) fail(name + " has a new Charlotte FAQ question");
  }
}
if (otherCities !== 99) fail("other roof cities checked " + otherCities + " (want 99)");

if (failures.length) {
  console.error("charlotte-roof-faq-check: " + failures.length + " failure(s)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}

console.log(
  "charlotte-roof-faq-check: Charlotte roof age FAQ once, asphalt/metal FAQ once, 99 other roof cities clean",
);
