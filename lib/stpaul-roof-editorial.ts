import { getLaunchProjectSlugs, getPermit, getProjectCost, getProjectCostsFile } from "@/lib/data";
import { buildEstimate, permitDisplayUsd, type Estimate } from "@/lib/estimates";
import { formatDate, usd, usdRange } from "@/lib/format";
import { stateAnchorSlug } from "@/lib/permits-index";
import { inlineProjectName } from "@/lib/projects";
import { recordedHubPermitFeeLabel } from "@/lib/sourcing";
import { statePermitPeers } from "@/lib/state-permits";
import type { City, Permit, ProjectCost } from "@/lib/types";
import { wageHourlyLabel } from "@/lib/wage-index";

const CITY_SLUG = "st-paul-mn";
const PROJECT_SLUG = "roof-replacement";

export type StPaulRoofLine = { name: string; amount: string };

export type StPaulRoofJobLink = { href: string; label: string; article: string };

export type StPaulRoofPeer = { name: string; roofHref: string; permitHref: string };

export type StPaulRoofSource = { name: string; url: string; dateLabel: string | null };

export type StPaulRoofWage = {
  metro: string;
  mean: string;
  vintage: string;
  metroUrl: string;
  nationalMean: string;
  nationalVintage: string;
  nationalUrl: string;
  laborMult: string;
  multiplier: string;
  surveySentence: string | null;
};

export type StPaulRoofEditorialModel = {
  heading: string;
  jobInline: string;
  jobSentence: string;
  laborSentence: string | null;
  wage: StPaulRoofWage | null;
  allInSentence: string | null;
  permitIntro: string | null;
  lineItems: StPaulRoofLine[];
  rangeSentence: string | null;
  driverSentence: string | null;
  caveatSentence: string | null;
  feeScheduleYear: string | null;
  permitSource: StPaulRoofSource | null;
  projectSource: StPaulRoofSource | null;
  permitHref: string;
  cityHref: string;
  cityName: string;
  jobs: StPaulRoofJobLink[];
  peers: StPaulRoofPeer[];
  stateHref: string;
  stateLinkLabel: string;
};

function plain(text: string | null | undefined): string | null {
  const cleaned = String(text || "")
    .replace(/\u2014/g, ";")
    .replace(/\u2013/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  if (/[\u2013\u2014]/.test(cleaned)) return null;
  if (/\b(?:recorded|feeModel|permitRequired|laborShare|null|undefined|NaN)\b/.test(cleaned)) return null;
  if (/\b(?:do not invent|left null|not extracted)\b/i.test(cleaned)) return null;
  if (/wage-indexed model/i.test(cleaned)) return null;
  return cleaned;
}

function asSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : text + ".";
}

/** Split on sentence periods without breaking "St." or "Minn. Stat." */
function dataSentences(text: string): string[] {
  const masked = text.replace(/\b(St|Minn|Stat)\./g, (token) => token.replace(".", "\u0000"));
  return masked
    .split(/(?<=\.)\s+/)
    .map((part) => part.replace(/\u0000/g, ".").trim())
    .filter(Boolean);
}

function noteSentence(notes: string, pattern: RegExp): string | null {
  for (const part of dataSentences(notes)) {
    if (!pattern.test(part)) continue;
    const cleaned = plain(part);
    if (cleaned) return asSentence(cleaned);
  }
  return null;
}

function dateLabel(iso: string | null | undefined): string | null {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(iso || "").trim());
  if (!match) return null;
  return plain(formatDate(match[1]));
}

function plainNum(n: number): string {
  const text = String(n);
  return /e/i.test(text) ? String(Math.round(n * 1000) / 1000) : text;
}

function articleFor(name: string): string {
  if (/^hvac\b/i.test(name) || /^[aeiou]/i.test(name)) return "an";
  return "a";
}

function sourceOf(
  name: string | null | undefined,
  url: string | null | undefined,
  retrieved: string | null | undefined,
): StPaulRoofSource | null {
  const cleanName = plain(name || "");
  const href = String(url || "").trim();
  if (!cleanName || !href) return null;
  return { name: cleanName, url: href, dateLabel: dateLabel(retrieved) };
}

