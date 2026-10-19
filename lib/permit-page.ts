import { sanitizeCopy } from "@/lib/dashes";
import { getLaunchProjectSlugs, getPermit, getProjectCost } from "@/lib/data";
import { feeModelLabel, formatDate, usd } from "@/lib/format";
import { permitCalloutModel } from "@/lib/local-copy";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { shortCalcNoteForProse } from "@/lib/short-calc-note";
import { moneyExact } from "@/lib/sourcing";
import type { City, CostSource, Permit, ProjectCost } from "@/lib/types";

/**
 * Plain sentence the cost pages use when feeTypicalUsd is null.
 * The build check looks for this wording on those rows.
 */
export const PERMIT_FEE_NOT_PUBLISHED = "The city has not published a fee for this job";

export const PERMIT_PATH_NO_PERMIT = "The typical path does not require a permit";

const DESC_ORDER = ["roof-replacement", "kitchen-remodel", "hvac-replacement", "deck"];

export type PermitFeeStatus = "known" | "unknown" | "zero" | "missing";

export type PermitExemptionCite = {
  name: string;
  url: string;
  retrievedLabel: string | null;
  what: string | null;
};

export type PermitFeeRow = {
  projectSlug: string;
  jobLabel: string;
  href: string;
  noteId: string;
  status: PermitFeeStatus;
  typicalLabel: string | null;
  rangeLabel: string | null;
  /** usd() lines for fee amounts the typical and range labels do not already show. */
  feeLines: string[];
  noPermit: boolean;
  notPublished: boolean;
  feeBasis: string | null;
  valuationBasis: string | null;
  shortCalc: string;
  calculationNote: string;
  caveat: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  retrievedLabel: string | null;
  exemptionSource: PermitExemptionCite | null;
  permitRequired: boolean | null;
  feeModel: string | null;
};

export type PermitFaqItem = { question: string; answer: string };

export type PermitPageModel = {
  slug: string;
  cityName: string;
  stateAbbr: string;
  title: string;
  description: string;
  intro: string;
  feesChecked: string;
  caption: string;
  rows: PermitFeeRow[];
  faq: PermitFaqItem[];
};

function finish(text: string): string {
  const urls: string[] = [];
  const masked = (text || "").replace(/https?:\/\/[^\s)\]"'<>]+/g, (raw) => {
    const url = raw.replace(/[.,;:]+$/g, "");
    urls.push(url);
    return "\u3014URL" + (urls.length - 1) + "\u3015" + raw.slice(url.length);
  });
  const cleaned = sanitizeCopy(keepHvac(masked)).replace(/\s+/g, " ").trim();
  return cleaned.replace(/\u3014URL(\d+)\u3015/g, (_, index: string) => urls[Number(index)] ?? "");
}

function asSentence(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return /[.!?]$/.test(t) ? t : t + ".";
}

function jobPhrase(label: string): string {
  return keepHvac(label.toLowerCase());
}

/** A fee amount or an explicit permit status. Blank unknown rows do not count. */
function jobUsable(permit: Permit | undefined): boolean {
  if (!permit) return false;
  if (permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null) return true;
  if (permit.permitRequired === true || permit.permitRequired === false) return true;
  const model = (permit.feeModel || "").trim().toLowerCase();
  return Boolean(model && model !== "unknown");
}

export function cityHasPermitPage(city: City): boolean {
  return getLaunchProjectSlugs().some((slug) => jobUsable(getPermit(city.slug, slug)));
}

export function permitPageSlugs(cities: City[]): string[] {
  return cities.filter((city) => cityHasPermitPage(city)).map((city) => city.slug);
}

function containsMoney(text: string, formatted: string): boolean {
  if (!formatted) return false;
  const escaped = formatted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped + "(?!\\d)").test(text);
}

function feeLinesFor(permit: Permit | undefined, shown: string): string[] {
  if (!permit) return [];
  const lines: string[] = [];
  let text = shown;
  const bands: Array<[string, number | null]> = [
    ["Low", permit.feeLowUsd],
    ["Typical", permit.feeTypicalUsd],
    ["High", permit.feeHighUsd],
  ];
  for (const [label, amount] of bands) {
    if (typeof amount !== "number" || Number.isNaN(amount)) continue;
    const formatted = usd(amount);
    if (containsMoney(text, formatted)) continue;
    const exact = moneyExact(amount);
    // Callout labels keep cents that usd() would round at $1,000 and above.
    if (exact !== formatted && containsMoney(text, exact)) continue;
    const line = label + " " + formatted;
    lines.push(line);
    text += " " + line;
  }
  return lines;
}

