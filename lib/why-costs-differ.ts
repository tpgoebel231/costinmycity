import { cityLabel, getCity, getPermit } from "@/lib/data";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { PRIORITY_CLUSTER } from "@/lib/related-links";
import { keepHvac } from "@/lib/seo";
import { shortDeptName } from "@/lib/sourcing";
import type { City, Permit, ProjectCost } from "@/lib/types";

/**
 * Impression-cluster money pages with a shipped "why costs differ here" blurb.
 * Grow one URL per growth-loop fire; do not invent fees.
 */
const SHIPPED = new Set<string>([
  "charlotte-nc/roof-replacement",
  "denver-co/kitchen-remodel",
  "seattle-wa/kitchen-remodel",
  "nashville-tn/roof-replacement",
  "atlanta-ga/roof-replacement",
  "denver-co/roof-replacement",
  "seattle-wa/roof-replacement",
  "charlotte-nc/kitchen-remodel",
  "nashville-tn/kitchen-remodel",
  "atlanta-ga/kitchen-remodel",
  "charlotte-nc/hvac-replacement",
  "seattle-wa/hvac-replacement",
  "denver-co/hvac-replacement",
  "nashville-tn/hvac-replacement",
  "atlanta-ga/hvac-replacement",
  "charlotte-nc/deck",
  "seattle-wa/deck",
  "denver-co/deck",
  "nashville-tn/deck",
  "atlanta-ga/deck",
]);

const CLUSTER = new Set<string>(PRIORITY_CLUSTER);

export type WhyCostsDifferModel = {
  heading: string;
  paragraphs: string[];
  footnote: string;
};

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function firstSentence(s: string): string {
  const t = (s || "").trim();
  if (!t) return "";
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return asSentence(m ? m[0] : t);
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}

function peerPermitBits(projectSlug: string, currentSlug: string): string[] {
  const bits: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === currentSlug) continue;
    const peer = getCity(slug);
    const permit = getPermit(slug, projectSlug);
    if (!peer || !permit || permit.feeTypicalUsd == null) continue;
    bits.push(cityLabel(peer) + " " + usd(permit.feeTypicalUsd));
  }
  return bits;
}

function laborParagraph(project: ProjectCost, city: City): string | null {
  const adj = project.cityAdjustments?.[city.slug];
  if (!adj) return null;
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const laborPct = project.laborShare != null ? Math.round(project.laborShare * 100) : null;

  if (adj.blsConstructionMeanHourlyUsd == null && !adj.metro && !adj.laborWageMultiplier) {
    return null;
  }

  let s =
    "Labor for " +
    job.toLowerCase() +
    " in " +
    label +
    " is wage-indexed to the BLS construction-and-extraction occupations mean";
  if (adj.metro) s += " for " + adj.metro;
  if (adj.blsConstructionMeanHourlyUsd != null) {
    s += " of $" + adj.blsConstructionMeanHourlyUsd.toFixed(2) + " per hour";
  }
  if (adj.blsVintage) s += " (" + adj.blsVintage + ")";
  if (laborPct != null) s += ", applied to the recorded " + laborPct + "% labor share";
  if (adj.laborWageMultiplier != null && Number.isFinite(adj.laborWageMultiplier)) {
    const pct = Math.round(adj.laborWageMultiplier * 100);
    if (pct < 100) {
      s +=
        ". That puts labor in " +
        label +
        " below the national OEWS mean for the same vintage (labor wage multiplier " +
        adj.laborWageMultiplier.toFixed(3) +
        ", about " +
        pct +
        "% of national)";
    } else if (pct > 100) {
      s +=
        ". That puts labor above the national OEWS mean for the same vintage (labor wage multiplier " +
        adj.laborWageMultiplier.toFixed(3) +
        ")";
    }
  }
  return asSentence(s);
}

