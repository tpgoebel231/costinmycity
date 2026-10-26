import { kitchenSizeBands } from "@/lib/cost-by-size";
import { cityLabel } from "@/lib/data-client";
import { sanitizeCopy } from "@/lib/dashes";
import { buildEstimate, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { numberFmt, usd } from "@/lib/format";
import { highBandReachPrefix } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type KitchenFaqItem = { question: string; answer: string };

const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);

/**
 * A kitchen question that names this sq ft. "200 sq ft" and
 * "150, 200, or 400 sq ft" both count. Comma thousands (1,200) stay one number.
 */
const SQFT_LIST =
  /((?:\d{1,3}(?:,\d{3})+|\d+)(?:\s*,\s*(?:or\s+)?(?:\d{1,3}(?:,\d{3})+|\d+))*(?:\s+or\s+(?:\d{1,3}(?:,\d{3})+|\d+))?)\s+sq\s*ft/gi;
const SQFT_NUMBER = /\d{1,3}(?:,\d{3})+|\d+/g;

type KitchenBand = "low" | "typical" | "high";

type KitchenSize = { sqft: number; band: KitchenBand };

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  const done = /[.!?]["']?$/.test(t) ? t : t + ".";
  return sanitizeCopy(done);
}

function parseLeadingSf(label: string): number | null {
  const match = /^\s*(\d+)\s*sf\b/i.exec(label);
  return match ? Number(match[1]) : null;
}

function onQuantityStep(sqft: number, min: number, max: number, step: number): boolean {
  return (
    Number.isInteger(sqft) &&
    sqft >= min &&
    sqft <= max &&
    step > 0 &&
    (sqft - min) % step === 0
  );
}

/**
 * 150 / 200 / 400 from TYPICAL_JOB_SPECS and SIZE_BANDS. Null (emit nothing)
 * unless they agree, each size is on the calculator step, and the typical
 * size is projectMeta defaultQuantity.
 */
export function kitchenPaaSizes(project: ProjectCost): KitchenSize[] | null {
  if (project.projectSlug !== "kitchen-remodel") return null;
  const spec = typicalJobSpec("kitchen-remodel");
  const meta = projectMeta("kitchen-remodel");
  const bands = kitchenSizeBands();
  if (!spec || bands.length !== 3) return null;
  if (meta.pricing !== "per-unit" || meta.quantityStep <= 0) return null;
  if (!/same-footprint/i.test(spec.why) || !/a larger gut of the room/i.test(spec.why)) return null;

  const ordered: KitchenSize[] = [];
  for (const band of ["low", "typical", "high"] as const) {
    const fromSpec = parseLeadingSf(spec[band]);
    const row = bands.find((item) => item.band === band);
    if (fromSpec == null || !row || row.qty !== fromSpec) return null;
    if (!onQuantityStep(fromSpec, meta.quantityMin, meta.quantityMax, meta.quantityStep)) return null;
    ordered.push({ sqft: fromSpec, band });
  }
  const typical = ordered.find((item) => item.band === "typical");
  if (!typical || typical.sqft !== meta.defaultQuantity) return null;
  return ordered;
}

export function kitchenSqftNamedInQuestion(question: string): number[] {
  if (!/\bkitchen\b/i.test(question)) return [];
  const found: number[] = [];
  const re = new RegExp(SQFT_LIST.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(question))) {
    const parts = match[1].match(SQFT_NUMBER) || [];
    for (const part of parts) {
      const n = Number(part.replace(/,/g, ""));
      if (Number.isInteger(n)) found.push(n);
    }
  }
  return found;
}

export function kitchenQuestionCoversSqft(question: string, sqft: number): boolean {
  return kitchenSqftNamedInQuestion(question).includes(sqft);
}

export function kitchenSizeQuestion(cityName: string, sqft: number): string {
  return "How much does a " + numberFmt(sqft) + " sq ft kitchen remodel cost in " + cityName + "?";
}

function feeAdded(est: Estimate): number {
  return est.allInTypical - est.job.typical;
}

