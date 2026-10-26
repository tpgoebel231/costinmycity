import { cityLabel } from "@/lib/data-client";
import { inlineProjectName, projectMeta } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { moneyExact } from "@/lib/sourcing";
import type { City, Permit, ProjectCost } from "@/lib/types";

const DRIVER_JOBS = new Set(["roof-replacement", "kitchen-remodel", "hvac-replacement", "deck"]);

export type CostDriversModel = {
  heading: string;
  included: string[];
  drivers: string[];
};

function asSentence(s: string): string {
  const t = keepHvac(s.trim());
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function permitFeeKnown(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}

/** Scope is in the intro. The size table and permit section hold the rest. */
function includedBullets(_project: ProjectCost): string[] {
  return [];
}

function sizeDriver(project: ProjectCost): string {
  if (project.projectSlug === "roof-replacement") {
    return "Size is roof squares. One square is 100 sq ft of roof surface, not floor area. The size table lists the low, typical, and high.";
  }
  if (project.projectSlug === "kitchen-remodel") {
    return "Size is the kitchen floor area. The size table lists the low, typical, and high.";
  }
  if (project.projectSlug === "deck") {
    return "Size is the deck surface area. The size table lists the low, typical, and high.";
  }
  if (project.projectSlug === "hvac-replacement") {
    return "Cost scales with the number of systems, not a separate tonnage price.";
  }
  return asSentence("Job cost scales with " + projectMeta(project.projectSlug).quantityLabel.toLowerCase());
}

function wageDriver(project: ProjectCost, city: City): string {
  return asSentence(
    "Labor for " +
      inlineProjectName(project.projectSlug) +
      " in " +
      cityLabel(city) +
      " is adjusted for local construction wages",
  );
}

/** The wage sentence already says materials stay at the national figure. */
function materialsDriver(_project: ProjectCost, _city: City): string {
  return "";
}

function permitDriver(_city: City, permit: Permit | null | undefined): string {
  const fee = permit?.feeTypicalUsd ?? null;
  if (permitFeeKnown(permit) && fee != null) {
    const exempt = permit?.permitRequired === false && fee === 0;
    const lead = exempt
      ? "This typical job does not need a permit, so the permit fee is "
      : "The permit fee on the typical job is ";
    return asSentence(
      lead + moneyExact(fee) + ". The permit section on this page has the schedule detail",
    );
  }
  return "The permit fee is not listed on the city schedule, so that line is blank.";
}

/**
 * Short "what moves the price" lines. Schedule math stays in the permit section.
 */
export function costDrivers(
  project: ProjectCost,
  city: City,
  permit: Permit | null | undefined,
): CostDriversModel | null {
  if (!DRIVER_JOBS.has(project.projectSlug)) return null;

  return {
    heading: "What moves the price",
    included: includedBullets(project),
    drivers: [
      sizeDriver(project),
      wageDriver(project, city),
      materialsDriver(project, city),
      permitDriver(city, permit),
    ].filter(Boolean),
  };
}