function allInSentence(est: Estimate): string | null {
  const shown = permitDisplayUsd(est);
  if (shown == null || est.permitTypical == null) return null;
  const roundedOk =
    Math.round(shown) === est.permitTypical && est.job.typical + est.permitTypical === est.allInTypical;
  if (!roundedOk) return null;
  if (
    (Number.isInteger(shown) && shown === est.permitTypical) ||
    usd(shown) === usd(est.permitTypical)
  ) {
    return (
      "Typical all in: " +
      usd(est.job.typical) +
      " job plus " +
      usd(shown) +
      " permit equals " +
      usd(est.allInTypical) +
      "."
    );
  }
  return (
    "Typical all in: " +
    usd(est.job.typical) +
    " job plus the " +
    usd(shown) +
    " permit fee rounded to " +
    usd(est.permitTypical) +
    " equals " +
    usd(est.allInTypical) +
    "."
  );
}

function lineItems(permit: Permit): StPaulRoofLine[] {
  const rows: StPaulRoofLine[] = [];
  for (const extra of permit.extras || []) {
    const name = plain(extra.name || "");
    const amount = typeof extra.feeUsd === "number" ? extra.feeUsd : extra.amountUsd;
    if (!name || typeof amount !== "number") continue;
    rows.push({ name, amount: usd(amount) });
  }
  return rows;
}

