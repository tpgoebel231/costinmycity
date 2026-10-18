import { commonBandSource } from "./high-band";
import type { City, CityAdjustment, Permit, ProjectCost } from "./types";
import { projectMeta } from "./projects";

export interface JobCost {
  low: number;
  typical: number;
  high: number;
  laborTypical: number;
  materialsTypical: number;
  multiplier: number;
  unit: string;
  quantity: number;
  note?: string;
}

export interface Estimate {
  job: JobCost;
  permit: Permit | null;
  permitKnown: boolean;
  permitLow: number | null;
  permitTypical: number | null;
  permitHigh: number | null;
  allInLow: number;
  allInTypical: number;
  allInHigh: number;
  /** Chip and range ends. Common band when one is recorded, otherwise allInLow..allInHigh. */
  bandLow: number;
  bandHigh: number;
}

export function getAdjustment(project: ProjectCost, citySlug: string): CityAdjustment | undefined {
  return project.cityAdjustments?.[citySlug];
}

export function extraAmount(extra: { feeUsd?: number | null; amountUsd?: number | null }): number | null {
  if (typeof extra.feeUsd === "number") return extra.feeUsd;
  if (typeof extra.amountUsd === "number") return extra.amountUsd;
  return null;
}

function scaleBase(
  amount: number,
  multiplier: number,
  quantity: number,
  defaultQuantity: number,
  pricing: "job" | "per-unit",
  asJobTotal: boolean,
): number {
  if (pricing === "job" || asJobTotal) {
    const factor = defaultQuantity > 0 ? quantity / defaultQuantity : 1;
    return Math.round(amount * multiplier * factor);
  }
  return Math.round(amount * multiplier * quantity);
}

export function cityJobCost(project: ProjectCost, citySlug: string, quantity: number) {
  const adj = getAdjustment(project, citySlug);
  const multiplier = adj?.multiplier ?? 1;
  const meta = projectMeta(project.projectSlug);
  const laborShare = project.laborShare ?? 0.5;
  const materialShare = project.materialShare ?? project.materialsShare ?? 1 - laborShare;

  const low = scaleBase(project.nationalLow, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const typical = scaleBase(project.nationalTypical, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);
  const high = scaleBase(project.nationalHigh, multiplier, quantity, meta.defaultQuantity, meta.pricing, false);

  const laborTypical = Math.round(typical * laborShare);
  return {
    low,
    typical,
    high,
    laborTypical,
    materialsTypical: typical - laborTypical,
    multiplier,
    laborShare,
    materialShare,
    note: adj?.note ?? adj?.method,
  };
}

function scalePermit(permit: Permit | null, _jobTypical: number, quantity: number, defaultQty: number) {
  if (!permit) return { low: null as number | null, typical: null as number | null, high: null as number | null };
  const model = permit.feeModel;
  const qtyRatio = defaultQty > 0 ? quantity / defaultQty : 1;
  // Valuation/sliding fees are already computed for the permit row's assumed
  // valuations — do not re-scale by wage-indexed jobTypical (Seattle roof
  // was $743 hero vs Cost-details $706 from 742.97 × 11404/12000).
  const scale = (n: number | null): number | null => {
    if (n == null) return null;
    if (model === "flat" || model === "none") return Math.round(n);
    if (model === "valuation" || model === "sliding") return Math.round(n);
    if (model === "per_sqft" || model === "per_square" || model === "per-sqft") return Math.round(n * qtyRatio);
    return Math.round(n);
  };

  return { low: scale(permit.feeLowUsd), typical: scale(permit.feeTypicalUsd), high: scale(permit.feeHighUsd) };
}

export function buildEstimate(project: ProjectCost, city: City, permit: Permit | undefined, quantity?: number): Estimate {
  const meta = projectMeta(project.projectSlug);
  const qty = quantity ?? meta.defaultQuantity;
  const job = cityJobCost(project, city.slug, qty);
  const p = permit ?? null;
  const scaled = scalePermit(p, job.typical, qty, meta.defaultQuantity);
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
    job: {
      low: job.low,
      typical: job.typical,
      high: job.high,
      laborTypical: job.laborTypical,
      materialsTypical: job.materialsTypical,
      multiplier: job.multiplier,
      unit: project.unit,
      quantity: qty,
      note: job.note,
    },
    permit: p,
    permitKnown,
    permitLow: scaled.low,
    permitTypical: scaled.typical,
    permitHigh: scaled.high,
    allInLow: job.low + addLow,
    allInTypical: job.typical + (permitKnown ? pTyp : 0),
    allInHigh: job.high + addHigh,
    bandLow: bandJobLow + addLow,
    bandHigh: bandJobHigh + addHigh,
  };
}

/**
 * Permit dollars to show next to an estimate. The estimate rounds fees to
 * whole dollars for its sums; when that rounded value is just the recorded
 * fee (flat or valuation rows), show the recorded fee itself so a $75.50 fee
 * never reads $76 in one table and $75.50 in the next. Scaled per-square-foot
 * fees keep the estimate value.
 */
export function permitDisplayUsd(est: Estimate): number | null {
  const t = est.permitTypical;
  const recorded = est.permit?.feeTypicalUsd;
  if (t != null && typeof recorded === "number" && Math.round(recorded) === t) return recorded;
  return t;
}
