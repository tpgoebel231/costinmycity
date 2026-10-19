/**
 * Dallas HVAC and Charlotte roof budget FAQs must match the data files.
 * Math is a plain-JS mirror of lib/estimates.ts (same as scripts/qa/calc-check.mjs
 * and scripts/qa/number-check.mjs), including Charlotte quantity 22.
 */
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;

const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16, min: 8, max: 60, step: 1 },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1, min: 1, max: 4, step: 1 },
};

const DASH = /[\u2013\u2014]|&ndash;|&mdash;|&#8211;|&#8212;|&#x201[34];/i;
const SQFT_PER_ROOF_SQUARE = readConst("lib/roof-size.ts", "SQFT_PER_ROOF_SQUARE");
const ROOF_TYPICAL = readConst("lib/roof-size.ts", "typical");
const HVAC_SPEC = readHvacSpec();

function readConst(rel, name) {
  const src = fs.readFileSync(path.join(root, rel), "utf8");
  const match = src.match(new RegExp("\\b" + name + "\\s*[:=]\\s*(\\d+)"));
  if (!match) throw new Error("missing " + name + " in " + rel);
  return Number(match[1]);
}

function readHvacSpec() {
  const src = fs.readFileSync(path.join(root, "lib/typical-specs.ts"), "utf8");
  const block = src.split('"hvac-replacement"')[1] || "";
  const match = block.match(/typical:\s*"([^"]+)"/);
  if (!match) throw new Error("missing hvac typical spec");
  return match[1];
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

function roofSquaresPhrase(squares) {
  const surface = numberFmt(squares * SQFT_PER_ROOF_SQUARE) + " sq ft of roof surface";
  return squares + " squares (" + surface + ", not floor area)";
}

