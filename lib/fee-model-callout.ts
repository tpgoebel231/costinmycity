import { cityLabel } from "@/lib/data";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { shortProjectName } from "@/lib/projects";
import type { City, Permit } from "@/lib/types";

export type FeeModelCalloutModel = {
  heading: string;
  modelLabel: string | null;
  calculationNote: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

const FEE_MODEL_LABELS: Record<string, string> = {
  valuation: "Valuation-based",
  flat: "Flat fee",
  per_sqft: "Per square foot",
  tiered: "Tiered",
  area: "Area-based",
  none: "None (typical path)",
  exemption: "Exemption",
  hourly: "Hourly",
  unknown: "Unknown / not classified",
};

/**
 * Crawlable feeModel + calculationNote callout for impression-cluster money pages.
 * Uses only recorded permit.feeModel / calculationNote / source fields.
 * Returns null outside PRIORITY_CLUSTER, when permit is missing, or when both
 * feeModel is blank/unknown and calculationNote is empty.
 */
export function feeModelCallout(
  city: City,
  projectSlug: string,
  permit: Permit | null | undefined,
): FeeModelCalloutModel | null {
  if (!CLUSTER.has(city.slug)) return null;
  if (!permit) return null;

  const rawModel = (permit.feeModel || "").trim().toLowerCase();
  const calculationNote = (permit.calculationNote || "").trim() || null;
  const usefulModel = rawModel && rawModel !== "unknown";

  if (!usefulModel && !calculationNote) return null;

  const modelLabel = usefulModel
    ? FEE_MODEL_LABELS[rawModel] || rawModel.replace(/_/g, " ")
    : null;

  const sourceName = (permit.sourceName || "").trim() || null;
  const sourceUrl = (permit.sourceUrl || "").trim() || null;

  return {
    heading:
      "How the permit fee is modeled for " +
      shortProjectName(projectSlug) +
      " in " +
      cityLabel(city),
    modelLabel,
    calculationNote,
    sourceName,
    sourceUrl,
  };
}
