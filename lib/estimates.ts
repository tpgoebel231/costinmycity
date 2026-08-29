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
}

export function getAdjustment(project: ProjectCost, citySlug: string): CityAdjustment | undefined {
  return project.cityAdjustments?.[citySlug];
}

export function extraAmount(extra: { feeUsd?: number | null; amountUsd?: number | null }): number | null {
  if (typeof extra.feeUsd === "number") return extra.feeUsd;
  if (typeof extra.amountUsd === "number") return extra.amountUsd;
  return null;
}

export function cityJobCost(project: ProjectCost, citySlug: string, quantity: number) {
  const adj = getAdjustment(project, citySlug);
  const multiplier = adj?.multiplier ?? 1;
  const meta = projectMeta(project.projectSlug);
  const laborShare = project.laborShare ?? 0.5;
  const materialShare = project.materialShare ?? project.materialsShare ?? 1 - laborShare;

  let low: number;
  let typical: number;
  let high: number;

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

function scalePermit(permit: Permit | null, jobTypical: number, quantity: number, defaultQty: number) {
  if (!permit) return { low: null as number | null, typical: null as number | null, high: null as number | null };
  const model = permit.feeModel;
  const qtyRatio = defaultQty > 0 ? quantity / defaultQty : 1;
  const assumed = permit.typicalProjectValueUsd || permit.assumedValuationUsd?.typical || 0;
  const valueRatio = assumed > 0 ? jobTypical / assumed : qtyRatio;

  const scale = (n: number | null): number | null => {
    if (n == null) return null;
    if (model === "flat" || model === "none") return Math.round(n);
    if (model === "valuation" || model === "sliding") return Math.round(n * valueRatio);
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
    allInLow: job.low + (permitKnown ? pLow : 0),
    allInTypical: job.typical + (permitKnown ? pTyp : 0),
    allInHigh: job.high + (permitKnown ? pHigh : 0),
  };
}
