import { cityLabel, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City, Permit } from "@/lib/types";

const CAPTION =
  "All-in from our wage-indexed model at the typical job size. Permit uses the recorded municipal schedule when known; blank means we have not extracted a fee and do not invent one.";

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

export type CityHubJobsRow = {
  projectSlug: string;
  jobLabel: string;
  href: string;
  allInTypicalUsd: number;
  permitLabel: string;
};

export type CityHubJobsModel = {
  heading: string;
  caption: string;
  rows: CityHubJobsRow[];
};

function permitLabelFor(permit: Permit | undefined | null): string {
  if (!permit || !permitFeeKnown(permit) || permit.feeTypicalUsd == null) return "Blank";
  return usd(permit.feeTypicalUsd);
}

/**
 * Crawlable job table for PRIORITY_CLUSTER city hubs (/city/{slug}/).
 * One row per launch project; dollars from buildEstimate only.
 */
export function cityHubJobs(city: City): CityHubJobsModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const rows: CityHubJobsRow[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug);
    const est = buildEstimate(project, city, permit);
    rows.push({
      projectSlug: slug,
      jobLabel: shortProjectName(slug),
      href: "/cost/" + slug + "/" + city.slug + "/",
      allInTypicalUsd: est.allInTypical,
      permitLabel: permitLabelFor(permit),
    });
  }

  if (rows.length < 2) return null;
  return {
    heading: "Projects in " + cityLabel(city),
    caption: CAPTION,
    rows,
  };
}
