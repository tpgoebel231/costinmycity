/**
 * HVAC size PAA FAQs on every /cost/hvac-replacement/{city}/ page.
 * Math is a plain-JS mirror of lib/estimates.ts (same as scripts/qa/kitchen-paa-check.mjs).
 *
 * Older FAQ answers on some cities already contain an en dash. Those items are
 * not rewritten. This script rejects an em dash in any FAQ question or answer,
 * and an em or en dash in the new 3-ton / 2-system / 3-system answers.
 *
 * Sizes are read from lib/typical-specs.ts, lib/cost-by-size.ts, and
 * lib/projects.ts. They must be 1, 2, and 3 systems, with 1 the calculator
 * default and the typical spec a 3-ton job.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;
const hvac = projects.find((item) => item.projectSlug === "hvac-replacement");

const HVAC_META = readHvacMeta();
const HVAC_SPEC = readHvacSpec();
const HVAC_BANDS = readHvacBands();
const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);
const TON_SPEC = "3-ton (36,000 BTU) like-for-like split system";
const EM = /\u2014|&mdash;|&#8212;|&#x2014;/i;
const EN = /\u2013|&ndash;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
const THREE_TON = /\b3[-\s]?ton\b|(?:^|[^0-9])36,000\s*BTU/i;
const SYSTEM_LIST =
  /((?:\d{1,3}(?:,\d{3})+|\d+)(?:\s*,\s*(?:or\s+)?(?:\d{1,3}(?:,\d{3})+|\d+))*(?:\s+or\s+(?:\d{1,3}(?:,\d{3})+|\d+))?)\s*-?\s*(?:hvac\s+)?systems?\b/gi;
const SYSTEM_NUMBER = /\d{1,3}(?:,\d{3})+|\d+/g;

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readHvacMeta() {
  const src = fs.readFileSync(path.join(root, "lib/projects.ts"), "utf8");
  const start = src.indexOf('"hvac-replacement": {');
  if (start < 0) throw new Error("missing hvac meta");
  const from = src.slice(start);
  const end = from.indexOf("\n  },");
  const block = end >= 0 ? from.slice(0, end) : from;
  const num = (name) => {
    const match = block.match(new RegExp("\\b" + name + ":\\s*(\\d+)"));
    if (!match) throw new Error("missing hvac " + name);
    return Number(match[1]);
  };
  const text = (name) => {
    const match = block.match(new RegExp("\\b" + name + ":\\s*\"([^\"]*)\""));
    if (!match) throw new Error("missing hvac " + name);
    return match[1];
  };
  if (!/pricing:\s*"job"/.test(block)) throw new Error("hvac pricing is not job");
  return {
    pricing: "job",
    quantityLabel: text("quantityLabel"),
    quantityHint: text("quantityHint"),
    blurb: text("blurb"),
    defaultQuantity: num("defaultQuantity"),
    min: num("quantityMin"),
    max: num("quantityMax"),
    step: num("quantityStep"),
  };
}

function readHvacSpec() {
  const specSrc = fs.readFileSync(path.join(root, "lib/typical-specs.ts"), "utf8");
  const start = specSrc.indexOf('"hvac-replacement": {');
  if (start < 0) throw new Error("missing hvac typical-job spec");
  const block = specSrc.slice(start, specSrc.indexOf("},", start));
  const typical = block.match(/typical:\s*"([^"]+)"/);
  if (!typical) throw new Error("missing hvac typical spec");
  return typical[1];
}

function readHvacBands() {
  const bandSrc = fs.readFileSync(path.join(root, "lib/cost-by-size.ts"), "utf8");
  const match = bandSrc.match(/"hvac-replacement": \[([\s\S]*?)\]/);
  if (!match) throw new Error("missing hvac SIZE_BANDS");
  const rows = [...match[1].matchAll(/\{\s*qty:\s*(\d+),\s*band:\s*"(low|typical|high)"\s*\}/g)].map((row) => ({
    qty: Number(row[1]),
    band: row[2],
  }));
  if (!rows.length) throw new Error("hvac SIZE_BANDS did not parse");
  return rows;
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
  const meta = HVAC_META;
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
    typeof project.commonLow === "number" &&
    Number.isFinite(project.commonLow) &&
    typeof project.commonHigh === "number" &&
    Number.isFinite(project.commonHigh)
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
    jobLow,
    jobTypical,
    jobHigh,
    permitLow: scaled.low,
    permitTypical: scaled.typical,
    permitHigh: scaled.high,
    allInLow: jobLow + addLow,
    allInTypical: jobTypical + (permitKnown ? pTyp : 0),
    allInHigh: jobHigh + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
    permit,
  };
}

function permitDisplayUsd(est) {
  const t = est.permitTypical;
  const recorded = est.permit?.feeTypicalUsd;
  if (t != null && typeof recorded === "number" && Math.round(recorded) === t) return recorded;
  return t;
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

function numberFmt(n) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(n);
}

function highBandReachPrefix(project) {
  if (typeof project.commonLow !== "number" || !Number.isFinite(project.commonLow)) return null;
  if (typeof project.commonHigh !== "number" || !Number.isFinite(project.commonHigh)) return null;
  if (project.projectSlug === "roof-replacement") return "Premium or steep roofs can reach ";
  const note = project.scopeNote || "";
  if (/\bnew ductwork\b/i.test(note)) return "Jobs with new ductwork can reach ";
  return "Premium jobs can reach ";
}

function cityLabel(city) {
  return city.name + ", " + city.stateAbbr;
}

function onStep(qty) {
  return (
    Number.isInteger(qty) &&
    qty >= HVAC_META.min &&
    qty <= HVAC_META.max &&
    HVAC_META.step > 0 &&
    (qty - HVAC_META.min) % HVAC_META.step === 0
  );
}

function basisOk() {
  if (!hvac || hvac.projectSlug !== "hvac-replacement") return false;
  if (HVAC_META.pricing !== "job" || HVAC_META.quantityLabel !== "Systems") return false;
  if (HVAC_META.defaultQuantity !== 1 || HVAC_META.step !== 1) return false;
  if (HVAC_META.min !== 1 || HVAC_META.max !== 4) return false;
  if (HVAC_SPEC !== TON_SPEC || !/3-ton/i.test(HVAC_SPEC)) return false;
  if (!/existing ducts/i.test(HVAC_META.blurb)) return false;
  const hint = HVAC_META.quantityHint || "";
  if (!/one system/i.test(hint) || !/second zone/i.test(hint) || !/separately/i.test(hint)) return false;
  const expected = [
    { qty: 1, band: "typical" },
    { qty: 2, band: "high" },
    { qty: 3, band: "high" },
  ];
  if (HVAC_BANDS.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    const row = HVAC_BANDS[i];
    if (!row || row.qty !== expected[i].qty || row.band !== expected[i].band) return false;
    if (!onStep(row.qty)) return false;
  }
  if (HVAC_BANDS[0].qty !== HVAC_META.defaultQuantity) return false;
  return true;
}

function permitDecision(est, permit) {
  const added = est.allInTypical - est.jobTypical;
  const display = permitDisplayUsd(est);
  const feeTypical = permit ? permit.feeTypicalUsd : null;
  if (!permit || feeTypical == null) {
    if (added !== 0) return null;
    return { branch: "missing", fee: null, added };
  }
  if (feeTypical === 0 || (permit.permitRequired === false && added === 0)) {
    if (added !== 0) return null;
    if (feeTypical === 0 && (display == null || Math.round(display) !== added)) return null;
    return { branch: "zero", fee: display, added };
  }
  if (display == null || Math.round(display) !== added) return null;
  const model = permit.feeModel;
  if (model === "flat") return { branch: "flat", fee: display, added };
  if (SCALED_FEE_MODELS.has(model)) return { branch: "scaled", fee: display, added };
  return { branch: "valuation", fee: display, added };
}

function sizeDecision(project, city, permit, qty) {
  if (!basisOk()) return { include: false, reason: "hvac size basis does not match the recorded specs" };
  if (!onStep(qty)) return { include: false, reason: qty + " systems is off the calculator step" };
  const est = buildEstimate(project, city, permit, qty);
  if (!Number.isFinite(est.bandLow) || !Number.isFinite(est.bandHigh) || !Number.isFinite(est.allInTypical)) {
    return { include: false, reason: "band at " + qty + " systems is not a finite dollar" };
  }
  const copy = permitDecision(est, permit);
  if (!copy) {
    return {
      include: false,
      reason: "permit fee at " + qty + " systems does not round to allInTypical minus job cost",
    };
  }
  return { include: true, reason: "", branch: copy.branch, fee: copy.fee, est, qty };
}

function mentionsThreeTon(question) {
  return THREE_TON.test(question);
}

function systemsNamed(question) {
  if (!/\bhvac\b/i.test(question)) return [];
  const found = [];
  const re = new RegExp(SYSTEM_LIST.source, "gi");
  let match;
  while ((match = re.exec(question))) {
    const parts = match[1].match(SYSTEM_NUMBER) || [];
    for (const part of parts) {
      const n = Number(part.replace(/,/g, ""));
      if (Number.isInteger(n)) found.push(n);
    }
  }
  return found;
}

function coversSystems(question, qty) {
  return systemsNamed(question).includes(qty);
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

function visibleText(html) {
  let visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  visible = visible.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  return stripTags(visible);
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

function addNumbers(set, est) {
  const values = [
    est.jobLow,
    est.jobTypical,
    est.jobHigh,
    est.allInLow,
    est.allInTypical,
    est.allInHigh,
    est.bandLow,
    est.bandHigh,
    est.permitLow,
    est.permitTypical,
    est.permitHigh,
    permitDisplayUsd(est),
    est.allInTypical - est.jobTypical,
  ];
  for (const n of values) {
    if (typeof n === "number" && Number.isFinite(n)) set.add(usd(n));
  }
}

function dollarsOf(text) {
  return text.match(DOLLAR) || [];
}

function requirePhrase(label, answer, phrase) {
  if (!answer.includes(phrase)) fail(label + " missing phrase: " + phrase);
}

function assertPrintedFee(label, answer, decision) {
  const added = decision.est.allInTypical - decision.est.jobTypical;
  const display = permitDisplayUsd(decision.est);
  if (decision.branch === "missing") {
    if (added !== 0) fail(label + " missing fee but " + added + " was added to the total");
    return;
  }
  if (decision.branch === "zero") {
    if (added !== 0) fail(label + " zero/exempt branch but " + added + " was added to the total");
    return;
  }
  if (decision.fee !== display) {
    fail(label + " printed fee " + decision.fee + " is not the recorded/scaled fee " + display);
  }
  if (display == null || Math.round(display) !== added) {
    fail(label + " rounded permit fee " + display + " is not the " + added + " added to the total");
  }
  if (display != null && !answer.includes(usd(display))) {
    fail(label + " does not print the recorded/scaled fee " + usd(display));
  }
}

function checkDollars(label, text, allowed) {
  for (const token of dollarsOf(text)) {
    if (!allowed.has(token)) fail(label + " dollar " + token + " is not a recomputed value");
  }
}

function isTemplateAnswer(answer) {
  return (
    answer.includes("The typical HVAC job on this page is a 3-ton") ||
    /systems usually means (two|three) zones, and each system is counted separately/.test(answer)
  );
}

function checkSizeAnswer(label, row, decision, size, heroTypical) {
  const answer = row.answer;
  const est = decision.est;
  if (size.kind === "ton") {
    requirePhrase(
      label,
      answer,
      "The typical HVAC job on this page is a 3-ton (36,000 BTU) like-for-like split system on existing ducts.",
    );
    requirePhrase(label, answer, "the typical all-in cost is " + usd(est.allInTypical));
    if (/usually means (two|three) zones/.test(answer)) fail(label + " uses the multi-system lead");
    if (heroTypical != null && est.allInTypical !== heroTypical) {
      fail(label + " typical " + est.allInTypical + " != hero " + heroTypical);
    }
    const prefix = highBandReachPrefix(hvac);
    if (prefix) requirePhrase(label, answer, prefix + usd(est.allInHigh));
    else if (/can reach/.test(answer)) fail(label + " adds a broad-high sentence without a recorded prefix");
  } else {
    const word = size.qty === 2 ? "Two" : size.qty === 3 ? "Three" : "";
    requirePhrase(label, answer, word + " systems usually means " + word.toLowerCase() + " zones, and each system is counted separately.");
    requirePhrase(
      label,
      answer,
      "replacing " +
        numberFmt(size.qty) +
        " systems runs about " +
        usd(est.allInTypical) +
        " all in, with most projects at " +
        usd(est.bandLow) +
        " to " +
        usd(est.bandHigh),
    );
    if (answer.includes("The typical HVAC job on this page is")) fail(label + " uses the 3-ton lead");
    if (/can reach/.test(answer)) fail(label + " adds a broad-high sentence on a system-count answer");
  }
  if (Number.isFinite(est.bandLow) && Number.isFinite(est.bandHigh) && size.kind === "ton") {
    requirePhrase(label, answer, "most projects run " + usd(est.bandLow) + " to " + usd(est.bandHigh));
  }
  requirePhrase(label, answer, "In " + cityLabel(size.city));
  assertPrintedFee(label, answer, decision);
  if (decision.branch === "zero") {
    requirePhrase(label, answer, "There is usually no city permit fee on the typical path, so that is the job cost.");
  } else if (decision.branch === "flat") {
    requirePhrase(label, answer, "That figure includes the " + usd(decision.fee) + " typical permit fee.");
  } else if (decision.branch === "scaled") {
    requirePhrase(label, answer, "That figure includes the " + usd(decision.fee) + " permit fee at this size.");
  } else if (decision.branch === "valuation") {
    requirePhrase(label, answer, "That figure includes the " + usd(decision.fee) + " typical permit fee.");
    requirePhrase(label, answer, "listed for the typical job");
    requirePhrase(label, answer, "we do not compute here");
  } else if (decision.branch === "missing") {
    requirePhrase(label, answer, "No permit fee is included because the fee is not listed.");
  }
  const allowed = new Set();
  addNumbers(allowed, est);
  checkDollars(label, row.question + " " + answer, allowed);
  if (EN.test(row.question + " " + answer) || EM.test(row.question + " " + answer)) {
    fail(label + " has an em or en dash");
  }
}

function expectSystems(question, expected, label) {
  const got = systemsNamed(question);
  if (got.join(",") !== expected.join(",")) fail(label + " coverage regex -> " + got.join(","));
}

function expectTon(question, expected, label) {
  if (mentionsThreeTon(question) !== expected) fail(label + " ton regex -> " + mentionsThreeTon(question));
}

if (!hvac) fail("missing hvac project");
if (!basisOk()) fail("hvac sizes did not resolve to 1, 2, 3 systems on the calculator step with a 3-ton typical");
if (HVAC_META.defaultQuantity !== 1) fail("hvac default quantity drifted");
if (HVAC_META.step !== 1) fail("hvac quantityStep drifted");
expectSystems("How much does HVAC replacement cost for 1, 2, or 3 systems in Seattle?", [1, 2, 3], "seattle");
expectSystems("How much does HVAC replacement cost for 1 or 2 systems in Tacoma?", [1, 2], "tacoma");
expectSystems("How much does HVAC replacement cost for 1 or 2 systems in St. Louis?", [1, 2], "st-louis");
expectSystems("How much does HVAC replacement cost per system in Austin?", [], "per-system");
expectSystems("What does a 1-system versus a 2-system HVAC change-out permit cost in Austin?", [1, 2], "austin-hyphen");
expectSystems("How much does an AC-only replacement cost versus a full HVAC system in San Diego?", [], "full-system");
expectSystems("Does a bigger HVAC system or a pricier job cost more to permit in Fort Lauderdale?", [], "bigger");
expectSystems("How much does it cost to replace 2 HVAC systems in Chicago?", [2], "template-2");
expectSystems("How much does it cost to replace 3 HVAC systems in Chicago?", [3], "template-3");
expectSystems("How much does a new roof cost on a 2,200 sq ft home in Denver?", [], "roof");
expectTon("How much does a 3-ton HVAC replacement cost in Phoenix?", true, "3-ton");
expectTon("How much does a 3 ton HVAC replacement cost in Phoenix?", true, "3 ton");
expectTon("What is a 36,000 BTU replacement in Phoenix?", true, "btu");
expectTon("How much does a 2-ton HVAC replacement cost in Phoenix?", false, "2-ton");
expectTon("How much does a 5-ton HVAC replacement cost in Phoenix?", false, "5-ton");
expectTon("How much does HVAC replacement cost per system in Austin?", false, "per-system-ton");
expectSystems("How much does a 3-ton HVAC replacement cost in Phoenix?", [], "3-ton-not-a-count");

const hvacDir = path.join(outDir, "cost/hvac-replacement");
const outSlugs = fs.existsSync(hvacDir)
  ? fs
      .readdirSync(hvacDir)
      .filter((name) => fs.existsSync(path.join(hvacDir, name, "index.html")) && fs.statSync(path.join(hvacDir, name)).isDirectory())
      .sort()
  : [];
const dataSlugs = cities.map((city) => city.slug).sort();
if (outSlugs.length !== dataSlugs.length || outSlugs.join("\n") !== dataSlugs.join("\n")) {
  fail("hvac pages are not exactly the HVAC cities in data (out " + outSlugs.length + ", data " + dataSlugs.length + ")");
}

let itemCount = 0;
const sizeRows = [
  { qty: 1, kind: "ton", key: "3-ton" },
  { qty: 2, kind: "count", key: "2" },
  { qty: 3, kind: "count", key: "3" },
];
const summary = { pages: [], omissions: [], items: [] };

for (const city of cities) {
  const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === "hvac-replacement") || null;
  const file = path.join(hvacDir, city.slug, "index.html");
  if (!fs.existsSync(file)) {
    fail(city.slug + " missing html");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const label = city.slug;
  const pages = faqPages(html);
  if (pages.length !== 1) fail(label + " FAQPage count=" + pages.length + " (want 1)");
  const visible = visibleFaqItems(html);
  const ld = pages[0] ? ldFaqItems(pages[0]) : [];
  const seen = new Set();
  for (const item of ld) {
    if (seen.has(item.question)) fail(label + " duplicate question: " + item.question);
    seen.add(item.question);
    if (EM.test(item.question) || EM.test(item.answer)) fail(label + " em dash in FAQ: " + item.question);
  }
  if (visible.length > ld.length) {
    fail(label + " visible FAQ count " + visible.length + " exceeds FAQPage " + ld.length);
  }
  for (let i = 0; i < visible.length; i++) {
    const want = ld[i];
    if (!want || visible[i].question !== want.question || visible[i].answer !== want.answer) {
      fail(label + " visible FAQ [" + i + "] does not equal FAQPage text: " + (visible[i] && visible[i].question));
    }
  }
  const pageText = visibleText(html);
  for (const item of ld) {
    if (!pageText.includes(item.question) || !pageText.includes(item.answer)) {
      fail(label + " FAQPage text is not visible: " + item.question);
    }
  }

  const heroMatch = html.match(/data-hero-typical="(\d+)"/);
  const heroTypical = heroMatch ? Number(heroMatch[1]) : null;
  const atTypical = hvac ? buildEstimate(hvac, city, permit, 1) : null;
  if (!atTypical || heroTypical == null || heroTypical !== atTypical.allInTypical) {
    fail(label + " hero typical " + heroTypical + " != 3-ton all-in " + (atTypical && atTypical.allInTypical));
  }

  const howMuchQuestion = "How much does HVAC replacement cost in " + cityLabel(city) + "?";
  const howMuchAt = visible.findIndex((row) => row.question === howMuchQuestion);
  if (howMuchAt < 0) fail(label + " missing How much does HVAC replacement cost item");

  const sizeDecisions = sizeRows.map((size) => ({
    ...size,
    city,
    question:
      size.kind === "ton"
        ? "How much does a 3-ton HVAC replacement cost in " + city.name + "?"
        : "How much does it cost to replace " + numberFmt(size.qty) + " HVAC systems in " + city.name + "?",
    decision: sizeDecision(hvac, city, permit, size.qty),
  }));

  const pageSummary = { slug: city.slug, name: city.name, feeModel: permit ? permit.feeModel : null, items: [] };
  let slot = howMuchAt + 1;
  for (const item of sizeDecisions) {
    const at = visible.findIndex((row) => row.question === item.question);
    const ldAt = ld.findIndex((row) => row.question === item.question);
    const coveredByOther = visible.some((row) => {
      if (row.question === item.question) return false;
      if (item.kind === "ton") return mentionsThreeTon(row.question);
      return coversSystems(row.question, item.qty);
    });
    if (!item.decision.include) {
      summary.omissions.push({ slug: city.slug, item: item.key, reason: item.decision.reason });
      if (at >= 0 && isTemplateAnswer(visible[at].answer)) {
        fail(label + " " + item.key + " template answer present but should be omitted (" + item.decision.reason + ")");
      }
      continue;
    }
    if (coveredByOther) {
      const cover = visible.find((row) => {
        if (row.question === item.question) return false;
        if (item.kind === "ton") return mentionsThreeTon(row.question);
        return coversSystems(row.question, item.qty);
      });
      summary.omissions.push({
        slug: city.slug,
        item: item.key,
        reason: "covered by existing question: " + (cover ? cover.question : ""),
      });
      if (at >= 0) fail(label + " " + item.key + " added even though another HVAC question covers it");
      continue;
    }
    if (at >= 0 && at !== slot) {
      if (isTemplateAnswer(visible[at].answer)) {
        fail(label + " " + item.key + " template answer is not directly after the how-much item (at " + at + ", want " + slot + ")");
      } else {
        summary.omissions.push({
          slug: city.slug,
          item: item.key,
          reason: "existing question already on the page: " + item.question,
        });
      }
      continue;
    }
    if (at < 0) {
      fail(label + " missing " + item.key + " question (" + item.decision.branch + ")");
      continue;
    }
    if (ldAt !== at) fail(label + " " + item.key + " FAQPage index " + ldAt + " != visible " + at);
    checkSizeAnswer(label + " " + item.key, visible[at], item.decision, item, heroTypical);
    itemCount++;
    slot++;
    const rendered = {
      slug: city.slug,
      item: item.key,
      qty: item.qty,
      branch: item.decision.branch,
      feeModel: permit ? permit.feeModel : null,
      fee: item.decision.fee,
      question: visible[at].question,
      answer: visible[at].answer,
    };
    summary.items.push(rendered);
    pageSummary.items.push(rendered);
  }
  summary.pages.push(pageSummary);
}

const leaked = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".html")) {
      const rel = path.relative(outDir, full).split(path.sep).join("/");
      if (rel.startsWith("cost/hvac-replacement/")) continue;
      const html = fs.readFileSync(full, "utf8");
      if (
        html.includes("The typical HVAC job on this page is a 3-ton") ||
        html.includes("How much does it cost to replace 2 HVAC systems in") ||
        html.includes("How much does it cost to replace 3 HVAC systems in") ||
        /systems usually means (two|three) zones, and each system is counted separately/.test(html)
      ) {
        leaked.push(rel);
      }
    }
  }
}
walk(outDir);
if (leaked.length) fail("new HVAC PAA questions leaked onto non-HVAC pages: " + leaked.slice(0, 8).join(", "));

try {
  fs.writeFileSync("/tmp/hvac-paa-summary.json", JSON.stringify(summary));
} catch {
  /* summary is for the report; the check result does not depend on it */
}

if (failures.length) {
  console.error("hvac-paa-check: " + failures.length + " failure(s)");
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  if (failures.length > 40) console.error("  ... " + (failures.length - 40) + " more");
  process.exit(1);
}

console.log("hvac-paa-check: " + outSlugs.length + " HVAC pages OK, " + itemCount + " items");
