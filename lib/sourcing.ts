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

/**
 * Prefer a recorded department acronym (SDCI, CPD).
 * Else the last comma clause when recorded (Atlanta "Office of Buildings").
 * Else strip a leading "Department of …" (Nashville "Codes and Building Safety").
 * Else the clause before an em/en dash when recorded.
 * Else "local".
 */
export function shortDeptName(city: City): string {
  const name = (city.permitDeptName || "").trim();
  const m = name.match(/\(([A-Z]{2,8})\)/);
  if (m) return m[1];
  // "Department of City Planning, Office of Buildings" → "Office of Buildings"
  const parts = name.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1].split(/\s+[—–-]\s+/)[0].trim();
    if (last && last.length >= 3 && last.length <= 40 && !/^https?:/i.test(last)) {
      return last;
    }
  }
  // "Department of Codes and Building Safety" → "Codes and Building Safety"
  // (Nashville roof CTR: recognizable Codes office instead of "local").
  let stripped = name.replace(/^Department of (?:the\s+)?/i, "").trim();
  stripped = stripped.split(/\s+[—–-]\s+/)[0].trim();
  if (
    stripped &&
    stripped !== name &&
    stripped.length >= 3 &&
    stripped.length <= 40 &&
    !/^https?:/i.test(stripped)
  ) {
    return stripped;
  }
  return "local";
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}


/**
 * When 2+ recorded extras with dollars sum to feeTypical, return a short
 * parenthetical from those names only (Seattle kitchen $864 building + $864 plan review).
 * Does not invent fees or rename beyond light shortening of recorded labels.
 */
export function recordedFeePartsNote(permit: Permit): string | null {
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return null;
  const parts = (permit.extras || []).filter(
    (e) => e.feeUsd != null && e.feeUsd > 0,
  );
  if (parts.length < 2) return null;
  const sum = parts.reduce((s, e) => s + (e.feeUsd as number), 0);
  if (Math.abs(sum - fee) > 0.05) return null;
  const bits = parts.map((e) => {
    const n = (e.name || "").toLowerCase();
    const amt = usd(e.feeUsd as number);
    // Building / plan-review before valuation so Denver ADMIN 138
    // "Building permit (… valuation)" labels as building (kitchen CTR).
    if (/plan review/.test(n)) return amt + " plan review";
    if (/building permit|building valuation/.test(n)) return amt + " building";
    // Seattle HVAC Table D-8 mechanical equipment (typical 2-unit included dollars).
    if (/mechanical|equipment fee/.test(n)) return amt + " mechanical";
    if (/tech/.test(n)) return amt + " tech";
    if (/minimum|min(?:imum)? permit/.test(n)) return amt + " minimum";
    if (/zoning/.test(n)) return amt + " zoning";
    if (/valuation/.test(n) && /tech|codes tech/.test(n) === false) return amt + " valuation";
    if (/codes tech|tech fee/.test(n)) return amt + " tech";
    // Seattle kitchen WA BCC (RCW 19.27.085) — avoid a bare last dollar in the parts note.
    if (/building code council|\bwacc\b|\bbcc\b/.test(n)) return amt + " WA BCC";
    return amt;
  });
  return "(" + bits.join(" + ") + ")";
}

/** Typical fee dollars plus optional recorded parts note for SERP/hero CTR. */
export function recordedPermitFeeBit(permit: Permit): string {
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return usd(fee);
  const partsNote = recordedFeePartsNote(permit);
  return usd(fee) + (partsNote ? " " + partsNote : "");
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

  // Fee dollars + recorded parts in hero for CTR (Seattle kitchen and fee>0 peers).
  return asSentence(
    "A typical " +
      job +
      " in " +
      label +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      recordedPermitFeeBit(permit as Permit),
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
