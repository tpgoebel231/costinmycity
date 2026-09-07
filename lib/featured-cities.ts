import type { City } from "./types";
import { PRIORITY_CLUSTER } from "./related-links";

/** Major metros shown on the homepage after the impression cluster. */
const MAJOR_METRO_SLUGS = [
  "austin-tx",
  "minneapolis-mn",
  "boston-ma",
  "miami-fl",
  "phoenix-az",
  "portland-or",
  "dallas-tx",
  "houston-tx",
  "los-angeles-ca",
  "chicago-il",
  "raleigh-nc",
  "philadelphia-pa",
  "san-diego-ca",
  "washington-dc",
] as const;

const FEATURED_CAP = 16;

/**
 * Featured homepage cities: impression cluster first, then major metros
 * that exist in the dataset. Cap at FEATURED_CAP. Never invents cities.
 */
export function getFeaturedCities(cities: City[]): City[] {
  const bySlug = new Map(cities.map((c) => [c.slug, c]));
  const ordered: City[] = [];
  const seen = new Set<string>();

  for (const slug of PRIORITY_CLUSTER) {
    if (ordered.length >= FEATURED_CAP) break;
    const city = bySlug.get(slug);
    if (city && !seen.has(slug)) {
      ordered.push(city);
      seen.add(slug);
    }
  }

  for (const slug of MAJOR_METRO_SLUGS) {
    if (ordered.length >= FEATURED_CAP) break;
    const city = bySlug.get(slug);
    if (city && !seen.has(slug)) {
      ordered.push(city);
      seen.add(slug);
    }
  }

  return ordered;
}
