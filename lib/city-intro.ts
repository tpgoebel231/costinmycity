import { cityLabel, getCity, getPermit, getProjectCost } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { typicalAllInSentence } from "@/lib/sourcing";
import type { City } from "@/lib/types";

const CLUSTER_FEATURED = ["roof-replacement", "kitchen-remodel"] as const;
const CLUSTER_SLUGS = new Set<string>(PRIORITY_CLUSTER);
const HVAC_SLUG = "hvac-replacement";
const DECK_SLUG = "deck";
const ROOF_SLUG = "roof-replacement";
const KITCHEN_SLUG = "kitchen-remodel";
const ROOF_PEERS_HEADING = "Compare roofs in other metros";
const KITCHEN_PEERS_HEADING = "Compare kitchens in other metros";
const HVAC_PEERS_HEADING = "Compare HVAC in other metros";
const DECK_PEERS_HEADING = "Compare decks in other metros";

export type CityLeadLink = {
  href: string;
  label: string;
};

export type CityPeerGroup = {
  heading: string;
  links: CityLeadLink[];
};

export type CityPageLead = {
  paragraphs: string[];
  featured: CityLeadLink[];
  peerGroups: CityPeerGroup[];
};

function moneyLink(projectSlug: string, city: City): CityLeadLink | null {
  const project = getProjectCost(projectSlug);
  if (!project) return null;
  const permit = getPermit(city.slug, projectSlug) ?? undefined;
  const est = buildEstimate(project, city, permit);
  return {
    href: "/cost/" + projectSlug + "/" + city.slug,
    label: shortProjectName(projectSlug) + " in " + cityLabel(city) + ", ~" + usd(est.allInTypical),
  };
}

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
      const link = moneyLink(slug, city);
      if (link) featured.push(link);
    }
  }

  if (featured.length < 4) {
    const hvac = moneyLink(HVAC_SLUG, city);
    if (hvac) featured.push(hvac);
  }

  const peerGroups: CityPeerGroup[] = [];
  const roofGroup = peerGroup(ROOF_SLUG, ROOF_PEERS_HEADING, city);
  if (roofGroup) peerGroups.push(roofGroup);
  const kitchenGroup = peerGroup(KITCHEN_SLUG, KITCHEN_PEERS_HEADING, city);
  if (kitchenGroup) peerGroups.push(kitchenGroup);
  const hvacGroup = peerGroup(HVAC_SLUG, HVAC_PEERS_HEADING, city);
  if (hvacGroup) peerGroups.push(hvacGroup);
  const deckGroup = peerGroup(DECK_SLUG, DECK_PEERS_HEADING, city);
  if (deckGroup) peerGroups.push(deckGroup);

  if (!paragraphs.length) return null;
  return {
    paragraphs,
    featured,
    peerGroups,
  };
}

function peerGroup(projectSlug: string, heading: string, city: City): CityPeerGroup | null {
  const project = getProjectCost(projectSlug);
  if (!project) return null;
  const links: CityLeadLink[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const otherCity = getCity(slug);
    if (!otherCity) continue;
    const link = moneyLink(projectSlug, otherCity);
    if (link) links.push(link);
  }
  if (!links.length) return null;
  return { heading, links };
}
