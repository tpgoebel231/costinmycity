import { cityLabel, getLaunchProjectSlugs, getProjectCost } from "@/lib/data";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { shortProjectName } from "@/lib/projects";
import type { City, ProjectCost } from "@/lib/types";

export type LaborMaterialsSplitModel = {
  heading: string;
  laborPctLabel: string;
  materialsPctLabel: string;
  note: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
};

export type CityHubLaborSplitRow = {
  projectSlug: string;
  jobLabel: string;
  href: string;
  laborPctLabel: string;
  materialsPctLabel: string;
};

export type CityHubLaborSplitModel = {
  heading: string;
  caption: string;
  rows: CityHubLaborSplitRow[];
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

const CITY_HUB_CAPTION =
  "Recorded project allocation only. Used for wage-index math on the labor share; not a surveyed local contractor split.";

/**
 * Crawlable labor vs materials split for impression-cluster money pages.
 * Uses only recorded project.laborShare / materialShare / laborShareNote and sources.
 * Returns null outside PRIORITY_CLUSTER or when laborShare is missing.
 */
export function laborMaterialsSplit(
  project: ProjectCost,
  city: City,
): LaborMaterialsSplitModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const labor = project.laborShare;
  if (labor == null || !Number.isFinite(labor)) return null;

  const materialsRaw = project.materialShare ?? project.materialsShare;
  const materials =
    materialsRaw != null && Number.isFinite(materialsRaw)
      ? materialsRaw
      : Math.max(0, 1 - labor);

  const note = (project.laborShareNote || "").trim() || null;
  const source = project.sources?.[0];
  const sourceUrl = (source?.url || "").trim() || null;
  const sourceName = (source?.name || "").trim() || null;

  const laborPct = Math.round(labor * 100);
  const materialsPct = Math.round(materials * 100);

  return {
    heading: "Labor vs materials for " + shortProjectName(project.projectSlug),
    laborPctLabel: laborPct + "%",
    materialsPctLabel: materialsPct + "%",
    note,
    sourceUrl,
    sourceName,
  };
}

/**
 * Crawlable labor vs materials table for PRIORITY_CLUSTER city hubs (/city/{slug}/).
 * One row per launch project with a recorded laborShare; parity with money-page d5a74b1.
 */
export function laborMaterialsSplitForCity(city: City): CityHubLaborSplitModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const rows: CityHubLaborSplitRow[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const split = laborMaterialsSplit(project, city);
    if (!split) continue;
    rows.push({
      projectSlug: slug,
      jobLabel: shortProjectName(slug),
      href: "/cost/" + slug + "/" + city.slug + "/",
      laborPctLabel: split.laborPctLabel,
      materialsPctLabel: split.materialsPctLabel,
    });
  }

  if (rows.length < 2) return null;
  return {
    heading: "Labor vs materials in " + cityLabel(city),
    caption: CITY_HUB_CAPTION,
    rows,
  };
}