function valuationBasis(permit: Permit): string | null {
  const model = (permit.feeModel || "").trim().toLowerCase();
  const assumed = permit.assumedValuationUsd;
  const bits: string[] = [];
  if (assumed) {
    if (typeof assumed.low === "number") bits.push("low " + usd(assumed.low));
    if (typeof assumed.typical === "number") bits.push("typical " + usd(assumed.typical));
    if (typeof assumed.high === "number") bits.push("high " + usd(assumed.high));
  }
  if (bits.length) {
    const lead = model === "valuation" ? "Project value for the formula: " : "Project value on this row: ";
    return lead + bits.join(", ") + ".";
  }
  if (typeof permit.typicalProjectValueUsd === "number") {
    return "Project value on this row: " + usd(permit.typicalProjectValueUsd) + ".";
  }
  return null;
}

function exemptionCite(source: CostSource | null | undefined): PermitExemptionCite | null {
  if (!source?.url) return null;
  const name = (source.name || "").trim();
  if (!name) return null;
  const retrieved = (source.retrievedDate || "").trim();
  const what = (source.what || source.note || "").trim();
  return {
    name: finish(name),
    url: source.url.trim(),
    retrievedLabel: retrieved ? formatDate(retrieved) : null,
    what: what ? finish(what) : null,
  };
}

function shortCalc(permit: Permit | undefined, displayedTypical: string | null): string {
  let text = shortCalcNoteForProse(permit, displayedTypical);
  text = finish(text);
  if (text.length <= 400) return text;
  const fallback = shortCalcNoteForProse(
    { feeTypicalUsd: permit?.feeTypicalUsd ?? null, calculationNote: "x".repeat(401) },
    displayedTypical,
  );
  return finish(fallback).slice(0, 400);
}

function buildRow(city: City, project: ProjectCost, permit: Permit | undefined): PermitFeeRow {
  const callout = permitCalloutModel(city, project, permit);
  const jobLabel = finish(shortProjectName(project.projectSlug));
  const href = "/cost/" + project.projectSlug + "/" + city.slug + "/";
  const noteId = "calc-" + project.projectSlug;
  const feeBasis = permit && (permit.feeModel || "").trim() ? finish(feeModelLabel(permit.feeModel)) : null;
  const basis = permit ? valuationBasis(permit) : null;
  const caveat = permit?.caveat?.trim() ? finish(permit.caveat) : null;
  const calculationNote = permit?.calculationNote?.trim() ? finish(permit.calculationNote) : "";
  const sourceName = permit?.sourceName?.trim() ? finish(permit.sourceName) : null;
  const sourceUrl = permit?.sourceUrl?.trim() || null;
  const retrievedRaw = permit?.retrievedDate?.trim() || "";
  const retrievedLabel = retrievedRaw ? formatDate(retrievedRaw) : null;

  let status: PermitFeeStatus = "missing";
  let typicalLabel: string | null = null;
  let rangeLabel: string | null = null;
  if (callout.kind === "known") {
    status = "known";
    typicalLabel = finish(callout.typicalLabel || usd(callout.typicalUsd));
    rangeLabel = callout.rangeLabel ? finish(callout.rangeLabel) : null;
  } else if (callout.kind === "zero") {
    status = "zero";
    typicalLabel = usd(0);
  } else if (callout.kind === "unknown") {
    status = "unknown";
  }

  const noPermit = status === "zero" && permit?.permitRequired === false;
  const shown = [typicalLabel, rangeLabel].filter(Boolean).join(" ");
  const feeLines = feeLinesFor(permit, shown).map((line) => finish(line));
  const displayedTypical = typicalLabel;
  const notPublished = status === "unknown" || status === "missing";

  return {
    projectSlug: project.projectSlug,
    jobLabel,
    href,
    noteId,
    status,
    typicalLabel,
    rangeLabel,
    feeLines,
    noPermit,
    notPublished,
    feeBasis: feeBasis ? finish(feeBasis) : null,
    valuationBasis: basis ? finish(basis) : null,
    shortCalc: shortCalc(permit, displayedTypical),
    calculationNote,
    caveat,
    sourceName,
    sourceUrl,
    retrievedLabel,
    exemptionSource: exemptionCite(permit?.exemptionSource),
    permitRequired: permit ? permit.permitRequired : null,
    feeModel: permit?.feeModel?.trim() ? permit.feeModel.trim() : null,
  };
}

function feePhrase(row: PermitFeeRow): string {
  const name = jobPhrase(row.jobLabel);
  if (row.notPublished || !row.typicalLabel) return name + " not published";
  return name + " " + row.typicalLabel;
}

