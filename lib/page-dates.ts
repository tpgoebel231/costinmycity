import { getLaunchProjectSlugs, getPermit } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Permit, ProjectCost } from "@/lib/types";

/** YYYY-MM-DD from a retrievedDate, or null when the field is blank. */
export function retrievedDay(raw: string | null | undefined): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec((raw || "").trim());
  return match ? match[1] : null;
}

/** Latest calendar day among ISO retrieved dates. Not the build clock. */
export function latestRetrievedDate(values: Array<string | null | undefined>): string | null {
  let latest = "";
  for (const raw of values) {
    const day = retrievedDay(raw);
    if (day && day > latest) latest = day;
  }
  return latest || null;
}

/**
 * Editorial ship day for a page that has shipped copy beyond the fee data.
 * Not a retrievedDate. The page date is the later of this day and the
 * retrieved dates. Cost keys are "cost:<projectSlug>/<citySlug>". Hub keys
 * are "hub:<citySlug>". Permit pages are not listed.
 */
export const EDITORIAL_UPDATED: Record<string, string> = {
  "cost:roof-replacement/st-paul-mn": "2026-11-04",
  "cost:roof-replacement/charlotte-nc": "2026-11-03",
  "hub:denver-co": "2026-11-03",
};

/**
 * Cost page: permit row, its exemption source, and the project source dates,
 * then the later of that day and an editorial ship day when this page has one.
 */
export function costPageUpdatedIso(
  project: ProjectCost,
  permit: Permit | null | undefined,
  citySlug?: string,
): string | null {
  const dates: Array<string | null | undefined> = [];
  if (permit) {
    dates.push(permit.retrievedDate);
    dates.push(permit.exemptionSource?.retrievedDate);
  }
  for (const source of project.sources || []) {
    dates.push(source.retrievedDate);
  }
  const slug = citySlug || permit?.citySlug || "";
  if (slug) dates.push(EDITORIAL_UPDATED["cost:" + project.projectSlug + "/" + slug]);
  return latestRetrievedDate(dates);
}

/**
 * Permit page, and the retrieved-date half of a city hub: every launch-project
 * permit row for the city, plus each row's exemption source.
 * City hubs apply an editorial day through cityHubUpdatedIso.
 */
export function cityPagesUpdatedIso(citySlug: string): string | null {
  const dates: Array<string | null | undefined> = [];
  for (const slug of getLaunchProjectSlugs()) {
    const permit = getPermit(citySlug, slug);
    if (!permit) continue;
    dates.push(permit.retrievedDate);
    dates.push(permit.exemptionSource?.retrievedDate);
  }
  return latestRetrievedDate(dates);
}

/**
 * City hub only. Permit pages keep cityPagesUpdatedIso.
 * Later of the hub's retrieved dates and an editorial ship day.
 */
export function cityHubUpdatedIso(citySlug: string): string | null {
  return latestRetrievedDate([
    cityPagesUpdatedIso(citySlug),
    EDITORIAL_UPDATED["hub:" + citySlug],
  ]);
}

/** Visible "Updated Mon D, YYYY" date. Same calendar day as dateModified. */
export function updatedLabel(iso: string | null | undefined): string | null {
  const day = retrievedDay(iso);
  if (!day) return null;
  return formatDate(day);
}
