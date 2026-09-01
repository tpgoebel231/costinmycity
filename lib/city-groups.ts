import type { City } from "./types";

export type StateCityGroup = {
  stateAbbr: string;
  state: string;
  cities: City[];
};

export function compareCities(a: City, b: City): number {
  const byName = a.name.localeCompare(b.name, "en");
  if (byName !== 0) return byName;
  return a.slug.localeCompare(b.slug, "en");
}

export function uniqueStateCount(cities: City[]): number {
  return new Set(cities.map((c) => c.stateAbbr)).size;
}

export function stateAnchorId(stateAbbr: string): string {
  return "state-" + stateAbbr.toLowerCase();
}

export function filterCities(cities: City[], query: string): City[] {
  const n = query.trim().toLowerCase();
  if (!n) return cities;
  return cities.filter((c) =>
    (c.name + " " + c.state + " " + c.stateAbbr + " " + c.county).toLowerCase().includes(n),
  );
}

export function groupCitiesByState(cities: City[]): StateCityGroup[] {
  const byAbbr = new Map<string, StateCityGroup>();
  for (const city of cities) {
    const existing = byAbbr.get(city.stateAbbr);
    if (existing) {
      existing.cities.push(city);
    } else {
      byAbbr.set(city.stateAbbr, {
        stateAbbr: city.stateAbbr,
        state: city.state,
        cities: [city],
      });
    }
  }
  const groups = Array.from(byAbbr.values());
  groups.sort((a, b) => a.stateAbbr.localeCompare(b.stateAbbr, "en"));
  for (const group of groups) {
    group.cities.sort(compareCities);
  }
  return groups;
}