function descriptionFor(city: City, rows: PermitFeeRow[]): string {
  const bySlug = new Map(rows.map((row) => [row.projectSlug, row]));
  const phrases = DESC_ORDER.map((slug) => {
    const row = bySlug.get(slug);
    return row ? feePhrase(row) : slug.replace(/-/g, " ") + " not published";
  });
  let lastFee = -1;
  for (let i = 0; i < phrases.length; i++) {
    if (!phrases[i].endsWith(" not published")) lastFee = i;
  }
  if (lastFee >= 0) phrases[lastFee] += " typical";
  return finish(
    city.name +
      ", " +
      city.stateAbbr +
      " building permit fees for 2026: " +
      phrases.join(", ") +
      ", with formulas and official sources.",
  );
}

function howMuchAnswer(row: PermitFeeRow): string {
  if (row.notPublished) {
    const parts = [PERMIT_FEE_NOT_PUBLISHED + "."];
    if (row.caveat) parts.push(asSentence(row.caveat));
    return finish(parts.join(" "));
  }
  const parts: string[] = [];
  if (row.typicalLabel) parts.push("The typical permit fee is " + row.typicalLabel + ".");
  if (row.rangeLabel) parts.push("The range is " + row.rangeLabel + ".");
  for (const line of row.feeLines) parts.push(asSentence(line) );
  if (row.noPermit) parts.push(PERMIT_PATH_NO_PERMIT + ".");
  if (row.feeBasis) parts.push("Fee basis: " + row.feeBasis + ".");
  if (row.valuationBasis) parts.push(asSentence(row.valuationBasis));
  if (row.sourceName) {
    let source = "Source: " + row.sourceName + ".";
    if (row.retrievedLabel) source += " Retrieved " + row.retrievedLabel + ".";
    parts.push(source);
  }
  return finish(parts.join(" "));
}

function needPermitAnswer(row: PermitFeeRow): string | null {
  const model = (row.feeModel || "").trim().toLowerCase();
  const ask = row.permitRequired === false || model === "exemption" || model === "none";
  if (!ask) return null;
  const parts: string[] = [];
  if (row.permitRequired === false) parts.push("No. " + PERMIT_PATH_NO_PERMIT + ".");
  else if (row.permitRequired === true) parts.push("A permit is required.");
  if (row.feeBasis) parts.push("Fee basis: " + row.feeBasis + ".");
  if (row.caveat) parts.push(asSentence(row.caveat));
  return finish(parts.join(" "));
}

function faqFor(city: City, rows: PermitFeeRow[]): PermitFaqItem[] {
  const items: PermitFaqItem[] = [];
  for (const row of rows) {
    const job = jobPhrase(row.jobLabel);
    items.push({
      question: finish("How much is a " + job + " permit in " + city.name + "?"),
      answer: howMuchAnswer(row),
    });
    const need = needPermitAnswer(row);
    if (need) {
      items.push({
        question: finish("Do I need a permit for a " + job + " in " + city.name + "?"),
        answer: need,
      });
    }
  }
  const dept = city.permitDeptName.trim();
  const portal = city.permitPortalUrl.trim();
  if (dept && portal) {
    items.push({
      question: finish("Where do I apply for a building permit in " + city.name + "?"),
      answer: finish("Apply with " + dept + ". The permit portal is " + portal + "."),
    });
  }
  return items;
}

function latestRetrieved(rows: PermitFeeRow[], permits: Array<Permit | undefined>): string {
  let latest = "";
  for (const permit of permits) {
    const raw = (permit?.retrievedDate || "").trim();
    if (raw && (!latest || raw > latest)) latest = raw;
  }
  if (!latest) {
    for (const row of rows) {
      if (row.retrievedLabel && !latest) return row.retrievedLabel;
    }
    return "";
  }
  return formatDate(latest);
}

export function permitPageModel(city: City): PermitPageModel | null {
  if (!cityHasPermitPage(city)) return null;
  const rows: PermitFeeRow[] = [];
  const permits: Array<Permit | undefined> = [];
  for (const slug of getLaunchProjectSlugs()) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug);
    permits.push(permit);
    rows.push(buildRow(city, project, permit));
  }
  if (!rows.length) return null;

  const year = city.feeScheduleYear;
  let intro = city.permitDeptName.trim() + " is the permit office for " + city.name + ", " + city.stateAbbr + ".";
  if (year != null) intro += " The fee schedule year is " + String(year) + ".";
  const checked = latestRetrieved(rows, permits);
  const title = "Building Permit Fees in " + city.name + ", " + city.stateAbbr + " (2026)";

  return {
    slug: city.slug,
    cityName: finish(city.name),
    stateAbbr: city.stateAbbr,
    title: finish(title),
    description: descriptionFor(city, rows),
    intro: finish(intro),
    feesChecked: checked ? "Fees checked " + checked : "Fees checked",
    caption: finish("Building permit fees in " + city.name + ", " + city.stateAbbr + " by job, 2026"),
    rows,
    faq: faqFor(city, rows),
  };
}
