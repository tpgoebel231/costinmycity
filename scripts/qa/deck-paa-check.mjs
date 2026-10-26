/**
 * Deck size PAA FAQs on every /cost/deck/{city}/ page.
 * Math is a plain-JS mirror of lib/estimates.ts (same as scripts/qa/roof-paa-check.mjs,
 * scripts/qa/dal-clt-faq-check.mjs, scripts/qa/calc-check.mjs, and scripts/qa/number-check.mjs).
 *
 * Older FAQ answers on some cities already contain an en dash in a department
 * name. Those items are not rewritten. This script rejects an em dash in any
 * FAQ question or answer, and an en dash in the new 10x10 / 16x20 / 20x20 answers.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;
const deck = projects.find((item) => item.projectSlug === "deck");

const DECK_META = readDeckMeta();
const DECK_SIZES = [
  { label: "10x10", sqft: 100, typical: false },
  { label: "16x20", sqft: 320, typical: true },
  { label: "20x20", sqft: 400, typical: false },
];
const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);
const EM = /\u2014|&mdash;|&#8212;|&#x2014;/i;
const EN = /\u2013|&ndash;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readDeckMeta() {
  const src = fs.readFileSync(path.join(root, "lib/projects.ts"), "utf8");
  const start = src.indexOf('"deck": {');
  if (start < 0) throw new Error("missing deck meta");
  const from = src.slice(start);
  const block = from.slice(0, from.indexOf('"kitchen-remodel"'));
  const num = (name) => {
    const match = block.match(new RegExp("\\b" + name + ":\\s*(\\d+)"));
    if (!match) throw new Error("missing deck " + name);
    return Number(match[1]);
  };
  if (!/pricing:\s*"per-unit"/.test(block)) throw new Error("deck pricing is not per-unit");
  return {
    pricing: "per-unit",
    defaultQuantity: num("defaultQuantity"),
    min: num("quantityMin"),
    max: num("quantityMax"),
    step: num("quantityStep"),
  };
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
  const meta = DECK_META;
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
  if (typeof project.commonLow !== "number" || typeof project.commonHigh !== "number") return null;
  if (project.projectSlug === "roof-replacement") return "Premium or steep roofs can reach ";
  const note = project.scopeNote || "";
  if (/\bnew ductwork\b/i.test(note)) return "Jobs with new ductwork can reach ";
  return "Premium jobs can reach ";
}

function cityLabel(city) {
  return city.name + ", " + city.stateAbbr;
}

function deckBasisOk(project) {
  return (
    project.projectSlug === "deck" &&
    DECK_META.pricing === "per-unit" &&
    DECK_META.defaultQuantity === 320 &&
    DECK_META.step > 0
  );
}

function onStep(sqft) {
  return (
    Number.isInteger(sqft) &&
    sqft >= DECK_META.min &&
    sqft <= DECK_META.max &&
    DECK_META.step > 0 &&
    (sqft - DECK_META.min) % DECK_META.step === 0
  );
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

function sizeDecision(project, city, permit, sqft) {
  if (!deckBasisOk(project)) return { include: false, reason: "deck quantity basis does not match the calculator" };
  if (!onStep(sqft)) return { include: false, reason: sqft + " sq ft is off the calculator step" };
  const est = buildEstimate(project, city, permit, sqft);
  const copy = permitDecision(est, permit);
  if (!copy) {
    return {
      include: false,
      reason: "permit fee at " + sqft + " sq ft does not round to allInTypical minus job cost",
    };
  }
  return { include: true, reason: "", branch: copy.branch, fee: copy.fee, est, sqft };
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

function checkSizeAnswer(label, row, decision, size) {
  const answer = row.answer;
  const est = decision.est;
  requirePhrase(label, answer, "A " + size.label + " deck is " + numberFmt(size.sqft) + " sq ft of walking surface");
  requirePhrase(label, answer, "typical all-in cost at that size is " + usd(est.allInTypical));
  if (Number.isFinite(est.bandLow) && Number.isFinite(est.bandHigh)) {
    requirePhrase(label, answer, "most projects run " + usd(est.bandLow) + " to " + usd(est.bandHigh));
  }
  const prefix = highBandReachPrefix(deck);
  if (prefix) {
    requirePhrase(label, answer, prefix + usd(est.allInHigh));
  }
  if (size.typical && size.sqft === DECK_META.defaultQuantity) {
    requirePhrase(label, answer, "typical size the calculator on this page starts at");
  } else if (answer.includes("typical size the calculator on this page starts at")) {
    fail(label + " claims to be the calculator starting size");
  }
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

if (!deck) fail("missing deck project");
if (DECK_META.defaultQuantity !== 320) fail("deck default quantity drifted");
if (DECK_META.step !== 10) fail("deck quantityStep drifted");
if (onStep(144)) fail("12x12=144 should be off the step of 10");
if (onStep(256)) fail("16x16=256 should be off the step of 10");
for (const size of DECK_SIZES) {
  if (!onStep(size.sqft)) fail(size.label + "=" + size.sqft + " should be on the quantity step");
}

const deckDir = path.join(outDir, "cost/deck");
const outSlugs = fs.existsSync(deckDir)
  ? fs
      .readdirSync(deckDir)
      .filter((name) => fs.existsSync(path.join(deckDir, name, "index.html")) && fs.statSync(path.join(deckDir, name)).isDirectory())
      .sort()
  : [];
const dataSlugs = cities.map((city) => city.slug).sort();
if (outSlugs.length !== 100 || dataSlugs.length !== 100 || outSlugs.join("\n") !== dataSlugs.join("\n")) {
  fail("deck pages are not exactly the 100 data cities (out " + outSlugs.length + ", data " + dataSlugs.length + ")");
}

let itemCount = 0;

for (const city of cities) {
  const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === "deck") || null;
  const file = path.join(deckDir, city.slug, "index.html");
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
  if (visible.length > ld.length) fail(label + " visible FAQ count " + visible.length + " exceeds FAQPage " + ld.length);
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

  const howMuchQuestion = "How much does deck cost in " + cityLabel(city) + "?";
  const howMuchAt = visible.findIndex((row) => row.question === howMuchQuestion);
  if (howMuchAt < 0) fail(label + " missing How much does deck cost item");

  const sizeDecisions = DECK_SIZES.map((size) => ({
    ...size,
    question: "How much does a " + size.label + " deck cost in " + city.name + "?",
    decision: sizeDecision(deck, city, permit, size.sqft),
  }));

  let slot = howMuchAt + 1;
  for (const item of sizeDecisions) {
    const at = visible.findIndex((row) => row.question === item.question);
    const ldAt = ld.findIndex((row) => row.question === item.question);
    if (!item.decision.include) {
      if (at === slot) {
        fail(label + " " + item.label + " present at insert slot but should be omitted (" + item.decision.reason + ")");
      }
      continue;
    }
    if (at < 0) {
      fail(label + " missing " + item.label + " question (" + item.decision.branch + ")");
      continue;
    }
    if (at === slot) {
      if (ldAt !== at) fail(label + " " + item.label + " FAQPage index " + ldAt + " != visible " + at);
      checkSizeAnswer(label + " " + item.label, visible[at], item.decision, item);
      itemCount++;
      slot++;
    } else {
      // Already on the page (Fort Worth 20x20). Skip the insert slot; do not rewrite.
      itemCount++;
    }
  }
}

const leaked = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith(".html")) {
      const rel = path.relative(outDir, full).split(path.sep).join("/");
      if (rel.startsWith("cost/deck/")) continue;
      const html = fs.readFileSync(full, "utf8");
      if (
        html.includes("How much does a 10x10 deck cost in") ||
        html.includes("How much does a 16x20 deck cost in") ||
        html.includes("How much does a 20x20 deck cost in")
      ) {
        leaked.push(rel);
      }
    }
  }
}
walk(path.join(outDir, "cost"));
if (leaked.length) fail("new deck PAA questions leaked onto non-deck pages: " + leaked.slice(0, 8).join(", "));

if (failures.length) {
  console.error("deck-paa-check: " + failures.length + " failure(s)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}

console.log("deck-paa-check: 100 deck pages OK, " + itemCount + " items");