/**
 * Permit sentence for a priced kitchen size. Null omits the whole FAQ.
 *
 * Print permitDisplayUsd with usd(), the same formatter the hero permit line
 * uses. Omit unless Math.round(display) equals the fee added into allInTypical.
 * Valuation rows often keep one fee across sizes; print that added dollar.
 */
function permitSentence(est: Estimate): { branch: string; sentence: string } | null {
  const added = feeAdded(est);
  const display = permitDisplayUsd(est);
  const permit = est.permit;
  const feeTypical = permit?.feeTypicalUsd;

  if (!permit || feeTypical == null) {
    if (added !== 0) return null;
    return {
      branch: "missing",
      sentence: "No permit fee is included because the fee is not recorded.",
    };
  }

  if (feeTypical === 0 || (permit.permitRequired === false && added === 0)) {
    if (added !== 0) return null;
    if (feeTypical === 0 && (display == null || Math.round(display) !== added)) return null;
    return {
      branch: "zero",
      sentence: "There is usually no city permit fee on the typical path, so that is the job cost.",
    };
  }

  if (display == null || Math.round(display) !== added) return null;
  const feeLabel = usd(display);
  const lead = "That figure includes the ";
  const model = permit.feeModel;

  if (model === "flat") {
    return {
      branch: "flat",
      sentence: lead + feeLabel + " typical permit fee.",
    };
  }

  if (SCALED_FEE_MODELS.has(model)) {
    return {
      branch: "scaled",
      sentence: lead + feeLabel + " permit fee at this size.",
    };
  }

  // valuation / sliding / tiered / area / unknown / other, and any remaining model
  return {
    branch: "valuation",
    sentence:
      lead +
      feeLabel +
      " typical permit fee. That fee is recorded for the typical job, and a larger job can carry a different fee that we do not compute here.",
  };
}

function sizeIntro(size: KitchenSize): string {
  const n = numberFmt(size.sqft);
  if (size.band === "low") return "A " + n + " sq ft kitchen is a smaller same-footprint remodel.";
  if (size.band === "typical") {
    return "A " + n + " sq ft kitchen is the typical size the calculator on this page starts at.";
  }
  return "A " + n + " sq ft kitchen is a larger gut of the room.";
}

/**
 * 150, then 200, then 400. Off-step sizes, a drifted size basis, and
 * unprovable permit fees are omitted. Questions already on the page, or any
 * kitchen question that already names that sq ft, are omitted too.
 */
export function kitchenSizeFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
  existingQuestions: readonly string[] = [],
): KitchenFaqItem[] {
  const sizes = kitchenPaaSizes(project);
  if (!sizes) return [];
  const at = (qty: number) => buildEstimate(project, city, permit ?? undefined, qty);
  const prefix = highBandReachPrefix(project);
  const items: KitchenFaqItem[] = [];

  for (const size of sizes) {
    const question = kitchenSizeQuestion(city.name, size.sqft);
    if (existingQuestions.some((existing) => existing === question)) continue;
    if (existingQuestions.some((existing) => kitchenQuestionCoversSqft(existing, size.sqft))) continue;
    const atSize = at(size.sqft);
    const permitCopy = permitSentence(atSize);
    if (!permitCopy) continue;
    const hasBand = Number.isFinite(atSize.bandLow) && Number.isFinite(atSize.bandHigh);
    const range = hasBand
      ? "most projects run " + usd(atSize.bandLow) + " to " + usd(atSize.bandHigh)
      : usd(atSize.allInLow) + " low to " + usd(atSize.allInHigh) + " high";
    let cost =
      "In " +
      cityLabel(city) +
      ", the typical all-in cost at that size is " +
      usd(atSize.allInTypical) +
      ", and " +
      range +
      ".";
    if (prefix) cost += " " + prefix + usd(atSize.allInHigh) + ".";
    items.push({
      question,
      answer: asSentence(sizeIntro(size) + " " + cost + " " + permitCopy.sentence),
    });
  }

  return items;
}
