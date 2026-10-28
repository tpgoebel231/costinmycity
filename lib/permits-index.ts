import { compareCities } from "@/lib/city-groups";
import { getCities } from "@/lib/data";
import { cityHasPermitPage } from "@/lib/permit-page";
import { roofPermitDetail } from "@/lib/permit-mesh";
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

function itemFor(city: City): PermitsIndexItem {
  const detail = roofPermitDetail(city);
  const item: PermitsIndexItem = {
    href: "/permits/" + city.slug + "/",
    label: city.name,
  };
  if (detail) item.detail = detail;
  return item;
}

/** Permit pages grouped by state name. States and cities use localeCompare "en". */
export function permitsIndexModel(): { total: number; groups: PermitsIndexGroup[] } {
  const cities = getCities().filter(cityHasPermitPage);
  const byAbbr = new Map<string, { state: string; stateAbbr: string; cities: City[] }>();
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
      items: group.cities.slice().sort(compareCities).map(itemFor),
    }));
  return { total: cities.length, groups };
}