function permitParagraph(project: ProjectCost, city: City, permit: Permit | null): string | null {
  if (!permit || permit.feeTypicalUsd == null) return null;
  const job = shortProjectName(project.projectSlug).toLowerCase();
  const label = cityLabel(city);
  const dept = shortDeptName(city);
  const fee = permit.feeTypicalUsd;
  const peers = peerPermitBits(project.projectSlug, city.slug);

  if (fee === 0 && (permit.permitRequired === false || mentionsExemption(permit))) {
    let s =
      "On the recorded typical path, " +
      label +
      " charges " +
      usd(0) +
      " for a like-for-like " +
      job +
      " because of a documented permit exemption";
    if (permit.sourceName) s += " (" + permit.sourceName.split(";")[0].trim() + ")";
    if (peers.length) {
      s +=
        ". Same-job recorded typical permit fees elsewhere in this metro cluster include " +
        peers.join(", ");
    }
    s +=
      ". That exemption is a local cost difference: the all-in figure here is wage-indexed job cost without a municipal permit line on the typical path";
    return asSentence(s);
  }

  let s =
    "The recorded typical permit fee for " +
    job +
    " in " +
    label +
    " is " +
    usd(fee);
  if (dept !== "local") s += " from " + dept;
  if (peers.length) {
    s += ". Peer recorded typicals in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function deptDisplay(city: City): string {
  const raw = (city.permitDeptName || "").trim();
  if (!raw) return "";
  const cut = raw.split(/\s+[\u2013\u2014-]\s+/)[0].trim();
  return cut || raw;
}

function ifPermitSentence(note: string): string | null {
  const t = (note || "").trim();
  if (!t) return null;
  const start = t.search(/If a permit/i);
  if (start < 0) return null;
  const rest = t.slice(start);
  // Stop at a period that is not part of a dollar amount like $59.70.
  const end = rest.search(/\.(?!\d)/);
  if (end < 0) return asSentence(rest);
  return asSentence(rest.slice(0, end + 1));
}

function permitBlob(permit: Permit): string {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    permit.sourceName || "",
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(" ")),
  ].join(" ");
}

/** Exact recorded dollars (keeps cents). usd() rounds and would rewrite LUESA line items. */
function moneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (negative ? "-$" : "$") + body;
}

/**
 * Charlotte roof: like-for-like reroof is a statutory $0, with a recorded
 * LUESA Section II.A alternate that is not in the page totals.
 * Returns null unless the permit row still contains those facts.
 */
function charlotteRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "charlotte-nc" || project.projectSlug !== "roof-replacement") return null;
  if (!permit || permit.feeTypicalUsd !== 0 || permit.permitRequired !== false) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  const exemption = charlotteRoofExemptionParagraph(city, permit);
  if (exemption) paragraphs.push(exemption);
  const alternate = charlotteRoofAlternateParagraph(permit);
  if (alternate) paragraphs.push(alternate);
  const context = charlotteRoofContextParagraph(city, project, permit);
  if (context) paragraphs.push(context);
  if (!exemption || !alternate || !context) return null;

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

function charlotteRoofExemptionParagraph(city: City, permit: Permit): string | null {
  const blob = permitBlob(permit);
  if (!/160D-1110\(c\)\(5\)/.test(blob) || !/\bexempt/i.test(blob) || !/\$40,000/.test(blob)) return null;

  const label = cityLabel(city);
  let s =
    "The recorded typical permit fee for roof replacement in " +
    label +
    " is " +
    usd(0) +
    " because a like-for-like single-family reroof at or under $40,000 does not require a building permit under N.C.G.S. 160D-1110(c)(5)";
  if (/OSFM/i.test(blob) && /15%/.test(blob) && /10\/19\/2023/.test(blob)) {
    s +=
      ". NC OSFM guidance (10/19/2023) reads that exemption as roofing replacement plus up to 15% of the existing roof deck";
  }

  const assumed = permit.assumedValuationUsd;
  const low = assumed?.low;
  const typical = assumed?.typical;
  const high = assumed?.high;
  if (
    typeof low === "number" &&
    typeof typical === "number" &&
    typeof high === "number" &&
    low <= 40000 &&
    typical <= 40000 &&
    high <= 40000 &&
    permit.feeLowUsd === 0 &&
    permit.feeHighUsd === 0
  ) {
    s +=
      ". Recorded assumed valuations on this row are low " +
      moneyExact(low) +
      ", typical " +
      moneyExact(typical) +
      ", and high " +
      moneyExact(high) +
      ", each at or under that $40,000 line, and the recorded fee low, typical, and high are all " +
      usd(0);
  }

  s +=
    ". That exemption is the local cost difference on the typical path: the all-in figure is wage-indexed job cost without a municipal permit line";
  return asSentence(s);
}

