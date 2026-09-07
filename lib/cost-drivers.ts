import { cityLabel } from "@/lib/data-client";
import { usd } from "@/lib/format";
import { projectMeta, shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

const DRIVER_JOBS = new Set(["roof-replacement", "kitchen-remodel"]);

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

function firstSentence(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return asSentence(m ? m[0] : t);
}

function permitFeeKnown(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}

function includedBullets(project: ProjectCost): string[] {
  const out: string[] = [];
  const scope = (project.scopeNote || "").trim();
  const unit = (project.unitNote || "").trim();
  if (scope) out.push(firstSentence(scope));
  if (unit && unit !== scope) out.push(firstSentence(unit));
  const spec = typicalJobSpec(project.projectSlug);
  if (spec) {
    out.push(
      asSentence("Typical job is " + spec.typical + " (" + spec.low + " to " + spec.high + ")"),
    );
  }
  return out.filter(Boolean);
}

function sizeDriver(project: ProjectCost): string {
  const spec = typicalJobSpec(project.projectSlug);
  const meta = projectMeta(project.projectSlug);
  if (project.projectSlug === "roof-replacement") {
    let s =
      "Size is measured in " +
      meta.quantityLabel.toLowerCase() +
      " (100 sf of roof surface each)";
    if (spec) {
      s += ". This page models " + spec.low + " to " + spec.high + ", with a typical of " + spec.typical;
    }
    return asSentence(s);
  }
  if (project.projectSlug === "kitchen-remodel") {
    let s = "Size is the kitchen's affected area, in square feet";
    if (spec) {
      s += ". This page models " + spec.low + " to " + spec.high + ", with a typical of " + spec.typical;
    }
    return asSentence(s);
  }
  return asSentence("Job cost scales with " + meta.quantityLabel.toLowerCase());
}

function wageDriver(project: ProjectCost, city: City): string {
  const adj = project.cityAdjustments?.[city.slug];
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const laborPct = project.laborShare != null ? Math.round(project.laborShare * 100) : null;

  if (adj && (adj.metro || adj.blsConstructionMeanHourlyUsd != null || adj.blsVintage)) {
    let wage =
      "Labor for " +
      job +
      " in " +
      label +
      " is indexed to the BLS construction-and-extraction occupations mean hourly wage";
    if (adj.metro) wage += " for " + adj.metro;
    if (adj.blsConstructionMeanHourlyUsd != null) {
      wage += " of $" + adj.blsConstructionMeanHourlyUsd.toFixed(2);
    }
    if (adj.blsVintage) wage += " (" + adj.blsVintage + ")";
    if (laborPct != null) wage += ", applied to the " + laborPct + "% labor share";
    return asSentence(wage);
  }

  let s =
    "Labor for " + job + " in " + label + " uses the recorded city wage index applied to the labor share only";
  if (laborPct != null) s += " (" + laborPct + "%)";
  return asSentence(s);
}

function materialsDriver(project: ProjectCost, city: City): string {
  const label = cityLabel(city);
  const materialShare = project.materialShare ?? project.materialsShare;
  const materialPct = materialShare != null ? Math.round(materialShare * 100) : null;
  let s = "Materials stay at the national figure";
  if (materialPct != null) s += " (" + materialPct + "% of the typical job)";
  s += " while labor is wage-indexed for " + label;
  return asSentence(s);
}

function permitDriver(city: City, permit: Permit | null | undefined): string {
  const known = permitFeeKnown(permit);
  const fee = permit?.feeTypicalUsd ?? null;
  if (known && fee != null) {
    let s = "The recorded permit fee is " + usd(fee);
    if (permit?.sourceName) s += " from " + permit.sourceName;
    s += ". We do not invent fees";
    return asSentence(s);
  }
  let s =
    "The permit line is blank because the official fee is not yet recorded. We do not invent a dollar";
  if (permit?.sourceName) s += ". Source on file: " + permit.sourceName;
  return asSentence(s);
}

/**
 * Crawlable "what moves the price" copy for roof and kitchen money pages.
 * HVAC and deck stay unchanged (null). Never invents permit dollars.
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
