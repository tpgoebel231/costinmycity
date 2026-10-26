import { hvacSizeBands } from "@/lib/cost-by-size";
import { cityLabel } from "@/lib/data-client";
import { sanitizeCopy } from "@/lib/dashes";
import { buildEstimate, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { numberFmt, usd } from "@/lib/format";
import { highBandReachPrefix } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type HvacFaqItem = { question: string; answer: string };

const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);

/**
 * Item 1 is the typical 3-ton job (quantity 1). "3-ton", "3 ton", and
 * "36,000 BTU" all count. A 2-ton or 5-ton question does not.
 */
const THREE_TON = /\b3[-\s]?ton\b|(?:^|[^0-9])36,000\s*BTU/i;

/**
 * A number list followed by system(s). "1, 2, or 3 systems", "1 or 2 systems",
 * "1-system", and "2 HVAC systems" all count. "per system" has no number, so
 * it does not. Comma thousands (1,000) stay one number.
 */
const SYSTEM_LIST =
  /((?:\d{1,3}(?:,\d{3})+|\d+)(?:\s*,\s*(?:or\s+)?(?:\d{1,3}(?:,\d{3})+|\d+))*(?:\s+or\s+(?:\d{1,3}(?:,\d{3})+|\d+))?)\s*-?\s*(?:hvac\s+)?systems?\b/gi;
const SYSTEM_NUMBER = /\d{1,3}(?:,\d{3})+|\d+/g;

const TON_SPEC = "3-ton (36,000 BTU) like-for-like split system";

type HvacKind = "ton" | "count";

type HvacSize = { qty: number; kind: HvacKind };

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  const done = /[.!?]["']?$/.test(t) ? t : t + ".";
  return sanitizeCopy(done);
}

function onQuantityStep(qty: number, min: number, max: number, step: number): boolean {
  return Number.isInteger(qty) && qty >= min && qty <= max && step > 0 && (qty - min) % step === 0;
}

/**
 * Quantity 1 (typical 3-ton job), then 2 systems, then 3 systems.
 * Null (emit nothing) unless SIZE_BANDS, projectMeta, and the typical spec agree.
 */
export function hvacPaaSizes(project: ProjectCost): HvacSize[] | null {
  if (project.projectSlug !== "hvac-replacement") return null;
  const spec = typicalJobSpec("hvac-replacement");
  const meta = projectMeta("hvac-replacement");
  const bands = hvacSizeBands();
  if (!spec || bands.length !== 3) return null;
  if (meta.pricing !== "job" || meta.quantityLabel !== "Systems") return null;
  if (meta.defaultQuantity !== 1 || meta.quantityStep !== 1) return null;
  if (meta.quantityMin !== 1 || meta.quantityMax !== 4) return null;
  if (spec.typical !== TON_SPEC || !/3-ton/i.test(spec.typical)) return null;
  if (!/existing ducts/i.test(meta.blurb)) return null;
  const hint = meta.quantityHint || "";
  if (!/one system/i.test(hint) || !/second zone/i.test(hint) || !/separately/i.test(hint)) return null;

  const expected: { qty: number; band: "typical" | "high" }[] = [
    { qty: 1, band: "typical" },
    { qty: 2, band: "high" },
    { qty: 3, band: "high" },
  ];
  for (let i = 0; i < expected.length; i++) {
    const row = bands[i];
    const want = expected[i];
    if (!row || row.qty !== want.qty || row.band !== want.band) return null;
    if (!onQuantityStep(row.qty, meta.quantityMin, meta.quantityMax, meta.quantityStep)) return null;
  }
  if (bands[0].qty !== meta.defaultQuantity) return null;
  return [
    { qty: 1, kind: "ton" },
    { qty: 2, kind: "count" },
    { qty: 3, kind: "count" },
  ];
}

export function hvacQuestionMentionsThreeTon(question: string): boolean {
  return THREE_TON.test(question);
}

