import { cityLabel } from "@/lib/data";
import { numberFmt } from "@/lib/format";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City } from "@/lib/types";

export type CityFactsModel = {
  heading: string;
  countyLabel: string;
  populationLabel: string | null;
  yearLabel: string | null;
  sourceLabel: string | null;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

function countyDisplay(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/county/i.test(trimmed) || trimmed.includes("/")) return trimmed;
  return trimmed + " County";
}

/**
 * Crawlable city-facts callout for impression-cluster money pages and city hubs.
 * Uses only recorded city.county + population / populationYear / populationSource.
 * Returns null outside PRIORITY_CLUSTER or when county and population are both unusable.
 */
export function cityFactsCallout(city: City): CityFactsModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const county = countyDisplay(city.county || "");
  const pop =
    city.population != null && Number.isFinite(city.population) && city.population > 0
      ? city.population
      : null;
  if (!county && pop == null) return null;

  const year =
    city.populationYear != null && Number.isFinite(city.populationYear)
      ? city.populationYear
      : null;
  const source = (city.populationSource || "").trim() || null;

  return {
    heading: "City facts for " + cityLabel(city),
    countyLabel: county || "Not recorded",
    populationLabel: pop != null ? numberFmt(pop) : null,
    yearLabel: year != null ? String(year) : null,
    sourceLabel: source,
  };
}
