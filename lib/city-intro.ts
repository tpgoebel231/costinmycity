import { cityLabel, getPermit, getProjectCost } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { typicalAllInSentence } from "@/lib/sourcing";
import type { City } from "@/lib/types";

const DENVER_FEATURED = ["roof-replacement", "kitchen-remodel"] as const;

export type CityLeadLink = {
  href: string;
  label: string;
};

export type CityPageLead = {
  paragraphs: string[];
  featured: CityLeadLink[];
};

/**
 * Short city-page intro. Only Denver is filled so other city pages stay unchanged.
 */
export function cityPageLead(city: City): CityPageLead | null {
  if (city.slug !== "denver-co") return null;

  const paragraphs: string[] = [];
  const featured: CityLeadLink[] = [];

  for (const slug of DENVER_FEATURED) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug) ?? null;
    paragraphs.push(typicalAllInSentence(city, project, permit));
    const est = buildEstimate(project, city, permit ?? undefined);
    featured.push({
      href: "/cost/" + slug + "/" + city.slug,
      label: shortProjectName(slug) + " in " + cityLabel(city) + ", ~" + usd(est.allInTypical),
    });
  }

  if (!paragraphs.length) return null;
  return { paragraphs, featured };
}
