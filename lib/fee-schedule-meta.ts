import { cityLabel } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import type { City, Permit } from "@/lib/types";

export type FeeScheduleMetaModel = {
  heading: string;
  yearLabel: string | null;
  scheduleUrl: string | null;
  scheduleLinkLabel: string;
  sourceName: string | null;
  retrievedLabel: string | null;
  dept: string;
};

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

/**
 * Crawlable fee-schedule meta for impression-cluster money pages.
 * Uses only recorded city.feeScheduleYear / feeScheduleUrl and permit source/retrieved.
 * Returns null outside PRIORITY_CLUSTER or when year and schedule URL are both missing.
 */
export function feeScheduleMeta(
  city: City,
  permit: Permit | null | undefined,
): FeeScheduleMetaModel | null {
  if (!CLUSTER.has(city.slug)) return null;

  const year = city.feeScheduleYear;
  const scheduleUrl = (city.feeScheduleUrl || "").trim();
  if (year == null && !scheduleUrl) return null;

  const sourceName = (permit?.sourceName || "").trim() || null;
  const retrievedRaw = (permit?.retrievedDate || "").trim();
  const retrievedLabel = retrievedRaw ? formatDate(retrievedRaw) : null;

  return {
    heading: "Fee schedule on file for " + cityLabel(city),
    yearLabel: year != null ? String(year) : null,
    scheduleUrl: scheduleUrl || null,
    scheduleLinkLabel: "Official fee schedule",
    sourceName,
    retrievedLabel,
    dept: city.permitDeptName,
  };
}
