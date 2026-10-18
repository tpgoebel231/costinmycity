import { cityLabel, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { keepHvac } from "@/lib/seo";
import { CITY_HUB_SERP_SLUGS } from "@/lib/serp-retitle-keys";
import { shortDeptName } from "@/lib/sourcing";
import type { City } from "@/lib/types";

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

export type CityHubSeo = {
  /** On-page H1 / query-aligned base. */
  h1: string;
  /** SERP <title> base (before site suffix). */
  title: string;
  /** Meta description; leads with how-much home renovation. */
  description: string;
};

export type CityHubFaqItem = { question: string; answer: string };

type JobLine = {
  projectSlug: string;
  label: string;
  allInTypical: number;
  feeKnown: boolean;
  feeUsd: number | null;
};

function jobLines(city: City): JobLine[] {
  const lines: JobLine[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug);
    const est = buildEstimate(project, city, permit);
    lines.push({
      projectSlug: slug,
      label: shortProjectName(slug),
      allInTypical: est.allInTypical,
      feeKnown: permitFeeKnown(permit) && permit?.feeTypicalUsd != null,
      feeUsd: permit?.feeTypicalUsd ?? null,
    });
  }
  return lines;
}

function joinProse(parts: string[]): string {
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] + " and " + parts[1];
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function listAllIn(lines: JobLine[]): string {
  return joinProse(lines.map((line) => keepHvac(line.label.toLowerCase()) + " about " + usd(line.allInTypical)));
}

/**
 * Query-aligned SERP title + meta for PRIORITY_CLUSTER city hubs.
 * Targets “home renovation cost {city}” impressions; dollars from buildEstimate only.
 * Returns null outside the cluster so other hubs keep the generic project copy.
 */
export function cityHubSeo(city: City): CityHubSeo | null {
  if (!CLUSTER.has(city.slug)) return null;

  const label = cityLabel(city);
  const lines = jobLines(city);
  if (lines.length < 2) return null;

  const h1 = "Home renovation cost in " + label;
  const title = h1;
  const dept = shortDeptName(city);
  const description =
    "How much does home renovation cost in " +
    label +
    "? Typical all-in on our wage-indexed model: " +
    listAllIn(lines) +
    ", each with the recorded " +
    dept +
    " permit fee when known.";

  return { h1, title, description: keepHvac(description) };
}

/**
 * Every hub, not only the impression cluster. Query questions for Denver and
 * Chicago, shared questions elsewhere. Existing cluster topics are merged
 * into those answers so the page has one FAQ, not a second copy.
 */
export { cityHubFaqItems } from "@/lib/city-hub-deepen";

/** City hubs retitled for CTR. chicago-il shipped first; other slugs come from the candidate CSV. */
const SERP_RETITLE = new Set<string>(["chicago-il", ...CITY_HUB_SERP_SLUGS]);

/**
 * Chicago's shipped title is 61 characters. Longer city names use a shorter pattern
 * that stays at or under 60.
 */
function cityHubSerpTitle(name: string): string {
  const full = name + " home project costs 2026: typical cost and permit fees";
  if (full.length <= 61) return full;
  const mid = name + " project costs 2026: typical cost + permit fees";
  if (mid.length <= 60) return mid;
  const short = name + " costs 2026: typical + permit fees";
  if (short.length <= 60) return short;
  const tiny = name + " costs 2026";
  return tiny.length <= 60 ? tiny : tiny.slice(0, 60).trim();
}

/**
 * 2026 SERP title + meta with typical cost and permit fee per job, from
 * buildEstimate and recorded permit rows only. Null outside SERP_RETITLE.
 * Description keeps the Chicago template (longer than 155). On-page H1 is unchanged.
 */
export function cityHubSerpMeta(city: City): { title: string; description: string } | null {
  if (!SERP_RETITLE.has(city.slug)) return null;
  const lines = jobLines(city);
  if (lines.length < 2) return null;
  const title = cityHubSerpTitle(city.name);
  const parts = lines.map((line) => {
    const name = keepHvac(line.label.toLowerCase());
    const fee = line.feeKnown && line.feeUsd != null ? (line.feeUsd === 0 ? ", $0 permit fee" : ", permit " + usd(line.feeUsd)) : "";
    return name + " " + usd(line.allInTypical) + fee;
  });
  const description =
    "2026 typical costs in " + cityLabel(city) + ": " + parts.join("; ") +
    ". Official city permit fees with the formula and source.";
  return { title, description: keepHvac(description) };
}
