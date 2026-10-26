import { cityLabel } from "@/lib/data-client";
import { sanitizeCopy } from "@/lib/dashes";
import { buildEstimate, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { numberFmt, usd } from "@/lib/format";
import { highBandReachPrefix } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type DeckFaqItem = { question: string; answer: string };

const DECK_TYPICAL_SQFT = 320;
const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);

/** 10x10, 16x20 (typical), 20x20. 12x12=144 and 16x16=256 are off the step of 10. */
const DECK_SIZES = [
  { label: "10x10", sqft: 100, typical: false },
  { label: "16x20", sqft: 320, typical: true },
  { label: "20x20", sqft: 400, typical: false },
] as const;

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  const done = /[.!?]["']?$/.test(t) ? t : t + ".";
  return sanitizeCopy(done);
}

function deckBasisOk(project: ProjectCost): boolean {
  if (project.projectSlug !== "deck") return false;
  const meta = projectMeta(project.projectSlug);
  return meta.pricing === "per-unit" && meta.defaultQuantity === DECK_TYPICAL_SQFT && meta.quantityStep > 0;
}

function feeAdded(est: Estimate): number {
  return est.allInTypical - est.job.typical;
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
 * Permit sentence for a priced deck size. Null omits the whole FAQ.
 *
 * Print permitDisplayUsd with usd(), the same formatter the hero permit line
 * uses: a recorded fee keeps its cents, and a scaled per-sqft fee keeps the
 * estimate's scaled value. Omit unless Math.round(display) equals the fee
 * added into allInTypical.
 *
 * Fee 0 / permitRequired false uses the site's exempt wording (usually no
 * city permit fee on the typical path). valuation/sliding/tiered/area/unknown/other
 * name the recorded typical fee and say a larger job can carry a different fee.
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

/** 10x10, then 16x20, then 20x20. Off-step sizes and unprovable permit fees are omitted. */
export function deckSizeFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): DeckFaqItem[] {
  if (!deckBasisOk(project)) return [];
  const meta = projectMeta(project.projectSlug);
  const at = (qty: number) => buildEstimate(project, city, permit ?? undefined, qty);
  const items: DeckFaqItem[] = [];

  for (const size of DECK_SIZES) {
    if (!onQuantityStep(size.sqft, meta.quantityMin, meta.quantityMax, meta.quantityStep)) continue;
    const atSize = at(size.sqft);
    const permitCopy = permitSentence(atSize);
    if (!permitCopy) continue;
    const hasBand = Number.isFinite(atSize.bandLow) && Number.isFinite(atSize.bandHigh);
    const range = hasBand
      ? "most projects run " + usd(atSize.bandLow) + " to " + usd(atSize.bandHigh)
      : usd(atSize.allInLow) + " low to " + usd(atSize.allInHigh) + " high";
    const prefix = highBandReachPrefix(project);
    let intro =
      "A " + size.label + " deck is " + numberFmt(size.sqft) + " sq ft of walking surface";
    if (size.typical && size.sqft === meta.defaultQuantity) {
      intro += ", the typical size the calculator on this page starts at";
    }
    intro += ".";
    let cost =
      "In " +
      cityLabel(city) +
      ", the typical all-in cost at that size is " +
      usd(atSize.allInTypical) +
      ", and " +
      range +
      ".";
    if (prefix) {
      cost += " " + prefix + usd(atSize.allInHigh) + ".";
    }
    items.push({
      question: "How much does a " + size.label + " deck cost in " + city.name + "?",
      answer: asSentence(intro + " " + cost + " " + permitCopy.sentence),
    });
  }

  return items;
}
