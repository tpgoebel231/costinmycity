import { compareCities } from "@/lib/city-groups";
import { getCities } from "@/lib/data";
import { cityHasPermitPage } from "@/lib/permit-page";
import { jobPermitDetail, roofPermitDetail } from "@/lib/permit-mesh";
import type { City } from "@/lib/types";

export type PermitsIndexItem = {
  href: string;
  label: string;
  detail?: string;
};

export type PermitsIndexGroup = {
  state: string;
  stateAbbr: string;
  items: PermitsIndexItem[];
};

/** Columns on the state fee tables, in display order. */
const TABLE_PROJECTS = ["roof-replacement", "deck", "kitchen-remodel", "hvac-replacement"] as const;

const EXEMPT_TEXT = "Usually no city permit needed";
const NONE_TEXT = "See permit page";

export type PermitStateTableCell = {
  projectSlug: string;
  text: string;
  kind: "fee" | "exempt" | "none";
};

export type PermitStateTable = {
  state: string;
  stateAbbr: string;
  id: string;
  heading: string;
  caption: string;
  rows: { href: string; label: string; cells: PermitStateTableCell[] }[];
};

type PermitCityGroup = { state: string; stateAbbr: string; cities: City[] };

function itemFor(city: City): PermitsIndexItem {
  const detail = roofPermitDetail(city);
  const item: PermitsIndexItem = {
    href: "/permits/" + city.slug + "/",
    label: city.name,
  };
  if (detail) item.detail = detail;
  return item;
}

/**
 * Anchor slug for a state name: lowercased, non [a-z0-9] runs become "-",
 * then leading and trailing "-" are removed. "New York" -> "new-york".
 */
export function stateAnchorSlug(state: string): string {
  return state.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Same city set, state order, and city order as permitsIndexModel. */
function permitCityGroups(): { total: number; groups: PermitCityGroup[] } {
  const cities = getCities().filter(cityHasPermitPage);
  const byAbbr = new Map<string, PermitCityGroup>();
  for (const city of cities) {
    const existing = byAbbr.get(city.stateAbbr);
    if (existing) existing.cities.push(city);
    else byAbbr.set(city.stateAbbr, { state: city.state, stateAbbr: city.stateAbbr, cities: [city] });
  }
  const groups = Array.from(byAbbr.values())
    .sort((a, b) => a.state.localeCompare(b.state, "en") || a.stateAbbr.localeCompare(b.stateAbbr, "en"))
    .map((group) => ({
      state: group.state,
      stateAbbr: group.stateAbbr,
      cities: group.cities.slice().sort(compareCities),
    }));
  return { total: cities.length, groups };
}

function cellFor(city: City, projectSlug: string): PermitStateTableCell {
  const detail = jobPermitDetail(city, projectSlug);
  if (detail?.kind === "fee") return { projectSlug, text: detail.label, kind: "fee" };
  if (detail?.kind === "exempt") return { projectSlug, text: EXEMPT_TEXT, kind: "exempt" };
  return { projectSlug, text: NONE_TEXT, kind: "none" };
}

/** Permit pages grouped by state name. States and cities use localeCompare "en". */
export function permitsIndexModel(): { total: number; groups: PermitsIndexGroup[] } {
  const grouped = permitCityGroups();
  return {
    total: grouped.total,
    groups: grouped.groups.map((group) => ({
      state: group.state,
      stateAbbr: group.stateAbbr,
      items: group.cities.map(itemFor),
    })),
  };
}

/** Four job fees per city, grouped and ordered like permitsIndexModel. */
export function permitsStateTablesModel(): PermitStateTable[] {
  return permitCityGroups().groups.map((group) => {
    const slug = stateAnchorSlug(group.state);
    return {
      state: group.state,
      stateAbbr: group.stateAbbr,
      id: "state-" + slug,
      heading: group.state + " permit fees by city",
      caption:
        "Typical city permit fees for four common jobs in " +
        group.state +
        ". Each city links to its permit page with the official fee schedule.",
      rows: group.cities.map((city) => ({
        href: "/permits/" + city.slug + "/",
        label: city.name,
        cells: TABLE_PROJECTS.map((projectSlug) => cellFor(city, projectSlug)),
      })),
    };
  });
}