function rangeSentence(permit: Permit): string | null {
  const assumed = permit.assumedValuationUsd;
  if (typeof permit.feeLowUsd !== "number" || typeof permit.feeHighUsd !== "number") return null;
  if (!assumed || typeof assumed.low !== "number" || typeof assumed.high !== "number") return null;
  let sentence =
    "The fee range is " +
    usdRange(permit.feeLowUsd, permit.feeHighUsd) +
    ": " +
    usd(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    " and " +
    usd(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ".";
  if (
    typeof assumed.typical === "number" &&
    typeof permit.typicalProjectValueUsd === "number" &&
    assumed.typical !== permit.typicalProjectValueUsd
  ) {
    sentence += " The project value on the schedule row is " + usd(permit.typicalProjectValueUsd) + ".";
  }
  return sentence;
}

function surveySentence(method: string | null | undefined): string | null {
  for (const part of dataSentences(String(method || ""))) {
    if (!/bid survey/i.test(part)) continue;
    const cleaned = plain(part);
    if (cleaned) return asSentence(cleaned);
  }
  return null;
}

function wageModel(project: ProjectCost, city: City): StPaulRoofWage | null {
  const adj = project.cityAdjustments?.[city.slug];
  const national = getProjectCostsFile()?.nationalWageIndex;
  if (!adj || !national) return null;
  const metro = plain(adj.metro || "");
  const vintage = plain(adj.blsVintage || "");
  const nationalVintage = plain(national.vintage || "");
  const metroUrl = String(adj.source || "").trim();
  const nationalUrl = String(national.sourceUrl || "").trim();
  const mean = adj.blsConstructionMeanHourlyUsd;
  const nationalMean = national.nationalMeanHourlyUsd;
  const laborMult = adj.laborWageMultiplier;
  const multiplier = adj.multiplier;
  if (!metro || !vintage || !nationalVintage || !metroUrl || !nationalUrl) return null;
  if (typeof mean !== "number" || typeof nationalMean !== "number") return null;
  if (typeof laborMult !== "number" || typeof multiplier !== "number") return null;
  return {
    metro,
    mean: wageHourlyLabel(mean),
    vintage,
    metroUrl,
    nationalMean: wageHourlyLabel(nationalMean),
    nationalVintage,
    nationalUrl,
    laborMult: plainNum(laborMult),
    multiplier: plainNum(multiplier),
    surveySentence: surveySentence(adj.method),
  };
}

/**
 * Editorial for the St. Paul roof cost page only.
 * Other cities and other St. Paul jobs get null.
 * Dollar text comes from usd(), usdRange(), wageHourlyLabel(), and recordedHubPermitFeeLabel().
 */
export function stPaulRoofEditorial(city: City, project: ProjectCost): StPaulRoofEditorialModel | null {
  if (city.slug !== CITY_SLUG || project.projectSlug !== PROJECT_SLUG) return null;
  const permit = getPermit(city.slug, project.projectSlug);
  if (!permit) return null;

  const cityName = plain(city.name);
  const jobInline = plain(inlineProjectName(project.projectSlug));
  if (!cityName || !jobInline) return null;

  const est = buildEstimate(project, city, permit);
  const jobLead = jobInline.charAt(0).toUpperCase() + jobInline.slice(1);
  const jobSentence =
    jobLead +
    " in " +
    cityName +
    " is " +
    usd(est.job.low) +
    " at the low end, " +
    usd(est.job.typical) +
    " for the typical job, and " +
    usd(est.job.high) +
    " at the high end, before the permit.";

  let laborSentence: string | null = null;
  if (typeof project.laborShare === "number" && Number.isFinite(project.laborShare)) {
    laborSentence = "Labor is " + Math.round(project.laborShare * 100) + "% of the job.";
  }

  const lines = lineItems(permit);
  const feeLabel = plain(recordedHubPermitFeeLabel(permit));
  const dept = plain(city.permitDeptName);
  const jurisdiction = noteSentence(city.notes || "", /not Minneapolis and not Ramsey County/i);
  const typicalValuation = permit.assumedValuationUsd?.typical;
  const introBits: string[] = [];
  if (dept) introBits.push(dept + " sets this roof permit.");
  if (jurisdiction) introBits.push(jurisdiction);
  if (feeLabel && typeof typicalValuation === "number") {
    introBits.push("At the " + usd(typicalValuation) + " valuation the listed fee is " + feeLabel + ".");
  } else if (feeLabel) {
    introBits.push("The listed fee is " + feeLabel + ".");
  }
  if (lines.length) introBits.push("The lines included in that fee:");
  const permitIntro = introBits.length ? introBits.join(" ") : null;

  const caveat = plain(permit.caveat || "");
  const caveatSentence = caveat ? "The caveat for this roof permit is: " + asSentence(caveat) : null;
  const driverSentence = noteSentence(city.notes || "", /326B\.148/);

  const jobs: StPaulRoofJobLink[] = [];
  for (const slug of getLaunchProjectSlugs()) {
    if (slug === project.projectSlug) continue;
    if (!getProjectCost(slug)) continue;
    const label = plain(inlineProjectName(slug));
    if (!label) continue;
    jobs.push({
      href: "/cost/" + slug + "/" + city.slug + "/",
      label,
      article: articleFor(label),
    });
  }

  const peers: StPaulRoofPeer[] = [];
  for (const peer of statePermitPeers(city)) {
    const name = plain(peer.name);
    if (!name) continue;
    peers.push({
      name,
      roofHref: "/cost/" + project.projectSlug + "/" + peer.slug + "/",
      permitHref: "/permits/" + peer.slug + "/",
    });
  }

  const projectRow = (project.sources || []).find((source) => (source.name || "").trim() && (source.url || "").trim());

  return {
    heading: "How to read " + cityName + "'s roof numbers",
    jobInline,
    jobSentence,
    laborSentence,
    wage: wageModel(project, city),
    allInSentence: allInSentence(est),
    permitIntro,
    lineItems: lines,
    rangeSentence: rangeSentence(permit),
    driverSentence,
    caveatSentence,
    feeScheduleYear: typeof city.feeScheduleYear === "number" ? String(city.feeScheduleYear) : null,
    permitSource: sourceOf(permit.sourceName, permit.sourceUrl, permit.retrievedDate),
    projectSource: projectRow ? sourceOf(projectRow.name, projectRow.url, projectRow.retrievedDate) : null,
    permitHref: "/permits/" + city.slug + "/",
    cityHref: "/city/" + city.slug + "/",
    cityName,
    jobs,
    peers,
    stateHref: "/permits/#state-" + stateAnchorSlug(city.state),
    stateLinkLabel: city.state + " fee table",
  };
}
