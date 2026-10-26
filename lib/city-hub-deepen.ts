import { compareCities } from "@/lib/city-groups";
import { cityLabel, getCities, getLaunchProjectSlugs, getPermit, getProjectCost } from "@/lib/data";
import { buildEstimate, permitDisplayUsd } from "@/lib/estimates";
import { formatDate, usd } from "@/lib/format";
import { isPublishedMinimumFloor } from "@/lib/permit-valuation";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { isCitationPeriod, splitSentences } from "@/lib/sentences";
import { recordedHubPermitFeeLabel, shortDeptName } from "@/lib/sourcing";
import type { City, Permit } from "@/lib/types";

export type CityHubFaqItem = { question: string; answer: string };

export type CityHubPermitStart = {
  amount: number;
  /** Leading space plus qualifier, or empty when the data does not support one. */
  qualifier: string;
  /** Which published floor or fee field supplied amount. For the report, not the page. */
  via: string;
};

export type HubPermitBullet = {
  text: string;
  href?: string;
};

export type NearbyHubCard = {
  stateAbbr?: string;
  href: string;
  label: string;
  detail: string;
};

type ProjectRow = {
  slug: string;
  label: string;
  permit: Permit | undefined;
  allInTypical: number;
  bandLow: number;
  bandHigh: number;
};

const LAUNCH = () => getLaunchProjectSlugs();

/** Approximate geographic state centers (lat, lng). Used only to order nearby hubs; not shown. */
const STATE_CENTER: Record<string, [number, number]> = {
  AL: [32.8, -86.8], AR: [34.9, -92.4], AZ: [34.3, -111.7], CA: [37.2, -119.5], CO: [39.0, -105.5],
  DC: [38.9, -77.0], FL: [28.6, -82.4], GA: [32.7, -83.4], HI: [20.8, -156.3], IA: [42.1, -93.5],
  ID: [44.4, -114.6], IL: [40.0, -89.2], IN: [39.9, -86.3], KS: [38.5, -98.4], KY: [37.5, -85.3],
  LA: [31.1, -92.0], MA: [42.3, -71.8], MD: [39.0, -76.8], MI: [44.3, -85.4], MN: [46.3, -94.3],
  MO: [38.4, -92.5], NC: [35.6, -79.4], NE: [41.5, -99.8], NJ: [40.2, -74.7], NM: [34.4, -106.1],
  NV: [39.3, -116.6], NY: [42.9, -75.5], OH: [40.3, -82.8], OK: [35.6, -97.5], OR: [43.9, -120.6],
  PA: [40.9, -77.8], RI: [41.7, -71.5], TN: [35.9, -86.4], TX: [31.5, -99.3], UT: [39.3, -111.7],
  VA: [37.5, -78.9], WA: [47.4, -120.5], WI: [44.6, -89.9],
};

