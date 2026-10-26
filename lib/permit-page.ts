import { sanitizeCopy } from "@/lib/dashes";
import { getLaunchProjectSlugs, getPermit, getProjectCost } from "@/lib/data";
import { compactPermitFeeLabel, feeModelLabel, formatDate, usd } from "@/lib/format";
import { permitCalloutModel } from "@/lib/local-copy";
import { shortProjectName } from "@/lib/projects";
import { absUrl, keepHvac, siteOrganization } from "@/lib/seo";
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
  const cleaned = sanitizeCopy(keepHvac(masked))
    .replace(/\s+/g, " ")
    // One range form on permit pages: "$83 to $195", never "$83 – $195".
    .replace(/(\$\d[\d,]*(?:\.\d+)?)\s*[\u2013-]\s*(\$\d)/g, "$1 to $2")
    .trim();
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

/** "a roof replacement", "an HVAC replacement". */
function withArticle(phrase: string): string {
  return (/^(?:[aeiou]|hvac\b)/i.test(phrase) ? "an " : "a ") + phrase;
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

/**
 * Table cell text. A short official note is shown as is. A long note is not
 * cut mid-formula: the cell shows the fee basis and project values instead,
 * and the full note is in the "How each fee is calculated" section below.
 */
function shortCalc(
  permit: Permit | undefined,
  feeBasis: string | null,
  basis: string | null,
  displayedTypical: string | null,
): string {
  const note = (permit?.calculationNote || "").trim();
  if (!note) return "";
  if (note.length <= 400) return finish(note);
  const parts: string[] = [];
  if (feeBasis) parts.push(asSentence(feeBasis));
  if (basis) parts.push(asSentence(basis));
  if (!parts.length && displayedTypical) {
    const exempt = permit?.permitRequired === false && permit.feeTypicalUsd === 0;
    parts.push(
      exempt
        ? "The typical job does not need a permit, so the official fee is $0."
        : "The official typical permit fee is " + displayedTypical + ".",
    );
  }
  return finish(parts.join(" "));
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
    typicalLabel = compactPermitFeeLabel(permit, usd(0));
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
    shortCalc: shortCalc(permit, feeBasis ? finish(feeBasis) : null, basis ? finish(basis) : null, displayedTypical),
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
      question: finish("How much is " + withArticle(job) + " permit in " + city.name + "?"),
      answer: howMuchAnswer(row),
    });
    const need = needPermitAnswer(row);
    if (need) {
      items.push({
        question: finish("Do I need a permit for " + withArticle(job) + " in " + city.name + "?"),
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

/** Dataset copy: no em dash and no en dash. Data strings are sanitized first. */
function datasetPlain(text: string): string {
  return sanitizeCopy(keepHvac(text))
    .replace(/[\u2013\u2014]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

function proseJob(label: string): string {
  return datasetPlain(label.toLowerCase().replace(/\bhvac\b/gi, "HVAC"));
}

type FeeBands = { typical: boolean; low: boolean; high: boolean };

/** Money bands the permit fee column actually prints for these rows. */
function feeBands(rows: PermitFeeRow[]): FeeBands {
  const bands: FeeBands = { typical: false, low: false, high: false };
  for (const row of rows) {
    if (row.typicalLabel) bands.typical = true;
    for (const line of row.feeLines) {
      if (line.startsWith("Typical ")) bands.typical = true;
      if (line.startsWith("Low ")) bands.low = true;
      if (line.startsWith("High ")) bands.high = true;
    }
    const range = row.rangeLabel || "";
    if (!range) continue;
    if (/^from\b/i.test(range)) {
      bands.low = true;
      continue;
    }
    if (/^up to\b/i.test(range)) {
      bands.high = true;
      continue;
    }
    const amounts = range.match(/\$\d[\d,]*(?:\.\d+)?/g) || [];
    if (amounts.length >= 2 || range.includes(" to ")) {
      bands.low = true;
      bands.high = true;
    } else if (amounts.length === 1) {
      bands.low = true;
    }
  }
  return bands;
}

/** Official source URLs for table rows, then each row's exemption URL. Deduped. */
function datasetSourceUrls(rows: PermitFeeRow[]): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const raw of [row.sourceUrl, row.exemptionSource?.url]) {
      const url = (raw || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }
  return urls;
}

function measuredVariable(name: string, description: string, money: boolean) {
  const item: Record<string, string> = {
    "@type": "PropertyValue",
    name: datasetPlain(name),
    description: datasetPlain(description),
  };
  if (money) item.unitText = "USD";
  return item;
}

/**
 * One Dataset for a permit fee table page.
 * License and distribution are omitted: the site states no data license and ships no download file.
 * temporalCoverage is omitted: the rows do not state a coverage range.
 */
export function permitDatasetJsonLd(city: City, model: PermitPageModel, dateModified: string | null) {
  const bands = feeBands(model.rows);
  const bandNames: string[] = [];
  if (bands.typical) bandNames.push("typical");
  if (bands.low) bandNames.push("low");
  if (bands.high) bandNames.push("high");
  const jobs = model.rows.map((row) => proseJob(row.jobLabel));
  const unpublished = model.rows.filter((row) => row.notPublished).map((row) => proseJob(row.jobLabel));
  const place = datasetPlain(model.cityName + ", " + model.stateAbbr);
  let description =
    "Residential building permit fees in " +
    place +
    " for " +
    joinList(jobs) +
    (bandNames.length ? " (" + joinList(bandNames) + ")" : "") +
    ", with the fee formula and the official source for each job.";
  if (unpublished.length) {
    description += " The city has not published a fee for " + joinList(unpublished) + ".";
  }
  description = datasetPlain(description);

  const variableMeasured = [];
  if (bands.typical) {
    variableMeasured.push(
      measuredVariable("Typical permit fee", "Typical residential building permit fee for the job.", true),
    );
  }
  if (bands.low) {
    variableMeasured.push(
      measuredVariable("Low permit fee", "Low residential building permit fee for the job.", true),
    );
  }
  if (bands.high) {
    variableMeasured.push(
      measuredVariable("High permit fee", "High residential building permit fee for the job.", true),
    );
  }
  // How it is calculated and Official source are table columns on every permit page.
  const showsRetrieved = model.rows.some((row) => row.retrievedLabel);
  variableMeasured.push(
    measuredVariable("Fee calculation basis", "How the permit fee is calculated.", false),
    measuredVariable("Official source", "Official source for the permit fee.", false),
  );
  if (showsRetrieved) {
    variableMeasured.push(measuredVariable("Retrieved date", "Date the official source was retrieved.", false));
  }

  const sources = datasetSourceUrls(model.rows);
  const dataset: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: datasetPlain(place + " residential building permit fees"),
    description,
    url: absUrl("/permits/" + city.slug),
    keywords: [
      datasetPlain(model.cityName),
      datasetPlain(city.state),
      "building permit fees",
      ...model.rows.map((row) => datasetPlain(row.jobLabel)),
    ],
    isAccessibleForFree: true,
    creator: siteOrganization(),
    publisher: siteOrganization(),
    spatialCoverage: {
      "@type": "Place",
      name: place,
      address: {
        "@type": "PostalAddress",
        addressLocality: datasetPlain(model.cityName),
        addressRegion: datasetPlain(model.stateAbbr),
        addressCountry: "US",
      },
    },
  };
  if (dateModified) dataset.dateModified = dateModified;
  if (sources.length) {
    dataset.isBasedOn = sources;
    dataset.citation = sources.slice();
  }
  dataset.variableMeasured = variableMeasured;
  return dataset;
}
