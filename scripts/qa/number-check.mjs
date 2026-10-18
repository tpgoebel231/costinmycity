/**
 * Hero typical/low/high, permit fee, and calculator default must match
 * the data files. Math is a plain-JS mirror of lib/estimates.ts and the
 * project defaults in lib/projects.ts. Do not change those modules from here.
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
  "roof-replacement": { pricing: "job", defaultQuantity: 16 },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1 },
  deck: { pricing: "per-unit", defaultQuantity: 320 },
  "kitchen-remodel": { pricing: "per-unit", defaultQuantity: 200 },
};

const PAGES = [
  ["roof-replacement", "chicago-il"],
  ["roof-replacement", "charlotte-nc"],
  ["roof-replacement", "st-louis-mo"],
  ["hvac-replacement", "indianapolis-in"],
  ["kitchen-remodel", "phoenix-az"],
  ["deck", "boston-ma"],
  ["roof-replacement", "denver-co"],
  ["hvac-replacement", "seattle-wa"],
  ["kitchen-remodel", "austin-tx"],
  ["deck", "atlanta-ga"],
];

function cityJobCost(project, citySlug, quantity) {
  const meta = META[project.projectSlug];
  const adj = project.cityAdjustments?.[citySlug];
  const multiplier = adj?.multiplier ?? 1;
  const laborShare = project.laborShare ?? 0.5;
  let low;
  let typical;
  let high;
  if (meta.pricing === "job") {
    const factor = meta.defaultQuantity > 0 ? quantity / meta.defaultQuantity : 1;
    low = Math.round(project.nationalLow * multiplier * factor);
    typical = Math.round(project.nationalTypical * multiplier * factor);
    high = Math.round(project.nationalHigh * multiplier * factor);
  } else {
    low = Math.round(project.nationalLow * multiplier * quantity);
    typical = Math.round(project.nationalTypical * multiplier * quantity);
    high = Math.round(project.nationalHigh * multiplier * quantity);
  }
  const laborTypical = Math.round(typical * laborShare);
  return { low, typical, high, laborTypical, materialsTypical: typical - laborTypical };
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
  return {
    allInLow: job.low + (permitKnown ? pLow : 0),
    allInTypical: job.typical + (permitKnown ? pTyp : 0),
    allInHigh: job.high + (permitKnown ? pHigh : 0),
    permitTypical: scaled.typical,
    permit,
  };
}

function permitDisplayUsd(est) {
  const t = est.permitTypical;
  const recorded = est.permit?.feeTypicalUsd;
  if (t != null && typeof recorded === "number" && Math.round(recorded) === t) return recorded;
  return t;
}

function attr(html, name) {
  const match = html.match(new RegExp("\\b" + name + '="([^"]*)"'));
  return match ? match[1] : null;
}

function close(actual, expected) {
  if (expected == null) return actual == null || actual === "";
  if (actual == null || actual === "") return false;
  return Math.abs(Number(actual) - expected) < 0.001;
}

const failures = [];
for (const [projectSlug, citySlug] of PAGES) {
  const city = cities.find((item) => item.slug === citySlug);
  const project = projects.find((item) => item.projectSlug === projectSlug);
  const permit = permits.find((item) => item.citySlug === citySlug && item.projectSlug === projectSlug);
  const rel = "cost/" + projectSlug + "/" + citySlug + "/index.html";
  const file = path.join(outDir, rel);
  if (!city || !project || !fs.existsSync(file)) {
    failures.push(rel + " missing city, project, or html");
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const est = buildEstimate(project, city, permit, META[projectSlug].defaultQuantity);
  const fee = permitDisplayUsd(est);
  const checks = [
    ["data-hero-typical", est.allInTypical],
    ["data-hero-low", est.allInLow],
    ["data-hero-high", est.allInHigh],
    ["data-permit", fee],
    ["data-calc-default", est.allInTypical],
    ["data-qty", META[projectSlug].defaultQuantity],
  ];
  for (const [name, expected] of checks) {
    const actual = attr(html, name);
    if (!close(actual, expected)) {
      failures.push(rel + " " + name + " html=" + actual + " data=" + expected);
    }
  }
  const input = html.match(/<input\b[^>]*id="qty-num"[^>]*>/);
  const value = input ? (input[0].match(/\bvalue="([^"]*)"/) || [])[1] : null;
  if (!close(value, META[projectSlug].defaultQuantity)) {
    failures.push(rel + " qty input html=" + value + " data=" + META[projectSlug].defaultQuantity);
  }
  console.log(
    projectSlug + "/" + citySlug +
      " typical=" + est.allInTypical +
      " low=" + est.allInLow +
      " high=" + est.allInHigh +
      " permit=" + (fee == null ? "blank" : fee),
  );
}

if (failures.length) {
  console.error("number-check: " + failures.length + " mismatch(es)");
  for (const line of failures) console.error("  " + line);
  process.exit(1);
}
console.log("number-check: " + PAGES.length + " pages match data-file estimates");
