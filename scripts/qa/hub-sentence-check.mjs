/**
 * Recompute each city hub's one-line hero sentence from the data files and
 * compare it to the rendered text. Does not import the page helper, so a
 * drift in either copy fails the build.
 *
 * Math mirrors lib/estimates.ts (all-in typical) and lib/city-hub-deepen.ts
 * (nearest $1k, published minimum, else lowest feeTypicalUsd or feeLowUsd).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = (Array.isArray(costsFile) ? costsFile : costsFile.projects).filter((item) => item?.projectSlug);

const ORDER = ["roof-replacement", "hvac-replacement", "deck", "kitchen-remodel"];
const META = {
  "roof-replacement": { pricing: "job", defaultQuantity: 16 },
  "hvac-replacement": { pricing: "job", defaultQuantity: 1 },
  deck: { pricing: "per-unit", defaultQuantity: 320 },
  "kitchen-remodel": { pricing: "per-unit", defaultQuantity: 200 },
};

function launchSlugs() {
  const fromData = projects.map((item) => item.projectSlug);
  const ordered = ORDER.filter((slug) => fromData.includes(slug));
  const extra = fromData.filter((slug) => !ORDER.includes(slug));
  return [...ordered, ...extra];
}

function scaleBase(amount, multiplier, quantity, defaultQuantity, pricing) {
  if (pricing === "job") {
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

function allInTypical(project, city, permit) {
  const meta = META[project.projectSlug] || { pricing: "job", defaultQuantity: 1 };
  const multiplier = project.cityAdjustments?.[city.slug]?.multiplier ?? 1;
  const jobTypical = scaleBase(project.nationalTypical, multiplier, meta.defaultQuantity, meta.defaultQuantity, meta.pricing);
  const scaled = scalePermit(permit, meta.defaultQuantity, meta.defaultQuantity);
  const permitKnown = scaled.typical != null || scaled.low != null || scaled.high != null;
  const pTyp = scaled.typical ?? scaled.low ?? 0;
  return jobTypical + (permitKnown ? pTyp : 0);
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

function formatHubThousands(amount) {
  return "$" + Math.round(amount / 1000) + "k";
}

function sameMoney(n, expected) {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

function permitRowRecordsValuation(permit) {
  if (!permit) return false;
  const assumed = permit.assumedValuationUsd;
  if (assumed && (typeof assumed.low === "number" || typeof assumed.typical === "number" || typeof assumed.high === "number")) {
    return true;
  }
  return typeof permit.typicalProjectValueUsd === "number";
}

function permitText(permit) {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    ...(permit.extras || []).map((extra) => [extra.name, extra.note].filter(Boolean).join(" ")),
  ].join(" ");
}

function isPublishedMinimumFloor(permit) {
  if (!permit || permitRowRecordsValuation(permit)) return false;
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return false;
  if (permit.feeLowUsd != null && permit.feeLowUsd !== fee) return false;
  return /published (city )?minimum|minimum permit/i.test(permitText(permit));
}

function planBasedMinimumAmounts(text) {
  const amounts = [];
  const re = /[^.]{0,24}plan-based[^.]{0,80}/gi;
  let match;
  while ((match = re.exec(text))) {
    const window = match[0];
    if (!/\bmin(?:imum)?\b/i.test(window)) continue;
    for (const dollar of window.matchAll(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g)) {
      amounts.push(Number(dollar[1].replace(/,/g, "")));
    }
  }
  return amounts;
}

function feeFieldFor(permit, amount) {
  if (sameMoney(permit.feeTypicalUsd, amount)) return "feeTypicalUsd";
  if (sameMoney(permit.feeLowUsd, amount)) return "feeLowUsd";
  if (sameMoney(permit.feeHighUsd, amount)) return "feeHighUsd";
  for (const extra of permit.extras || []) {
    if (sameMoney(extra.feeUsd, amount) || sameMoney(extra.amountUsd, amount)) return "extra fee";
  }
  return null;
}

function permitStart(city) {
  // Lowest typical permit fee among permit-required launch rows (same figure the hub cards show).
  let best = null;
  for (const slug of launchSlugs()) {
    const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === slug);
    if (!permit || permit.permitRequired !== true) continue;
    const value = permit.feeTypicalUsd;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    if (!best || value < best.amount) best = { amount: value };
  }
  if (!best) return null;
  return { amount: best.amount, qualifier: "" };
}

export function sentenceFor(city) {
  const amounts = [];
  for (const slug of launchSlugs()) {
    const project = projects.find((item) => item.projectSlug === slug);
    if (!project) continue;
    const permit = permits.find((item) => item.citySlug === city.slug && item.projectSlug === slug);
    amounts.push(allInTypical(project, city, permit));
  }
  if (!amounts.length) return "";
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  let sentence = "A typical " + city.name + " home project runs " + formatHubThousands(low) + " to " + formatHubThousands(high) + ".";
  const start = permitStart(city);
  if (start) sentence += " Permits start at " + usd(start.amount) + start.qualifier + ".";
  return sentence;
}

function heroText(html) {
  const match = html.match(/<p class="hero-answer">([^<]*)<\/p>/);
  return match ? match[1].replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"') : null;
}

function main() {
const failures = [];
let checked = 0;
for (const city of cities) {
  if (!city?.slug) continue;
  const rel = "city/" + city.slug + "/index.html";
  const file = path.join(outDir, rel);
  if (!fs.existsSync(file)) {
    failures.push(rel + " missing");
    continue;
  }
  const expected = sentenceFor(city);
  const actual = heroText(fs.readFileSync(file, "utf8"));
  checked += 1;
  if (actual !== expected) {
    failures.push(city.slug + "\n  expected: " + expected + "\n  actual:   " + actual);
  }
}

if (failures.length) {
  console.error("hub-sentence-check: " + failures.length + " hub(s) do not match data.");
  for (const failure of failures.slice(0, 20)) console.error(failure);
  process.exit(1);
}

console.log("hub-sentence-check: " + checked + " hubs match the data-file sentence.");
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) main();
