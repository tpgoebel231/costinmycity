import { cityLabel, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { keepHvac } from "@/lib/seo";
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

function listJobNames(lines: JobLine[]): string {
  return joinProse(lines.map((line) => keepHvac(line.label.toLowerCase())));
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
 * FAQ for PRIORITY_CLUSTER city hubs. How-much first for CTR/JSON-LD.
 * Fees and dollars only from recorded permit rows + buildEstimate.
 */
export function cityHubFaqItems(city: City): CityHubFaqItem[] {
  if (!CLUSTER.has(city.slug)) return [];

  const label = cityLabel(city);
  const lines = jobLines(city);
  if (lines.length < 2) return [];

  const dept = shortDeptName(city);
  const feeBits = lines
    .filter((line) => line.feeKnown && line.feeUsd != null)
    .map((line) => keepHvac(line.label.toLowerCase()) + " " + usd(line.feeUsd!));

  const items: CityHubFaqItem[] = [
    {
      question: "How much does home renovation cost in " + label + "?",
      answer:
        "On our wage-indexed model, typical all-in figures are " +
        listAllIn(lines) +
        ". Those figures include the recorded local permit fee when we have extracted it from the " +
        dept +
        " schedule.",
    },
    {
      question: "What home projects do you cover in " + label + "?",
      answer:
        "We publish typical costs for " +
        listJobNames(lines) +
        " in " +
        label +
        ", each with citations and the recorded permit line when known.",
    },
  ];

  if (feeBits.length) {
    let feeAnswer =
      "Recorded typical permit fees from " + dept + " are " + feeBits.join(", ") + ".";
    if (city.feeScheduleYear) {
      feeAnswer += " Fee schedule year " + city.feeScheduleYear + ".";
    }
    feeAnswer += " Confirm the live line before you pull a permit.";
    items.push({
      question: "What permit fees apply for home projects in " + label + "?",
      answer: feeAnswer,
    });
  }

  return items;
}
