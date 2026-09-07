import { cityLabel, getCity, getPermit, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City, Permit, ProjectCost } from "@/lib/types";

const CLUSTER_JOBS = new Set([
  "roof-replacement",
  "kitchen-remodel",
  "hvac-replacement",
  "deck",
]);

const CAPTION =
  "All-in from our wage-indexed model at the typical job size. Permit uses the recorded municipal schedule when known; blank means we have not extracted a fee and do not invent one.";

export type ClusterCompareRow = {
  citySlug: string;
  cityLabel: string;
  href: string;
  allInTypicalUsd: number;
  permitLabel: string;
  isCurrent: boolean;
};

export type ClusterCompareModel = {
  heading: string;
  caption: string;
  rows: ClusterCompareRow[];
};

function headingFor(projectSlug: string): string | null {
  if (projectSlug === "roof-replacement") return "Compare roof replacement across metros";
  if (projectSlug === "kitchen-remodel") return "Compare kitchen remodel across metros";
  if (projectSlug === "hvac-replacement") return "Compare HVAC replacement across metros";
  if (projectSlug === "deck") return "Compare deck across metros";
  return null;
}

function permitLabelFor(permit: Permit | undefined | null): string {
  if (!permit || !permitFeeKnown(permit) || permit.feeTypicalUsd == null) return "Blank";
  return usd(permit.feeTypicalUsd);
}

/**
 * Crawlable same-job compare table for the impression cluster.
 * Roof, kitchen, HVAC, and deck. One row per PRIORITY_CLUSTER city, including the current page.
 */
export function clusterCompare(project: ProjectCost, city: City): ClusterCompareModel | null {
  const heading = headingFor(project.projectSlug);
  if (!heading || !CLUSTER_JOBS.has(project.projectSlug)) return null;

  const rows: ClusterCompareRow[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    const other = getCity(slug);
    if (!other) continue;
    const permit = getPermit(slug, project.projectSlug);
    const est = buildEstimate(project, other, permit);
    rows.push({
      citySlug: slug,
      cityLabel: cityLabel(other),
      href: "/cost/" + project.projectSlug + "/" + slug + "/",
      allInTypicalUsd: est.allInTypical,
      permitLabel: permitLabelFor(permit),
      isCurrent: slug === city.slug,
    });
  }

  if (!rows.length) return null;
  return { heading, caption: CAPTION, rows };
}
