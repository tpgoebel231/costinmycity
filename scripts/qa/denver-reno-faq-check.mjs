/**
 * Denver hub renovation section and Denver kitchen budget FAQs must match
 * the data files. Math is a plain-JS mirror of lib/estimates.ts (same as
 * scripts/qa/number-check.mjs, plus the common-band path those cards use).
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;

const ORDER = ["roof-replacement", "hvac-replacement", "deck", "kitchen-remodel"];
const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16, shortName: "Roof replacement" },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1, shortName: "HVAC replacement" },
  deck: { pricing: "per-unit", defaultQuantity: 320, shortName: "Deck" },
  "kitchen-remodel": { pricing: "per-unit", defaultQuantity: 200, shortName: "Kitchen remodel" },
};

const DASH = /[\u2013\u2014]|&ndash;|&mdash;|&#8211;|&#8212;|&#x201[34];/i;
const THIRTY = /30%/;
const CITY = "denver-co";
const PROJECT = "kitchen-remodel";

function launchSlugs() {
  const fromData = projects.map((item) => item.projectSlug);
  const ordered = ORDER.filter((slug) => fromData.includes(slug));
  const extra = fromData.filter((slug) => !ORDER.includes(slug));
  return [...ordered, ...extra];
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

function commonBandSource(project) {
  if (typeof project.commonLow === "number" && typeof project.commonHigh === "number") {
    return { low: project.commonLow, high: project.commonHigh, asJobTotal: false };
  }
  return null;
}

function cityJobCost(project, citySlug, quantity) {
  const meta = META[project.projectSlug];
  const adj = project.cityAdjustments?.[citySlug];
  const multiplier = adj?.multiplier ?? 1;
  const low = scaleBase(project.nationalLow, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const typical = scaleBase(project.nationalTypical, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const high = scaleBase(project.nationalHigh, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  return { low, typical, high, multiplier };
}

function buildEstimate(project, city, permit, quantity) {
  const meta = META[project.projectSlug];
  const qty = quantity ?? meta.defaultQuantity;
  const job = cityJobCost(project, city.slug, qty);
  const scaled = scalePermit(permit, qty, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pLow = scaled.low ?? scaled.typical ?? 0;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  const pHigh = scaled.high ?? scaled.typical ?? 0;
  const common = commonBandSource(project);
  const bandJobLow = common
    ? scaleBase(common.low, job.multiplier, qty, meta.defaultQuantity, meta.pricing, common.asJobTotal)
    : job.low;
  const bandJobHigh = common
    ? scaleBase(common.high, job.multiplier, qty, meta.defaultQuantity, meta.pricing, common.asJobTotal)
    : job.high;
  const addLow = permitKnown ? pLow : 0;
  const addHigh = permitKnown ? pHigh : 0;
  return {
    job,
    permit,
    permitTypical: scaled.typical,
    allInLow: job.low + (permitKnown ? pLow : 0),
    allInTypical: job.typical + (permitKnown ? pTyp : 0),
    allInHigh: job.high + (permitKnown ? pHigh : 0),
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
  };
}

function permitDisplayUsd(est) {
  const t = est.permitTypical;
  const recorded = est.permit?.feeTypicalUsd;
  if (t != null && typeof recorded === "number" && Math.round(recorded) === t) return recorded;
  return t;
}

function keepHvac(text) {
  return (text || "").replace(/\bhvac\b/gi, "HVAC");
}

/** "a roof replacement", "an HVAC replacement". HVAC and a vowel letter take "an". */
function withArticle(phrase, sentenceStart) {
  const article = /^(?:[aeiou]|hvac\b)/i.test(phrase) ? "an" : "a";
  const word = sentenceStart ? article.charAt(0).toUpperCase() + article.slice(1) : article;
  return word + " " + phrase;
}

