import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { LAUNCH_PROJECTS } from "@/lib/types";
import type { City, Permit, ProjectCost } from "@/lib/types";

const LAUNCH_JOBS = new Set<string>(LAUNCH_PROJECTS);

const CAPTION =
  "Labor and materials from our wage-indexed model at the typical job size. Permit uses the recorded municipal schedule when known; blank means we have not extracted a fee and do not invent one.";

export type CostBreakdownRow = {
  label: string;
  amountLabel: string;
  emphasis?: boolean;
};

export type CostBreakdownModel = {
  heading: string;
  caption: string;
  rows: CostBreakdownRow[];
  noteLine: string | null;
};

function wageNote(project: ProjectCost, city: City): string | null {
  const adj = project.cityAdjustments?.[city.slug];
  const multiplier = adj?.multiplier;
  if (multiplier == null) return null;

  // multiplier is the whole job (labor share times the labor wage index, plus materials at 1).
  // laborWageMultiplier is the labor-share index shown in the metro wage table.
  const parts: string[] = [];
  if (adj.laborWageMultiplier != null) {
    parts.push("labor share indexed at " + adj.laborWageMultiplier + "\u00d7");
  }
  if (adj.blsConstructionMeanHourlyUsd != null) {
    parts.push(
      "BLS construction mean hourly $" + adj.blsConstructionMeanHourlyUsd.toFixed(2),
    );
  }
  parts.push("materials at the national figure");
  return (
    "Overall job multiplier for this metro is " +
    multiplier +
    "\u00d7 (" +
    parts.join("; ") +
    ")."
  );
}

/**
 * Crawlable typical-job breakdown from buildEstimate at default quantity.
 * Always returns a model for the four launch money jobs. Never invents permit dollars.
 */
export function costBreakdown(
  project: ProjectCost,
  city: City,
  permit: Permit | null | undefined,
): CostBreakdownModel | null {
  if (!LAUNCH_JOBS.has(project.projectSlug)) return null;

  let est;
  try {
    est = buildEstimate(project, city, permit ?? undefined);
  } catch {
    return null;
  }
  if (!est) return null;

  const permitLabel =
    est.permitKnown && est.permitTypical != null ? usd(est.permitTypical) : "Blank";

  return {
    heading: "Typical cost breakdown",
    caption: CAPTION,
    rows: [
      { label: "Labor (allocated)", amountLabel: usd(est.job.laborTypical) },
      { label: "Materials (allocated)", amountLabel: usd(est.job.materialsTypical) },
      { label: "Permit", amountLabel: permitLabel },
      { label: "All-in typical", amountLabel: usd(est.allInTypical), emphasis: true },
    ],
    noteLine: wageNote(project, city),
  };
}
