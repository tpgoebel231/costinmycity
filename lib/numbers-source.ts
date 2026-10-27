import { sanitizeCopy } from "@/lib/dashes";
import { getProjectCostsFile, permitFeeKnown } from "@/lib/data";
import { buildEstimate, cityJobCost, getAdjustment, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { formatDate, numberFmt, usd } from "@/lib/format";
import { commonBandSource, highBandReachPrefix } from "@/lib/high-band";
import { projectMeta, type ProjectMeta } from "@/lib/projects";
import type { City, Permit, ProjectCost } from "@/lib/types";
import { wageHourlyLabel } from "@/lib/wage-index";

export type NumbersSourceLink = { href: string; label: string };
export type NumbersSourcePiece = string | NumbersSourceLink;
export type NumbersSourceStep = NumbersSourcePiece[];

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * New copy cannot keep an em or en dash. Source names still run through sanitizeCopy.
 * sanitizeCopy trims, so a leading or trailing space is put back. Those spaces
 * separate a link label from the words beside it.
 */
export function sanitizeNumbersText(text: string): string {
  if (!text) return "";
  const lead = /^\s*/.exec(text)?.[0] ?? "";
  const core = text.trim();
  if (!core) return lead ? " " : "";
  const trail = /\s*$/.exec(text)?.[0] ?? "";
  const cleaned = sanitizeCopy(core).replace(/\u2014/g, " - ").replace(/\u2013/g, " - ");
  return lead + cleaned + trail;
}

function finish(parts: NumbersSourcePiece[]): NumbersSourceStep {
  const out: NumbersSourcePiece[] = [];
  for (const part of parts) {
    if (typeof part === "string") {
      const text = sanitizeNumbersText(part);
      if (text) out.push(text);
    } else if (part.href && part.label) {
      out.push({ href: part.href, label: sanitizeNumbersText(part.label) });
    }
  }
  return out;
}

function plainNum(n: number): string {
  const text = String(n);
  return /e/i.test(text) ? String(Math.round(n * 1000) / 1000) : text;
}

function sizePhrase(meta: ProjectMeta): string {
  return numberFmt(meta.defaultQuantity) + " " + meta.quantityLabel.toLowerCase();
}

function jobProduct(project: ProjectCost, multiplier: number, meta: ProjectMeta): number {
  const qty = meta.defaultQuantity;
  if (meta.pricing === "job") {
    const factor = meta.defaultQuantity > 0 ? qty / meta.defaultQuantity : 1;
    return Math.round(project.nationalTypical * multiplier * factor);
  }
  return Math.round(project.nationalTypical * multiplier * qty);
}

function scaleAmount(
  amount: number,
  multiplier: number,
  meta: ProjectMeta,
  asJobTotal: boolean,
): number {
  const qty = meta.defaultQuantity;
  if (meta.pricing === "job" || asJobTotal) {
    const factor = meta.defaultQuantity > 0 ? qty / meta.defaultQuantity : 1;
    return Math.round(amount * multiplier * factor);
  }
  return Math.round(amount * multiplier * qty);
}

function wholeJobWords(meta: ProjectMeta, multiplier: number, typical: number): string {
  const base = plainNum(multiplier) + " times the national typical";
  const sized = meta.pricing === "per-unit" ? base + ", times " + sizePhrase(meta) : base;
  return sized + ": " + usd(typical) + " here.";
}

function sourceLink(name: string, url: string): NumbersSourcePiece {
  const href = url.trim();
  if (!href) return name;
  return { href, label: name };
}

function retrieved(date: string | null | undefined): string {
  const trimmed = (date || "").trim();
  if (!trimmed) return "";
  return " (retrieved " + formatDate(trimmed) + ")";
}

function stepNational(project: ProjectCost, meta: ProjectMeta): NumbersSourceStep | null {
  const source = project.sources?.[0];
  const name = (source?.name || "").trim();
  const url = (source?.url || "").trim();
  if (!name || !isNum(project.nationalTypical) || !isNum(project.nationalLow) || !isNum(project.nationalHigh)) {
    return null;
  }
  const perUnit = meta.pricing === "per-unit";
  const unitWords = perUnit ? "per sq ft" : "per job at the typical size";
  const common = commonBandSource(project);
  const parts: NumbersSourcePiece[] = [
    "We start from ",
    sourceLink(name, url),
    retrieved(source?.retrievedDate),
    ", which records a national typical of " +
      usd(project.nationalTypical) +
      " " +
      unitWords +
      ", with a range of " +
      usd(project.nationalLow) +
      " to " +
      usd(project.nationalHigh),
  ];
  if (common) {
    parts.push(", and an everyday range of " + usd(common.low) + " to " + usd(common.high));
  }
  parts.push(".");
  if (perUnit) {
    parts.push(" This page multiplies by the typical size, " + sizePhrase(meta) + ".");
  }
  return finish(parts);
}

function stepLabor(city: City, project: ProjectCost, est: Estimate, meta: ProjectMeta): NumbersSourceStep | null {
  const adj = getAdjustment(project, city.slug);
  const multiplier = adj?.multiplier ?? 1;
  if (!isNum(multiplier)) return null;
  const fromCode = cityJobCost(project, city.slug, meta.defaultQuantity);
  const product = jobProduct(project, multiplier, meta);
  if (fromCode.typical !== est.job.typical || fromCode.multiplier !== multiplier || product !== est.job.typical) {
    return null;
  }

  const laborPct = isNum(project.laborShare) ? Math.round(project.laborShare * 100) : null;
  const national = getProjectCostsFile()?.nationalWageIndex;
  const nationalMean = national?.nationalMeanHourlyUsd;
  const nationalVintage = (national?.vintage || "").trim();
  const mean = adj?.blsConstructionMeanHourlyUsd;
  const vintage = (adj?.blsVintage || "").trim() || "";
  const metro = (adj?.metro || "").trim() || "";
  const laborMult = adj?.laborWageMultiplier;
  const source = (adj?.source || "").trim() || "";
  const fieldsOk =
    !!adj &&
    laborPct != null &&
    !!metro &&
    !!vintage &&
    !!source &&
    !!nationalVintage &&
    isNum(mean) &&
    isNum(nationalMean) &&
    isNum(laborMult) &&
    isNum(adj.multiplier);

  if (
    !fieldsOk ||
    laborPct == null ||
    !isNum(mean) ||
    !isNum(nationalMean) ||
    !isNum(laborMult)
  ) {
    if (multiplier !== 1) return null;
    const parts: NumbersSourcePiece[] = [];
    if (laborPct != null) parts.push("Labor is " + laborPct + "% of the job. ");
    parts.push(
      "Labor stays at the national figure, so the whole job is " + wholeJobWords(meta, multiplier, est.job.typical),
    );
    return finish(parts);
  }

  return finish([
    "Labor is " + laborPct + "% of the job. ",
    { href: source, label: "BLS OEWS" },
    " " +
      vintage +
      " puts " +
      metro +
      " construction wages at " +
      wageHourlyLabel(mean) +
      " against " +
      wageHourlyLabel(nationalMean) +
      " nationally (" +
      nationalVintage +
      "), so labor is multiplied by " +
      plainNum(laborMult) +
      " and materials stay at the national figure, which makes the whole job " +
      wholeJobWords(meta, multiplier, est.job.typical),
  ]);
}

function stepPermit(permit: Permit | null | undefined, est: Estimate): NumbersSourceStep | null {
  const shown = permitDisplayUsd(est);
  const name = (permit?.sourceName || "").trim() || "";
  const url = (permit?.sourceUrl || "").trim() || "";
  const date = retrieved(permit?.retrievedDate);

  if (permit && permit.permitRequired === false && permit.feeTypicalUsd === 0) {
    if (shown !== 0) return null;
    const parts: NumbersSourcePiece[] = ["The typical job does not need a permit"];
    if (name) {
      parts.push(", per ", sourceLink(name, url), date);
    }
    parts.push(", so the permit line is " + usd(0) + ".");
    return finish(parts);
  }

  if (permit && permit.feeTypicalUsd != null && permitFeeKnown(permit) && permit.permitRequired !== false) {
    if (!isNum(shown)) return null;
    const model = (permit.feeModel || "").trim().toLowerCase();
    const parts: NumbersSourcePiece[] = ["The permit line is " + usd(shown)];
    if (name) {
      parts.push(", the typical fee from ", sourceLink(name, url), date);
    }
    if ((model === "valuation" || model === "sliding") && isNum(permit.typicalProjectValueUsd)) {
      parts.push(", at the " + usd(permit.typicalProjectValueUsd) + " project value the schedule uses");
    }
    parts.push(".");
    return finish(parts);
  }

  if (!permit || permit.feeTypicalUsd == null) {
    if (est.permitKnown) return null;
    const parts: NumbersSourcePiece[] = [];
    if (name) {
      parts.push(sourceLink(name, url), date, " does not publish a dollar fee for this typical job, so the totals have no permit line.");
    } else {
      parts.push("No dollar fee is published for this typical job, so the totals have no permit line.");
    }
    return finish(parts);
  }

  return null;
}

function stepRange(project: ProjectCost, est: Estimate, meta: ProjectMeta): NumbersSourceStep | null {
  const common = commonBandSource(project);
  const multiplier = est.job.multiplier;
  const bandJobLow = common
    ? scaleAmount(common.low, multiplier, meta, common.asJobTotal)
    : est.job.low;
  const bandJobHigh = common
    ? scaleAmount(common.high, multiplier, meta, common.asJobTotal)
    : est.job.high;
  const addLow = est.permitKnown ? (est.permitLow ?? est.permitTypical ?? 0) : 0;
  const addHigh = est.permitKnown ? (est.permitHigh ?? est.permitTypical ?? 0) : 0;
  if (bandJobLow + addLow !== est.bandLow || bandJobHigh + addHigh !== est.bandHigh) return null;

  let sentence =
    "Most projects run " +
    usd(est.bandLow) +
    " to " +
    usd(est.bandHigh) +
    ": the " +
    (common ? "everyday range" : "national range") +
    " times the same " +
    plainNum(multiplier);
  if (meta.pricing === "per-unit") sentence += " and the typical size";
  if (est.permitKnown) sentence += ", plus the permit fee at the low and high ends";
  sentence += ".";

  const parts: NumbersSourcePiece[] = [sentence];
  const prefix = highBandReachPrefix(project);
  if (prefix) {
    const permitHigh = est.permitKnown ? (est.permitHigh ?? est.permitTypical ?? 0) : 0;
    if (est.job.high + permitHigh !== est.allInHigh) return finish(parts);
    parts.push(" " + prefix + usd(est.allInHigh) + ".");
  }
  return finish(parts);
}

function stepTotal(est: Estimate): NumbersSourceStep | null {
  const shown = permitDisplayUsd(est);
  const how: NumbersSourceLink = { href: "/methodology/", label: "How we calculate" };
  if (est.permitKnown) {
    if (!isNum(shown)) return null;
    if (Math.abs(est.job.typical + shown - est.allInTypical) > 0.001) return null;
    return finish([
      "Typical all in: " +
        usd(est.job.typical) +
        " job plus " +
        usd(shown) +
        " permit equals " +
        usd(est.allInTypical) +
        ". ",
      how,
      ".",
    ]);
  }
  if (est.allInTypical !== est.job.typical) return null;
  return finish(["Typical all in is the job cost, " + usd(est.allInTypical) + ". ", how, "."]);
}

/**
 * Ordered steps for the "Where these numbers come from" section.
 * A step is omitted when its figures would not reproduce buildEstimate.
 */
export function numbersSourceSteps(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): NumbersSourceStep[] {
  const meta = projectMeta(project.projectSlug);
  const est = buildEstimate(project, city, permit ?? undefined);
  const steps = [
    stepNational(project, meta),
    stepLabor(city, project, est, meta),
    stepPermit(permit, est),
    stepRange(project, est, meta),
    stepTotal(est),
  ];
  return steps.filter((step): step is NumbersSourceStep => step != null && step.length > 0);
}
