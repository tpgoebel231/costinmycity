import { sanitizeCopy } from "@/lib/dashes";
import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { jobProseName, moneyPagePermitClause } from "@/lib/money-page-seo";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { MONEY_SERP_RETITLE, MONEY_TOP_QUERY } from "@/lib/serp-retitle-keys";
import type { City, Permit, ProjectCost } from "@/lib/types";

/** SERP title base, before the " – CostInMyCity" suffix. */
const TITLE_MAX = 60;
/** Meta description cap. City hubs keep the longer Chicago template. */
const DESC_MAX = 155;

const SHORT_JOB: Record<string, string> = {
  "roof-replacement": "roof",
  "hvac-replacement": "HVAC",
  deck: "deck",
  "kitchen-remodel": "kitchen",
};

function finalCopy(text: string): string {
  return sanitizeCopy(keepHvac(text))
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function capPhrase(phrase: string): string {
  if (phrase.startsWith("HVAC")) return phrase;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

/** Query wording for the job. "kitchen reno" only when the query says reno and not remodel. */
function jobPhraseForQuery(slug: string, query: string): string {
  const full = keepHvac(shortProjectName(slug).toLowerCase());
  if (slug === "kitchen-remodel" && /\breno\b/i.test(query) && !/\bremodel\b/i.test(query)) {
    return "kitchen reno";
  }
  return full;
}

function queryJobAt(query: string, slug: string): number {
  const q = query.toLowerCase();
  const tokens =
    slug === "kitchen-remodel"
      ? ["kitchen remodel", "kitchen renovation", "kitchen reno", "kitchen"]
      : slug === "hvac-replacement"
        ? ["hvac replacement", "hvac", "furnace", "heat pump", "air conditioning"]
        : slug === "roof-replacement"
          ? ["roof replacement", "roofing", "reroof", "roof"]
          : ["decking", "deck"];
  let at = -1;
  for (const token of tokens) {
    const i = q.indexOf(token);
    if (i >= 0 && (at < 0 || i < at)) at = i;
  }
  return at;
}

function wantsJobFirst(query: string, slug: string, city: City): boolean {
  if (!query.trim()) return false;
  const jobAt = queryJobAt(query, slug);
  if (jobAt < 0) return false;
  const cityAt = query.toLowerCase().indexOf(city.name.toLowerCase());
  if (cityAt < 0) return true;
  return jobAt < cityAt;
}

function titleCandidates(city: City, project: ProjectCost, allIn: number, query: string): string[] {
  const price = "(~" + usd(allIn) + ")";
  const slug = project.projectSlug;
  const job = keepHvac(shortProjectName(slug).toLowerCase());
  const short = SHORT_JOB[slug] || job;
  const out: string[] = [];
  if (wantsJobFirst(query, slug, city)) {
    const phrase = jobPhraseForQuery(slug, query);
    const q = query.toLowerCase();
    if (q.includes("average cost of")) {
      out.push("Average cost of " + phrase + " " + city.name + " 2026 " + price);
    }
    if (q.includes("average")) {
      out.push("Average " + phrase + " cost " + city.name + " 2026 " + price);
    }
    out.push(capPhrase(phrase) + " cost " + city.name + " 2026 " + price);
  }
  out.push(city.name + " " + job + " cost 2026 " + price);
  if (short !== job) out.push(city.name + " " + short + " cost 2026 " + price);
  return out;
}

function fitTitle(title: string, max: number): string {
  if (title.length <= max) return title;
  const matched = title.match(/\s*\(~\$[\d,]+(?:\.\d{2})?\)$/);
  const price = matched ? matched[0].trim() : "";
  const headBudget = price ? max - price.length - 1 : max;
  let head = (matched && matched.index != null ? title.slice(0, matched.index) : title).trim();
  if (head.length > headBudget) {
    head = head.slice(0, Math.max(0, headBudget));
    const space = head.lastIndexOf(" ");
    if (space > 8) head = head.slice(0, space);
    head = head.replace(/[\s,;:]+$/g, "");
  }
  const out = price ? (head + " " + price).trim() : head;
  return out.length <= max ? out : out.slice(0, max).trim();
}

function pickTitle(candidates: string[]): string {
  const cleaned = candidates.map(finalCopy);
  for (const title of cleaned) {
    if (title.length <= TITLE_MAX) return title;
  }
  const shortest = [...cleaned].sort((a, b) => a.length - b.length)[0] || "";
  return fitTitle(shortest, TITLE_MAX);
}

/**
 * Permit clause for the new description. Same fee rules as moneyPageSeo:
 * $0 sentence, exempt note, included-mid when the fee is positive, or not listed.
 */
function permitClause(permit: Permit | null | undefined, city: City): string {
  const bit = moneyPagePermitClause(permit, city);
  if (bit.fee == null || bit.fee === 0 || !bit.includedMid) {
    const sentence = bit.sentence.trim();
    return /[.!?]$/.test(sentence) ? sentence : sentence + ".";
  }
  const mid = bit.includedMid.trim();
  const withPeriod = /[.!?]$/.test(mid) ? mid : mid + ".";
  if (withPeriod.startsWith("HVAC")) return withPeriod;
  return withPeriod.charAt(0).toUpperCase() + withPeriod.slice(1);
}

function withoutParens(text: string): string {
  let next = text;
  while (/\([^()]*\)/.test(next)) next = next.replace(/\s*\([^()]*\)/g, "");
  return next.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
}

function throughFirstDollar(clause: string): string | null {
  const matched = clause.match(/\$[\d,]+(?:\.\d{2})?/);
  if (!matched || matched.index == null) return null;
  let short = clause.slice(0, matched.index + matched[0].length).replace(/[\s,;:]+$/g, "").trim();
  if (!short) return null;
  if (!/[.!?]$/.test(short)) short += ".";
  return short;
}

function ensurePeriod(text: string): string {
  const trimmed = text.replace(/[\s,;:]+$/g, "").trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : trimmed + ".";
}

function truncateClean(text: string, max: number): string {
  if (text.length <= max) return text;
  let cut = text.slice(0, max);
  const open = cut.lastIndexOf("(");
  const close = cut.lastIndexOf(")");
  if (open > close) cut = cut.slice(0, open);
  const space = cut.lastIndexOf(" ");
  if (space >= 40) cut = cut.slice(0, space);
  cut = cut.replace(/[\s,;:(–-]+$/g, "").trim();
  if (!/[.!?]$/.test(cut)) {
    if (cut.length + 1 <= max) cut += ".";
    else {
      const earlier = cut.lastIndexOf(" ");
      if (earlier > 0) cut = cut.slice(0, earlier).replace(/[\s,;:(–-]+$/g, "").trim();
      if (cut.length + 1 <= max) cut += ".";
    }
  }
  return cut.length <= max ? cut : cut.slice(0, max).trim();
}

function fitDescription(lead: string, clause: string): string {
  const candidates: string[] = [];
  const add = (piece: string) => {
    const text = ensurePeriod(finalCopy(lead + piece));
    if (text && !candidates.includes(text)) candidates.push(text);
  };
  add(clause);
  const stripped = withoutParens(clause);
  add(stripped);
  const feeStop = throughFirstDollar(stripped);
  if (feeStop) add(feeStop);
  const dollar = clause.match(/\$[\d,]+(?:\.\d{2})?/);
  if (dollar) add("Permit fee " + dollar[0] + ".");
  else add("Local permit fee not listed yet.");
  for (const candidate of candidates) {
    if (candidate.length <= DESC_MAX) return candidate;
  }
  return truncateClean(candidates[candidates.length - 1] || finalCopy(lead), DESC_MAX);
}

/**
 * SERP title + meta for money URLs in the retitle set.
 * Null outside the set so other pages keep moneyPageSeo.
 * Does not change the on-page H1.
 */
export function moneyPageSerpMeta(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): { title: string; description: string } | null {
  const key = project.projectSlug + "/" + city.slug;
  if (!MONEY_SERP_RETITLE.has(key)) return null;
  const est = buildEstimate(project, city, permit ?? undefined);
  const query = MONEY_TOP_QUERY[key] || "";
  const title = pickTitle(titleCandidates(city, project, est.allInTypical, query));
  const lead =
    "2026 typical " + jobProseName(project) + " cost in " + cityLabel(city) + ": " + usd(est.allInTypical) + ". ";
  const description = fitDescription(lead, permitClause(permit, city));
  return { title, description };
}
