/**
 * ui.js estimateAt must match the plain-JS mirror of lib/estimates.ts
 * for every launch city, project, and quantity step.
 */
import fs from "fs";
import path from "path";
import vm from "vm";

const root = path.resolve(import.meta.dirname, "../..");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = Array.isArray(costsFile) ? costsFile : costsFile.projects;

const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16, min: 8, max: 60, step: 1 },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1, min: 1, max: 4, step: 1 },
  deck: { pricing: "per-unit", defaultQuantity: 320, min: 80, max: 1200, step: 10 },
  "kitchen-remodel": { pricing: "per-unit", defaultQuantity: 200, min: 80, max: 500, step: 10 },
};

function commonBand(project) {
  if (typeof project.commonLow === "number" && typeof project.commonHigh === "number") {
    return { low: project.commonLow, high: project.commonHigh, asJob: false };
  }
  return null;
}

function scaleBase(amount, multiplier, quantity, defaultQuantity, pricing, asJob) {
  if (pricing === "job" || asJob) {
    const factor = defaultQuantity > 0 ? quantity / defaultQuantity : 1;
    return Math.round(amount * multiplier * factor);
  }
  return Math.round(amount * multiplier * quantity);
}

function cityJobCost(project, citySlug, quantity) {
  const meta = META[project.projectSlug];
  const adj = project.cityAdjustments?.[citySlug];
  const multiplier = adj?.multiplier ?? 1;
  const laborShare = project.laborShare ?? 0.5;
  const low = scaleBase(project.nationalLow, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const typical = scaleBase(project.nationalTypical, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const high = scaleBase(project.nationalHigh, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const laborTypical = Math.round(typical * laborShare);
  return { low, typical, high, laborTypical, materialsTypical: typical - laborTypical, multiplier, laborShare };
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
  const job = cityJobCost(project, city.slug, qty);
  const scaled = scalePermit(permit, qty, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pLow = scaled.low ?? scaled.typical ?? 0;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  const pHigh = scaled.high ?? scaled.typical ?? 0;
  const recorded = permit?.feeTypicalUsd;
  let display = scaled.typical;
  if (scaled.typical != null && typeof recorded === "number" && Math.round(recorded) === scaled.typical) display = recorded;
  const common = commonBand(project);
  const bandJobLow = common
    ? scaleBase(common.low, job.multiplier, qty, meta.defaultQuantity, meta.pricing, common.asJob)
    : job.low;
  const bandJobHigh = common
    ? scaleBase(common.high, job.multiplier, qty, meta.defaultQuantity, meta.pricing, common.asJob)
    : job.high;
  const addLow = permitKnown ? pLow : 0;
  const addHigh = permitKnown ? pHigh : 0;
  return {
    allInLow: job.low + addLow,
    allInTypical: job.typical + (permitKnown ? pTyp : 0),
    allInHigh: job.high + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
    labor: job.laborTypical,
    materials: job.materialsTypical,
    job: job.typical,
    permitDisplay: permitKnown ? display : null,
  };
}

const context = { Intl, Math, Number, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "public/ui.js"), "utf8"), context);
const estimateAt = context.estimateAt;
const usd = context.usd;
if (typeof estimateAt !== "function") {
  console.error("calc-check: estimateAt was not loaded from public/ui.js");
  process.exit(1);
}

let checks = 0;
const failures = [];
for (const project of projects) {
  const meta = META[project.projectSlug];
  if (!meta) continue;
  for (const city of cities) {
    const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === project.projectSlug) || null;
    const adj = project.cityAdjustments?.[city.slug];
    const band = commonBand(project);
    const cfg = {
      pricing: meta.pricing,
      defaultQty: meta.defaultQuantity,
      nLow: project.nationalLow,
      nTyp: project.nationalTypical,
      nHigh: project.nationalHigh,
      commonLow: band ? band.low : null,
      commonHigh: band ? band.high : null,
      commonJob: band ? band.asJob : false,
      mult: adj?.multiplier ?? 1,
      labor: project.laborShare ?? 0.5,
      feeModel: permit?.feeModel || "",
      feeLow: permit?.feeLowUsd ?? null,
      feeTyp: permit?.feeTypicalUsd ?? null,
      feeHigh: permit?.feeHighUsd ?? null,
    };
    for (let qty = meta.min; qty <= meta.max; qty += meta.step) {
      const expected = buildEstimate(project, city, permit, qty);
      const actual = estimateAt(cfg, qty);
      checks += 1;
      const keys = ["allInLow", "allInTypical", "allInHigh", "bandLow", "bandHigh", "labor", "materials", "job", "permitDisplay"];
      for (const key of keys) {
        const a = actual[key];
        const e = expected[key];
        if (a !== e && !(a == null && e == null)) {
          failures.push(project.projectSlug + "/" + city.slug + " qty=" + qty + " " + key + " ui=" + a + " data=" + e);
          break;
        }
      }
      if (failures.length > 12) break;
    }
    if (failures.length > 12) break;
  }
  if (failures.length > 12) break;
}

if (usd(126.73) !== "$126.73" || usd(8954) !== "$8,954" || usd(0) !== "$0") {
  failures.push("usd format mismatch " + [usd(126.73), usd(8954), usd(0)].join(" | "));
}

if (failures.length) {
  console.error("calc-check: " + failures.length + " mismatch(es) in " + checks + " rows");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}
console.log("calc-check: " + checks + " quantity rows match lib/estimates.ts mirror");
