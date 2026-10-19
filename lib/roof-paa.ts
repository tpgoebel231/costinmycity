import { cityLabel } from "@/lib/data-client";
import { sanitizeCopy } from "@/lib/dashes";
import { buildEstimate, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { numberFmt, usd } from "@/lib/format";
import { highBandReachPrefix } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { ROOF_SQUARES, SQFT_PER_ROOF_SQUARE, roofSquaresPhrase } from "@/lib/roof-size";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type RoofFaqItem = { question: string; answer: string };

const FIFTY_THOUSAND = 50000;
const FORTY_THOUSAND = 40000;
const HOME_SQFT = [2200, 2800] as const;
const STEEP_REACH = "Premium or steep roofs can reach ";
const SCALED_FEE_MODELS = new Set(["per_sqft", "per_square", "per-sqft"]);
const VALUATION_FEE_MODELS = new Set(["valuation", "sliding", "tiered", "area", "unknown"]);

/**
 * Charlotte roof row: statutory $0 plus a recorded LUESA alternate. Not other cities.
 * The $40,000 exemption sentence stays behind this guard.
 */
export function charlotteRoofStatuteExempt(permit: Permit | null | undefined): boolean {
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

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  const done = /[.!?]["']?$/.test(t) ? t : t + ".";
  return sanitizeCopy(done);
}

function roofBasisOk(project: ProjectCost): boolean {
  if (project.projectSlug !== "roof-replacement") return false;
  const meta = projectMeta(project.projectSlug);
  return meta.pricing === "job" && meta.defaultQuantity === ROOF_SQUARES.typical && meta.quantityStep > 0;
}

function feeAdded(est: Estimate): number {
  return est.allInTypical - est.job.typical;
}

/**
 * Permit sentence for a priced roof size. Null omits the whole FAQ.
 *
 * Print permitDisplayUsd with usd(), the same formatter the hero permit line
 * and the permit callout use: a recorded fee keeps its cents, and a scaled
 * per-square fee keeps the estimate's scaled value. The total adds the
 * rounded dollar. Omit unless Math.round(display) equals the fee added into
 * allInTypical.
 *
 * thoseFigures is only the $50,000 answer that says "$50,000 is above all of
 * those." "Those figures" refers to the range and the reach. Size answers,
 * and the other $50,000 comparisons, stay "That figure".
 */
function permitSentence(
  est: Estimate,
  kind: "size" | "budget",
  thoseFigures: boolean,
): { branch: string; sentence: string } | null {
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

  if (feeTypical === 0) {
    if (display == null || Math.round(display) !== added) return null;
    return {
      branch: "zero",
      sentence: "The permit fee on the typical path is " + usd(0) + ", so that is the job cost.",
    };
  }

  if (display == null || Math.round(display) !== added) return null;
  const feeLabel = usd(display);
  const lead = thoseFigures ? "Those figures include the " : "That figure includes the ";
  const model = permit.feeModel;

  if (model === "flat") {
    return {
      branch: "flat",
      sentence: lead + feeLabel + " typical permit fee.",
    };
  }

  if (SCALED_FEE_MODELS.has(model)) {
    const where = kind === "size" ? "at this size" : "at the typical size";
    return {
      branch: "scaled",
      sentence: lead + feeLabel + " permit fee " + where + ".",
    };
  }

  if (VALUATION_FEE_MODELS.has(model)) {
    if (kind === "budget") {
      return {
        branch: "valuation",
        sentence:
          lead +
          feeLabel +
          " typical permit fee. A " +
          usd(FIFTY_THOUSAND) +
          " job can carry a different fee than the recorded typical one, which we do not compute here. The permit section has that fee.",
      };
    }
    return {
      branch: "valuation",
      sentence:
        lead +
        feeLabel +
        " typical permit fee. That fee is recorded for the typical job, and a larger job can carry a different fee that we do not compute here.",
    };
  }

  return null;
}

function onQuantityStep(squares: number, min: number, max: number, step: number): boolean {
  return (
    Number.isInteger(squares) &&
    squares >= min &&
    squares <= max &&
    step > 0 &&
    (squares - min) % step === 0
  );
}

/** 2,200 sq ft then 2,800 sq ft. Off-step sizes and unprovable permit fees are omitted. */
export function roofHomeSizeFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): RoofFaqItem[] {
  if (!roofBasisOk(project)) return [];
  const meta = projectMeta(project.projectSlug);
  const at = (qty: number) => buildEstimate(project, city, permit ?? undefined, qty);
  const items: RoofFaqItem[] = [];

  for (const roofSqFt of HOME_SQFT) {
    const squares = roofSqFt / SQFT_PER_ROOF_SQUARE;
    if (!onQuantityStep(squares, meta.quantityMin, meta.quantityMax, meta.quantityStep)) continue;
    const atSize = at(squares);
    const permitCopy = permitSentence(atSize, "size", false);
    if (!permitCopy) continue;
    const hasBand = Number.isFinite(atSize.bandLow) && Number.isFinite(atSize.bandHigh);
    const range = hasBand
      ? "most projects run " + usd(atSize.bandLow) + " to " + usd(atSize.bandHigh)
      : usd(atSize.allInLow) + " low to " + usd(atSize.allInHigh) + " high";
    items.push({
      question: "How much does a new roof cost on a " + numberFmt(roofSqFt) + " sq ft home in " + city.name + "?",
      answer: asSentence(
        "One square is " +
          SQFT_PER_ROOF_SQUARE +
          " sq ft of roof surface, so " +
          numberFmt(roofSqFt) +
          " sq ft of roof is " +
          squares +
          " squares. At " +
          squares +
          " squares in " +
          cityLabel(city) +
          " the calculator gives " +
          usd(atSize.allInTypical) +
          " typical, and " +
          range +
          ". " +
          permitCopy.sentence +
          " If " +
          numberFmt(roofSqFt) +
          " sq ft is your floor area, not your roof surface, measure the roof or ask your roofer for the squares, since the calculator prices roof surface",
      ),
    });
  }

  return items;
}

function budgetBranch(est: Estimate): "above" | "middle" | "inside" | null {
  const aboveAll =
    FIFTY_THOUSAND > est.allInHigh &&
    FIFTY_THOUSAND > est.bandHigh &&
    FIFTY_THOUSAND > est.bandLow &&
    FIFTY_THOUSAND > est.allInTypical;
  if (aboveAll) return "above";
  if (est.bandHigh < FIFTY_THOUSAND && FIFTY_THOUSAND <= est.allInHigh) return "middle";
  if (FIFTY_THOUSAND <= est.bandHigh) return "inside";
  return null;
}

/** $50,000 question. Null when the typical-path permit fee cannot be stated honestly. */
export function roofFiftyThousandFaqItem(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): RoofFaqItem | null {
  if (!roofBasisOk(project)) return null;
  const meta = projectMeta(project.projectSlug);
  const at = (qty: number) => buildEstimate(project, city, permit ?? undefined, qty);
  const atTypical = at(meta.defaultQuantity);
  const branch = budgetBranch(atTypical);
  if (!branch) return null;
  const steep = highBandReachPrefix(project) === STEEP_REACH;
  if ((branch === "above" || branch === "middle") && !steep) return null;
  const permitCopy = permitSentence(atTypical, "budget", branch === "above");
  if (!permitCopy) return null;

  const phrase = roofSquaresPhrase(ROOF_SQUARES.typical);
  let answer: string;
  if (branch === "above") {
    answer =
      "For the job we price, yes. At the typical " +
      phrase +
      " in " +
      city.name +
      ", most projects run " +
      usd(atTypical.bandLow) +
      " to " +
      usd(atTypical.bandHigh) +
      ", and premium or steep roofs can reach " +
      usd(atTypical.allInHigh) +
      ". " +
      usd(FIFTY_THOUSAND) +
      " is above all of those.";
  } else if (branch === "middle") {
    answer =
      "At the typical " +
      phrase +
      " in " +
      city.name +
      ", " +
      usd(FIFTY_THOUSAND) +
      " is above the most-projects range of " +
      usd(atTypical.bandLow) +
      " to " +
      usd(atTypical.bandHigh) +
      " and within the premium or steep reach of " +
      usd(atTypical.allInHigh) +
      ".";
  } else {
    answer =
      "At the typical " +
      phrase +
      " in " +
      city.name +
      ", " +
      usd(FIFTY_THOUSAND) +
      " is inside the most-projects range of " +
      usd(atTypical.bandLow) +
      " to " +
      usd(atTypical.bandHigh) +
      ".";
  }

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= FIFTY_THOUSAND) {
      crossSquares = qty;
      break;
    }
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    answer +=
      " On the typical path the same scale first reaches " +
      usd(FIFTY_THOUSAND) +
      " at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical).";
  }

  if (charlotteRoofStatuteExempt(permit)) {
    answer +=
      " Above " +
      usd(FORTY_THOUSAND) +
      " the like-for-like exemption no longer applies, so a building permit would be needed. The permit section has that fee.";
  } else {
    answer += " " + permitCopy.sentence;
  }

  return {
    question: "Is " + usd(FIFTY_THOUSAND) + " too much for a roof replacement in " + city.name + "?",
    answer: asSentence(answer),
  };
}
