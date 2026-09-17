import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, ProjectCost } from "@/lib/types";

/** Lowercase job name for prose; keepHvac restores HVAC casing. */
export function jobProseName(project: ProjectCost): string {
  return keepHvac(shortProjectName(project.projectSlug).toLowerCase());
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}

/**
 * Short factual permit clause for SERP meta and how-much FAQ.
 * Does not invent fees; $0 / exempt only when the recorded row supports it.
 */
export function moneyPagePermitClause(permit: Permit | null | undefined): {
  fee: number | null;
  /** Trailing sentence or clause about the permit line. */
  sentence: string;
  /** Snappy mid-sentence clause when fee > 0 (for meta). */
  includedMid: string | null;
} {
  const fee = permit?.feeTypicalUsd ?? null;
  if (fee == null) {
    return {
      fee: null,
      sentence: "Local permit fee not yet recorded.",
      includedMid: null,
    };
  }
  if (fee === 0) {
    let sentence = "The recorded typical path permit fee is $0";
    if (mentionsExemption(permit) || permit?.permitRequired === false) {
      sentence += " (exempt)";
    }
    sentence += ".";
    return { fee: 0, sentence, includedMid: null };
  }
  return {
    fee,
    sentence: "The recorded local permit fee of " + usd(fee) + " is included in the all-in.",
    includedMid: "including the recorded local permit fee",
  };
}

export type MoneyPageSeo = {
  /** On-page H1 / money-keyword base without the (~$…) cue. */
  h1: string;
  /** SERP <title> base (before site suffix), with typical-price cue when known. */
  title: string;
  /** Meta + on-page desc string (kept in sync). */
  description: string;
  allInTypical: number;
  jobTypical: number;
};

/**
 * Shared money-page SERP title + description for generateMetadata and page desc.
 * Title keeps "{shortName} cost in {cityLabel}" and appends (~$typical) for CTR.
 * Description leads with the how-much query; never claims a $0 fee is "included".
 */
export function moneyPageSeo(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): MoneyPageSeo {
  const shortName = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const h1 = shortName + " cost in " + label;
  const title = h1 + " (~" + usd(est.allInTypical) + ")";
  const permitBit = moneyPagePermitClause(permit);

  let description: string;
  if (permitBit.fee == null) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ", " +
      (permitBit.includedMid || "including the recorded local permit fee") +
      ".";
  }

  return {
    h1: keepHvac(h1),
    title: keepHvac(title),
    description: keepHvac(description),
    allInTypical: est.allInTypical,
    jobTypical: est.job.typical,
  };
}

/** First FAQ Q/A: query-aligned how-much, same permit rules as meta. */
export function moneyPageHowMuchFaq(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): { question: string; answer: string } {
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const permitBit = moneyPagePermitClause(permit);

  const question = "How much does " + job + " cost in " + label + "?";
  let answer: string;
  if (permitBit.fee == null) {
    answer =
      "Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  }

  return {
    question: keepHvac(question),
    answer: keepHvac(answer),
  };
}