function joinProse(parts) {
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] + " and " + parts[1];
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function permitClause(row) {
  if (row.est.permit && row.est.permit.permitRequired === false) return ", usually no city permit needed";
  if (row.fee != null) return ", including the " + usd(row.fee) + " permit";
  return "";
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

/** Visible characters with tags removed and no space inserted at the tag. */
function textContent(html) {
  return decode(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function visibleBody(html) {
  let s = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  return stripTags(s);
}

function sectionHtml(html, id) {
  const re = new RegExp('<section\\b[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</section>', "i");
  const match = html.match(re);
  return match ? match[1] : null;
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

const failures = [];
function fail(msg) {
  failures.push(msg);
}

const city = cities.find((item) => item.slug === CITY);
const kitchenProject = projects.find((item) => item.projectSlug === PROJECT);
const kitchenPermit = permits.find((item) => item.citySlug === CITY && item.projectSlug === PROJECT);
if (!city || !kitchenProject) {
  fail("missing Denver city or kitchen-remodel project in data files");
}

const hubRows = [];
if (city) {
  for (const slug of launchSlugs()) {
    const project = projects.find((item) => item.projectSlug === slug);
    if (!project) continue;
    const permit = permits.find((item) => item.citySlug === CITY && item.projectSlug === slug);
    const est = buildEstimate(project, city, permit, META[slug].defaultQuantity);
    hubRows.push({
      slug,
      label: META[slug].shortName,
      allInTypical: est.allInTypical,
      bandLow: est.bandLow,
      bandHigh: est.bandHigh,
      fee: permitDisplayUsd(est),
      est,
    });
  }
}

const kitchenRow = hubRows.find((row) => row.slug === PROJECT);
const T = kitchenRow?.allInTypical;
const L = kitchenRow?.bandLow;
const H = kitchenRow?.bandHigh;
const F = kitchenRow?.fee;
const S = META[PROJECT].defaultQuantity;
const typicals = hubRows.map((row) => row.allInTypical);
const minTypical = typicals.length ? Math.min(...typicals) : null;
const maxTypical = typicals.length ? Math.max(...typicals) : null;

const hubFile = path.join(outDir, "city", CITY, "index.html");
const moneyFile = path.join(outDir, "cost", PROJECT, CITY, "index.html");
if (!fs.existsSync(hubFile)) fail("missing " + path.relative(root, hubFile));
if (!fs.existsSync(moneyFile)) fail("missing " + path.relative(root, moneyFile));

const hubHtml = fs.existsSync(hubFile) ? fs.readFileSync(hubFile, "utf8") : "";
const moneyHtml = fs.existsSync(moneyFile) ? fs.readFileSync(moneyFile, "utf8") : "";

const renoHtml = hubHtml ? sectionHtml(hubHtml, "renovation") : null;
if (!renoHtml) {
  fail("hub missing section#renovation");
} else {
  const renoText = stripTags(renoHtml);
  if (!renoText.includes("Home renovation cost in Denver")) fail("hub renovation missing h2 text");
  const answer =
    "Most home renovation projects we price in Denver run " +
    usd(minTypical) +
    " to " +
    usd(maxTypical) +
    " all-in at the typical size, including the city permit fee.";
  if (!renoText.includes(answer)) fail("hub renovation answer mismatch; wanted: " + answer);
  if (!renoText.includes("Pick a job above for the full cost breakdown, permit steps and fee source.")) {
    fail("hub renovation missing follow line");
  }
  const ul = renoHtml.match(/<ul\b[^>]*>([\s\S]*?)<\/ul>/i);
  const lis = ul ? [...ul[1].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)] : [];
  if (lis.length !== hubRows.length) {
    fail("hub renovation li count " + lis.length + " want " + hubRows.length);
  }
  hubRows.forEach((row, index) => {
    const href = "/cost/" + row.slug + "/" + CITY + "/";
    const costPage = path.join(outDir, "cost", row.slug, CITY, "index.html");
    if (!fs.existsSync(costPage)) fail("missing cost page for " + href);
    const liHtml = lis[index] ? lis[index][1] : "";
    const anchors = liHtml.match(/<a\b[^>]*>/gi) || [];
    if (anchors.length !== 1 || !liHtml.includes('href="' + href + '"')) {
      fail("hub renovation li missing link " + href);
    }
    const want =
      keepHvac(row.label) +
      " cost in " +
      city.name +
      ": typical " +
      usd(row.allInTypical) +
      ", most projects " +
      usd(row.bandLow) +
      " to " +
      usd(row.bandHigh) +
      permitClause(row) +
      ".";
    const got = textContent(liHtml);
    if (got !== want) fail("hub renovation line mismatch for " + row.slug + " got=" + got + " want=" + want);
  });
  const kitchenLine =
    "Typical " +
    usd(T) +
    ", most projects " +
    usd(L) +
    " to " +
    usd(H) +
    ", including the " +
    usd(F) +
    " permit.";
  if (!renoText.includes("Kitchen remodel cost in Denver")) fail("hub kitchen card missing heading");
  if (!renoText.includes(kitchenLine)) fail("hub kitchen card line mismatch; wanted: " + kitchenLine);
  if (!renoText.includes("See the Denver kitchen remodel breakdown")) fail("hub kitchen card missing CTA");
  if (!/href="\/cost\/kitchen-remodel\/denver-co\/"/.test(renoHtml)) {
    fail("hub kitchen card missing href=/cost/kitchen-remodel/denver-co/");
  }
  if (DASH.test(renoHtml)) fail("hub renovation copy has an em or en dash");
  if (THIRTY.test(renoText)) fail("hub renovation copy has 30%");
}

for (const page of [
  ["hub", hubHtml],
  ["kitchen", moneyHtml],
]) {
  const pages = faqPages(page[1]);
  if (pages.length !== 1) fail(page[0] + " FAQPage count=" + pages.length + " (want 1)");
}

const expectedFaqs = [];
if (kitchenRow && F != null) {
  if (L <= 30000 && 30000 <= H) {
    expectedFaqs.push({
      question: "Is $30,000 enough to remodel a kitchen in Denver?",
      answer:
        "Yes, for the job we price: a mid-range remodel on the same layout, about " +
        S +
        " sq ft. Our typical all-in is " +
        usd(T) +
        ", and most projects run " +
        usd(L) +
        " to " +
        usd(H) +
        ". That typical already includes the " +
        usd(F) +
        " typical city permit fee. At $30,000 you are close to the typical, so finish choices decide whether you land a little under or over.",
    });
  }
  if (L <= 20000 && 20000 < T) {
    expectedFaqs.push({
      question: "Is $20,000 enough for a kitchen remodel in Denver?",
      answer:
        "It can be. $20,000 is inside our range of " +
        usd(L) +
        " to " +
        usd(H) +
        " for a same-layout remodel, but below the " +
        usd(T) +
        " typical, so plan on lower-end cabinets, counters and appliances. The " +
        usd(F) +
        " typical permit fee comes out of that budget too.",
    });
  }
  if (10000 < L) {
    expectedFaqs.push({
      question: "Is $10,000 enough to renovate a kitchen in Denver?",
      answer:
        "Not for a full remodel. $10,000 is below our low of " +
        usd(L) +
        ", so it fits cosmetic updates only, such as paint, hardware or lighting. Same-layout cabinet-only work may not need a building permit.",
    });
  }
  expectedFaqs.push({
    question: "Why do some sites say a Denver kitchen remodel costs $50,000 to $150,000?",
    answer:
      "Those figures usually cover layout changes, moved walls or plumbing, or full gut renovations. We do not price those jobs. Our figures are for a mid-range remodel on the same layout.",
  });
}

if (expectedFaqs.length !== 4) fail("expected 4 budget FAQs from data guards, got " + expectedFaqs.length);

const visibleFaqs = visibleFaqItems(moneyHtml);
const moneyFaqPage = faqPages(moneyHtml)[0];
const ldFaqs = moneyFaqPage ? ldFaqItems(moneyFaqPage) : [];
const moneyVisible = visibleBody(moneyHtml);

for (const item of expectedFaqs) {
  const vis = visibleFaqs.find((row) => row.question === item.question);
  const ld = ldFaqs.find((row) => row.question === item.question);
  if (!moneyVisible.includes(item.question)) fail("kitchen visible text missing question: " + item.question);
  if (!vis) fail("kitchen MoneyFaq missing question: " + item.question);
  else if (vis.answer !== item.answer) {
    fail("kitchen visible answer mismatch for " + item.question + " got=" + vis.answer);
  }
  if (!ld) fail("kitchen FAQPage missing question: " + item.question);
  else if (ld.answer !== item.answer) {
    fail("kitchen JSON-LD answer mismatch for " + item.question + " got=" + ld.answer);
  }
  if (vis && ld && vis.question !== ld.question) {
    fail("kitchen visible/JSON-LD question differ: " + vis.question);
  }
  if (vis && ld && vis.answer !== ld.answer) {
    fail("kitchen visible/JSON-LD answer differ for " + item.question);
  }
  const blob = item.question + " " + item.answer;
  if (DASH.test(blob)) fail("budget FAQ has an em or en dash: " + item.question);
  if (THIRTY.test(blob)) fail("budget FAQ has 30%: " + item.question);
}

if (visibleFaqs.length >= 4) {
  const firstFour = visibleFaqs.slice(0, 4).map((row) => row.question);
  const want = expectedFaqs.map((row) => row.question);
  if (firstFour.join("\n") !== want.join("\n")) {
    fail("budget FAQs are not first in MoneyFaq; got " + firstFour.join(" | "));
  }
}

if (ldFaqs.length >= 4) {
  const firstFour = ldFaqs.slice(0, 4).map((row) => row.question);
  const want = expectedFaqs.map((row) => row.question);
  if (firstFour.join("\n") !== want.join("\n")) {
    fail("budget FAQs are not first in FAQPage; got " + firstFour.join(" | "));
  }
}

const NK = /\$\d+k\b/i;
const questionA = "What is the home renovation cost in " + city.name + "?";
const questionB = "Which home renovation costs the most in " + city.name + "?";
let maxRow = hubRows[0];
let minRow = hubRows[0];
for (const row of hubRows) {
  if (!maxRow || row.allInTypical > maxRow.allInTypical) maxRow = row;
  if (!minRow || row.allInTypical < minRow.allInTypical) minRow = row;
}
const answerA =
  "A typical " +
  city.name +
  " home project runs " +
  usd(minTypical) +
  " to " +
  usd(maxTypical) +
  ". Typical all-in costs on this page are " +
  joinProse(hubRows.map((row) => keepHvac(row.label.toLowerCase()) + " " + usd(row.allInTypical))) +
  ". Those totals include the city permit fee when a fee is on file.";
const answerB = maxRow && minRow
  ? "Of the jobs we price in " +
    city.name +
    ", " +
    withArticle(keepHvac(maxRow.label.toLowerCase())) +
    " costs the most at a typical " +
    usd(maxRow.allInTypical) +
    ", with most projects " +
    usd(maxRow.bandLow) +
    " to " +
    usd(maxRow.bandHigh) +
    ". " +
    withArticle(keepHvac(minRow.label.toLowerCase()), true) +
    " costs the least at a typical " +
    usd(minRow.allInTypical) +
    ". Each total includes the city permit fee when one is on file."
  : "";

const hubFaqHtml = hubHtml ? sectionHtml(hubHtml, "faq") : null;
if (hubFaqHtml && DASH.test(hubFaqHtml)) fail("hub FAQ copy has an em or en dash");
const hubVisibleFaqs = visibleFaqItems(hubHtml);
const hubLdFaqs = faqPages(hubHtml)[0] ? ldFaqItems(faqPages(hubHtml)[0]) : [];
const visA = hubVisibleFaqs.find((row) => row.question === questionA);
const visB = hubVisibleFaqs.find((row) => row.question === questionB);
const ldA = hubLdFaqs.find((row) => row.question === questionA);
const ldB = hubLdFaqs.find((row) => row.question === questionB);
if (!visA) fail("hub FAQ missing question: " + questionA);
else if (visA.answer !== answerA) fail("hub FAQ (a) answer mismatch got=" + visA.answer);
else if (NK.test(visA.answer)) fail("hub FAQ (a) has a $Nk token");
if (!ldA) fail("hub FAQPage missing question: " + questionA);
else if (ldA.answer !== answerA) fail("hub FAQPage (a) answer mismatch got=" + ldA.answer);
if (visA && ldA && visA.answer !== ldA.answer) fail("hub FAQ (a) visible and JSON-LD differ");
if (!visB) fail("hub FAQ missing question: " + questionB);
else if (visB.answer !== answerB) fail("hub FAQ (b) answer mismatch got=" + visB.answer);
if (!ldB) fail("hub FAQPage missing question: " + questionB);
else if (ldB.answer !== answerB) fail("hub FAQPage (b) answer mismatch got=" + ldB.answer);
if (visB && ldB && (visB.question !== ldB.question || visB.answer !== ldB.answer)) {
  fail("hub FAQ (b) visible and JSON-LD differ");
}
const visIndexA = hubVisibleFaqs.findIndex((row) => row.question === questionA);
const visIndexB = hubVisibleFaqs.findIndex((row) => row.question === questionB);
if (visIndexA < 0 || visIndexB !== visIndexA + 1) fail("hub FAQ (b) is not immediately after FAQ (a)");
const ldIndexA = hubLdFaqs.findIndex((row) => row.question === questionA);
const ldIndexB = hubLdFaqs.findIndex((row) => row.question === questionB);
if (ldIndexA < 0 || ldIndexB !== ldIndexA + 1) fail("FAQPage (b) is not immediately after FAQ (a)");
if (answerA && NK.test(answerA)) fail("computed FAQ (a) still has a $Nk token");
if ((questionB + " " + answerB) && DASH.test(questionB + " " + answerB)) fail("FAQ (b) has an em or en dash");

const cityOut = path.join(outDir, "city");
if (fs.existsSync(cityOut)) {
  for (const name of fs.readdirSync(cityOut)) {
    const file = path.join(cityOut, name, "index.html");
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, "utf8");
    const hasReno = /id="renovation"/.test(html);
    if (name === CITY && !hasReno) fail("denver hub missing #renovation");
    if (name !== CITY && hasReno) fail(name + " hub has #renovation; only denver-co should");
  }
} else {
  fail("missing out/city");
}

if (failures.length) {
  console.error("denver-reno-faq-check: " + failures.length + " mismatch(es)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}

console.log(
  "denver-reno-faq-check: hub renovation + 4 Denver kitchen budget FAQs match data-file estimates" +
    " T=" +
    usd(T) +
    " L=" +
    usd(L) +
    " H=" +
    usd(H) +
    " F=" +
    usd(F),
);
