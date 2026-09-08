import { cityLabel, getCity, getLaunchProjectSlugs, getPermit, getProjectCost } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import type { City, ProjectCost } from "@/lib/types";

/** High-impression city slugs for same-job money-page links. */
export const PRIORITY_CLUSTER = [
  "charlotte-nc",
  "seattle-wa",
  "denver-co",
  "nashville-tn",
  "atlanta-ga",
] as const;

const PRIORITY_JOBS = new Set(["roof-replacement", "kitchen-remodel", "hvac-replacement", "deck"]);

export type RelatedLink = {
  href: string;
  label: string;
};

export type RelatedMoneyGroups = {
  inCity: RelatedLink[];
  sameJob: RelatedLink[];
  sameJobHeading: string | null;
  indexHref: string;
  indexLabel: string;
};

function moneyHref(projectSlug: string, citySlug: string): string {
  return "/cost/" + projectSlug + "/" + citySlug;
}

function dollarLabel(name: string, city: City, typicalUsd: number): string {
  return name + " in " + cityLabel(city) + ", ~" + usd(typicalUsd);
}

function sameJobHeading(projectSlug: string): string | null {
  if (projectSlug === "roof-replacement") return "Related roofs";
  if (projectSlug === "kitchen-remodel") return "Related kitchens";
  if (projectSlug === "hvac-replacement") return "Related HVAC replacements";
  if (projectSlug === "deck") return "Related decks";
  return null;
}

export function relatedMoneyGroups(city: City, project: ProjectCost): RelatedMoneyGroups {
  const projectSlug = project.projectSlug;
  const inCity: RelatedLink[] = [];

  for (const otherSlug of getLaunchProjectSlugs()) {
    if (otherSlug === projectSlug) continue;
    const otherProject = getProjectCost(otherSlug);
    if (!otherProject) continue;
    const permit = getPermit(city.slug, otherSlug);
    const est = buildEstimate(otherProject, city, permit);
    inCity.push({
      href: moneyHref(otherSlug, city.slug),
      label: dollarLabel(shortProjectName(otherSlug), city, est.allInTypical),
    });
  }

  const sameJob: RelatedLink[] = [];
  const heading = sameJobHeading(projectSlug);
  if (heading && PRIORITY_JOBS.has(projectSlug)) {
    for (const slug of PRIORITY_CLUSTER) {
      if (slug === city.slug) continue;
      const otherCity = getCity(slug);
      if (!otherCity) continue;
      const permit = getPermit(slug, projectSlug);
      const est = buildEstimate(project, otherCity, permit);
      sameJob.push({
        href: moneyHref(projectSlug, slug),
        label: dollarLabel(shortProjectName(projectSlug), otherCity, est.allInTypical),
      });
    }
  }

  const short = shortProjectName(projectSlug);
  return {
    inCity,
    sameJob,
    sameJobHeading: heading,
    indexHref: "/cost/" + projectSlug,
    indexLabel: "All " + short.toLowerCase() + " costs by city",
  };
}
