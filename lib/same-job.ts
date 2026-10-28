import { compareCities } from "@/lib/city-groups";
import { CENSUS_REGION, cityHubNearbyHeading, distanceMiles, hasCoords, stateDistance } from "@/lib/city-hub-deepen";
import { comparePermitLabel } from "@/lib/cluster-compare";
import { cityLabel, getCities, getPermit } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import type { City, Permit, ProjectCost } from "@/lib/types";

const SAME_JOB_MIN = 4;
const SAME_JOB_MAX = 6;

/** Used only after same-state and same-region peers are exhausted. */
const REGION_ORDER = ["Northeast", "Midwest", "South", "West"];

export type SameJobCard = {
  href: string;
  label: string;
  detail: string;
  /** Same permit text as the compare table, with a "Permit " prefix on dollar labels. Omitted for a dash placeholder. */
  detail2?: string;
  stateAbbr: string;
};

/** Compare-table unknown text is "Blank". A dash placeholder is omitted instead of printed. */
function permitDetail(permit: Permit | undefined): string | undefined {
  const label = comparePermitLabel(permit);
  const compact = label.replace(/\s/g, "");
  if (compact === "-" || compact === "\u2013" || compact === "\u2014") return undefined;
  if (!label.includes("$")) return label;
  return "Permit " + label;
}

/**
 * Closest first: city coordinates when both have them, else the distance
 * between state centers (same-state peers tie at 0), then larger cities.
 */
export function sortByCloseness(origin: City, list: City[]): City[] {
  return [...list].sort((a, b) => {
    if (hasCoords(origin) && hasCoords(a) && hasCoords(b)) {
      const delta = distanceMiles(origin, a) - distanceMiles(origin, b);
      if (delta !== 0) return delta;
    }
    const byState = stateDistance(origin.stateAbbr, a.stateAbbr) - stateDistance(origin.stateAbbr, b.stateAbbr);
    if (Number.isFinite(byState) && byState !== 0) return byState;
    return (b.population || 0) - (a.population || 0) || compareCities(a, b);
  });
}

/**
 * Same state first (up to 6, alphabetical). If that is under 4, fill from the
 * same Census region up to 6. Other regions are used only to reach 4, in
 * Census region order. Within a region, closer states come first. `others`
 * must already exclude `city`.
 */
export function selectSameJobPeers(city: City, others: City[]): City[] {
  const sameState = others.filter((item) => item.stateAbbr === city.stateAbbr).sort(compareCities);
  const picked: City[] = sameState.slice(0, SAME_JOB_MAX);
  if (picked.length >= SAME_JOB_MIN) return picked;

  const region = CENSUS_REGION[city.stateAbbr];
  const seen = () => new Set(picked.map((item) => item.slug));
  if (region) {
    const rest = others.filter((item) => !seen().has(item.slug) && CENSUS_REGION[item.stateAbbr] === region);
    for (const item of sortByCloseness(city, rest)) {
      if (picked.length >= SAME_JOB_MAX) break;
      picked.push(item);
    }
  }
  if (picked.length >= SAME_JOB_MIN) return picked.slice(0, SAME_JOB_MAX);

  const have = seen();
  for (const regionName of REGION_ORDER) {
    if (regionName === region) continue;
    const rest = others.filter((item) => !have.has(item.slug) && CENSUS_REGION[item.stateAbbr] === regionName);
    for (const item of sortByCloseness(city, rest)) {
      if (picked.length >= SAME_JOB_MIN) break;
      picked.push(item);
      have.add(item.slug);
    }
    if (picked.length >= SAME_JOB_MIN) break;
  }
  return picked.slice(0, SAME_JOB_MAX);
}

/** Other cities that have this project. */
export function sameJobPeers(city: City): City[] {
  const others = getCities().filter((item) => item.slug !== city.slug);
  return selectSameJobPeers(city, others);
}

export function sameJobBlock(city: City, project: ProjectCost): { heading: string; items: SameJobCard[] } {
  const items = sameJobPeers(city).map((peer) => {
    const permit = getPermit(peer.slug, project.projectSlug);
    const est = buildEstimate(project, peer, permit);
    return {
      href: "/cost/" + project.projectSlug + "/" + peer.slug + "/",
      label: cityLabel(peer),
      detail: "Typical " + usd(est.allInTypical),
      detail2: permitDetail(permit),
      stateAbbr: peer.stateAbbr,
    };
  });
  return {
    heading: cityHubNearbyHeading(city, items),
    items,
  };
}
