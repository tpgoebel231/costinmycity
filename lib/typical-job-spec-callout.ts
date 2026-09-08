import { cityLabel } from "@/lib/data";
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
