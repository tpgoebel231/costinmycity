import { cityLabel } from "@/lib/data";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City, ProjectCost } from "@/lib/types";

export type WageIndexModel = {
  heading: string;
  metroLabel: string | null;
  meanHourlyLabel: string | null;
  vintageLabel: string | null;
  methodLabel: string | null;
  sourceUrl: string | null;
  sourceLinkLabel: string;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

/**
 * Crawlable metro wage-index callout for impression-cluster money pages.
 * Uses only recorded project.cityAdjustments BLS/OEWS fields (metro, method, source URL, mean hourly, vintage).
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

  if (!metro && !method && !sourceUrl && mean == null) return null;

  return {
    heading: "Metro wage index for " + cityLabel(city),
    metroLabel: metro,
    meanHourlyLabel: mean != null ? "$" + mean.toFixed(2) + "/hr" : null,
    vintageLabel: vintage,
    methodLabel: method,
    sourceUrl,
    sourceLinkLabel: "BLS OEWS release",
  };
}
