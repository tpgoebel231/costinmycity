import { compareCities } from "@/lib/city-groups";
import { getCities } from "@/lib/data";
import { cityHasPermitPage } from "@/lib/permit-page";
import { jobPermitDetail, roofPermitDetail } from "@/lib/permit-mesh";
import { inlineProjectName } from "@/lib/projects";
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
  /** Lowest/highest sentences for this table. Empty when no job has two fee cities. */
  summary: string[];
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

/**
 * Integer cents for ordering labels only. "$1,499.44" and "$66" compare as
 * 149944 and 6600. The printed fee stays the original label, unrounded.
 */
function labelCents(label: string): number {
  const stripped = label.replace(/\$/g, "").replace(/,/g, "").trim();
  const negative = stripped.startsWith("-");
  const body = negative ? stripped.slice(1) : stripped;
  const dot = body.indexOf(".");
  const whole = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? "" : body.slice(dot + 1);
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -cents : cents;
}

/** Table-row order. Two names use "A and B". Three or more use an Oxford comma. */
function joinCityList(names: string[]): string {
  if (names.length <= 1) return names[0] || "";
  if (names.length === 2) return names[0] + " and " + names[1];
  return names.slice(0, -1).join(", ") + ", and " + names[names.length - 1];
}

/** One sentence per job that has at least two fee cities, then an exemption note when that job has exempt cities. */
function stateFeeSummary(state: string, rows: PermitStateTable["rows"]): string[] {
  const sentences: string[] = [];
  for (const projectSlug of TABLE_PROJECTS) {
    const fee: { city: string; label: string; cents: number }[] = [];
    const exempt: string[] = [];
    for (const row of rows) {
      const cell = row.cells.find((item) => item.projectSlug === projectSlug);
      if (!cell) continue;
      if (cell.kind === "fee") fee.push({ city: row.label, label: cell.text, cents: labelCents(cell.text) });
      else if (cell.kind === "exempt") exempt.push(row.label);
    }
    if (fee.length < 2) continue;
    let minCents = fee[0].cents;
    let maxCents = fee[0].cents;
    for (const item of fee) {
      if (item.cents < minCents) minCents = item.cents;
      if (item.cents > maxCents) maxCents = item.cents;
    }
    const job = inlineProjectName(projectSlug);
    if (minCents === maxCents) {
      const label = fee[0].label;
      const cities = joinCityList(fee.map((item) => item.city));
      if (fee.length === 2) {
        sentences.push(
          "In " + state + ", the " + job + " permit fee in our data is " + label + " in both " + cities + ".",
        );
      } else {
        sentences.push(
          "In " +
            state +
            ", the " +
            job +
            " permit fee in our data is " +
            label +
            " in each of " +
            cities +
            ".",
        );
      }
    } else {
      const lowest = fee.filter((item) => item.cents === minCents);
      const highest = fee.filter((item) => item.cents === maxCents);
      sentences.push(
        "In " +
          state +
          ", the lowest " +
          job +
          " permit fee in our data is " +
          lowest[0].label +
          " in " +
          joinCityList(lowest.map((item) => item.city)) +
          " and the highest is " +
          highest[0].label +
          " in " +
          joinCityList(highest.map((item) => item.city)) +
          ".",
      );
    }
    if (exempt.length > 0) {
      const verb = exempt.length === 1 ? "needs" : "need";
      sentences.push(joinCityList(exempt) + " usually " + verb + " no city permit for this job.");
    }
  }
  return sentences;
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
    const rows = group.cities.map((city) => ({
      href: "/permits/" + city.slug + "/",
      label: city.name,
      cells: TABLE_PROJECTS.map((projectSlug) => cellFor(city, projectSlug)),
    }));
    return {
      state: group.state,
      stateAbbr: group.stateAbbr,
      id: "state-" + slug,
      heading: group.state + " permit fees by city",
      caption:
        "Typical city permit fees for four common jobs in " +
        group.state +
        ". Each city links to its permit page with the official fee schedule.",
      rows,
      summary: stateFeeSummary(group.state, rows),
    };
  });
}
