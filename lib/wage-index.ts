import { cityLabel, getProjectCost, getProjectCostsFile } from "@/lib/data";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City, ProjectCost } from "@/lib/types";

export type WageIndexModel = {
  heading: string;
  metroLabel: string | null;
  meanHourlyLabel: string | null;
  vintageLabel: string | null;
  nationalMeanHourlyLabel: string | null;
  nationalVintageLabel: string | null;
  laborWageMultiplierLabel: string | null;
  methodLabel: string | null;
  sourceUrl: string | null;
  nationalSourceUrl: string | null;
  sourceLinkLabel: string;
  nationalSourceLinkLabel: string;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

function money(n: number): string {
  return "$" + n.toFixed(2) + "/hr";
}

function multiplierLabel(n: number): string {
  return n.toFixed(3) + "× labor";
}

/**
 * Crawlable metro wage-index callout for impression-cluster money pages and city hubs.
 * Uses only recorded project.cityAdjustments BLS/OEWS fields plus file-level nationalWageIndex.
 * Returns null outside PRIORITY_CLUSTER or when those fields are all blank.
 */
export function wageIndexCallout(
  project: ProjectCost,
  city: City,
): WageIndexModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const adj = project.cityAdjustments?.[city.slug];
  if (!adj) return null;

  const metro = (adj.metro || "").trim() || null;
  const method = (adj.method || "").trim() || null;
  const sourceUrl = (adj.source || "").trim() || null;
  const mean =
    adj.blsConstructionMeanHourlyUsd != null &&
    Number.isFinite(adj.blsConstructionMeanHourlyUsd)
      ? adj.blsConstructionMeanHourlyUsd
      : null;
  const vintage = (adj.blsVintage || "").trim() || null;
  const laborMult =
    adj.laborWageMultiplier != null && Number.isFinite(adj.laborWageMultiplier)
      ? adj.laborWageMultiplier
      : null;

  const national = getProjectCostsFile()?.nationalWageIndex;
  const nationalMean =
    national?.nationalMeanHourlyUsd != null &&
    Number.isFinite(national.nationalMeanHourlyUsd)
      ? national.nationalMeanHourlyUsd
      : null;
  const nationalVintage = (national?.vintage || "").trim() || null;
  const nationalSourceUrl = (national?.sourceUrl || "").trim() || null;

  if (
    !metro &&
    !method &&
    !sourceUrl &&
    mean == null &&
    laborMult == null &&
    nationalMean == null
  ) {
    return null;
  }

  return {
    heading: "Metro wage index for " + cityLabel(city),
    metroLabel: metro,
    meanHourlyLabel: mean != null ? money(mean) : null,
    vintageLabel: vintage,
    nationalMeanHourlyLabel: nationalMean != null ? money(nationalMean) : null,
    nationalVintageLabel: nationalVintage,
    laborWageMultiplierLabel: laborMult != null ? multiplierLabel(laborMult) : null,
    methodLabel: method,
    sourceUrl,
    nationalSourceUrl,
    sourceLinkLabel: "BLS OEWS metro release",
    nationalSourceLinkLabel: "BLS OEWS national release",
  };
}

/** City-hub helper: use roof-replacement adjustments (same metro for all launch jobs). */
export function wageIndexCalloutForCity(city: City): WageIndexModel | null {
  const project = getProjectCost("roof-replacement");
  if (!project) return null;
  return wageIndexCallout(project, city);
}