export function stateDistance(a: string, b: string): number {
  const p = STATE_CENTER[a];
  const q = STATE_CENTER[b];
  if (!p || !q) return Number.POSITIVE_INFINITY;
  const dLat = p[0] - q[0];
  const dLng = (p[1] - q[1]) * Math.cos(((p[0] + q[0]) / 2) * (Math.PI / 180));
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/** Census regions. Used when a page groups cities by region instead of distance. */
export const CENSUS_REGION: Record<string, string> = {
  CT: "Northeast",
  ME: "Northeast",
  MA: "Northeast",
  NH: "Northeast",
  RI: "Northeast",
  VT: "Northeast",
  NJ: "Northeast",
  NY: "Northeast",
  PA: "Northeast",
  IL: "Midwest",
  IN: "Midwest",
  MI: "Midwest",
  OH: "Midwest",
  WI: "Midwest",
  IA: "Midwest",
  KS: "Midwest",
  MN: "Midwest",
  MO: "Midwest",
  NE: "Midwest",
  ND: "Midwest",
  SD: "Midwest",
  DE: "South",
  FL: "South",
  GA: "South",
  MD: "South",
  NC: "South",
  SC: "South",
  VA: "South",
  DC: "South",
  WV: "South",
  AL: "South",
  KY: "South",
  MS: "South",
  TN: "South",
  AR: "South",
  LA: "South",
  OK: "South",
  TX: "South",
  AZ: "West",
  CO: "West",
  ID: "West",
  MT: "West",
  NV: "West",
  NM: "West",
  UT: "West",
  WY: "West",
  AK: "West",
  CA: "West",
  HI: "West",
  OR: "West",
  WA: "West",
};

function joinProse(parts: string[]): string {
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] + " and " + parts[1];
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function projectRows(city: City): ProjectRow[] {
  const rows: ProjectRow[] = [];
  for (const slug of LAUNCH()) {
    const project = getProjectCost(slug);
    if (!project) continue;
    const permit = getPermit(city.slug, slug);
    const est = buildEstimate(project, city, permit);
    rows.push({
      slug,
      label: shortProjectName(slug),
      permit,
      allInTypical: est.allInTypical,
      bandLow: est.bandLow,
      bandHigh: est.bandHigh,
    });
  }
  return rows;
}

/** Nearest $1,000, then "$8k". */
export function formatHubThousands(amount: number): string {
  const thousands = Math.round(amount / 1000);
  return "$" + thousands + "k";
}

function sameMoney(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Dollars in one sentence window that the text calls a plan-based minimum.
 * The caller still has to match each dollar to a fee field.
 */
export function planBasedMinimumAmounts(text: string): number[] {
  const amounts: number[] = [];
  const re = /[^.]{0,24}plan-based[^.]{0,80}/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const window = match[0];
    if (!/\bmin(?:imum)?\b/i.test(window)) continue;
    for (const dollar of window.matchAll(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g)) {
      amounts.push(Number(dollar[1].replace(/,/g, "")));
    }
  }
  return amounts;
}

function feeFieldFor(permit: Permit, amount: number): string | null {
  if (sameMoney(permit.feeTypicalUsd, amount)) return "feeTypicalUsd";
  if (sameMoney(permit.feeLowUsd, amount)) return "feeLowUsd";
  if (sameMoney(permit.feeHighUsd, amount)) return "feeHighUsd";
  for (const extra of permit.extras || []) {
    if (sameMoney(extra.feeUsd, amount) || sameMoney(extra.amountUsd, amount)) return "extra fee";
  }
  return null;
}

function requiresPermit(permit: Permit | undefined): permit is Permit {
  return Boolean(permit && permit.permitRequired === true);
}

/**
 * Lowest permit fee to lead the hub with.
 * Prefer a published minimum the lib already recognizes, including a plan-based
 * floor stated in the city notes or the permit text when that dollar matches a
 * fee on a permit-required row. Otherwise the lowest feeTypicalUsd or feeLowUsd
 * on permit-required rows.
 */
export function cityHubPermitStart(city: City): CityHubPermitStart | null {
  // Lowest typical permit fee among permit-required rows: the same figure the
  // hub cards show as "Permit $P", so the hero never contradicts a card.
  let best: { amount: number; slug: string } | null = null;
  for (const row of projectRows(city)) {
    if (!requiresPermit(row.permit)) continue;
    const value = row.permit.feeTypicalUsd;
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) continue;
    if (!best || value < best.amount) best = { amount: value, slug: row.slug };
  }
  if (!best) return null;
  return {
    amount: best.amount,
    qualifier: "",
    via: "lowest feeTypicalUsd on " + best.slug + " among permit-required rows",
  };
}

export function cityHubHeroSentence(city: City): string {
  const rows = projectRows(city);
  if (!rows.length) return "";
  const lows = rows.map((row) => row.allInTypical);
  const low = Math.min(...lows);
  const high = Math.max(...lows);
  let sentence =
    "A typical " + city.name + " home project runs " + formatHubThousands(low) + " to " + formatHubThousands(high) + ".";
  const start = cityHubPermitStart(city);
  if (start) {
    sentence += " Permits start at " + usd(start.amount) + start.qualifier + ".";
  }
  return sentence;
}

/** Only these hubs render the visible renovation-cost section. Other city pages stay unchanged. */
const CITY_HUB_RENOVATION_SLUGS = new Set(["denver-co"]);

