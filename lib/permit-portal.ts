import { cityLabel } from "@/lib/data";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City } from "@/lib/types";

export type PermitPortalModel = {
  heading: string;
  dept: string;
  portalUrl: string;
  portalLinkLabel: string;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

/**
 * Crawlable permit-portal callout for impression-cluster money pages.
 * Uses only recorded city.permitPortalUrl + city.permitDeptName.
 * Returns null outside PRIORITY_CLUSTER or when either field is blank.
 */
export function permitPortalCallout(city: City): PermitPortalModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const dept = (city.permitDeptName || "").trim();
  const portalUrl = (city.permitPortalUrl || "").trim();
  if (!dept || !portalUrl) return null;

  return {
    heading: "Permit portal for " + cityLabel(city),
    dept,
    portalUrl,
    portalLinkLabel: "Official permit portal",
  };
}