export function hvacSystemsNamedInQuestion(question: string): number[] {
  if (!/\bhvac\b/i.test(question)) return [];
  const found: number[] = [];
  const re = new RegExp(SYSTEM_LIST.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = re.exec(question))) {
    const parts = match[1].match(SYSTEM_NUMBER) || [];
    for (const part of parts) {
      const n = Number(part.replace(/,/g, ""));
      if (Number.isInteger(n)) found.push(n);
    }
  }
  return found;
}

export function hvacQuestionCoversSystems(question: string, qty: number): boolean {
  return hvacSystemsNamedInQuestion(question).includes(qty);
}

export function hvacSizeQuestion(cityName: string, size: HvacSize): string {
  if (size.kind === "ton") {
    return "How much does a 3-ton HVAC replacement cost in " + cityName + "?";
  }
  return "How much does it cost to replace " + numberFmt(size.qty) + " HVAC systems in " + cityName + "?";
}

function feeAdded(est: Estimate): number {
  return est.allInTypical - est.job.typical;
}

/**
 * Permit sentence for a priced HVAC size. Null omits the whole FAQ.
 * Same branches as lib/kitchen-paa.ts. Print the fee buildEstimate adds.
 * Omit unless Math.round(display) equals allInTypical minus job cost.
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

function countLead(qty: number): string | null {
  if (qty === 2) return "Two systems usually means two zones, and each system is counted separately.";
  if (qty === 3) return "Three systems usually means three zones, and each system is counted separately.";
  return null;
}

/**
 * 3-ton (quantity 1), then 2 systems, then 3 systems.
 * A drifted size basis and an unprovable permit fee omit every item.
 * A question already on the page is left as it is. Item 1 is also skipped
 * when any question mentions 3-ton, 3 ton, or 36,000 BTU. Items 2 and 3 are
 * skipped when an HVAC question already names that system count.
 */
export function hvacSizeFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
  existingQuestions: readonly string[] = [],
): HvacFaqItem[] {
  const sizes = hvacPaaSizes(project);
  if (!sizes) return [];
  const spec = typicalJobSpec("hvac-replacement");
  if (!spec) return [];
  const at = (qty: number) => buildEstimate(project, city, permit ?? undefined, qty);
  const prefix = highBandReachPrefix(project);
  const items: HvacFaqItem[] = [];

  for (const size of sizes) {
    const question = hvacSizeQuestion(city.name, size);
    if (existingQuestions.some((existing) => existing === question)) continue;
    if (size.kind === "ton" && existingQuestions.some((existing) => hvacQuestionMentionsThreeTon(existing))) continue;
    if (size.kind === "count" && existingQuestions.some((existing) => hvacQuestionCoversSystems(existing, size.qty))) {
      continue;
    }
    const atSize = at(size.qty);
    const permitCopy = permitSentence(atSize);
    if (!permitCopy) continue;
    if (!Number.isFinite(atSize.bandLow) || !Number.isFinite(atSize.bandHigh)) continue;
    if (!Number.isFinite(atSize.allInTypical)) continue;

    let lead: string;
    let cost: string;
    if (size.kind === "ton") {
      if (size.qty !== 1) continue;
      lead = "The typical HVAC job on this page is a " + spec.typical + " on existing ducts.";
      cost =
        "In " +
        cityLabel(city) +
        ", the typical all-in cost is " +
        usd(atSize.allInTypical) +
        ", and most projects run " +
        usd(atSize.bandLow) +
        " to " +
        usd(atSize.bandHigh) +
        ".";
      if (prefix) cost += " " + prefix + usd(atSize.allInHigh) + ".";
    } else {
      const intro = countLead(size.qty);
      if (!intro) continue;
      lead = intro;
      cost =
        "In " +
        cityLabel(city) +
        ", replacing " +
        numberFmt(size.qty) +
        " systems runs about " +
        usd(atSize.allInTypical) +
        " all in, with most projects at " +
        usd(atSize.bandLow) +
        " to " +
        usd(atSize.bandHigh) +
        ".";
    }

    items.push({
      question,
      answer: asSentence(lead + " " + cost + " " + permitCopy.sentence),
    });
  }

  return items;
}
