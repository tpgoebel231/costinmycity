import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, ProjectCost } from "@/lib/types";

function permitFeeKnown(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}

function asSentence(s: string): string {
  const t = keepHvac(s.trim());
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function firstSentence(s: string): string {
  const t = s.trim();
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return asSentence(m ? m[0] : t);
}

function jobPhrase(project: ProjectCost): string {
  return shortProjectName(project.projectSlug).toLowerCase();
}

/** Prefer a recorded department acronym (SDCI, CPD) over the full office name. */
export function shortDeptName(city: City): string {
  const m = (city.permitDeptName || "").match(/\(([A-Z]{2,8})\)/);
  return m ? m[1] : "local";
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}

/**
 * CITY + JOB + typical dollar from buildEstimate. Does not invent permit dollars.
 */
export function typicalAllInSentence(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string {
  const est = buildEstimate(project, city, permit ?? undefined);
  const job = jobPhrase(project);
  const label = cityLabel(city);
  const fee = permit?.feeTypicalUsd ?? null;

  if (fee == null) {
    return asSentence(
      "A typical " +
        job +
        " in " +
        label +
        " runs about " +
        usd(est.job.typical) +
        " on our wage-indexed model, with no permit dollar on the typical because the official fee is not yet recorded",
    );
  }

  if (fee === 0) {
    let s =
      "A typical " +
      job +
      " in " +
      label +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model; the recorded permit fee is " +
      usd(0);
    if (mentionsExemption(permit) || permit?.permitRequired === false) {
      s += " because of a documented exemption";
    }
    return asSentence(s);
  }

  return asSentence(
    "A typical " +
      job +
      " in " +
      label +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee",
  );
}

/**
 * Unique city × job intro: money lead, then BLS / permit / national. Cap 4.
 * Does not invent permit dollars or sources.
 */
export function localSourcingSentences(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string[] {
  const out: string[] = [];
  const adj = project.cityAdjustments?.[city.slug];
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const laborPct = project.laborShare != null ? Math.round(project.laborShare * 100) : null;

  out.push(typicalAllInSentence(city, project, permit));

  if (adj && (adj.metro || adj.blsConstructionMeanHourlyUsd != null || adj.blsVintage)) {
    let wage =
      "Labor for " +
      job +
      " in " +
      label +
      " is indexed to the BLS construction-and-extraction occupations mean hourly wage";
    if (adj.metro) wage += " for " + adj.metro;
    if (adj.blsConstructionMeanHourlyUsd != null) {
      wage += " of $" + adj.blsConstructionMeanHourlyUsd.toFixed(2);
    }
    if (adj.blsVintage) wage += " (" + adj.blsVintage + ")";
    if (laborPct != null) wage += ", applied to the " + laborPct + "% labor share";
    out.push(asSentence(wage));
  } else {
    out.push(
      asSentence(
        "Labor for " + job + " in " + label + " uses the recorded city wage index applied to the labor share only",
      ),
    );
  }

  const known = permitFeeKnown(permit);
  if (known && permit && permit.feeTypicalUsd != null) {
    let p =
      city.permitDeptName +
      " is the issuing office. The typical permit fee recorded from " +
      permit.sourceName;
    if (permit.retrievedDate) p += ", retrieved " + permit.retrievedDate;
    p += ", is " + usd(permit.feeTypicalUsd);
    if (permit.feeModel) p += ". Fee model: " + permit.feeModel.replace(/_/g, " ");
    out.push(asSentence(p));
  } else {
    let p = "The official permit fee was not extracted from the published schedule, so the permit line stays blank";
    if (permit?.sourceName) p += ". Source on file: " + permit.sourceName;
    if (permit?.retrievedDate) p += ", retrieved " + permit.retrievedDate;
    if (permit?.caveat) p += ". " + firstSentence(permit.caveat);
    out.push(asSentence(p));
  }

  out.push(
    asSentence(
      "The national typical for this job is " +
        usd(project.nationalTypical) +
        ". Materials stay at the national figure while labor is wage-indexed for " +
        label,
    ),
  );

  return out.slice(0, 4).map(keepHvac);
}