function charlotteRoofAlternateParagraph(permit: Permit): string | null {
  const note = permit.calculationNote || "";
  const caveat = permit.caveat || "";
  if (!/Alternate LUESA Section II\.A/.test(note)) return null;

  const trigger =
    "cost exceeds $40,000, load-bearing work exceeds the OSFM deck allowance, or new roofing is added";
  const building = (permit.extras || []).find((e) => /valuation building permit/i.test(e.name || ""));
  const tech = (permit.extras || []).find((e) => /technology charge/i.test(e.name || ""));
  const buildingUsd = typeof building?.feeUsd === "number" ? building.feeUsd : null;
  const techUsd = typeof tech?.feeUsd === "number" ? tech.feeUsd : null;
  const rateRecorded =
    !!building?.note && /\$59\.70/.test(building.note) && /\$12\.19 per \$1,000/.test(building.note);
  const totalMatch = note.match(/=\s*(\$[\d,]+\.\d{2})/);
  const lowMatch = note.match(/Low\s+(\$[\d,]+)\s*=\s*(\$[\d,]+\.\d{2})/);
  const highMatch = note.match(/high\s+(\$[\d,]+)\s*=\s*(\$[\d,]+\.\d{2})/);
  const typicalVal = permit.assumedValuationUsd?.typical ?? permit.typicalProjectValueUsd;

  let s = "A permit is still required";
  if ((note + " " + caveat).includes(trigger)) s += " if " + trigger;
  s += ". On that path the recorded alternate is LUESA Section II.A for projects not requiring plan review";
  if (/revised July 1, 2026/.test((permit.sourceName || "") + " " + note)) {
    s += ", Mecklenburg County LUESA Fee Ordinance revised July 1, 2026";
  }
  if (rateRecorded) s += ": $59.70 plus $12.19 per $1,000 or part over $3,000";
  if (techUsd === 3 && /Note f/.test(note + " " + (tech?.note || ""))) {
    s += ", plus the $3 technology charge (Note f)";
  }

  if (
    totalMatch &&
    buildingUsd != null &&
    techUsd != null &&
    typicalVal != null &&
    note.includes(moneyExact(buildingUsd)) &&
    note.includes(moneyExact(techUsd)) &&
    note.includes(totalMatch[1]) &&
    note.includes(moneyExact(typicalVal))
  ) {
    s +=
      ". At the recorded " +
      moneyExact(typicalVal) +
      " typical valuation that alternate total is " +
      totalMatch[1] +
      " (" +
      moneyExact(buildingUsd) +
      " valuation building permit + " +
      moneyExact(techUsd) +
      " tech)";
  }

  const lowVal = permit.assumedValuationUsd?.low;
  const highVal = permit.assumedValuationUsd?.high;
  if (
    lowMatch &&
    highMatch &&
    typeof lowVal === "number" &&
    typeof highVal === "number" &&
    lowMatch[1] === moneyExact(lowVal) &&
    highMatch[1] === moneyExact(highVal)
  ) {
    s += ". The same note records " + lowMatch[2] + " at " + lowMatch[1] + " and " + highMatch[2] + " at " + highMatch[1];
  }

  if (/not included in totals/i.test((building?.note || "") + " " + (tech?.note || ""))) {
    s += ". Those alternate dollars are not included in the low, typical, or high totals";
  }
  if (permit.feeHighUsd === 0 && (highVal == null || highVal <= 40000)) {
    s += ". This row does not record a permit dollar for a job above $40,000";
  }
  return asSentence(s);
}

function charlotteRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit,
): string | null {
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers = peerPermitBits(project.projectSlug, city.slug);
  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (/County LUESA totals only/i.test(permit.calculationNote || "")) {
    s += ". Recorded totals on this roof row are county LUESA totals only";
  }
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  if (peers.length) {
    s += ". Same-job recorded typical permit fees elsewhere in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function agencyParagraph(city: City, permit: Permit | null): string | null {
  const dept = deptDisplay(city);
  if (!dept) return null;
  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit?.feeTypicalUsd === 0 && mentionsExemption(permit) && permit.calculationNote) {
    const ifPermit = ifPermitSentence(permit.calculationNote);
    if (ifPermit) {
      s += ". " + ifPermit.replace(/\.$/, "");
    }
  } else if (city.notes) {
    const note = firstSentence(city.notes);
    if (note && note.length < 220) s += ". " + note.replace(/\.$/, "");
  }
  return asSentence(s);
}

/**
 * Crawlable "why costs differ here" blurb for shipped impression-cluster money URLs.
 * Grounded in on-file city, BLS wage, and permit-row fields only.
 */
export function whyCostsDiffer(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): WhyCostsDifferModel | null {
  const key = city.slug + "/" + project.projectSlug;
  if (!CLUSTER.has(city.slug) || !SHIPPED.has(key)) return null;

  const charlotteRoof = charlotteRoofWhy(city, project, permit ?? null);
  if (charlotteRoof) return charlotteRoof;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  const permitPara = permitParagraph(project, city, permit ?? null);
  if (permitPara) paragraphs.push(permitPara);
  const agency = agencyParagraph(city, permit ?? null);
  if (agency) paragraphs.push(agency);

  if (!paragraphs.length) return null;

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}
