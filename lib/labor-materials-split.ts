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

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

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
