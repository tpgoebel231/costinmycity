import { cityLabel, getCity, getPermit, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { ProjectCost } from "@/lib/types";

const CAPTION =
  "All-in from our wage-indexed model at the typical job size. Permit uses the recorded municipal schedule when known; blank means we have not extracted a fee and do not invent one.";

export type ProjectHubClusterRow = {
  citySlug: string;
  cityLabel: string;
  href: string;
  allInTypicalUsd: number;
  permitLabel: string;
};

export type ProjectHubClusterModel = {
  heading: string;
  caption: string;
  rows: ProjectHubClusterRow[];
};

function permitLabelFor(permit: ReturnType<typeof getPermit>): string {
  if (!permit || !permitFeeKnown(permit) || permit.feeTypicalUsd == null) return "Blank";
  return usd(permit.feeTypicalUsd);
}

/**
 * Crawlable featured-metro compare for project hubs (/cost/{job}/).
 * One row per PRIORITY_CLUSTER city; dollars from buildEstimate only.
 */
export function projectHubCluster(project: ProjectCost): ProjectHubClusterModel | null {
  const short = shortProjectName(project.projectSlug);
  const rows: ProjectHubClusterRow[] = [];

  for (const slug of PRIORITY_CLUSTER) {
    const city = getCity(slug);
    if (!city) continue;
    const permit = getPermit(slug, project.projectSlug);
    const est = buildEstimate(project, city, permit);
    rows.push({
      citySlug: slug,
      cityLabel: cityLabel(city),
      href: "/cost/" + project.projectSlug + "/" + slug + "/",
      allInTypicalUsd: est.allInTypical,
      permitLabel: permitLabelFor(permit),
    });
  }

  if (!rows.length) return null;
  return {
    heading: "Compare " + short.toLowerCase() + " across featured metros",
    caption: CAPTION,
    rows,
  };
}