export type CityHubRenovationLine = {
  slug: string;
  href: string;
  /** "{job} cost in {city}", the visible link. */
  link: string;
  /** Text after the link, starting with ": typical" and ending with a period. */
  text: string;
};

export type CityHubRenovationKitchenCard = {
  href: string;
  heading: string;
  line: string;
  cta: string;
};

export type CityHubRenovationModel = {
  heading: string;
  answer: string;
  lines: CityHubRenovationLine[];
  /** One sentence under the list. No dollar figures. */
  follow: string;
  kitchen: CityHubRenovationKitchenCard;
};

/**
 * Permit clause for one renovation line. No clause when a fee is not on file.
 * Dollars use permitDisplayUsd and usd, the same pair as the kitchen card.
 */
function renovationPermitClause(city: City, row: ProjectRow): string {
  if (row.permit?.permitRequired === false) return ", usually no city permit needed";
  const project = getProjectCost(row.slug);
  if (!project) return "";
  const fee = permitDisplayUsd(buildEstimate(project, city, row.permit));
  if (fee != null) return ", including the " + usd(fee) + " permit";
  return "";
}

/**
 * Visible renovation-cost block for opted-in hubs. Dollars come from
 * buildEstimate / usd on the same launch rows the project cards use.
 */
export function cityHubRenovationSection(city: City): CityHubRenovationModel | null {
  if (!CITY_HUB_RENOVATION_SLUGS.has(city.slug)) return null;
  const rows = projectRows(city);
  if (!rows.length) return null;
  const typicals = rows.map((row) => row.allInTypical);
  const minTypical = Math.min(...typicals);
  const maxTypical = Math.max(...typicals);
  const kitchenRow = rows.find((row) => row.slug === "kitchen-remodel");
  if (!kitchenRow) return null;
  const kitchenProject = getProjectCost("kitchen-remodel");
  if (!kitchenProject) return null;
  const kitchenPermit = getPermit(city.slug, "kitchen-remodel");
  const kitchenEst = buildEstimate(kitchenProject, city, kitchenPermit);
  const kitchenFee = permitDisplayUsd(kitchenEst);
  if (kitchenFee == null) return null;
  return {
    heading: "Home renovation cost in " + city.name,
    answer:
      "Most home renovation projects we price in " +
      city.name +
      " run " +
      usd(minTypical) +
      " to " +
      usd(maxTypical) +
      " all-in at the typical size, including the city permit fee.",
    lines: rows.map((row) => ({
      slug: row.slug,
      href: "/cost/" + row.slug + "/" + city.slug + "/",
      link: keepHvac(row.label) + " cost in " + city.name,
      text:
        ": typical " +
        usd(row.allInTypical) +
        ", most projects " +
        usd(row.bandLow) +
        " to " +
        usd(row.bandHigh) +
        renovationPermitClause(city, row) +
        ".",
    })),
    follow: "Pick a job above for the full cost breakdown, permit steps and fee source.",
    kitchen: {
      href: "/cost/kitchen-remodel/" + city.slug + "/",
      heading: "Kitchen remodel cost in " + city.name,
      line:
        "Typical " +
        usd(kitchenRow.allInTypical) +
        ", most projects " +
        usd(kitchenRow.bandLow) +
        " to " +
        usd(kitchenRow.bandHigh) +
        ", including the " +
        usd(kitchenFee) +
        " permit.",
      cta: "See the " + city.name + " kitchen remodel breakdown",
    },
  };
}

export function cityHubFeesChecked(city: City): { label: string; href: string } {
  let latest = "";
  for (const slug of LAUNCH()) {
    const raw = (getPermit(city.slug, slug)?.retrievedDate || "").trim();
    if (raw && (!latest || raw > latest)) latest = raw;
  }
  const href = (city.feeScheduleUrl || "").trim() || "#permits";
  return {
    label: latest ? "Fees checked " + formatDate(latest) : "Fees checked",
    href,
  };
}

