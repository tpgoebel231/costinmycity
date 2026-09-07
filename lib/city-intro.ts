import { cityLabel, getPermit, getProjectCost } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { typicalAllInSentence } from "@/lib/sourcing";
import type { City } from "@/lib/types";

const CLUSTER_FEATURED = ["roof-replacement", "kitchen-remodel"] as const;
const CLUSTER_SLUGS = new Set<string>(PRIORITY_CLUSTER);

export type CityLeadLink = {
  href: string;
  label: string;
};

export type CityPageLead = {
  paragraphs: string[];
  featured: CityLeadLink[];
};

/**
 * Short city-page intro for impression-cluster hubs.
 * Other city pages stay unchanged (null lead).
 */
export function cityPageLead(city: City): CityPageLead | null {
  if (!CLUSTER_SLUGS.has(city.slug)) return null;

  const paragraphs: string[] = [];
  const featured: CityLeadLink[] = [];

  for (const slug of CLUSTER_FEATURED) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug) ?? null;
    if (paragraphs.length < 3) {
      paragraphs.push(typicalAllInSentence(city, project, permit));
    }
    if (featured.length < 4) {
      const est = buildEstimate(project, city, permit ?? undefined);
      featured.push({
        href: "/cost/" + slug + "/" + city.slug,
        label: shortProjectName(slug) + " in " + cityLabel(city) + ", ~" + usd(est.allInTypical),
      });
    }
  }

  if (!paragraphs.length) return null;
  return { paragraphs, featured };
}
