import { cityLabel, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import type { City, Permit, ProjectCost } from "@/lib/types";

const CAPTION =
  "All-in from our wage-indexed model at the typical job size. Permit uses the recorded municipal schedule when known; blank means we have not extracted a fee and do not invent one.";

export type InCityJobsRow = {
  projectSlug: string;
  jobLabel: string;
  href: string;
  allInTypicalUsd: number;
  permitLabel: string;
  isCurrent: boolean;
};

export type InCityJobsModel = {
  heading: string;
  caption: string;
  rows: InCityJobsRow[];
};

function permitLabelFor(permit: Permit | undefined | null): string {
  if (!permit || !permitFeeKnown(permit) || permit.feeTypicalUsd == null) return "Blank";
  return usd(permit.feeTypicalUsd);
}

/**
 * Crawlable cross-job compare table for the same city.
 * One row per launch project (roof/kitchen/HVAC/deck), including the current page.
 */
export function inCityJobsCompare(city: City, project: ProjectCost): InCityJobsModel | null {
  const rows: InCityJobsRow[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    const other = getProjectCost(slug);
    if (!other) continue;
    const permit = getPermit(city.slug, slug);
    const est = buildEstimate(other, city, permit);
    rows.push({
      projectSlug: slug,
      jobLabel: shortProjectName(slug),
      href: "/cost/" + slug + "/" + city.slug + "/",
      allInTypicalUsd: est.allInTypical,
      permitLabel: permitLabelFor(permit),
      isCurrent: slug === project.projectSlug,
    });
  }

  if (rows.length < 2) return null;
  return {
    heading: "Other home projects in " + cityLabel(city),
    caption: CAPTION,
    rows,
  };
}
