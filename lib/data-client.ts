import type { City } from "./types";

export function cityLabel(city: Pick<City, "name" | "stateAbbr">): string {
  return city.name + ", " + city.stateAbbr;
}
