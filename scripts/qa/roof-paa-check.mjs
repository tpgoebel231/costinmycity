/**
 * Roof PAA FAQs on every /cost/roof-replacement/{city}/ page.
 * Math is a plain-JS mirror of lib/estimates.ts (same as scripts/qa/dal-clt-faq-check.mjs,
 * scripts/qa/calc-check.mjs, and scripts/qa/number-check.mjs).
 *
 * Older FAQ answers on some cities already contain an en dash in a department
 * name. Those items are not rewritten. This script rejects an em dash in any
 * FAQ question or answer, and an en dash in the new 2,200 / 2,800 / $50,000 answers.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;
const roof = projects.find((item) => item.projectSlug === "roof-replacement");

const SQFT_PER_ROOF_SQUARE = readConst("lib/roof-size.ts", "SQFT_PER_ROOF_SQUARE");
const ROOF_TYPICAL = readConst("lib/roof-size.ts", "typical");
const ROOF_META = readRoofMeta();
const HOME_SQFT = [2200, 2800];
const FIFTY_THOUSAND = 50000;
const FORTY_THOUSAND = 40000;
const STEEP_REACH = "Premium or steep roofs can reach ";
const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);
const VALUATION_FEE_MODELS = new Set(["valuation", "sliding", "tiered", "area", "unknown"]);
const EM = /\u2014|&mdash;|&#8212;|&#x2014;/i;
const EN = /\u2013|&ndash;|&#8211;|&#x2013;/i;
const DOLLAR = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function readConst(rel, name) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const match = src.match(new RegExp("\\b" + name + "\\s*[:=]\\s*(\\d+)"));
  if (!match) throw new Error("missing " + name + " in " + rel);
  return Number(match[1]);
}

function readRoofMeta() {
  const src = fs.readFileSync(path.join(root, "lib/projects.ts"), "utf8");
  const start = src.indexOf('"roof-replacement"');
  const from = src.slice(start);
  const block = from.slice(0, from.indexOf('"hvac-replacement"'));
  const num = (name) => {
    const match = block.match(new RegExp("\\b" + name + ":\\s*(\\d+)"));
    if (!match) throw new Error("missing roof " + name);
    return Number(match[1]);
  };
  if (!/pricing:\s*"job"/.test(block)) throw new Error("roof pricing is not job");
  if (!/defaultQuantity:\s*ROOF_SQUARES\.typical/.test(block)) {
    throw new Error("roof defaultQuantity is not ROOF_SQUARES.typical");
  }
  return { pricing: "job", defaultQuantity: readConst("lib/roof-size.ts", "typical"), min: num("quantityMin"), max: num("quantityMax"), step: num("quantityStep") };
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
  const meta = ROOF_META;
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

function charlotteRoofStatuteExempt(permit) {
  if (!permit || permit.feeTypicalUsd !== 0) return false;
  const blob = (permit.caveat || "") + " " + (permit.calculationNote || "");
  return (
    /160D-1110\(c\)\(5\)/.test(blob) &&
    /\$40,000/.test(blob) &&
    /like-for-like/i.test(blob) &&
    /OSFM/i.test(blob) &&
    /15%/.test(blob) &&
    /10\/19\/2023/.test(blob) &&
    /Alternate LUESA Section II\.A/.test(permit.calculationNote || "")
  );
}

function roofBasisOk(project) {
  return (
    project.projectSlug === "roof-replacement" &&
    ROOF_META.pricing === "job" &&
    ROOF_META.defaultQuantity === ROOF_TYPICAL &&
    ROOF_META.step > 0
  );
}

function onStep(squares) {
  return (
    Number.isInteger(squares) &&
    squares >= ROOF_META.min &&
    squares <= ROOF_META.max &&
    ROOF_META.step > 0 &&
    (squares - ROOF_META.min) % ROOF_META.step === 0
  );
}

function permitDecision(est, permit) {
  const added = est.allInTypical - est.jobTypical;
  // Recorded fee with cents when that rounds to the added dollar, otherwise the scaled fee.
  const display = permitDisplayUsd(est);
  const feeTypical = permit ? permit.feeTypicalUsd : null;
  if (!permit || feeTypical == null) {
    if (added !== 0) return null;
    return { branch: "missing", fee: null, added };
  }
  if (feeTypical === 0) {
    if (display == null || Math.round(display) !== added) return null;
    return { branch: "zero", fee: display, added };
  }
  // Printed fee is the recorded or scaled fee. Its rounded value is what the total adds.
  if (display == null || Math.round(display) !== added) return null;
  const model = permit.feeModel;
  if (model === "flat") return { branch: "flat", fee: display, added };
  if (SCALED_FEE_MODELS.has(model)) return { branch: "scaled", fee: display, added };
  if (VALUATION_FEE_MODELS.has(model)) return { branch: "valuation", fee: display, added };
  return null;
}

function budgetBranch(est) {
  const above =
    FIFTY_THOUSAND > est.allInHigh &&
    FIFTY_THOUSAND > est.bandHigh &&
    FIFTY_THOUSAND > est.bandLow &&
    FIFTY_THOUSAND > est.allInTypical;
  if (above) return "above";
  if (est.bandHigh < FIFTY_THOUSAND && FIFTY_THOUSAND <= est.allInHigh) return "middle";
  if (FIFTY_THOUSAND <= est.bandHigh) return "inside";
  return null;
}

function sizeDecision(project, city, permit, sqft) {
  if (!roofBasisOk(project)) return { include: false, reason: "roof quantity basis does not match the calculator" };
  const squares = sqft / SQFT_PER_ROOF_SQUARE;
  if (!onStep(squares)) return { include: false, reason: squares + " squares is off the calculator step" };
  const est = buildEstimate(project, city, permit, squares);
  const copy = permitDecision(est, permit);
  if (!copy) {
    return {
      include: false,
      reason: "permit fee at " + squares + " squares does not round to allInTypical minus job cost",
    };
  }
  return { include: true, reason: "", branch: copy.branch, fee: copy.fee, est, squares };
}

function crossSquares(project, city, permit) {
  const at = (qty) => buildEstimate(project, city, permit, qty);
  for (let qty = ROOF_META.min; qty <= ROOF_META.max; qty += ROOF_META.step) {
    if (at(qty).allInTypical >= FIFTY_THOUSAND) return qty;
  }
  return null;
}

function fiftyDecision(project, city, permit) {
  if (!roofBasisOk(project)) return { include: false, reason: "roof quantity basis does not match the calculator" };
  const est = buildEstimate(project, city, permit, ROOF_META.defaultQuantity);
  const copy = permitDecision(est, permit);
  if (!copy) return { include: false, reason: "typical permit fee does not round to allInTypical minus job cost" };
  const branch = budgetBranch(est);
  if (!branch) return { include: false, reason: "$50,000 does not fall in an above, middle, or inside band" };
  const steep = highBandReachPrefix(project) === STEEP_REACH;
  if ((branch === "above" || branch === "middle") && !steep) {
    return { include: false, reason: "no premium or steep reach wording for this project" };
  }
  const permitBranch = charlotteRoofStatuteExempt(permit) ? "charlotte-exempt" : copy.branch;
  return {
    include: true,
    reason: "",
    branch,
    permitBranch,
    fee: copy.fee,
    est,
    cross: crossSquares(project, city, permit),
  };
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

function assertPrintedFee(label, answer, decision, feePrinted) {
  const added = decision.est.allInTypical - decision.est.jobTypical;
  const display = permitDisplayUsd(decision.est);
  const permitBranch = decision.permitBranch || decision.branch;
  if (permitBranch === "missing") {
    if (added !== 0) fail(label + " missing fee but " + added + " was added to the total");
    return;
  }
  if (decision.fee !== display) {
    fail(label + " printed fee " + decision.fee + " is not the recorded/scaled fee " + display);
  }
  if (display == null || Math.round(display) !== added) {
    fail(label + " rounded permit fee " + display + " is not the " + added + " added to the total");
  }
  // Charlotte's $50,000 answer keeps the exemption sentence and does not print the $0 fee.
  if (feePrinted === false) return;
  if (display != null && !answer.includes(usd(display))) {
    fail(label + " does not print the recorded/scaled fee " + usd(display));
  }
}

function checkDollars(label, text, allowed) {
  for (const token of dollarsOf(text)) {
    if (!allowed.has(token)) fail(label + " dollar " + token + " is not a recomputed value or a question-named amount");
  }
}

function checkSizeAnswer(label, row, decision) {
  const answer = row.answer;
  const est = decision.est;
  requirePhrase(label, answer, "One square is " + SQFT_PER_ROOF_SQUARE + " sq ft of roof surface");
  requirePhrase(label, answer, numberFmt(decision.squares * SQFT_PER_ROOF_SQUARE) + " sq ft of roof is " + decision.squares + " squares");
  requirePhrase(label, answer, usd(est.allInTypical) + " typical");
  if (Number.isFinite(est.bandLow) && Number.isFinite(est.bandHigh)) {
    requirePhrase(label, answer, "most projects run " + usd(est.bandLow) + " to " + usd(est.bandHigh));
  }
  requirePhrase(label, answer, "floor area, not your roof surface");
  assertPrintedFee(label, answer, decision);
  if (decision.branch === "zero") {
    requirePhrase(label, answer, "The permit fee on the typical path is $0, so that is the job cost.");
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

function checkFiftyAnswer(label, row, decision) {
  const answer = row.answer;
  const est = decision.est;
  requirePhrase(label, answer, "At the typical ");
  requirePhrase(label, answer, usd(est.bandLow) + " to " + usd(est.bandHigh));
  if (decision.branch === "above") {
    requirePhrase(label, answer, "For the job we price, yes.");
    requirePhrase(label, answer, "premium or steep roofs can reach " + usd(est.allInHigh));
    requirePhrase(label, answer, usd(FIFTY_THOUSAND) + " is above all of those.");
  } else if (decision.branch === "middle") {
    requirePhrase(label, answer, usd(FIFTY_THOUSAND) + " is above the most-projects range of " + usd(est.bandLow) + " to " + usd(est.bandHigh));
    requirePhrase(label, answer, "within the premium or steep reach of " + usd(est.allInHigh));
  } else if (decision.branch === "inside") {
    requirePhrase(label, answer, usd(FIFTY_THOUSAND) + " is inside the most-projects range of " + usd(est.bandLow) + " to " + usd(est.bandHigh));
  }
  const crossPhrase = "first reaches " + usd(FIFTY_THOUSAND) + " at " + decision.cross + " squares";
  if (decision.cross != null) {
    const crossed = buildEstimate(roof, row.city, row.permit, decision.cross);
    requirePhrase(label, answer, crossPhrase);
    requirePhrase(label, answer, usd(crossed.allInTypical) + " typical");
  } else if (answer.includes("first reaches")) {
    fail(label + " includes a cross-squares sentence that the quantity range does not reach");
  }
  const lead = decision.branch === "above" ? "Those figures include the " : "That figure includes the ";
  if (decision.permitBranch === "charlotte-exempt") {
    requirePhrase(label, answer, "Above " + usd(FORTY_THOUSAND) + " the like-for-like exemption no longer applies");
    if (answer.includes("That figure includes") || answer.includes("Those figures include")) {
      fail(label + " Charlotte exemption answer also includes a permit-fee sentence");
    }
  } else if (decision.permitBranch === "zero") {
    requirePhrase(label, answer, "The permit fee on the typical path is $0, so that is the job cost.");
  } else if (decision.permitBranch === "flat") {
    requirePhrase(label, answer, lead + usd(decision.fee) + " typical permit fee.");
  } else if (decision.permitBranch === "scaled") {
    requirePhrase(label, answer, lead + usd(decision.fee) + " permit fee at the typical size.");
  } else if (decision.permitBranch === "valuation") {
    requirePhrase(label, answer, lead + usd(decision.fee) + " typical permit fee.");
    requirePhrase(label, answer, "different fee than the official typical one");
    requirePhrase(label, answer, "we do not compute here");
    requirePhrase(label, answer, "The permit section has that fee.");
  } else if (decision.permitBranch === "missing") {
    requirePhrase(label, answer, "No permit fee is included because the fee is not listed.");
  }
  assertPrintedFee(label, answer, decision, decision.permitBranch !== "charlotte-exempt");
  if (decision.branch === "above" && decision.permitBranch !== "charlotte-exempt" && decision.permitBranch !== "zero" && decision.permitBranch !== "missing") {
    const marker = usd(FIFTY_THOUSAND) + " is above all of those. " + lead;
    if (!answer.includes(marker)) fail(label + " permit sentence after the above-all line is not \"" + lead.trim() + "\"");
  }
  if (decision.branch !== "above" && answer.includes("Those figures include")) {
    fail(label + " uses Those figures outside the above-all comparison");
  }
  const allowed = new Set([usd(FIFTY_THOUSAND)]);
  if (decision.permitBranch === "charlotte-exempt") allowed.add(usd(FORTY_THOUSAND));
  addNumbers(allowed, est);
  for (let qty = ROOF_META.min; qty <= ROOF_META.max; qty += ROOF_META.step) {
    addNumbers(allowed, buildEstimate(roof, row.city, row.permit, qty));
  }
  checkDollars(label, row.question + " " + answer, allowed);
  if (EN.test(row.question + " " + answer) || EM.test(row.question + " " + answer)) {
    fail(label + " has an em or en dash");
  }
}

if (!roof) fail("missing roof project");
if (SQFT_PER_ROOF_SQUARE !== 100) fail("SQFT_PER_ROOF_SQUARE=" + SQFT_PER_ROOF_SQUARE);
if (ROOF_META.defaultQuantity !== ROOF_TYPICAL) fail("roof default quantity drifted");

const roofDir = path.join(outDir, "cost/roof-replacement");
const outSlugs = fs.existsSync(roofDir)
  ? fs
      .readdirSync(roofDir)
      .filter((name) => fs.existsSync(path.join(roofDir, name, "index.html")) && fs.statSync(path.join(roofDir, name)).isDirectory())
      .sort()
  : [];
const dataSlugs = cities.map((city) => city.slug).sort();
if (outSlugs.length !== 100 || dataSlugs.length !== 100 || outSlugs.join("\n") !== dataSlugs.join("\n")) {
  fail("roof pages are not exactly the 100 data cities (out " + outSlugs.length + ", data " + dataSlugs.length + ")");
}

let itemCount = 0;

for (const city of cities) {
  const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === "roof-replacement") || null;
  const file = path.join(roofDir, city.slug, "index.html");
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

  const sizeDecisions = HOME_SQFT.map((sqft) => ({
    sqft,
    question: "How much does a new roof cost on a " + numberFmt(sqft) + " sq ft home in " + city.name + "?",
    decision: sizeDecision(roof, city, permit, sqft),
  }));
  const includedSizes = sizeDecisions.filter((item) => item.decision.include);
  includedSizes.forEach((item, index) => {
    const at = visible.findIndex((row) => row.question === item.question);
    const ldAt = ld.findIndex((row) => row.question === item.question);
    if (at < 0) fail(label + " missing " + item.sqft + " sq ft question");
    else if (at !== index) fail(label + " " + item.sqft + " sq ft question at index " + at + " (want " + index + ")");
    if (ldAt !== at) fail(label + " " + item.sqft + " FAQPage index " + ldAt + " != visible " + at);
    if (at >= 0 && visible[at]) {
      checkSizeAnswer(label + " " + item.sqft, visible[at], item.decision);
      itemCount++;
    }
  });
  for (const item of sizeDecisions) {
    if (item.decision.include) continue;
    if (visible.some((row) => row.question === item.question) || ld.some((row) => row.question === item.question)) {
      fail(label + " " + item.sqft + " sq ft question present but should be omitted (" + item.decision.reason + ")");
    }
  }

  const fifty = fiftyDecision(roof, city, permit);
  const fiftyQuestion = "Is " + usd(FIFTY_THOUSAND) + " too much for a roof replacement in " + city.name + "?";
  const thirtyQuestion = "Is $30,000 too much for a roof replacement in " + city.name + "?";
  const fiftyAt = visible.findIndex((row) => row.question === fiftyQuestion);
  const fiftyLd = ld.findIndex((row) => row.question === fiftyQuestion);
  if (fifty.include) {
    if (fiftyAt < 0) fail(label + " missing $50,000 question (" + fifty.branch + "/" + fifty.permitBranch + ")");
    else {
      const thirtyAt = visible.findIndex((row) => row.question === thirtyQuestion);
      const wantAt = thirtyAt >= 0 ? thirtyAt + 1 : includedSizes.length;
      if (fiftyAt !== wantAt) fail(label + " $50,000 question at index " + fiftyAt + " (want " + wantAt + ")");
      if (fiftyLd !== fiftyAt) fail(label + " $50,000 FAQPage index " + fiftyLd + " != visible " + fiftyAt);
      checkFiftyAnswer(label + " $50,000", { ...visible[fiftyAt], city, permit }, fifty);
      itemCount++;
    }
  } else if (fiftyAt >= 0 || fiftyLd >= 0) {
    fail(label + " $50,000 question present but should be omitted (" + fifty.reason + ")");
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
      if (rel.startsWith("cost/roof-replacement/")) continue;
      const html = fs.readFileSync(full, "utf8");
      if (
        html.includes("How much does a new roof cost on a 2,200 sq ft home") ||
        html.includes("How much does a new roof cost on a 2,800 sq ft home") ||
        html.includes("Is $50,000 too much for a roof replacement")
      ) {
        leaked.push(rel);
      }
    }
  }
}
walk(path.join(outDir, "cost"));
if (leaked.length) fail("new roof PAA questions leaked onto non-roof pages: " + leaked.slice(0, 8).join(", "));

if (failures.length) {
  console.error("roof-paa-check: " + failures.length + " failure(s)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}

console.log("roof-paa-check: 100 roof pages OK, " + itemCount + " items");