const CODE_TOKEN = /\b(?:ADMIN|Table|SMC|RCW|ROH|LAMC|Municipal Code)\b|\b\d+[A-Z]-\d+/i;
const EXEMPT_RE =
  /\bexempt\b|permit-exempt|may not need a (?:building )?permit|does not require a permit|do not require a permit/i;
const INTERNAL_RE = /\b(?:recorded|feeModel|permitRequired|\w+Usd|null|undefined|NaN)\b/;
const CITE_START = /^(?:[A-Z](?:\.[A-Z])+\.?|[A-Z]{2,})\b/;

function hasCodeToken(text: string): boolean {
  return CODE_TOKEN.test(text);
}

/** Parentheticals that point at a list the hub does not show, such as "(item 10 is ...)". */
function stripItemParentheticals(text: string): string {
  return text
    .replace(/\s*\(([^()]*)\)/g, (full, inner: string) => {
      if (!/\bitems?\s+\d+\b/i.test(inner)) return full;
      if (inner.includes("$")) return full;
      return "";
    })
    .replace(/\s+([.!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Drop a trailing "under <statute>" clause, including an em-dash aside after the citation.
 * Ordinary phrases such as "under $40,000" stay.
 */
function stripTrailingUnderCitation(text: string): string {
  const idx = text.toLowerCase().lastIndexOf(" under ");
  if (idx < 0) return text;
  const before = text.slice(0, idx).trim();
  let after = text.slice(idx + " under ".length).trim();
  let punct = "";
  if (/[.!?]$/.test(after)) {
    punct = after.slice(-1);
    after = after.slice(0, -1).trim();
  }
  const citation = after.split(/\s+[\u2014\u2013]\s+/)[0].trim();
  if (!before || (!hasCodeToken(citation) && !CITE_START.test(citation))) return text;
  return /[.!?]$/.test(before) ? before : before + (punct || ".");
}

function endsWithAbbreviation(text: string): boolean {
  const t = text.trim();
  if (!t.endsWith(".")) return false;
  return isCitationPeriod(t, t.length - 1);
}

/**
 * splitSentences keeps a following clause when it does not start with a capital
 * or a digit, so "$50,001…" stays glued to the exemption sentence. Keep the
 * exemption sentence and drop a tail that is not itself an exemption.
 */
function peelNonExemptTail(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "(") {
      depth++;
      continue;
    }
    if (ch === ")") {
      if (depth > 0) depth--;
      continue;
    }
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (depth > 0) continue;
    if (ch === "." && isCitationPeriod(t, i)) continue;
    let j = i + 1;
    while (j < t.length && t[j] === " ") j++;
    if (j === i + 1 || j >= t.length) continue;
    const tail = t.slice(j).trim();
    if (!tail || EXEMPT_RE.test(tail)) continue;
    return t.slice(0, i + 1).trim();
  }
  return t;
}

/** Lowercase the first letter after the job label unless that word is an acronym. */
function lowerLeadingUnlessAcronym(text: string): string {
  const match = text.match(/^([A-Za-z]+)/);
  if (!match) return text;
  const word = match[1];
  if (word.length >= 2 && word === word.toUpperCase()) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function statedExemption(permit: Permit, label: string): string | null {
  const caveat = permit.caveat || "";
  for (const sentence of splitSentences(caveat)) {
    if (!EXEMPT_RE.test(sentence)) continue;
    let text = stripItemParentheticals(peelNonExemptTail(sentence));
    if (hasCodeToken(text)) text = stripTrailingUnderCitation(text);
    text = text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (hasCodeToken(text) || INTERNAL_RE.test(text)) continue;
    if (!/[.!?]$/.test(text)) text += ".";
    if (endsWithAbbreviation(text)) continue;
    if (text.length > 220) continue;
    return label + ": " + lowerLeadingUnlessAcronym(text);
  }
  return null;
}

function exemptSentence(labels: string[]): string {
  const parts = labels.map((label) => "a typical " + label.toLowerCase());
  const list = joinProse(parts);
  const verb = labels.length === 1 ? " does not need a permit." : " do not need a permit.";
  return list.charAt(0).toUpperCase() + list.slice(1) + verb;
}

/**
 * Three to five plain-English permit bullets. Code-table numbers stay out of the text.
 */
export function cityHubPermitBullets(city: City): HubPermitBullet[] {
  const rows = projectRows(city);
  type Item = { kind: string; text: string; href?: string };
  const items: Item[] = [];

  const exempt = rows.filter((row) => row.permit?.permitRequired === false);
  if (exempt.length) {
    items.push({ kind: "exempt", text: keepHvac(exemptSentence(exempt.map((row) => row.label))) });
  }

  const stated: string[] = [];
  for (const row of rows) {
    if (!row.permit || row.permit.permitRequired === false) continue;
    const line = statedExemption(row.permit, row.label);
    if (line && !stated.includes(line)) stated.push(line);
  }
  if (stated.length) {
    items.push({ kind: "stated", text: keepHvac(stated.slice(0, 2).join(" ")).replace(/\s*\(\$0\)/g, "") });
  }

  const start = cityHubPermitStart(city);
  if (start) {
    items.push({
      kind: "start",
      text: "Permits start at " + usd(start.amount) + start.qualifier + ".",
    });
  }

  const feeBits = rows.map((row) => {
    const name = keepHvac(row.label.toLowerCase());
    if (row.permit?.permitRequired === false) return name + " no permit needed";
    if (row.permit?.feeTypicalUsd == null) return name + " not published";
    return name + " " + recordedHubPermitFeeLabel(row.permit);
  });
  if (feeBits.length) {
    items.push({ kind: "typical", text: "Typical permit fees: " + joinProse(feeBits) + "." });
  }

  if (city.feeScheduleYear != null) {
    items.push({ kind: "year", text: "The fee schedule year is " + city.feeScheduleYear + "." });
  }

  const dept = shortDeptName(city);
  if (dept && dept.toLowerCase() !== "local") {
    items.push({ kind: "office", text: "The permit office on file is " + dept + "." });
  }

  const href =
    (city.feeScheduleUrl || "").trim() ||
    rows.map((row) => (row.permit?.sourceUrl || "").trim()).find(Boolean) ||
    "";
  if (href) {
    items.push({ kind: "link", text: "Official fee schedule", href });
  }

  const drop = ["office", "year", "stated"];
  let kept = items.filter((item) => !hasCodeToken(item.text));
  while (kept.length > 5) {
    const kind = drop.find((name) => kept.some((item) => item.kind === name));
    if (!kind) break;
    const index = kept.findIndex((item) => item.kind === kind);
    kept = kept.filter((_, i) => i !== index);
  }
  if (kept.length < 3 && !kept.some((item) => item.kind === "check")) {
    const linkAt = kept.findIndex((item) => item.kind === "link");
    const check = {
      kind: "check",
      text: "Confirm the current fee on the official schedule before you apply.",
    };
    if (linkAt >= 0) kept.splice(linkAt, 0, check);
    else kept.push(check);
  }

  return kept.slice(0, 5).map((item) => {
    const text = stripItemParentheticals(item.text);
    return item.href ? { text, href: item.href } : { text };
  });
}

export function hasCoords(city: City): city is City & { lat: number; lng: number } {
  return typeof city.lat === "number" && Number.isFinite(city.lat) && typeof city.lng === "number" && Number.isFinite(city.lng);
}

export function distanceMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const radius = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function roofDetail(city: City): string {
  const project = getProjectCost("roof-replacement");
  if (!project) return "";
  const permit = getPermit(city.slug, "roof-replacement");
  const est = buildEstimate(project, city, permit);
  return "Typical roof " + usd(est.allInTypical);
}

/**
 * Three or four other hubs. Same state first. Then nearest by lat/lng when both
 * cities have coordinates, otherwise the closest states by approximate state center,
 * larger cities first.
 */
export function cityHubNearby(city: City): NearbyHubCard[] {
  const others = getCities().filter((item) => item.slug !== city.slug);
  const sameState = others.filter((item) => item.stateAbbr === city.stateAbbr).sort(compareCities);
  let picked = sameState.slice(0, 4);
  if (picked.length < 3) {
    const skip = new Set(picked.map((item) => item.slug));
    const rest = others.filter((item) => !skip.has(item.slug));
    let fill: City[] = [];
    if (hasCoords(city)) {
      const ranked = rest.filter((item) => hasCoords(item));
      if (ranked.length) {
        fill = ranked.sort((a, b) => distanceMiles(city, a) - distanceMiles(city, b) || compareCities(a, b));
      }
    }
    if (!fill.length) {
      fill = rest
        .filter((item) => stateDistance(city.stateAbbr, item.stateAbbr) < 9)
        .sort(
          (a, b) =>
            stateDistance(city.stateAbbr, a.stateAbbr) - stateDistance(city.stateAbbr, b.stateAbbr) ||
            (b.population || 0) - (a.population || 0) ||
            compareCities(a, b),
        );
    }
    picked = picked.concat(fill.slice(0, 4 - picked.length));
  }
  return picked.slice(0, 4).map((item) => ({
    href: "/city/" + item.slug,
    label: cityLabel(item),
    detail: roofDetail(item),
    stateAbbr: item.stateAbbr,
  }));
}

/**
 * Honest heading for the cards above. "Nearby" is not used because the
 * fill is by state or region, not by measured distance.
 */
export function cityHubNearbyHeading(city: City, items: NearbyHubCard[]): string {
  if (items.every((item) => item.stateAbbr === city.stateAbbr)) return "Other " + city.state + " cities";
  const region = CENSUS_REGION[city.stateAbbr];
  if (region && items.every((item) => CENSUS_REGION[item.stateAbbr || ""] === region)) {
    return region === "West" || region === "South" ? "Other cities in the " + region : "Other " + region + " cities";
  }
  return "Other cities to compare";
}

function rowBySlug(rows: ProjectRow[], slug: string): ProjectRow | undefined {
  return rows.find((row) => row.slug === slug);
}

function feeClause(row: ProjectRow | undefined): string {
  if (!row) return "";
  if (row.permit?.permitRequired === false) return " A typical " + row.label.toLowerCase() + " does not need a permit.";
  if (row.permit?.feeTypicalUsd == null) return " The permit fee is not published.";
  return " The typical permit fee is " + recordedHubPermitFeeLabel(row.permit) + ".";
}

function jobAnswer(city: City, row: ProjectRow | undefined, noun: string): string {
  if (!row) return "We do not have a " + noun + " figure for " + city.name + " on this page.";
  return (
    "A typical " +
    noun +
    " in " +
    city.name +
    " is " +
    usd(row.allInTypical) +
    " all-in. Most projects run " +
    usd(row.bandLow) +
    " to " +
    usd(row.bandHigh) +
    "." +
    keepHvac(feeClause(row))
  );
}

function costList(rows: ProjectRow[]): string {
  return joinProse(rows.map((row) => keepHvac(row.label.toLowerCase()) + " " + usd(row.allInTypical)));
}

function permitFeeAnswer(city: City, rows: ProjectRow[]): string {
  const parts: string[] = [];
  const fees = rows.map((row) => {
    const name = keepHvac(row.label.toLowerCase());
    if (row.permit?.permitRequired === false) return name + " no permit needed";
    if (row.permit?.feeTypicalUsd == null) return name + " not published";
    return name + " " + recordedHubPermitFeeLabel(row.permit);
  });
  if (fees.length) parts.push("Permit fees on file: " + joinProse(fees) + ".");
  const start = cityHubPermitStart(city);
  if (start) parts.push("Permits start at " + usd(start.amount) + start.qualifier + ".");
  if (city.feeScheduleYear != null) parts.push("The fee schedule year is " + city.feeScheduleYear + ".");
  parts.push("The official fee schedule is linked on this page.");
  return parts.join(" ");
}

/**
 * Rounded thousands unless exactRange is set. Only renovation-section hubs
 * pass true, so every other hub keeps the "$Nk to $Nk" sentence.
 */
function renovationAnswer(city: City, rows: ProjectRow[], exactRange = false): string {
  const amounts = rows.map((row) => row.allInTypical);
  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  const lowText = exactRange ? usd(low) : formatHubThousands(low);
  const highText = exactRange ? usd(high) : formatHubThousands(high);
  return (
    "A typical " +
    city.name +
    " home project runs " +
    lowText +
    " to " +
    highText +
    ". Typical all-in costs on this page are " +
    costList(rows) +
    ". Those totals include the city permit fee when a fee is on file."
  );
}

/** Highest and lowest typical totals. Ties keep the earlier launch row. */
function extremeRows(rows: ProjectRow[]): { max: ProjectRow; min: ProjectRow } {
  let max = rows[0];
  let min = rows[0];
  for (const row of rows) {
    if (row.allInTypical > max.allInTypical) max = row;
    if (row.allInTypical < min.allInTypical) min = row;
  }
  return { max, min };
}

/** "a roof replacement", "an HVAC replacement". HVAC and a vowel letter take "an". */
function withArticle(phrase: string, sentenceStart = false): string {
  const article = /^(?:[aeiou]|hvac\b)/i.test(phrase) ? "an" : "a";
  const word = sentenceStart ? article.charAt(0).toUpperCase() + article.slice(1) : article;
  return word + " " + phrase;
}

function mostCostAnswer(city: City, rows: ProjectRow[]): string {
  const picked = extremeRows(rows);
  const maxLabel = keepHvac(picked.max.label.toLowerCase());
  const minLabel = keepHvac(picked.min.label.toLowerCase());
  return (
    "Of the jobs we price in " +
    city.name +
    ", " +
    withArticle(maxLabel) +
    " costs the most at a typical " +
    usd(picked.max.allInTypical) +
    ", with most projects " +
    usd(picked.max.bandLow) +
    " to " +
    usd(picked.max.bandHigh) +
    ". " +
    withArticle(minLabel, true) +
    " costs the least at a typical " +
    usd(picked.min.allInTypical) +
    ". Each total includes the city permit fee when one is on file."
  );
}

/**
 * Three or four visible questions. Denver and Chicago use the search queries.
 * Other hubs use the shared cost, roof, and permit questions. Cluster FAQ
 * topics are folded into these answers so a page does not ask the same thing twice.
 */
export function cityHubFaqItems(city: City): CityHubFaqItem[] {
  const rows = projectRows(city);
  if (rows.length < 2) return [];
  const roof = rowBySlug(rows, "roof-replacement");
  const kitchen = rowBySlug(rows, "kitchen-remodel");
  const name = city.name;

  let items: CityHubFaqItem[];
  if (city.slug === "denver-co") {
    items = [
      {
        question: "What is the home renovation cost in Denver?",
        answer: renovationAnswer(city, rows, CITY_HUB_RENOVATION_SLUGS.has(city.slug)),
      },
      {
        question: "Which home renovation costs the most in " + name + "?",
        answer: mostCostAnswer(city, rows),
      },
      {
        question: "What is the roof replacement cost in Denver?",
        answer: jobAnswer(city, roof, "roof replacement"),
      },
      {
        question: "What is the average kitchen remodel cost in Denver?",
        answer: jobAnswer(city, kitchen, "kitchen remodel"),
      },
      {
        question: "Where is the Denver permit fee schedule?",
        answer: permitFeeAnswer(city, rows),
      },
    ];
  } else if (city.slug === "chicago-il") {
    items = [
      {
        question: "What is the new roof cost in Chicago?",
        answer: jobAnswer(city, roof, "new roof"),
      },
      {
        question: "What is the kitchen remodeling cost in Chicago?",
        answer: jobAnswer(city, kitchen, "kitchen remodel"),
      },
      {
        question: "What does the City of Chicago permit fee calculator include?",
        answer: permitFeeAnswer(city, rows),
      },
    ];
  } else {
    items = [
      {
        question: "What is the home project cost in " + name + "?",
        answer: renovationAnswer(city, rows),
      },
      {
        question: "What is the roof replacement cost in " + name + "?",
        answer: jobAnswer(city, roof, "roof replacement"),
      },
      {
        question: "What are permit fees in " + name + "?",
        answer: permitFeeAnswer(city, rows),
      },
    ];
  }

  return items.filter((item) => item.question && item.answer && !hasCodeToken(item.question + " " + item.answer));
}
