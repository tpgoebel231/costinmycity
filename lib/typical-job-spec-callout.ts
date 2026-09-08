import { cityLabel, getLaunchProjectSlugs } from "@/lib/data";
import { usd } from "@/lib/format";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { shortProjectName } from "@/lib/projects";
import { assumedValuation, typicalJobSpec } from "@/lib/typical-specs";
import type { City } from "@/lib/types";

export type TypicalJobSpecCalloutModel = {
  heading: string;
  typicalLabel: string;
  lowLabel: string;
  highLabel: string;
  why: string;
  valuationTypicalLabel: string | null;
  valuationLowLabel: string | null;
  valuationHighLabel: string | null;
  valuationWhy: string | null;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

/**
 * Crawlable typical-job-spec (+ assumed valuation) callout for impression-cluster money pages.
 * Uses only recorded TYPICAL_JOB_SPECS / ASSUMED_VALUATIONS from lib/typical-specs (SOURCES.md).
 * Returns null outside PRIORITY_CLUSTER or when no typicalJobSpec is recorded.
 */
export function typicalJobSpecCallout(
  city: City,
  projectSlug: string,
): TypicalJobSpecCalloutModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const spec = typicalJobSpec(projectSlug);
  if (!spec) return null;

  const valuation = assumedValuation(projectSlug);

  return {
    heading:
      "Typical job we price for " +
      shortProjectName(projectSlug) +
      " in " +
      cityLabel(city),
    typicalLabel: spec.typical,
    lowLabel: spec.low,
    highLabel: spec.high,
    why: spec.why,
    valuationTypicalLabel: valuation ? usd(valuation.typical) : null,
    valuationLowLabel: valuation ? usd(valuation.low) : null,
    valuationHighLabel: valuation ? usd(valuation.high) : null,
    valuationWhy: valuation?.why?.trim() || null,
  };
}

export type CityHubTypicalJobSpecRow = {
  projectSlug: string;
  jobLabel: string;
  href: string;
  typicalLabel: string;
  lowLabel: string;
  highLabel: string;
  valuationTypicalLabel: string | null;
};

export type CityHubTypicalJobSpecModel = {
  heading: string;
  caption: string;
  rows: CityHubTypicalJobSpecRow[];
};

const CITY_HUB_CAPTION =
  "Recorded typical-job specs and assumed valuations from our published sources only. Assumed valuations apply official permit formulas; they are not city-assessed values.";

/**
 * Crawlable typical-job-spec table for PRIORITY_CLUSTER city hubs (/city/{slug}/).
 * One row per launch project with a recorded typicalJobSpec; parity with money-page cb65c6d.
 */
export function typicalJobSpecForCity(city: City): CityHubTypicalJobSpecModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const rows: CityHubTypicalJobSpecRow[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    const spec = typicalJobSpec(slug);
    if (!spec) continue;
    const valuation = assumedValuation(slug);
    rows.push({
      projectSlug: slug,
      jobLabel: shortProjectName(slug),
      href: "/cost/" + slug + "/" + city.slug + "/",
      typicalLabel: spec.typical,
      lowLabel: spec.low,
      highLabel: spec.high,
      valuationTypicalLabel: valuation ? usd(valuation.typical) : null,
    });
  }

  if (rows.length < 2) return null;
  return {
    heading: "Typical jobs we price in " + cityLabel(city),
    caption: CITY_HUB_CAPTION,
    rows,
  };
}