function highBandReachPrefix(project) {
  if (typeof project.commonLow !== "number" || typeof project.commonHigh !== "number") return null;
  const note = project.scopeNote || "";
  if (project.projectSlug === "roof-replacement") return "Premium or steep roofs can reach ";
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

function attr(html, name) {
  const match = html.match(new RegExp("\\b" + name + '="([^"]*)"'));
  return match ? match[1] : null;
}

function duplicates(items) {
  const seen = new Set();
  const dupes = [];
  for (const item of items) {
    if (seen.has(item.question)) dupes.push(item.question);
    seen.add(item.question);
  }
  return dupes;
}

const failures = [];
function fail(msg) {
  failures.push(msg);
}

function expectFaqs(label, html, expected, hero) {
  const fileNote = label;
  if (!html) {
    fail(fileNote + " missing html");
    return;
  }
  const pages = faqPages(html);
  if (pages.length !== 1) fail(fileNote + " FAQPage count=" + pages.length + " (want 1)");
  const visible = visibleFaqItems(html);
  const ld = pages[0] ? ldFaqItems(pages[0]) : [];
  const visDupes = duplicates(visible);
  const ldDupes = duplicates(ld);
  if (visDupes.length) fail(fileNote + " duplicate visible question: " + visDupes.join(" | "));
  if (ldDupes.length) fail(fileNote + " duplicate FAQPage question: " + ldDupes.join(" | "));

  if (hero) {
    const checks = [
      ["data-hero-typical", hero.allInTypical],
      ["data-hero-high", hero.allInHigh],
      ["data-permit", hero.fee],
    ];
    for (const [name, expectedValue] of checks) {
      const actual = attr(html, name);
      if (Number(actual) !== expectedValue) {
        fail(fileNote + " hero " + name + " html=" + actual + " data=" + expectedValue);
      }
    }
  }

  if (visible.length < expected.length) {
    fail(fileNote + " visible FAQ count " + visible.length + " < " + expected.length);
  } else {
    const first = visible.slice(0, expected.length).map((row) => row.question);
    const want = expected.map((row) => row.question);
    if (first.join("\n") !== want.join("\n")) {
      fail(fileNote + " new FAQs are not first in MoneyFaq; got " + first.join(" | "));
    }
  }
  if (ld.length < expected.length) {
    fail(fileNote + " FAQPage count of questions " + ld.length + " < " + expected.length);
  } else {
    const first = ld.slice(0, expected.length).map((row) => row.question);
    const want = expected.map((row) => row.question);
    if (first.join("\n") !== want.join("\n")) {
      fail(fileNote + " new FAQs are not first in FAQPage; got " + first.join(" | "));
    }
  }

  for (const item of expected) {
    const vis = visible.filter((row) => row.question === item.question);
    const schema = ld.filter((row) => row.question === item.question);
    if (vis.length !== 1) fail(fileNote + " visible question count " + vis.length + " for " + item.question);
    if (schema.length !== 1) fail(fileNote + " FAQPage question count " + schema.length + " for " + item.question);
    if (vis[0] && vis[0].answer !== item.answer) {
      fail(fileNote + " visible answer mismatch for " + item.question + "\n  got=" + vis[0].answer + "\n  want=" + item.answer);
    }
    if (schema[0] && schema[0].answer !== item.answer) {
      fail(fileNote + " JSON-LD answer mismatch for " + item.question + "\n  got=" + schema[0].answer + "\n  want=" + item.answer);
    }
    if (vis[0] && schema[0] && vis[0].answer !== schema[0].answer) {
      fail(fileNote + " visible/JSON-LD answer differ for " + item.question);
    }
    if (vis[0] && schema[0] && vis[0].question !== schema[0].question) {
      fail(fileNote + " visible/JSON-LD question differ for " + item.question);
    }
    const blob = item.question + " " + item.answer;
    if (DASH.test(blob)) fail(fileNote + " new FAQ has an em or en dash: " + item.question);
    if (vis[0] && DASH.test(vis[0].question + " " + vis[0].answer)) {
      fail(fileNote + " rendered FAQ has an em or en dash: " + item.question);
    }
  }
}

const dallas = cities.find((item) => item.slug === "dallas-tx");
const charlotte = cities.find((item) => item.slug === "charlotte-nc");
const hvac = projects.find((item) => item.projectSlug === "hvac-replacement");
const roof = projects.find((item) => item.projectSlug === "roof-replacement");
const dallasPermit = permits.find((item) => item.citySlug === "dallas-tx" && item.projectSlug === "hvac-replacement");
const charlottePermit = permits.find((item) => item.citySlug === "charlotte-nc" && item.projectSlug === "roof-replacement");

if (!dallas || !hvac || !dallasPermit) fail("missing Dallas HVAC city, project, or permit");
if (!charlotte || !roof || !charlottePermit) fail("missing Charlotte roof city, project, or permit");
if (ROOF_TYPICAL !== META["roof-replacement"].defaultQuantity) {
  fail("roof typical squares " + ROOF_TYPICAL + " != calculator default " + META["roof-replacement"].defaultQuantity);
}
if (SQFT_PER_ROOF_SQUARE !== 100) fail("SQFT_PER_ROOF_SQUARE=" + SQFT_PER_ROOF_SQUARE);

const dallasEst = dallas && hvac ? buildEstimate(hvac, dallas, dallasPermit, META["hvac-replacement"].defaultQuantity) : null;
const dallasFaqs = [];
if (dallas && dallasEst && HVAC_SPEC) {
  const fee = permitDisplayUsd(dallasEst);
  const typical = dallasEst.allInTypical;
  const bandLow = dallasEst.bandLow;
  const bandHigh = dallasEst.bandHigh;
  const broadHigh = dallasEst.allInHigh;
  const ductwork = highBandReachPrefix(hvac) === "Jobs with new ductwork can reach ";
  const tenThousand = 10000;
  const fiveThousand = 5000;
  if (fee != null && ductwork) {
    dallasFaqs.push({
      question: "How much does AC replacement cost in " + dallas.name + "?",
      answer:
        "We price AC replacement as a full change-out: a " +
        HVAC_SPEC +
        " on existing ducts. In " +
        dallas.name +
        " that job is " +
        usd(typical) +
        " all-in, and most projects run " +
        usd(bandLow) +
        " to " +
        usd(bandHigh) +
        ". That includes the " +
        usd(fee) +
        " typical city permit fee. Jobs with new ductwork can reach " +
        usd(broadHigh) +
        ". We do not price an AC-only swap separately.",
    });
  }
  if (fee != null && ductwork && typical < tenThousand && tenThousand <= bandHigh && bandLow <= tenThousand && broadHigh > tenThousand) {
    dallasFaqs.push({
      question: "Is " + usd(tenThousand) + " enough to replace an AC in " + dallas.name + "?",
      answer:
        "Usually, for the job we price. " +
        usd(tenThousand) +
        " is above our " +
        usd(typical) +
        " typical and inside the most-projects range of " +
        usd(bandLow) +
        " to " +
        usd(bandHigh) +
        ", including the " +
        usd(fee) +
        " permit. It would not cover a job with new ductwork, which can reach " +
        usd(broadHigh) +
        ".",
    });
  }
  if (fee != null && fiveThousand < bandLow && dallasEst.permitLow === fee) {
    dallasFaqs.push({
      question: "Is " + usd(fiveThousand) + " enough to replace an AC in " + dallas.name + "?",
      answer:
        "Not for the job we price. " +
        usd(fiveThousand) +
        " is below our low of " +
        usd(bandLow) +
        " for a like-for-like split system, and that low already includes the " +
        usd(fee) +
        " permit fee.",
    });
  }
}

const roofMeta = META["roof-replacement"];
const charlotteFaqs = [];
let charlotteRange = "omitted";
let charlotteAt22 = null;
if (charlotte && roof && ROOF_TYPICAL === roofMeta.defaultQuantity) {
  const at = (qty) => buildEstimate(roof, charlotte, charlottePermit, qty);
  const atTypical = at(roofMeta.defaultQuantity);
  const typicalFee = permitDisplayUsd(atTypical);
  const roofSqFt = 2200;
  const squares = roofSqFt / SQFT_PER_ROOF_SQUARE;
  const onStep =
    Number.isInteger(squares) &&
    squares >= roofMeta.min &&
    squares <= roofMeta.max &&
    roofMeta.step > 0 &&
    (squares - roofMeta.min) % roofMeta.step === 0;
  if (onStep && typicalFee === 0) {
    const atSize = at(squares);
    charlotteAt22 = atSize;
    const sizeFee = permitDisplayUsd(atSize);
    const hasBand = Number.isFinite(atSize.bandLow) && Number.isFinite(atSize.bandHigh);
    charlotteRange = hasBand ? "bandLow/bandHigh" : "allInLow/allInHigh";
    if (sizeFee === 0 && atSize.allInTypical === atSize.jobTypical) {
      const range = hasBand
        ? "most projects run " + usd(atSize.bandLow) + " to " + usd(atSize.bandHigh)
        : usd(atSize.allInLow) + " low to " + usd(atSize.allInHigh) + " high";
      charlotteFaqs.push({
        question: "How much does a new roof cost on a " + numberFmt(roofSqFt) + " sq ft home in " + charlotte.name + "?",
        answer:
          "One square is " +
          SQFT_PER_ROOF_SQUARE +
          " sq ft of roof surface, so " +
          numberFmt(roofSqFt) +
          " sq ft of roof is " +
          squares +
          " squares. At " +
          squares +
          " squares in " +
          charlotte.name +
          ", " +
          charlotte.stateAbbr +
          " the calculator gives " +
          usd(atSize.allInTypical) +
          " typical, and " +
          range +
          ". The permit fee on the typical path is " +
          usd(typicalFee) +
          ", so that is the job cost. If " +
          numberFmt(roofSqFt) +
          " sq ft is your floor area, not your roof surface, measure the roof or ask your roofer for the squares, since the calculator prices roof surface.",
      });
    }
  }

  const fiftyThousand = 50000;
  const fortyThousand = 40000;
  const steep = highBandReachPrefix(roof) === "Premium or steep roofs can reach ";
  const aboveAll =
    fiftyThousand > atTypical.allInHigh &&
    fiftyThousand > atTypical.bandHigh &&
    fiftyThousand > atTypical.bandLow &&
    fiftyThousand > atTypical.allInTypical;
  if (steep && aboveAll && charlotteRoofStatuteExempt(charlottePermit)) {
    let answer =
      "For the job we price, yes. At the typical " +
      roofSquaresPhrase(ROOF_TYPICAL) +
      " in " +
      charlotte.name +
      ", most projects run " +
      usd(atTypical.bandLow) +
      " to " +
      usd(atTypical.bandHigh) +
      ", and premium or steep roofs can reach " +
      usd(atTypical.allInHigh) +
      ". " +
      usd(fiftyThousand) +
      " is above all of those.";
    let crossSquares = null;
    for (let qty = roofMeta.min; qty <= roofMeta.max; qty += roofMeta.step) {
      if (at(qty).allInTypical >= fiftyThousand) {
        crossSquares = qty;
        break;
      }
    }
    if (crossSquares != null) {
      const crossed = at(crossSquares);
      answer +=
        " On the typical path the same scale first reaches " +
        usd(fiftyThousand) +
        " at " +
        crossSquares +
        " squares (" +
        usd(crossed.allInTypical) +
        " typical).";
    }
    answer +=
      " Above " +
      usd(fortyThousand) +
      " the like-for-like exemption no longer applies, so a building permit would be needed. The permit section has that fee.";
    charlotteFaqs.push({
      question: "Is " + usd(fiftyThousand) + " too much for a roof replacement in " + charlotte.name + "?",
      answer,
    });
  }
}

if (dallasFaqs.length !== 3) fail("expected 3 Dallas AC FAQs from data guards, got " + dallasFaqs.length);
if (charlotteFaqs.length !== 2) fail("expected 2 Charlotte roof FAQs from data guards, got " + charlotteFaqs.length);
if (charlotteRange !== "bandLow/bandHigh") {
  fail("Charlotte quantity 22 range fields are " + charlotteRange + " (hero band fields were expected)");
}

const dallasFile = path.join(outDir, "cost/hvac-replacement/dallas-tx/index.html");
const charlotteFile = path.join(outDir, "cost/roof-replacement/charlotte-nc/index.html");
const dallasHtml = fs.existsSync(dallasFile) ? fs.readFileSync(dallasFile, "utf8") : "";
const charlotteHtml = fs.existsSync(charlotteFile) ? fs.readFileSync(charlotteFile, "utf8") : "";
if (!dallasHtml) fail("missing " + path.relative(root, dallasFile));
if (!charlotteHtml) fail("missing " + path.relative(root, charlotteFile));

expectFaqs(
  "dallas-hvac",
  dallasHtml,
  dallasFaqs,
  dallasEst
    ? { allInTypical: dallasEst.allInTypical, allInHigh: dallasEst.allInHigh, fee: permitDisplayUsd(dallasEst) }
    : null,
);
const charlotteTypical = charlotte && roof ? buildEstimate(roof, charlotte, charlottePermit, roofMeta.defaultQuantity) : null;
expectFaqs(
  "charlotte-roof",
  charlotteHtml,
  charlotteFaqs,
  charlotteTypical
    ? {
        allInTypical: charlotteTypical.allInTypical,
        allInHigh: charlotteTypical.allInHigh,
        fee: permitDisplayUsd(charlotteTypical),
      }
    : null,
);

if (charlotteAt22 && charlotteFaqs[0] && !charlotteFaqs[0].answer.includes(usd(charlotteAt22.bandLow))) {
  fail("Charlotte 2,200 sq ft answer missing band low " + usd(charlotteAt22.bandLow));
}
if (charlotteAt22 && charlotteFaqs[0] && !charlotteFaqs[0].answer.includes(usd(charlotteAt22.bandHigh))) {
  fail("Charlotte 2,200 sq ft answer missing band high " + usd(charlotteAt22.bandHigh));
}

if (failures.length) {
  console.error("dal-clt-faq-check: " + failures.length + " mismatch(es)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}

const dallasFee = dallasEst ? permitDisplayUsd(dallasEst) : null;
console.log(
  "dal-clt-faq-check: Dallas HVAC " +
    dallasFaqs.length +
    " FAQs first T=" +
    usd(dallasEst.allInTypical) +
    " BL=" +
    usd(dallasEst.bandLow) +
    " BH=" +
    usd(dallasEst.bandHigh) +
    " high=" +
    usd(dallasEst.allInHigh) +
    " F=" +
    usd(dallasFee) +
    "; Charlotte roof " +
    charlotteFaqs.length +
    " FAQs first qty22=" +
    (charlotteAt22 ? usd(charlotteAt22.allInTypical) : "n/a") +
    " range=" +
    charlotteRange +
    " typicalHigh=" +
    (charlotteTypical ? usd(charlotteTypical.allInHigh) : "n/a"),
);
