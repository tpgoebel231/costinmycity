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
 * Cost page: permit row, its exemption source, and the project source dates.
 */
export function costPageUpdatedIso(
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  const dates: Array<string | null | undefined> = [];
  if (permit) {
    dates.push(permit.retrievedDate);
    dates.push(permit.exemptionSource?.retrievedDate);
  }
  for (const source of project.sources || []) {
    dates.push(source.retrievedDate);
  }
  return latestRetrievedDate(dates);
}

/**
 * City hub and permit page: every launch-project permit row for the city,
 * plus each row's exemption source.
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

/** Visible "Updated Mon D, YYYY" date. Same calendar day as dateModified. */
export function updatedLabel(iso: string | null | undefined): string | null {
  const day = retrievedDay(iso);
  if (!day) return null;
  return formatDate(day);
}
