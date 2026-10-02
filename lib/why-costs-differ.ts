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
  "austin-tx/roof-replacement",
  "phoenix-az/roof-replacement",
  "phoenix-az/hvac-replacement",
  "phoenix-az/kitchen-remodel",
  "phoenix-az/deck",
  "austin-tx/hvac-replacement",
  "austin-tx/kitchen-remodel",
  "austin-tx/deck",
  "tucson-az/roof-replacement",
  "tucson-az/hvac-replacement",
  "tucson-az/kitchen-remodel",
  "tucson-az/deck",
  "portland-or/roof-replacement",
  "portland-or/kitchen-remodel",
  "raleigh-nc/roof-replacement",
  "raleigh-nc/hvac-replacement",
  "raleigh-nc/kitchen-remodel",
  "raleigh-nc/deck",
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
  const techUsd = typeof tech?.feeUsd === "number" ? tech.feeUsd : null;
  const rateRecorded =
    !!building?.note && /\$59\.70/.test(building.note) && /\$12\.19 per \$1,000/.test(building.note);
  const highVal = permit.assumedValuationUsd?.high;
  const bandsRecorded =
    /Low\s+\$[\d,]+/.test(note) && /high\s+\$[\d,]+/i.test(note) && /=\s*\$[\d,]+\.\d{2}/.test(note);

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
  // Low / typical / high alternate totals stay in the calculation note once.
  if (bandsRecorded) {
    s +=
      ". Recorded alternate totals for the low, typical, and high valuations are in the calculation note on this page";
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

const DENVER_HVAC_HIGH =
  "$147 mechanical + $73.50 plan review = $220.50";
const DENVER_PLAN_REVIEW_RULE =
  "Plan review is 50% of the permit fee for work over $2,000.";
const DENVER_QUICK_PERMIT_RULE =
  "Roofing/siding and some mechanical work can qualify as Quick Permits (no plan review).";

function recordedSentences(text: string): string[] {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Denver HVAC: ADMIN 138 mechanical Quick Permit. Plan review is off the
 * low/typical and on the high only. No technology extra is on the row.
 * Returns false if those recorded anchors are missing, so we do not invent a path.
 */
function denverHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "denver-co" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 59 || permit.feeTypicalUsd !== 83 || permit.feeHighUsd !== 220.5) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 5000 || assumed.typical !== 7500 || assumed.high !== 16000) {
    return false;
  }

  const extras = permit.extras || [];
  const mechanical = extras.find((e) => /mechanical permit/i.test(e.name || ""));
  const plan = extras.find((e) => /plan review/i.test(e.name || ""));
  const electrical = extras.find((e) => /electrical permit/i.test(e.name || ""));
  if (!mechanical || mechanical.feeUsd !== 83) return false;
  if (!plan || plan.feeUsd != null) return false;
  if (!electrical || electrical.feeUsd != null) return false;
  if (extras.some((e) => /building permit/i.test(e.name || ""))) return false;
  if (extras.some((e) => /\btech/i.test(e.name || ""))) return false;

  const notes = city.notes || "";
  if (!notes.includes("ADMIN 138")) return false;
  if (!notes.includes(DENVER_PLAN_REVIEW_RULE)) return false;
  if (!notes.includes(DENVER_QUICK_PERMIT_RULE)) return false;
  if (!/ADMIN 138/.test(permit.sourceName || "")) return false;

  const blob = permitBlob(permit);
  if (!/Quick Permit mechanical/i.test(blob)) return false;
  if (!blob.includes(DENVER_HVAC_HIGH)) return false;
  if (!/exceeds \$2,000/.test(blob)) return false;
  if (!/CPD lists mechanical as a Quick Permit type for like-for-like change-outs/i.test(blob)) {
    return false;
  }
  const alternate = recordedSentences(permit.calculationNote || "").find(
    (s) => /not used in feeTypicalUsd/.test(s) && s.includes("$41.50") && s.includes("$124.50"),
  );
  if (!alternate) return false;
  if (!/no electrical/i.test(electrical.note || "")) return false;
  return true;
}

function denverHvacMechanicalParagraph(city: City, permit: Permit | null): string | null {
  if (!denverHvacFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null) return null;
  const typical = permit.feeTypicalUsd as number;

  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(typical) +
    ", the mechanical Quick Permit on the ADMIN 138 valuation table at the " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s +=
    ". CPD lists mechanical as a Quick Permit type for like-for-like change-outs, so the typical total is the mechanical fee only";
  s +=
    ". A building-permit line is not on this row, and no technology fee is recorded, so neither is added to the totals";
  return asSentence(s);
}

function denverHvacPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!denverHvacFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  const plan = (permit.extras || []).find((e) => /plan review/i.test(e.name || ""));
  if (!plan || !assumed || assumed.high == null) return null;

  let s =
    "Denver's notes on file say plan review is 50% of the permit fee for work over $2,000. " +
    DENVER_QUICK_PERMIT_RULE.replace(/\.$/, "");
  s +=
    ". On this HVAC row, plan review is left off the low and typical bands even when the valuation exceeds $2,000";
  s += ". The high band includes plan review when required";
  // Low / typical / high totals and the non–Quick Permit alternate stay in the calculation note once.
  s +=
    ". Recorded low, typical, and high totals and the alternate non–Quick Permit path are in the calculation note on this page";
  return asSentence(s);
}

function denverHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!denverHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  const admin = firstSentence(city.notes || "");
  if (admin && /ADMIN 138/.test(admin)) s += ". " + admin.replace(/\.$/, "");
  s += ". This HVAC row uses the mechanical trade line on that ADMIN 138 table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function denverHvacAssumption(permit: Permit): string | null {
  const assumed = permit.assumedValuationUsd;
  if (
    !assumed ||
    assumed.low == null ||
    assumed.typical == null ||
    assumed.high == null ||
    permit.feeLowUsd == null ||
    permit.feeTypicalUsd == null ||
    permit.feeHighUsd == null
  ) {
    return null;
  }
  return asSentence(
    "For the permit line we assumed Denver CPD's Quick Permit mechanical path on ADMIN 138: the mechanical fee only, " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      " and " +
      moneyExact(permit.feeTypicalUsd) +
      " at " +
      moneyExact(assumed.typical) +
      ". Plan review is left off those bands even though Denver's notes on file say plan review is 50% of the permit fee for work over $2,000. The high band, " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ", is the recorded total that includes plan review. No technology fee is recorded on this row, and the separate electrical permit has no recorded dollar",
  );
}

export type DenverHvacPageCopy = {
  assumption: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  splitFaq: string;
};

/** On-page Denver HVAC copy from the permit row. Null unless ADMIN 138 anchors are present. */
export function denverHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DenverHvacPageCopy | null {
  if (!denverHvacFacts(city, permit)) return null;
  const mechanical = denverHvacMechanicalParagraph(city, permit);
  const plan = denverHvacPlanParagraph(city, permit);
  const assumption = denverHvacAssumption(permit);
  if (!mechanical || !plan || !assumption) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  return {
    assumption,
    differ:
      "The recorded " +
      cityLabel(city) +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      (permit.feeModel ? " (" + permit.feeModel.replace(/_/g, " ") + ")" : "") +
      ". " +
      mechanical +
      " " +
      plan +
      " Verify the Quick Permit mechanical path with " +
      city.permitDeptName +
      ".",
    requiredClause:
      "The recorded typical is the Quick Permit mechanical permit on ADMIN 138 (" +
      typical +
      "). Plan review is not in that typical, and no technology fee is recorded on this row.",
    includedClause:
      "That " +
      typical +
      " is the mechanical permit only on the Quick Permit path. Plan review is not included in the typical, no technology fee is recorded on this row, and the separate electrical permit has no recorded dollar.",
    splitFaq: mechanical + " " + plan,
  };
}

/**
 * Denver HVAC money page: mechanical Quick Permit vs plan review, with no tech line.
 * Band arithmetic and the non–Quick Permit alternate stay in the calculation note.
 * Returns null outside that row so other cluster pages keep the generic blurb.
 */
function denverHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "denver-co" || project.projectSlug !== "hvac-replacement") return null;
  const mechanical = denverHvacMechanicalParagraph(city, permit);
  const plan = denverHvacPlanParagraph(city, permit);
  const context = denverHvacContextParagraph(city, project, permit);
  if (!mechanical || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(mechanical, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

/**
 * Denver roof: ADMIN 138 building permit on the Quick Permit / roof covering
 * path. Plan review is off the low, typical, and high recorded bands.
 * Returns false if those recorded anchors are missing, so we do not invent a path.
 */
function denverRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "denver-co" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 83 || permit.feeTypicalUsd !== 115 || permit.feeHighUsd !== 195) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  const building = extras.find((e) => /building permit/i.test(e.name || ""));
  const plan = extras.find((e) => /plan review/i.test(e.name || ""));
  if (!building || building.feeUsd !== 115) return false;
  if (!plan || plan.feeUsd != null) return false;
  if (extras.some((e) => /\btech/i.test(e.name || ""))) return false;
  if (extras.some((e) => /mechanical permit/i.test(e.name || ""))) return false;

  const notes = city.notes || "";
  if (!notes.includes("ADMIN 138")) return false;
  if (!notes.includes(DENVER_PLAN_REVIEW_RULE)) return false;
  if (!notes.includes(DENVER_QUICK_PERMIT_RULE)) return false;
  if (!/ADMIN 138/.test(permit.sourceName || "")) return false;

  const blob = permitBlob(permit);
  if (!/Quick Permit \/ roof covering/.test(blob)) return false;
  if (!/CPD lists roofing as a Quick Permit type/i.test(blob)) return false;
  if (!/no plan review/i.test(blob)) return false;

  const note = permit.calculationNote || "";
  if (!/building permit only on the Quick Permit path/i.test(note)) return false;
  if (!/Alternate non[–-]Quick Permit path/.test(note)) return false;
  if (!note.includes("$57.50") || !note.includes("$172.50")) return false;
  if (!/not used in the recorded typical\/low\/high/.test(note)) return false;
  return true;
}

function denverRoofBuildingParagraph(city: City, permit: Permit | null): string | null {
  if (!denverRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null) return null;
  const typical = permit.feeTypicalUsd as number;

  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(typical) +
    ", the building permit on the ADMIN 138 valuation table at the " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s +=
    ". CPD lists roofing as a Quick Permit type, so the typical total is the building permit only, with no plan review";
  return asSentence(s);
}

function denverRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!denverRoofFacts(city, permit)) return null;
  let s =
    "On this roof row, plan review is left off the low, typical, and high recorded bands even when the valuation exceeds $2,000";
  // Low / typical / high totals and the non–Quick Permit alternate stay in the calculation note once.
  s +=
    ". Recorded low, typical, and high totals and the alternate non–Quick Permit path are in the calculation note on this page";
  return asSentence(s);
}

function denverRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!denverRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  const admin = firstSentence(city.notes || "");
  if (admin && /ADMIN 138/.test(admin)) s += ". " + admin.replace(/\.$/, "");
  s += ". This roof row uses the building-permit line on that ADMIN 138 table, on the Quick Permit / roof covering path";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function denverRoofAssumption(permit: Permit): string | null {
  const assumed = permit.assumedValuationUsd;
  if (
    !assumed ||
    assumed.low == null ||
    assumed.typical == null ||
    assumed.high == null ||
    permit.feeLowUsd == null ||
    permit.feeTypicalUsd == null ||
    permit.feeHighUsd == null
  ) {
    return null;
  }
  return asSentence(
    "For the permit line we assumed Denver CPD's Quick Permit / roof covering path on ADMIN 138: the building permit only, " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      moneyExact(permit.feeTypicalUsd) +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". Plan review is left off the low, typical, and high recorded bands even though Denver's notes on file say plan review is 50% of the permit fee for work over $2,000. The alternate non–Quick Permit path and the full band detail are in the calculation note on this page",
  );
}

export type DenverRoofPageCopy = {
  assumption: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
};

/** On-page Denver roof copy from the permit row. Null unless ADMIN 138 Quick Permit anchors are present. */
export function denverRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DenverRoofPageCopy | null {
  if (!denverRoofFacts(city, permit)) return null;
  const building = denverRoofBuildingParagraph(city, permit);
  const plan = denverRoofPlanParagraph(city, permit);
  const assumption = denverRoofAssumption(permit);
  if (!building || !plan || !assumption) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  return {
    assumption,
    differ:
      "The recorded " +
      cityLabel(city) +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      (permit.feeModel ? " (" + permit.feeModel.replace(/_/g, " ") + ")" : "") +
      ". " +
      building +
      " " +
      plan +
      " Verify the Quick Permit / roof covering path with " +
      city.permitDeptName +
      ".",
    requiredClause:
      "The recorded typical is the Quick Permit building permit on ADMIN 138 (" +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      "). Plan review is not in the low, typical, or high recorded bands.",
    includedClause:
      "That " +
      typical +
      " is the building permit only on the Quick Permit / roof covering path. Plan review is not included in the recorded low, typical, or high.",
  };
}

/**
 * Denver roof money page: building Quick Permit, plan review off every recorded band.
 * Band arithmetic and the non–Quick Permit alternate stay in the calculation note.
 * Returns null outside that row so other cluster pages keep the generic blurb.
 */
function denverRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "denver-co" || project.projectSlug !== "roof-replacement") return null;
  const building = denverRoofBuildingParagraph(city, permit);
  const plan = denverRoofPlanParagraph(city, permit);
  const context = denverRoofContextParagraph(city, project, permit);
  if (!building || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(building, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const DENVER_DECK_SOURCE_NAME = "Denver CPD Development Fees / ADMIN 138";
const DENVER_DECK_SOURCE_URL =
  "https://www.denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Community-Planning-and-Development/Plan-Review-Permits-and-Inspections/Development-Fees";

export type DenverDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  typicalExact: string;
  rangeExact: string;
  permitSentence: string;
  includedMid: string;
};

/**
 * Denver deck: ADMIN 138 building permit plus 50% plan review.
 * Fees stay $124.50 / $172.50 / $268.50. New decks are not Quick Permit.
 * Returns false if those recorded anchors drift, so we do not invent a path.
 */
function denverDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "denver-co" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(124.5)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(172.5)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(268.5)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== DENVER_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== DENVER_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras.find((e) => e.name === "Building permit (ADMIN 138 valuation)");
  const plan = extras.find((e) => e.name === "Plan review (50% of permit)");
  const zoning = extras.find((e) => e.name === "Zoning / landmark review");
  if (!building || cents(building.feeUsd ?? NaN) !== cents(115)) return false;
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(57.5)) return false;
  if (!zoning || zoning.feeUsd != null) return false;

  const buildingNote = building.note || "";
  if (!/Included/.test(buildingNote)) return false;
  if (!/\$12,000/.test(buildingNote) || !/\$83/.test(buildingNote) || !/\$115/.test(buildingNote)) return false;
  if (!/\$179/.test(buildingNote) || !/Quick Permit/.test(buildingNote)) return false;

  const planNote = plan.note || "";
  if (!/Included/.test(planNote) || !/valuation > \$2,000/.test(planNote)) return false;
  if (!/\$57\.50/.test(planNote) || !/\$41\.50/.test(planNote) || !/\$89\.50/.test(planNote)) return false;

  const zoningNote = zoning.note || "";
  if (!/Not included/.test(zoningNote) || !/historic districts/.test(zoningNote)) return false;

  const notes = city.notes || "";
  if (!notes.includes("ADMIN 138")) return false;
  if (!notes.includes(DENVER_PLAN_REVIEW_RULE)) return false;
  if (!notes.includes(DENVER_QUICK_PERMIT_RULE)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(DENVER_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-08-13/.test(note)) return false;
  if (!/\$83 \+ plan review \$41\.50/.test(note) || !/feeLowUsd is \$124\.50/.test(note)) return false;
  if (!/\$115 \+ plan review \$57\.50/.test(note) || !/feeTypicalUsd is \$172\.50/.test(note)) return false;
  if (!/\$179 \+ plan review \$89\.50/.test(note) || !/feeHighUsd is \$268\.50/.test(note)) return false;
  if (!/valuation > \$2,000/.test(note)) return false;
  if (!/not a Quick Permit roofing\/siding\/mechanical/.test(note)) return false;
  if (!/Zoning\/landmark reviews are extra in historic districts/.test(note)) return false;
  if (!/not included in the recorded typical\/low\/high/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;
  if (!/typical project value is \$12,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/50% plan review/.test(caveat) || !/ADMIN 138/.test(caveat)) return false;
  if (!/retrieved 2026-08-13/.test(caveat)) return false;
  if (!/\$124\.50/.test(caveat) || !/\$172\.50/.test(caveat) || !/\$268\.50/.test(caveat)) return false;
  if (!/not Quick Permit roofing\/siding\/mechanical/.test(caveat)) return false;
  if (!/historic districts/.test(caveat)) return false;
  if (!/not included in recorded typical\/low\/high/.test(caveat)) return false;
  return true;
}

function denverDeckBuildingParagraph(city: City, permit: Permit | null): string | null {
  if (!denverDeckFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  return asSentence(
    "The recorded typical permit fee for a deck in " +
      cityLabel(city) +
      " is " +
      moneyExact(permit.feeTypicalUsd) +
      ", the building permit plus 50% plan review on the ADMIN 138 valuation table at the " +
      moneyExact(assumed.typical) +
      " typical valuation. New decks are not a Quick Permit roofing/siding/mechanical path",
  );
}

function denverDeckPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!denverDeckFacts(city, permit)) return null;
  return asSentence(
    "Plan review is required for valuation > $2,000 and is included in the recorded low, typical, and high. Recorded low, typical, and high totals are in the calculation note on this page. Zoning/landmark reviews are extra in historic districts and are not included in those totals",
  );
}

function denverDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!denverDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  const admin = firstSentence(city.notes || "");
  if (admin && /ADMIN 138/.test(admin)) s += ". " + admin.replace(/\.$/, "");
  s += ". This deck row uses the building-permit line plus 50% plan review on that ADMIN 138 table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function denverDeckAssumption(permit: Permit): string | null {
  const assumed = permit.assumedValuationUsd;
  if (
    !assumed ||
    assumed.low == null ||
    assumed.typical == null ||
    assumed.high == null ||
    permit.feeLowUsd == null ||
    permit.feeTypicalUsd == null ||
    permit.feeHighUsd == null ||
    permit.typicalProjectValueUsd == null
  ) {
    return null;
  }
  return asSentence(
    "For the permit line we assumed Denver CPD's ADMIN 138 valuation path for a new deck: building permit plus 50% plan review, " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      moneyExact(permit.feeTypicalUsd) +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". Plan review is required for valuation > $2,000. New decks are not Quick Permit roofing/siding/mechanical. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
      moneyExact(permit.typicalProjectValueUsd),
  );
}

/**
 * Short Denver deck copy. The full ADMIN 138 walk stays on the permit
 * callout calculation note. Null unless the recorded $124.50 / $172.50 / $268.50 anchors match.
 */
export function denverDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DenverDeckPageCopy | null {
  if (!denverDeckFacts(city, permit)) return null;
  const assumption = denverDeckAssumption(permit);
  const building = denverDeckBuildingParagraph(city, permit);
  const plan = denverDeckPlanParagraph(city, permit);
  if (!assumption || !building || !plan) return null;
  const assumed = permit.assumedValuationUsd;
  if (
    !assumed ||
    assumed.low == null ||
    assumed.typical == null ||
    assumed.high == null ||
    permit.feeLowUsd == null ||
    permit.feeTypicalUsd == null ||
    permit.feeHighUsd == null ||
    permit.typicalProjectValueUsd == null
  ) {
    return null;
  }
  const low = moneyExact(permit.feeLowUsd);
  const typical = moneyExact(permit.feeTypicalUsd);
  const high = moneyExact(permit.feeHighUsd);
  const projectValue = moneyExact(permit.typicalProjectValueUsd);
  const lowVal = moneyExact(assumed.low);
  const typicalVal = moneyExact(assumed.typical);
  const highVal = moneyExact(assumed.high);
  const buildingFee = (permit.extras || []).find((e) => e.name === "Building permit (ADMIN 138 valuation)");
  const planFee = (permit.extras || []).find((e) => e.name === "Plan review (50% of permit)");
  if (buildingFee?.feeUsd == null || planFee?.feeUsd == null) return null;
  const dept = shortDeptName(city);
  const parts =
    "(" + moneyExact(buildingFee.feeUsd) + " building + " + moneyExact(planFee.feeUsd) + " plan review)";
  return {
    assumption,
    howCalculated: asSentence(
      "Recorded low, typical, and high use the ADMIN 138 building permit plus 50% plan review. Full arithmetic is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Recorded assumed valuations are " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The low, typical, and high walk is in the calculation note on this page",
    ),
    differ:
      "The recorded " +
      cityLabel(city) +
      " fee comes from " +
      permit.sourceName +
      " (valuation). The typical path is " +
      typical +
      " on the recorded " +
      typicalVal +
      " valuation. Low, typical, and high valuation arithmetic are in the calculation note on this page. New decks are not Quick Permit roofing/siding/mechanical. Zoning/landmark reviews are extra in historic districts and are not in the recorded totals. Verify the fee with " +
      city.permitDeptName +
      ".",
    requiredClause:
      "The recorded typical is the ADMIN 138 building permit plus 50% plan review (" +
      typical +
      " at " +
      typicalVal +
      "). New decks are not Quick Permit roofing/siding/mechanical.",
    includedClause:
      "That " +
      typical +
      " is the building permit (" +
      moneyExact(buildingFee.feeUsd) +
      ") plus 50% plan review (" +
      moneyExact(planFee.feeUsd) +
      "). Zoning/landmark review is not included in the recorded low, typical, or high.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
    permitSentence:
      "The recorded " + dept + " permit fee of " + typical + " " + parts + " is included in the all-in.",
    includedMid: "including the recorded " + dept + " permit fee of " + typical + " " + parts,
  };
}

/**
 * Denver deck money page: building permit plus 50% plan review.
 * Band arithmetic stays in the calculation note.
 * Returns null outside that row so other Denver pages keep their own blurbs.
 */
function denverDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "denver-co" || project.projectSlug !== "deck") return null;
  const building = denverDeckBuildingParagraph(city, permit);
  const plan = denverDeckPlanParagraph(city, permit);
  const context = denverDeckContextParagraph(city, project, permit);
  if (!building || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(building, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const AUSTIN_EXPRESS_REVIEW_USD = 106.72;
const AUSTIN_EXPRESS_INSPECTION_USD = 66.33;
const AUSTIN_EXPRESS_TOTAL_USD = 173.05;
const AUSTIN_FIRE_INSPECTION_USD = 370;
const AUSTIN_EXPRESS_TRIGGER =
  "WUI and 50%+ replacement, or replacing more than 128 sq ft of decking";

function cents(n: number): number {
  return Math.round(n * 100);
}

/**
 * Austin roof: asphalt-on-asphalt reroof is a recorded $0 exemption.
 * Express plan review + inspection and the per-case Fire inspection are
 * recorded extras and are not in the totals. Returns false if those anchors
 * are missing, so we do not invent a path.
 */
function austinRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "austin-tx" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== false || permit.feeModel !== "none") return false;
  if (permit.feeLowUsd !== 0 || permit.feeTypicalUsd !== 0 || permit.feeHighUsd !== 0) return false;
  if (permit.retrievedDate !== "2026-08-31") return false;
  if (!/Work Exempt/i.test(permit.sourceName || "")) return false;

  const extras = permit.extras || [];
  const review = extras.find((e) => /Express Residential Plan Review/i.test(e.name || ""));
  const inspection = extras.find((e) => /Residential Express Permits inspection/i.test(e.name || ""));
  const fire = extras.find((e) => /Fire Residential Roof Replacement Inspection/i.test(e.name || ""));
  if (!review || review.feeUsd !== AUSTIN_EXPRESS_REVIEW_USD) return false;
  if (!inspection || inspection.feeUsd !== AUSTIN_EXPRESS_INSPECTION_USD) return false;
  if (!fire || fire.feeUsd !== AUSTIN_FIRE_INSPECTION_USD) return false;
  if (!/not included in totals/i.test(review.note || "")) return false;
  if (!/not included in totals/i.test(inspection.note || "")) return false;
  if (!/not included in totals/i.test(fire.note || "")) return false;
  if (!/may or may not apply per case/i.test(fire.note || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const expressSum = cents(review.feeUsd) + cents(inspection.feeUsd);
  if (expressSum !== cents(AUSTIN_EXPRESS_TOTAL_USD)) return false;

  const blob = permitBlob(permit);
  if (!/items 12/.test(blob) || !/\b13\b/.test(blob)) return false;
  if (!/asphalt/i.test(blob) || !/\bexempt/i.test(blob)) return false;
  if (!/Wildland-Urban Interface/i.test(blob) || !/50%/.test(blob)) return false;
  if (!blob.includes(AUSTIN_EXPRESS_TRIGGER)) return false;
  if (!/7\/15\/2026/.test(blob)) return false;
  if (!blob.includes(moneyExact(review.feeUsd))) return false;
  if (!blob.includes(moneyExact(inspection.feeUsd))) return false;
  if (!blob.includes(moneyExact(AUSTIN_EXPRESS_TOTAL_USD))) return false;
  if (!blob.includes(moneyExact(fire.feeUsd))) return false;
  if (!/\$0/.test(permit.calculationNote || "")) return false;
  return true;
}

function austinRoofExemptionParagraph(city: City, permit: Permit | null): string | null {
  if (!austinRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;

  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    usd(0) +
    " because a typical asphalt-on-asphalt reroof is exempt under City of Austin Work Exempt from Building Permits residential items 12 and 13";
  s +=
    ". Item 12 covers asphalt shingles replacing existing asphalt shingles, and item 13 covers roof-covering replacement that does not adversely affect the roof structure, unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced";
  s +=
    ". Recorded assumed valuations on this row are low " +
    moneyExact(assumed.low) +
    ", typical " +
    moneyExact(assumed.typical) +
    ", and high " +
    moneyExact(assumed.high) +
    ", and the recorded fee low, typical, and high are all " +
    usd(0);
  s +=
    ". That exemption is the local cost difference on the typical path: the all-in figure is wage-indexed job cost without a municipal permit line";
  return asSentence(s);
}

function austinRoofAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!austinRoofFacts(city, permit)) return null;
  const review = (permit.extras || []).find((e) => /Express Residential Plan Review/i.test(e.name || ""));
  const inspection = (permit.extras || []).find((e) =>
    /Residential Express Permits inspection/i.test(e.name || ""),
  );
  const fire = (permit.extras || []).find((e) =>
    /Fire Residential Roof Replacement Inspection/i.test(e.name || ""),
  );
  if (!review || review.feeUsd == null || !inspection || inspection.feeUsd == null || !fire || fire.feeUsd == null) {
    return null;
  }

  let s =
    "A permit path is still recorded when that exemption does not apply. The recorded alternate is an Express permit for " +
    AUSTIN_EXPRESS_TRIGGER;
  s +=
    ". On that path the FY 2025-26 Residential Building Plan Review & Inspection Permit Fees PDF (updated 7/15/2026) records Express Residential Plan Review " +
    moneyExact(review.feeUsd) +
    " plus Residential Express Permits inspection " +
    moneyExact(inspection.feeUsd) +
    ", which equals " +
    moneyExact(AUSTIN_EXPRESS_TOTAL_USD);
  s +=
    ". Austin Fire Residential Roof Replacement Inspection " +
    moneyExact(fire.feeUsd) +
    " is per-case and may or may not apply; it is not part of the " +
    moneyExact(AUSTIN_EXPRESS_TOTAL_USD) +
    " Express subtotal";
  s += ". Those Express and Fire dollars are not included in the low, typical, or high totals";
  return asSentence(s);
}

function austinRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!austinRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This roof row uses the recorded asphalt-on-asphalt exemption, not a valuation table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function austinRoofAssumption(city: City, permit: Permit): string | null {
  if (!austinRoofFacts(city, permit)) return null;
  return asSentence(
    "For the permit line we assumed the recorded asphalt-on-asphalt exemption (Work Exempt residential items 12 and 13), so the typical fee is " +
      usd(0) +
      ". The Express alternate (" +
      moneyExact(AUSTIN_EXPRESS_REVIEW_USD) +
      " plan review + " +
      moneyExact(AUSTIN_EXPRESS_INSPECTION_USD) +
      " inspection = " +
      moneyExact(AUSTIN_EXPRESS_TOTAL_USD) +
      ") and the per-case Fire inspection (" +
      moneyExact(AUSTIN_FIRE_INSPECTION_USD) +
      ") are not in that total",
  );
}

export type AustinRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  exemptionFaq: string;
  metaSentence: string;
};

/**
 * On-page Austin roof copy from the permit row.
 * Assumption stays short; the why-costs section carries the longer path.
 * Null unless the $0 exemption and recorded Express/Fire extras are present.
 */
export function austinRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AustinRoofPageCopy | null {
  if (!austinRoofFacts(city, permit)) return null;
  const assumption = austinRoofAssumption(city, permit);
  const alternate = austinRoofAlternateParagraph(city, permit);
  if (!assumption || !alternate) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;

  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "A typical asphalt-on-asphalt reroof is exempt under Work Exempt residential items 12 and 13 unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is replaced.",
    includedClause:
      "Express plan review, Express inspection, and the per-case Fire inspection are recorded extras and are not part of that " +
      usd(0) +
      ".",
    differ:
      "The typical path in " +
      label +
      " is recorded as " +
      usd(0) +
      " because an asphalt-on-asphalt reroof is exempt under Work Exempt residential items 12 and 13. If the exemption does not apply, the recorded Express alternate is " +
      moneyExact(AUSTIN_EXPRESS_REVIEW_USD) +
      " plan review plus " +
      moneyExact(AUSTIN_EXPRESS_INSPECTION_USD) +
      " inspection, which equals " +
      moneyExact(AUSTIN_EXPRESS_TOTAL_USD) +
      ", and it is not folded into the typical " +
      usd(0) +
      ". The per-case Fire roof-replacement inspection of " +
      moneyExact(AUSTIN_FIRE_INSPECTION_USD) +
      " is also not in that total.",
    howCalculated:
      "The recorded typical is " +
      usd(0) +
      " on the asphalt-on-asphalt exemption (Work Exempt items 12 and 13). The Express alternate, only if that exemption does not apply, is Express Residential Plan Review " +
      moneyExact(AUSTIN_EXPRESS_REVIEW_USD) +
      " plus Residential Express Permits inspection " +
      moneyExact(AUSTIN_EXPRESS_INSPECTION_USD) +
      " = " +
      moneyExact(AUSTIN_EXPRESS_TOTAL_USD) +
      ", and those dollars are not included in the low, typical, or high totals.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The typical permit fee stays " +
      usd(0) +
      " at each of those values. The Express lines stay the flat recorded pair and are not included in the totals.",
    exemptionFaq:
      "The recorded typical path is " +
      usd(0) +
      " under Work Exempt residential items 12 and 13 for an asphalt-on-asphalt reroof, unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced. An Express-permit path is recorded for those WUI jobs and for decking replacement over 128 sq ft, and it is not part of the typical " +
      usd(0) +
      ".",
    metaSentence:
      "The recorded typical path permit fee is " +
      usd(0) +
      " (asphalt-on-asphalt reroof exempt under Work Exempt items 12 and 13).",
  };
}

/**
 * Austin roof money page: $0 asphalt exemption vs recorded Express alternate.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function austinRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "austin-tx" || project.projectSlug !== "roof-replacement") return null;
  const exemption = austinRoofExemptionParagraph(city, permit);
  const alternate = austinRoofAlternateParagraph(city, permit);
  const context = austinRoofContextParagraph(city, project, permit);
  if (!exemption || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(exemption, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const AUSTIN_HVAC_FIRST_USD = 80.09;
const AUSTIN_HVAC_ADDITIONAL_USD = 41.47;
const AUSTIN_HVAC_HIGH_USD = 121.56;
const AUSTIN_HVAC_SUM = "$80.09 + $41.47 = $121.56";
const AUSTIN_HVAC_OUT_OF_PROGRAM =
  "New systems, duct redesign, or work outside the program use different residential building/mechanical fees.";

/**
 * Austin HVAC: residential Change-Out Program, like-for-like.
 * Typical and low are the first-system fee. High is first plus one additional.
 * Returns false if those recorded anchors are missing, so we do not invent a path.
 */
function austinHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "austin-tx" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(AUSTIN_HVAC_FIRST_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(AUSTIN_HVAC_FIRST_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(AUSTIN_HVAC_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (!/CM Vela Item 4 Motion 1 Attachment 1/.test(permit.sourceName || "")) return false;
  if (!/id=456810/.test(permit.sourceUrl || "")) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const first = extras.find((e) => /Change-Out Program/i.test(e.name || "") && /first system/i.test(e.name || ""));
  const additional = extras.find((e) => /additional HVAC system/i.test(e.name || ""));
  if (!first || cents(first.feeUsd ?? NaN) !== cents(AUSTIN_HVAC_FIRST_USD)) return false;
  if (!additional || cents(additional.feeUsd ?? NaN) !== cents(AUSTIN_HVAC_ADDITIONAL_USD)) return false;
  if (cents(first.feeUsd as number) + cents(additional.feeUsd as number) !== cents(AUSTIN_HVAC_HIGH_USD)) {
    return false;
  }
  if (!/FY26 adopted residential change-out fee/i.test(first.note || "")) return false;
  if (!/first \+ one additional/i.test(additional.note || "")) return false;

  const caveat = permit.caveat || "";
  if (!/residential Change-Out Program \(like-for-like HVAC\)/.test(caveat)) return false;
  if (!caveat.includes(AUSTIN_HVAC_OUT_OF_PROGRAM)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(AUSTIN_HVAC_SUM)) return false;
  if (!/Change-Out Program/i.test(note)) return false;
  if (!note.includes(moneyExact(AUSTIN_HVAC_FIRST_USD))) return false;
  if (!note.includes(moneyExact(AUSTIN_HVAC_ADDITIONAL_USD))) return false;
  if (!note.includes(moneyExact(AUSTIN_HVAC_HIGH_USD))) return false;
  if (!/like-for-like HVAC/.test(note)) return false;
  if (!note.includes(AUSTIN_HVAC_OUT_OF_PROGRAM)) return false;
  return true;
}

function austinHvacChangeOutParagraph(city: City, permit: Permit | null): string | null {
  if (!austinHvacFacts(city, permit)) return null;
  const typical = permit.feeTypicalUsd as number;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(typical) +
    ", the residential Change-Out Program fee for the first like-for-like system";
  s +=
    ". Low uses that same first-system Change-Out fee. The high band adds one additional system, and that arithmetic is in the calculation note on this page";
  return asSentence(s);
}

function austinHvacScopeParagraph(city: City, permit: Permit | null): string | null {
  if (!austinHvacFacts(city, permit)) return null;
  const outOfProgram = recordedSentences(permit.caveat || "").find((sentence) =>
    sentence.includes("New systems, duct redesign, or work outside the program"),
  );
  let s = outOfProgram
    ? outOfProgram.replace(/\.$/, "")
    : AUSTIN_HVAC_OUT_OF_PROGRAM.replace(/\.$/, "");
  s +=
    ". Those other residential building and mechanical fees are not recorded on this row, so they are not in the low, typical, or high";
  return asSentence(s);
}

function austinHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!austinHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This HVAC row uses the flat residential Change-Out Program, not a valuation table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function austinHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the residential Change-Out Program like-for-like path, so the typical fee is the first-system Change-Out of " +
      moneyExact(permit.feeTypicalUsd) +
      ". The high-band arithmetic is in the calculation note on this page. New systems, duct redesign, or work outside the program use different residential building/mechanical fees",
  );
}

export type AustinHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Austin HVAC copy from the Change-Out Program row.
 * Assumption and why stay short and point at the calculation note for the
 * high-band arithmetic. Null unless the recorded first-system fee and the
 * first-plus-one high are both present.
 */
export function austinHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AustinHvacPageCopy | null {
  if (!austinHvacFacts(city, permit)) return null;
  const assumption = austinHvacAssumption(permit);
  const changeOut = austinHvacChangeOutParagraph(city, permit);
  if (!assumption || !changeOut) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded typical is the residential Change-Out Program first-system fee (like-for-like HVAC) of " +
      typical +
      ". " +
      AUSTIN_HVAC_OUT_OF_PROGRAM,
    includedClause:
      "That " +
      typical +
      " is the first-system residential Change-Out Program fee for like-for-like HVAC. The high total in the calculation note adds one additional system. " +
      AUSTIN_HVAC_OUT_OF_PROGRAM,
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is the residential Change-Out Program like-for-like fee of " +
      typical +
      " for the first system. The high band, first system plus one additional, is in the calculation note on this page. " +
      AUSTIN_HVAC_OUT_OF_PROGRAM +
      " Those other dollars are not recorded on this row. Verify the Change-Out Program path with " +
      city.permitDeptName +
      ".",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the residential Change-Out Program (like-for-like first system)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the residential Change-Out Program (like-for-like first system) is included in the all-in.",
  };
}

/**
 * Austin HVAC money page: Change-Out Program first system vs one additional.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function austinHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "austin-tx" || project.projectSlug !== "hvac-replacement") return null;
  const changeOut = austinHvacChangeOutParagraph(city, permit);
  const scope = austinHvacScopeParagraph(city, permit);
  const context = austinHvacContextParagraph(city, project, permit);
  if (!changeOut || !scope || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(changeOut, scope, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const AUSTIN_KITCHEN_PLAN_USD = 342.7;
const AUSTIN_KITCHEN_PROCESSING_USD = 136.45;
const AUSTIN_KITCHEN_BUILDING_USD = 334.74;
const AUSTIN_KITCHEN_ELECTRIC_USD = 166.9;
const AUSTIN_KITCHEN_PLUMBING_USD = 200.43;
const AUSTIN_KITCHEN_ENERGY_USD = 86.06;
const AUSTIN_KITCHEN_TYPICAL_USD = 1267.28;
const AUSTIN_KITCHEN_EXPRESS_USD = 87.49;
const AUSTIN_KITCHEN_SUM =
  "interior remodel plan review (201\u2013300 sq ft) $342.70 + residential plan review application processing $136.45 + residential building permit fee (\u22641,000 sq ft) $334.74 + electric fee (\u22641,000 sq ft) $166.90 + plumbing fee (\u22641,000 sq ft) $200.43 + energy fee $86.06 = $1,267.28";
const AUSTIN_KITCHEN_TIERED =
  "Low and high are omitted because the fee model is tiered on remodel square footage and trade mix, not a low\u2013high band.";
const AUSTIN_KITCHEN_EXPRESS_LINE = "Residential Express Permits/Kitchen Remodels-Inspection";

/**
 * Austin kitchen: FY26 interior remodel, 201–300 sq ft plan-review bracket,
 * plus building, electric, plumbing, and energy. Low and high stay null.
 * Express inspection is recorded and is not in the typical. Returns false if
 * those anchors are missing, so we do not invent a path or a low–high band.
 */
function austinKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "austin-tx" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (permit.feeLowUsd != null || permit.feeHighUsd != null) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(AUSTIN_KITCHEN_TYPICAL_USD)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (!/FY26 residential plan review and permit fees/.test(permit.sourceName || "")) return false;
  if (!/id=456810/.test(permit.sourceUrl || "")) return false;

  const extras = permit.extras || [];
  if (extras.length !== 7) return false;
  const plan = extras.find((e) => /Interior remodel plan review/i.test(e.name || "") && /201/.test(e.name || ""));
  const processing = extras.find((e) => /plan review application processing/i.test(e.name || ""));
  const building = extras.find((e) => /building permit fee/i.test(e.name || ""));
  const electric = extras.find((e) => /^Electric fee/i.test(e.name || ""));
  const plumbing = extras.find((e) => /^Plumbing fee/i.test(e.name || ""));
  const energy = extras.find((e) => /^Energy fee$/i.test((e.name || "").trim()));
  const express = extras.find((e) => /Express kitchen-remodel inspection/i.test(e.name || ""));
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_PLAN_USD)) return false;
  if (!processing || cents(processing.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_PROCESSING_USD)) return false;
  if (!building || cents(building.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_BUILDING_USD)) return false;
  if (!electric || cents(electric.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_ELECTRIC_USD)) return false;
  if (!plumbing || cents(plumbing.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_PLUMBING_USD)) return false;
  if (!energy || cents(energy.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_ENERGY_USD)) return false;
  if (!express || cents(express.feeUsd ?? NaN) !== cents(AUSTIN_KITCHEN_EXPRESS_USD)) return false;
  if (!/Not added into typical/i.test(express.note || "")) return false;
  if (!express.note?.includes(AUSTIN_KITCHEN_EXPRESS_LINE)) return false;

  const includedCents =
    cents(plan.feeUsd as number) +
    cents(processing.feeUsd as number) +
    cents(building.feeUsd as number) +
    cents(electric.feeUsd as number) +
    cents(plumbing.feeUsd as number) +
    cents(energy.feeUsd as number);
  if (includedCents !== cents(AUSTIN_KITCHEN_TYPICAL_USD)) return false;

  const caveat = permit.caveat || "";
  if (!/201/.test(caveat) || !/building\+electric\+plumbing\+energy/.test(caveat)) return false;
  if (!/Mechanical \(\$146\.80\) omitted unless HVAC is relocated/.test(caveat)) return false;
  if (!/Low\/high left null/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(AUSTIN_KITCHEN_SUM)) return false;
  if (!note.includes(AUSTIN_KITCHEN_TIERED)) return false;
  if (!/201–300 sq ft plan-review bracket is the typical bracket/.test(note)) return false;
  if (!note.includes(moneyExact(AUSTIN_KITCHEN_EXPRESS_USD))) return false;
  if (!note.includes(AUSTIN_KITCHEN_EXPRESS_LINE)) return false;
  if (!/Alternate path not included in the typical/.test(note)) return false;
  if (!/not in the \$1,267\.28 typical/.test(note)) return false;
  if (/\$212\.90|\$214\.40|\$452\.00|\$551\.10|\$643\.50/.test(note)) return false;
  return true;
}

function austinKitchenPathParagraph(city: City, permit: Permit | null): string | null {
  if (!austinKitchenFacts(city, permit)) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  let s =
    "The recorded typical permit fee for a kitchen remodel in " +
    cityLabel(city) +
    " is " +
    typical +
    ", the FY26 interior-remodel path for a 201–300 sq ft kitchen with building, electric, plumbing, and energy";
  s += ". That total is the six published lines in the calculation note on this page";
  s += ". " + AUSTIN_KITCHEN_TIERED.replace(/\.$/, "");
  return asSentence(s);
}

function austinKitchenAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!austinKitchenFacts(city, permit)) return null;
  const express = (permit.extras || []).find((e) => /Express kitchen-remodel inspection/i.test(e.name || ""));
  if (!express || express.feeUsd == null) return null;
  let s =
    "The 201–300 sq ft plan-review bracket is the typical bracket used for this row. Other plan-review brackets exist and are not totaled here as a low or high";
  s +=
    ". Express kitchen-remodel inspection " +
    moneyExact(express.feeUsd) +
    " (FY26 " +
    AUSTIN_KITCHEN_EXPRESS_LINE +
    ") is an alternate path and is not added into the typical";
  s += ". Mechanical ($146.80) is omitted unless HVAC is relocated and is not in the typical";
  return asSentence(s);
}

function austinKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!austinKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This kitchen row uses the tiered interior-remodel path, not a valuation table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function austinKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the FY26 interior-remodel path on the 201–300 sq ft plan-review bracket, with building, electric, plumbing, and energy, so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". The line-item arithmetic is in the calculation note on this page. " +
      AUSTIN_KITCHEN_TIERED.replace(/\.$/, ""),
  );
}

export type AustinKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  typicalExact: string;
  includedMid: string;
  permitSentence: string;
  howCalculated: string;
  omittedBandsFaq: string;
  expressFaq: string;
};

/**
 * On-page Austin kitchen copy from the interior-remodel row.
 * Assumption and why stay short and point at the calculation note for the
 * six-line arithmetic. Null unless the recorded $1,267.28 typical is present
 * and low/high stay null.
 */
export function austinKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AustinKitchenPageCopy | null {
  if (!austinKitchenFacts(city, permit)) return null;
  const assumption = austinKitchenAssumption(permit);
  const path = austinKitchenPathParagraph(city, permit);
  if (!assumption || !path) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const express = moneyExact(AUSTIN_KITCHEN_EXPRESS_USD);
  return {
    assumption,
    requiredClause:
      "The recorded typical is the FY26 interior-remodel path (201–300 sq ft plan review, plus building, electric, plumbing, and energy) of " +
      typical +
      ". " +
      AUSTIN_KITCHEN_TIERED,
    includedClause:
      "That " +
      typical +
      " is the FY26 interior-remodel path for a 201–300 sq ft kitchen with building, electric, plumbing, and energy. The line-item arithmetic is in the calculation note on this page. The Express kitchen-remodel inspection is an alternate path and is not in that typical.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (tiered). The typical path is the FY26 interior remodel for a 201–300 sq ft kitchen at " +
      typical +
      ". The line-item arithmetic is in the calculation note on this page. " +
      AUSTIN_KITCHEN_TIERED +
      " The Express kitchen-remodel inspection of " +
      express +
      " is an alternate path and is not in the typical. Verify the interior-remodel path with " +
      city.permitDeptName +
      ".",
    typicalExact: typical,
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the FY26 interior-remodel path (201–300 sq ft)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the FY26 interior-remodel path (201–300 sq ft, building, electric, plumbing, and energy) is included in the all-in.",
    howCalculated: (permit.calculationNote || "").trim(),
    omittedBandsFaq:
      AUSTIN_KITCHEN_TIERED +
      " The 201–300 sq ft plan-review bracket is the typical bracket used for this row. Other plan-review brackets exist and are not totaled here as a low or high.",
    expressFaq:
      "Express kitchen-remodel inspection is " +
      express +
      " (FY26 " +
      AUSTIN_KITCHEN_EXPRESS_LINE +
      "). It is an alternate path and is not added into the typical " +
      typical +
      ".",
  };
}

/**
 * Austin kitchen money page: interior-remodel typical vs Express alternate.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function austinKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "austin-tx" || project.projectSlug !== "kitchen-remodel") return null;
  const path = austinKitchenPathParagraph(city, permit);
  const alternate = austinKitchenAlternateParagraph(city, permit);
  const context = austinKitchenContextParagraph(city, project, permit);
  if (!path || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(path, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const AUSTIN_DECK_PLAN_USD = 132.86;
const AUSTIN_DECK_PROCESSING_USD = 106.72;
const AUSTIN_DECK_BUILDING_USD = 289.53;
const AUSTIN_DECK_ELECTRIC_USD = 166.99;
const AUSTIN_DECK_TYPICAL_USD = 529.11;
const AUSTIN_DECK_SUM =
  "Small Projects Plan Review $132.86 + Residential Plan Review Application Processing $106.72 + Residential building permit fee (base, \u22641,000 sq ft) $289.53 = $529.11";
const AUSTIN_DECK_FLAT =
  "Low and high equal that typical under the flat fee model.";
const AUSTIN_DECK_ELECTRIC_LINE = "Electric fee (base, \u22641,000 sq ft)";
const AUSTIN_DECK_ELECTRIC_NOTE = "not added unless the deck adds lighting or outlets";

/**
 * Austin deck: Small Projects Plan Review plus the residential building permit.
 * Typical, low, and high stay $529.11. Electric is recorded and is not in the
 * typical unless the deck adds lighting or outlets. Returns false if those
 * anchors are missing, so we do not invent a path or a new dollar.
 */
function austinDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "austin-tx" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(AUSTIN_DECK_TYPICAL_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(AUSTIN_DECK_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(AUSTIN_DECK_TYPICAL_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-31") return false;
  if (!/FY 2025-26 Residential Building Plan Review/.test(permit.sourceName || "")) return false;
  if (!/fz9rhwg8qq/.test(permit.sourceUrl || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const plan = extras.find((e) => /Small Projects Plan Review/i.test(e.name || ""));
  const processing = extras.find((e) => /Residential Plan Review Application Processing/i.test(e.name || ""));
  const building = extras.find((e) => /building permit fee/i.test(e.name || ""));
  const electric = extras.find((e) => /^Electric fee/i.test(e.name || ""));
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(AUSTIN_DECK_PLAN_USD)) return false;
  if (!processing || cents(processing.feeUsd ?? NaN) !== cents(AUSTIN_DECK_PROCESSING_USD)) return false;
  if (!building || cents(building.feeUsd ?? NaN) !== cents(AUSTIN_DECK_BUILDING_USD)) return false;
  if (!electric || cents(electric.feeUsd ?? NaN) !== cents(AUSTIN_DECK_ELECTRIC_USD)) return false;
  if (!/\bIncluded\b/.test(plan.note || "")) return false;
  if (!/\bIncluded\b/.test(processing.note || "")) return false;
  if (!/\bIncluded\b/.test(building.note || "")) return false;
  if (!/Not added unless the deck adds lighting or outlets/i.test(electric.note || "")) return false;
  if (/\bIncluded\b/.test(electric.note || "")) return false;

  const includedCents =
    cents(plan.feeUsd as number) + cents(processing.feeUsd as number) + cents(building.feeUsd as number);
  if (includedCents !== cents(AUSTIN_DECK_TYPICAL_USD)) return false;

  const caveat = permit.caveat || "";
  if (!/16\u00d720/.test(caveat) || !/item 10/.test(caveat)) return false;
  if (!/Small Projects Plan Review/.test(caveat)) return false;
  if (!/not on the work-exempt list/.test(caveat)) return false;
  if (!/Published dollars do not change/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(AUSTIN_DECK_SUM)) return false;
  if (!/Low \$529\.11 and high \$529\.11/.test(note)) return false;
  if (!/fee model is flat/.test(note)) return false;
  if (!note.includes(AUSTIN_DECK_ELECTRIC_LINE)) return false;
  if (!note.includes(moneyExact(AUSTIN_DECK_ELECTRIC_USD))) return false;
  if (!/not in the \$529\.11 typical/.test(note)) return false;
  if (!new RegExp(AUSTIN_DECK_ELECTRIC_NOTE, "i").test(note)) return false;
  if (!/not on the work-exempt list/.test(note) || !/item 10/.test(note)) return false;
  if (!/16\u00d720/.test(note)) return false;
  if (!/Pool\/Uncovered Deck/.test(note) || !/5-business-day/.test(note)) return false;
  if (!note.includes(moneyExact(8000)) || !note.includes(moneyExact(12000)) || !note.includes(moneyExact(19200))) {
    return false;
  }
  if (!/Published dollars do not change/.test(note)) return false;
  if (!/FY 2025-26 Residential Building Plan Review/.test(note)) return false;
  if (!/retrieved 2026-08-31/.test(note)) return false;

  const allowed = new Set([
    moneyExact(AUSTIN_DECK_PLAN_USD),
    moneyExact(AUSTIN_DECK_PROCESSING_USD),
    moneyExact(AUSTIN_DECK_BUILDING_USD),
    moneyExact(AUSTIN_DECK_ELECTRIC_USD),
    moneyExact(AUSTIN_DECK_TYPICAL_USD),
    moneyExact(8000),
    moneyExact(12000),
    moneyExact(19200),
  ]);
  const dollars = note.match(/\$\d[\d,]*(?:\.\d+)?/g) || [];
  if (!dollars.length || dollars.some((d) => !allowed.has(d))) return false;
  return true;
}

function austinDeckPathParagraph(city: City, permit: Permit | null): string | null {
  if (!austinDeckFacts(city, permit)) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  let s =
    "The recorded typical permit fee for a deck in " +
    cityLabel(city) +
    " is " +
    typical +
    ", the Small Projects Plan Review path plus the residential building permit";
  s += ". That total is the three published lines in the calculation note on this page";
  s += ". " + AUSTIN_DECK_FLAT.replace(/\.$/, "");
  return asSentence(s);
}

function austinDeckElectricParagraph(city: City, permit: Permit | null): string | null {
  if (!austinDeckFacts(city, permit)) return null;
  const electric = (permit.extras || []).find((e) => /^Electric fee/i.test(e.name || ""));
  if (!electric || electric.feeUsd == null) return null;
  let s =
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    " is recorded but is not in the typical unless the deck adds lighting or outlets";
  s +=
    ". A typical attached 16\u00d720 uncovered deck is over 200 sq ft, so it is not on the work-exempt list (item 10 is \u2264200 sq ft, \u226430 in above grade, not attached, not in a flood hazard)";
  s += ". Published dollars do not change with the recorded valuation bands";
  return asSentence(s);
}

function austinDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!austinDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This deck row uses the flat Small Projects Plan Review path, not a valuation table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function austinDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the Small Projects Plan Review path plus the residential building permit, so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". The line-item arithmetic is in the calculation note on this page. " +
      AUSTIN_DECK_FLAT.replace(/\.$/, ""),
  );
}

export type AustinDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  typicalExact: string;
  includedMid: string;
  permitSentence: string;
  howCalculated: string;
  electricFaq: string;
  exemptFaq: string;
};

/**
 * On-page Austin deck copy from the Small Projects Plan Review row.
 * Assumption and why stay short and point at the calculation note for the
 * three-line arithmetic. Null unless the recorded $529.11 flat fee is present.
 */
export function austinDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AustinDeckPageCopy | null {
  if (!austinDeckFacts(city, permit)) return null;
  const assumption = austinDeckAssumption(permit);
  const path = austinDeckPathParagraph(city, permit);
  if (!assumption || !path) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const electric = moneyExact(AUSTIN_DECK_ELECTRIC_USD);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded typical is the Small Projects Plan Review path plus the residential building permit of " +
      typical +
      ". Typical 16\u00d720 uncovered decks are attached and over 200 sq ft, so they are not on the work-exempt list (item 10).",
    includedClause:
      "That " +
      typical +
      " is the Small Projects Plan Review path plus the residential building permit. The line-item arithmetic is in the calculation note on this page. The electric fee of " +
      electric +
      " is not in that typical unless the deck adds lighting or outlets.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is Small Projects Plan Review plus the residential building permit at " +
      typical +
      ". The line-item arithmetic is in the calculation note on this page. " +
      AUSTIN_DECK_FLAT +
      " The electric fee of " +
      electric +
      " is not in the typical unless the deck adds lighting or outlets. A typical attached 16\u00d720 deck is not on the work-exempt list. Verify the Small Projects Plan Review path with " +
      city.permitDeptName +
      ".",
    typicalExact: typical,
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Small Projects Plan Review path",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Small Projects Plan Review path is included in the all-in.",
    howCalculated: (permit.calculationNote || "").trim(),
    electricFaq:
      AUSTIN_DECK_ELECTRIC_LINE +
      " is " +
      electric +
      ". It is recorded but is not added unless the deck adds lighting or outlets, and it is not in the typical " +
      typical +
      ".",
    exemptFaq:
      "Typical 16\u00d720 uncovered decks are attached and over 200 sq ft, so they are not on the work-exempt list (item 10 is \u2264200 sq ft, \u226430 in above grade, not attached, not in a flood hazard). The recorded path is Small Projects Plan Review plus the building permit at " +
      typical +
      ". Published dollars do not change with the recorded " +
      moneyExact(8000) +
      " / " +
      moneyExact(12000) +
      " / " +
      moneyExact(19200) +
      " valuation bands.",
  };
}

/**
 * Austin deck money page: Small Projects Plan Review typical vs optional electric.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function austinDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "austin-tx" || project.projectSlug !== "deck") return null;
  const path = austinDeckPathParagraph(city, permit);
  const electric = austinDeckElectricParagraph(city, permit);
  const context = austinDeckContextParagraph(city, project, permit);
  if (!path || !electric || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(path, electric, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
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

const PHOENIX_ROOF_PLAN_SPLIT =
  "building permit portion $323 + plan review $323 (100% of the permit fee) = $646";

const PHOENIX_HVAC_PLAN_USD = 279;
const PHOENIX_HVAC_PLAN_SPLIT =
  "building permit portion $279 + plan review $279 (100% of the permit fee) = $558";

const PHOENIX_KITCHEN_PLAN_USD = 553;
const PHOENIX_KITCHEN_PLAN_SPLIT =
  "building permit portion $553 + plan review $553 (100% of the permit fee) = $1,106";

const PHOENIX_DECK_PLAN_USD = 323;
const PHOENIX_DECK_PLAN_SPLIT =
  "building permit portion $323 + plan review $323 (100% of the permit fee) = $646";

/**
 * Phoenix roof: Ordinance G-7465 Table A. Plan review is 100% of the building
 * permit fee when valuation is over $5,000 (minimum $195, residential ≤$50k)
 * and is included in the recorded totals. The typical split is plan review
 * $323 plus an equal building portion, which matches the recorded $646.
 * Low and high stay totals only. Returns false if those anchors drift.
 */
function phoenixRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "phoenix-az" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(558)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(646)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(846)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (
    permit.sourceUrl !==
    "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf"
  ) {
    return false;
  }
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) {
    return false;
  }
  if (!/\(PDD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "")) return false;
  if (cents(plan.feeUsd ?? NaN) !== cents(323)) return false;
  if (cents(plan.feeUsd as number) + cents(plan.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }
  const planNote = plan.note || "";
  if (!/Residential ≤\$50k/.test(planNote)) return false;
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;

  const caveat = permit.caveat || "";
  if (!/bundles trades into one building permit/.test(caveat)) return false;
  if (!/Plan review included when valuation > \$5,000/.test(caveat)) return false;
  if (!/100% of permit/.test(caveat) || !/min \$195/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PHOENIX_ROOF_PLAN_SPLIT)) return false;
  if (!/minimum \$195/.test(note) || !/valuation > \$5,000/.test(note)) return false;
  if (!/included in the totals/i.test(note)) return false;
  if (!note.includes("Low $8,000 = $558 total") || !note.includes("high $22,000 = $846 total")) return false;
  if (!/bundles trades into one building permit/.test(note)) return false;
  return true;
}

function phoenixRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Ordinance G-7465 Table A at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function phoenixRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixRoofFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function phoenixRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!phoenixRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This roof row uses recorded Table A valuation, with plan review included in the totals";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function phoenixRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Ordinance G-7465 Table A at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with plan review included. Low and high totals are in the calculation note on this page",
  );
}

export type PhoenixRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Phoenix roof copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table A anchors and the verified $646 split
 * are both present.
 */
export function phoenixRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PhoenixRoofPageCopy | null {
  if (!phoenixRoofFacts(city, permit)) return null;
  const assumption = phoenixRoofAssumption(permit);
  const fee = phoenixRoofFeeParagraph(city, permit);
  const plan = phoenixRoofPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Ordinance G-7465 Table A, and plan review is included in the typical fee when valuation is over $5,000.",
    includedClause:
      "That " +
      typical +
      " includes plan review. Phoenix bundles trades into one building permit.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with plan review included. Low and high totals are in the calculation note on this page. Verify the Table A path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table A totals are " +
      moneyExact(permit.feeLowUsd as number) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd as number) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded plan review is " +
      moneyExact(323) +
      ", and because that review is 100% of the permit fee the building portion is the same " +
      moneyExact(323) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465) is included in the all-in.",
  };
}

/**
 * Phoenix roof money page: Table A valuation with plan review included.
 * Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function phoenixRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "roof-replacement") return null;
  const fee = phoenixRoofFeeParagraph(city, permit);
  const plan = phoenixRoofPlanParagraph(city, permit);
  const context = phoenixRoofContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

/**
 * Phoenix HVAC: Ordinance G-7465 Table A. Plan review is 100% of the building
 * permit fee when valuation is over $5,000 (minimum $195, residential ≤$50k)
 * and is included in the recorded typical. The typical split is plan review
 * $279 plus an equal building portion, which matches the recorded $558.
 * The $5,000 low band is the boundary where that plan-review rule does not
 * add a separate recorded dollar. Low and high stay totals only.
 * Returns false if those anchors drift.
 */
function phoenixHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "phoenix-az" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(243)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(558)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(726)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (
    permit.sourceUrl !==
    "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf"
  ) {
    return false;
  }
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) {
    return false;
  }
  if (!/\(PDD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 5000 || assumed.typical !== 7500 || assumed.high !== 16000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "")) return false;
  if (cents(plan.feeUsd ?? NaN) !== cents(PHOENIX_HVAC_PLAN_USD)) return false;
  if (cents(plan.feeUsd as number) + cents(plan.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }
  const planNote = plan.note || "";
  if (!/Residential ≤\$50k/.test(planNote)) return false;
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;

  const caveat = permit.caveat || "";
  if (!/Same Table A as other building work/.test(caveat)) return false;
  if (!/no separate mechanical permit/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PHOENIX_HVAC_PLAN_SPLIT)) return false;
  if (!/minimum \$195/.test(note) || !/valuation > \$5,000/.test(note)) return false;
  if (!/included in the totals/i.test(note)) return false;
  if (!note.includes("Low $5,000 = $243 total") || !note.includes("high $16,000 = $726 total")) return false;
  if (!/no separate plan-review dollar/.test(note)) return false;
  if (!/no separate mechanical permit/.test(note)) return false;
  return true;
}

function phoenixHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixHvacFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Ordinance G-7465 Table A at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Plan review is included in that typical when valuation is over $5,000";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function phoenixHvacPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixHvacFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function phoenixHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!phoenixHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This HVAC row uses recorded Table A valuation, with plan review included in the typical total";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function phoenixHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Ordinance G-7465 Table A at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with plan review included. Low and high totals are in the calculation note on this page",
  );
}

export type PhoenixHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Phoenix HVAC copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table A anchors and the verified $558 split
 * are both present.
 */
export function phoenixHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PhoenixHvacPageCopy | null {
  if (!phoenixHvacFacts(city, permit)) return null;
  const assumption = phoenixHvacAssumption(permit);
  const fee = phoenixHvacFeeParagraph(city, permit);
  const plan = phoenixHvacPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Ordinance G-7465 Table A, and plan review is included in the typical fee when valuation is over $5,000.",
    includedClause:
      "That " +
      typical +
      " includes plan review. No separate mechanical permit is recorded in the PDD schedule for a standard replacement.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with plan review included. Low and high totals are in the calculation note on this page. Verify the Table A path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table A totals are " +
      moneyExact(permit.feeLowUsd as number) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd as number) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded plan review is " +
      moneyExact(PHOENIX_HVAC_PLAN_USD) +
      ", and because that review is 100% of the permit fee the building portion is the same " +
      moneyExact(PHOENIX_HVAC_PLAN_USD) +
      ". Plan review applies when valuation is over $5,000, so the " +
      moneyExact(assumed.low) +
      " low total has no separate plan-review dollar. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465) is included in the all-in.",
  };
}

/**
 * Phoenix HVAC money page: Table A valuation with plan review in the typical.
 * Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function phoenixHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "hvac-replacement") return null;
  const fee = phoenixHvacFeeParagraph(city, permit);
  const plan = phoenixHvacPlanParagraph(city, permit);
  const context = phoenixHvacContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

/**
 * Phoenix kitchen: Ordinance G-7465 Table A. Plan review is 100% of the building
 * permit fee when valuation is over $5,000 (minimum $195, residential ≤$50k)
 * and is included in the recorded typical. The typical split is plan review
 * $553 plus an equal building portion, which matches the recorded $1,106.
 * The $75,000 high band is above $50k, so it stays the recorded $1,670.40 total
 * with no separate plan-review percentage. Low stays a total only.
 * Returns false if those anchors drift.
 */
function phoenixKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "phoenix-az" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(706)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(1106)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(1670.4)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (
    permit.sourceUrl !==
    "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf"
  ) {
    return false;
  }
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) {
    return false;
  }
  if (!/\(PDD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "")) return false;
  if (cents(plan.feeUsd ?? NaN) !== cents(PHOENIX_KITCHEN_PLAN_USD)) return false;
  if (cents(plan.feeUsd as number) + cents(plan.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }
  const planNote = plan.note || "";
  if (!/Residential ≤\$50k/.test(planNote)) return false;
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;

  const caveat = permit.caveat || "";
  if (!/Remodel existing building uses Table A/.test(caveat)) return false;
  if (!/Same-layout cosmetic work may not need a permit/.test(caveat)) return false;
  if (!/moving walls\/MEP does/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PHOENIX_KITCHEN_PLAN_SPLIT)) return false;
  if (!/Residential ≤\$50k: plan review is 100% of the permit fee, minimum \$195, when valuation > \$5,000/.test(note)) {
    return false;
  }
  if (!/included in the totals/i.test(note)) return false;
  if (!note.includes("Low $15,000 = $706 total") || !note.includes("high $75,000 = $1,670.40 total")) {
    return false;
  }
  if (!/Remodel existing building uses Table A/.test(note)) return false;
  if (!/Same-layout cosmetic work may not need a permit/.test(note)) return false;
  if (!/moving walls\/MEP does/.test(note)) return false;
  return true;
}

function phoenixKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixKitchenFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for kitchen remodel in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Ordinance G-7465 Table A at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Plan review is included in that typical when valuation is over $5,000";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function phoenixKitchenPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixKitchenFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function phoenixKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!phoenixKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This kitchen row uses recorded Table A valuation, with plan review included in the typical total";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function phoenixKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Ordinance G-7465 Table A at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with plan review included. Low and high totals are in the calculation note on this page",
  );
}

export type PhoenixKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Phoenix kitchen copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table A anchors and the verified $1,106 split
 * are both present. The $75,000 high band stays the recorded total.
 */
export function phoenixKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PhoenixKitchenPageCopy | null {
  if (!phoenixKitchenFacts(city, permit)) return null;
  const assumption = phoenixKitchenAssumption(permit);
  const fee = phoenixKitchenFeeParagraph(city, permit);
  const plan = phoenixKitchenPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  const high = moneyExact(permit.feeHighUsd as number);
  return {
    assumption,
    requiredClause:
      "The recorded path is Ordinance G-7465 Table A, and plan review is included in the typical fee when valuation is over $5,000.",
    includedClause:
      "That " +
      typical +
      " includes plan review. Remodel existing building uses Table A.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with plan review included. Low and high totals are in the calculation note on this page. Verify the Table A path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table A totals are " +
      moneyExact(permit.feeLowUsd as number) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      high +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded plan review is " +
      moneyExact(PHOENIX_KITCHEN_PLAN_USD) +
      ", and because that review is 100% of the permit fee the building portion is the same " +
      moneyExact(PHOENIX_KITCHEN_PLAN_USD) +
      ". That 100% rule is the residential ≤$50k plan review (minimum $195, when valuation > $5,000) and covers the typical band. The high total is the recorded " +
      high +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465) is included in the all-in.",
  };
}

/**
 * Phoenix kitchen money page: Table A valuation with plan review in the typical.
 * Band arithmetic stays in the calculation note. The high band is a recorded total.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function phoenixKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "kitchen-remodel") return null;
  const fee = phoenixKitchenFeeParagraph(city, permit);
  const plan = phoenixKitchenPlanParagraph(city, permit);
  const context = phoenixKitchenContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

/**
 * Phoenix deck: Ordinance G-7465 Table A. Plan review is 100% of the building
 * permit fee when valuation is over $5,000 (minimum $195, residential ≤$50k)
 * and is included in the recorded totals. The typical split is plan review
 * $323 plus an equal building portion, which matches the recorded $646.
 * Low and high stay totals only. The $19,200 high band is the recorded $806
 * total, with no separate plan-review dollar beyond the typical $323 extra.
 * Returns false if those anchors drift.
 */
function phoenixDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "phoenix-az" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(558)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(646)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(806)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (
    permit.sourceUrl !==
    "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf"
  ) {
    return false;
  }
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) {
    return false;
  }
  if (!/\(PDD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "")) return false;
  if (cents(plan.feeUsd ?? NaN) !== cents(PHOENIX_DECK_PLAN_USD)) return false;
  if (cents(plan.feeUsd as number) + cents(plan.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }
  const planNote = plan.note || "";
  if (!/Residential ≤\$50k/.test(planNote)) return false;
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;

  const caveat = permit.caveat || "";
  if (!/Valuation-based Table A/.test(caveat)) return false;
  if (!/Unroofed patios are excluded from sf valuation rules/.test(caveat)) return false;
  if (!/a deck still needs a permit based on project valuation/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PHOENIX_DECK_PLAN_SPLIT)) return false;
  if (!/Residential ≤\$50k: plan review is 100% of the permit fee, minimum \$195, when valuation > \$5,000/.test(note)) {
    return false;
  }
  if (!/included in the totals/i.test(note)) return false;
  if (!note.includes("Low $8,000 = $558 total") || !note.includes("high $19,200 = $806 total")) return false;
  if (!/Valuation-based Table A/.test(note)) return false;
  if (!/Unroofed patios are excluded from sf valuation rules/.test(note)) return false;
  if (!/a deck still needs a permit based on project valuation/.test(note)) return false;
  return true;
}

function phoenixDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixDeckFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for a deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Ordinance G-7465 Table A at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function phoenixDeckPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!phoenixDeckFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function phoenixDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!phoenixDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s += ". This deck row uses recorded Table A valuation, with plan review included in the totals";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function phoenixDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Ordinance G-7465 Table A at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with plan review included. Low and high totals are in the calculation note on this page",
  );
}

export type PhoenixDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Phoenix deck copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table A anchors and the verified $646 split
 * are both present. The $19,200 high band stays the recorded $806 total.
 */
export function phoenixDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PhoenixDeckPageCopy | null {
  if (!phoenixDeckFacts(city, permit)) return null;
  const assumption = phoenixDeckAssumption(permit);
  const fee = phoenixDeckFeeParagraph(city, permit);
  const plan = phoenixDeckPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  const high = moneyExact(permit.feeHighUsd as number);
  return {
    assumption,
    requiredClause:
      "The recorded path is Ordinance G-7465 Table A, and plan review is included in the typical fee when valuation is over $5,000.",
    includedClause:
      "That " +
      typical +
      " includes plan review. A deck still needs a permit based on project valuation.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with plan review included. Low and high totals are in the calculation note on this page. Verify the Table A path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table A totals are " +
      moneyExact(permit.feeLowUsd as number) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      high +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded plan review is " +
      moneyExact(PHOENIX_DECK_PLAN_USD) +
      ", and because that review is 100% of the permit fee the building portion is the same " +
      moneyExact(PHOENIX_DECK_PLAN_USD) +
      ". The high total is the recorded " +
      high +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table A (Ordinance G-7465) is included in the all-in.",
  };
}

/**
 * Phoenix deck money page: Table A valuation with plan review in the typical.
 * Band arithmetic stays in the calculation note. The high band is a recorded total.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function phoenixDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "deck") return null;
  const fee = phoenixDeckFeeParagraph(city, permit);
  const plan = phoenixDeckPlanParagraph(city, permit);
  const context = phoenixDeckContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const TUCSON_ROOF_LOW_USD = 245.69;
const TUCSON_ROOF_TYPICAL_USD = 337.49;
const TUCSON_ROOF_HIGH_USD = 566.99;
const TUCSON_ROOF_TABLE_USD = 318.95;
const TUCSON_ROOF_DIGITAL_USD = 18.54;
const TUCSON_ROOF_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";
const TUCSON_ROOF_TABLE_NAME = "4-02.4 Construction Valuation Table";
const TUCSON_ROOF_DIGITAL_NAME = "Digital filing 1%, min $18.54";
const TUCSON_ROOF_SPLIT =
  "valuation-table portion $318.95 + digital filing $18.54 = $337.49";
const TUCSON_ROOF_BAND =
  "Band $2,000.01\u2013$25,000: base $89.45 + $22.95 per extra $1,000 of valuation above $2,000, plus digital filing 1% minimum $18.54.";
const TUCSON_ROOF_CAVEAT =
  "City of Tucson PDSD, not unincorporated Pima County. Alterations use contract valuation on Table 4-02.4. Level-1 5%-of-building-valuation path is not used because a contract value is assumed.";

/**
 * Tucson roof: FY27 Table 4-02.4 contract valuation plus digital filing.
 * Typical split is the recorded valuation-table portion $318.95 plus digital
 * filing $18.54, which matches the recorded $337.49. Low and high stay totals
 * only. Returns false if those anchors drift.
 */
function tucsonRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "tucson-az" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(TUCSON_ROOF_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(TUCSON_ROOF_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(TUCSON_ROOF_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== TUCSON_ROOF_SOURCE_URL) return false;
  if (
    permit.sourceName !==
    "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026"
  ) {
    return false;
  }
  if (!/\(PDSD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras.find((e) => (e.name || "") === TUCSON_ROOF_TABLE_NAME);
  const digital = extras.find((e) => (e.name || "") === TUCSON_ROOF_DIGITAL_NAME);
  if (!table || cents(table.feeUsd ?? NaN) !== cents(TUCSON_ROOF_TABLE_USD)) return false;
  if (!digital || cents(digital.feeUsd ?? NaN) !== cents(TUCSON_ROOF_DIGITAL_USD)) return false;
  if ((table.note || "") !== "Included." || (digital.note || "") !== "Included.") return false;
  if (cents(table.feeUsd as number) + cents(digital.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  if ((permit.caveat || "") !== TUCSON_ROOF_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes(TUCSON_ROOF_BAND)) return false;
  if (!note.includes(TUCSON_ROOF_SPLIT)) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $22,000 = $566.99 total")) {
    return false;
  }
  if (!/not unincorporated Pima County/.test(note)) return false;
  if (!/contract valuation on Table 4-02\.4/.test(note)) return false;
  if (!/Level-1 5%-of-building-valuation path is not used/.test(note)) return false;
  return true;
}

function tucsonRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Table 4-02.4 at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function tucsonRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonRoofFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function tucsonRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!tucsonRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This roof row uses recorded Table 4-02.4 contract valuation, with the valuation-table portion and digital filing included in the totals";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function tucsonRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Table 4-02.4 at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the valuation-table portion and digital filing included. Low and high totals are in the calculation note on this page",
  );
}

export type TucsonRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Tucson roof copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table 4-02.4 anchors and the verified
 * $318.95 + $18.54 split are both present.
 */
export function tucsonRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): TucsonRoofPageCopy | null {
  if (!tucsonRoofFacts(city, permit)) return null;
  const assumption = tucsonRoofAssumption(permit);
  const fee = tucsonRoofFeeParagraph(city, permit);
  const plan = tucsonRoofPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Table 4-02.4 contract valuation, and the valuation-table portion plus digital filing are included in the typical fee.",
    includedClause:
      "That " +
      typical +
      " includes the recorded " +
      TUCSON_ROOF_TABLE_NAME +
      " line and digital filing.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with the valuation-table portion and digital filing included. Low and high totals are in the calculation note on this page. Verify the Table 4-02.4 path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table 4-02.4 totals are " +
      moneyExact(permit.feeLowUsd as number) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd as number) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded " +
      TUCSON_ROOF_TABLE_NAME +
      " line is " +
      moneyExact(TUCSON_ROOF_TABLE_USD) +
      " and digital filing is " +
      moneyExact(TUCSON_ROOF_DIGITAL_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4 is included in the all-in.",
    typicalExact: typical,
    rangeExact:
      moneyExact(permit.feeLowUsd as number) + " – " + moneyExact(permit.feeHighUsd as number),
  };
}

/**
 * Tucson roof money page: Table 4-02.4 valuation with digital filing included.
 * Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function tucsonRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "tucson-az" || project.projectSlug !== "roof-replacement") return null;
  const fee = tucsonRoofFeeParagraph(city, permit);
  const plan = tucsonRoofPlanParagraph(city, permit);
  const context = tucsonRoofContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const TUCSON_HVAC_LOW_USD = 168.54;
const TUCSON_HVAC_TYPICAL_USD = 218.54;
const TUCSON_HVAC_HIGH_USD = 218.54;
const TUCSON_HVAC_FIRST_USD = 150;
const TUCSON_HVAC_ADDITIONAL_USD = 50;
const TUCSON_HVAC_DIGITAL_USD = 18.54;
const TUCSON_HVAC_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";
const TUCSON_HVAC_SOURCE_NAME =
  "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026 — 4-02.9 Trade Permits";
const TUCSON_HVAC_FIRST_NAME = "Trade permit first item (AC/heater replace, max 2)";
const TUCSON_HVAC_ADDITIONAL_NAME = "Each additional trade item";
const TUCSON_HVAC_DIGITAL_NAME = "Digital filing 1%, min $18.54";
const TUCSON_HVAC_CAVEAT =
  "HVAC change-out is a listed trade (F. Air Conditioner/Heater Repair/Replace, max 2), not the valuation table.";
const TUCSON_HVAC_LOW_SPLIT =
  "Low (1 item): first trade item $150 + digital filing min $18.54 = $168.54.";
const TUCSON_HVAC_TYPICAL_SPLIT =
  "Typical furnace + 3-ton (2 items): first trade item $150 + each additional trade item $50 + digital filing $18.54 = $218.54.";
const TUCSON_HVAC_HIGH_SPLIT =
  "High equals typical on this row ($218.54) because max 2 items is already the typical band.";

/**
 * Tucson HVAC: FY27 4-02.9 Trade Permits, listed trade F (max 2), plus digital
 * filing. Not the valuation table. Low is one item ($150 + $18.54). Typical
 * and high are the same two-item total ($150 + $50 + $18.54) because max 2
 * is already the typical band. assumedValuationUsd stays null.
 * Returns false if those anchors drift.
 */
function tucsonHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "tucson-az" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(TUCSON_HVAC_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(TUCSON_HVAC_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(TUCSON_HVAC_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd !== null) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== TUCSON_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== TUCSON_HVAC_SOURCE_NAME) return false;
  if (!/\(PDSD\)/.test(city.permitDeptName || "")) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const first = extras.find((e) => (e.name || "") === TUCSON_HVAC_FIRST_NAME);
  const additional = extras.find((e) => (e.name || "") === TUCSON_HVAC_ADDITIONAL_NAME);
  const digital = extras.find((e) => (e.name || "") === TUCSON_HVAC_DIGITAL_NAME);
  if (!first || cents(first.feeUsd ?? NaN) !== cents(TUCSON_HVAC_FIRST_USD)) return false;
  if (!additional || cents(additional.feeUsd ?? NaN) !== cents(TUCSON_HVAC_ADDITIONAL_USD)) return false;
  if (!digital || cents(digital.feeUsd ?? NaN) !== cents(TUCSON_HVAC_DIGITAL_USD)) return false;
  if ((first.note || "") !== "Included.") return false;
  if ((additional.note || "") !== "Second unit in typical. Included.") return false;
  if ((digital.note || "") !== "Included.") return false;
  if (cents(first.feeUsd as number) + cents(digital.feeUsd as number) !== cents(permit.feeLowUsd as number)) {
    return false;
  }
  if (
    cents(first.feeUsd as number) + cents(additional.feeUsd as number) + cents(digital.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }

  if ((permit.caveat || "") !== TUCSON_HVAC_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!/4-02\.9 Trade Permits/.test(note) || !note.includes("2026-09-01")) return false;
  if (!/F\. Air Conditioner\/Heater Repair\/Replace \(max 2\)/.test(note)) return false;
  if (!/not the valuation table/.test(note)) return false;
  if (!note.includes(TUCSON_HVAC_LOW_SPLIT)) return false;
  if (!note.includes(TUCSON_HVAC_TYPICAL_SPLIT)) return false;
  if (!note.includes(TUCSON_HVAC_HIGH_SPLIT)) return false;
  if (!/City of Tucson PDSD path/.test(note) || !/trade table not valuation/.test(note)) return false;
  return true;
}

function tucsonHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonHvacFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on 4-02.9 Trade Permits for a furnace plus 3-ton change-out (2 items)";
  s += ". High equals that typical because max 2 items is already the typical band";
  s += ". The 1-item low total is in the calculation note on this page";
  return asSentence(s);
}

function tucsonHvacPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonHvacFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function tucsonHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!tucsonHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This HVAC row uses recorded 4-02.9 Trade Permits (listed trade F, max 2), not the valuation table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function tucsonHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed 4-02.9 Trade Permits for a furnace plus 3-ton change-out (2 items, the listed max), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the first trade item, the additional item, and digital filing included. Low and high totals are in the calculation note on this page",
  );
}

export type TucsonHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Tucson HVAC copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * trade-item arithmetic. Null unless 4-02.9 anchors and the verified
 * $150 + $50 + $18.54 split are present. Not a valuation path.
 */
export function tucsonHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): TucsonHvacPageCopy | null {
  if (!tucsonHvacFacts(city, permit)) return null;
  const assumption = tucsonHvacAssumption(permit);
  const fee = tucsonHvacFeeParagraph(city, permit);
  const plan = tucsonHvacPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  if (permit.typicalProjectValueUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is 4-02.9 Trade Permits, listed trade F. Air Conditioner/Heater Repair/Replace (max 2), not the valuation table.",
    includedClause:
      "That " +
      typical +
      " includes the recorded first trade item, the additional trade item, and digital filing.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is " +
      typical +
      " for a furnace plus 3-ton change-out (2 items) on 4-02.9 Trade Permits, with the first trade item, the additional item, and digital filing included. High equals that typical because max 2 items is already the typical band. The 1-item low total is in the calculation note on this page. Verify the trade-permit path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded 4-02.9 totals are low 1 item " +
      moneyExact(permit.feeLowUsd) +
      " and typical 2 items " +
      typical +
      ". High equals typical (" +
      moneyExact(permit.feeHighUsd) +
      ") because max 2 items is already the typical band. At the typical band the recorded lines are first trade item " +
      moneyExact(TUCSON_HVAC_FIRST_USD) +
      ", each additional trade item " +
      moneyExact(TUCSON_HVAC_ADDITIONAL_USD) +
      ", and digital filing " +
      moneyExact(TUCSON_HVAC_DIGITAL_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "The recorded typical project value is " +
      moneyExact(permit.typicalProjectValueUsd) +
      ". That figure is the recorded typical job value, not a schedule valuation formula, and no assumed valuation is on this row. Permit totals for the 4-02.9 trade path are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on 4-02.9 Trade Permits",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on 4-02.9 Trade Permits is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Tucson HVAC money page: 4-02.9 trade permits, not valuation.
 * Item arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function tucsonHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "tucson-az" || project.projectSlug !== "hvac-replacement") return null;
  const fee = tucsonHvacFeeParagraph(city, permit);
  const plan = tucsonHvacPlanParagraph(city, permit);
  const context = tucsonHvacContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const TUCSON_KITCHEN_LOW_USD = 406.34;
const TUCSON_KITCHEN_TYPICAL_USD = 804.14;
const TUCSON_KITCHEN_HIGH_USD = 1297.59;
const TUCSON_KITCHEN_TABLE_USD = 785.6;
const TUCSON_KITCHEN_DIGITAL_USD = 18.54;
const TUCSON_KITCHEN_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";
const TUCSON_KITCHEN_SOURCE_NAME =
  "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026";
const TUCSON_KITCHEN_TABLE_NAME = "4-02.4 Construction Valuation Table";
const TUCSON_KITCHEN_DIGITAL_NAME = "Digital filing 1%, min $18.54";
const TUCSON_KITCHEN_TRADE_NAME = "Trade permits (plumbing fixture / electrical circuit)";
const TUCSON_KITCHEN_TRADE_NOTE =
  "$150 first + $50 each additional if filed separately. Not added to the building total.";
const TUCSON_KITCHEN_CAVEAT =
  "Level-2 reconfiguration would use 15% of standard building valuation if no contract is provided. Dataset uses assumed contract valuation on Table 4-02.4.";
const TUCSON_KITCHEN_BAND_LOW =
  "Band $2,000.01\u2013$25,000: base $89.45 + $22.95 per extra $1,000 of valuation above $2,000, plus digital filing 1% of the total fee, minimum $18.54.";
const TUCSON_KITCHEN_BAND_MID =
  "Band $25,000.01\u2013$50,000: base $617.30 + $16.83 per extra $1,000 of valuation above $25,000, plus digital filing 1% of the total fee, minimum $18.54.";
const TUCSON_KITCHEN_BAND_HIGH =
  "Band $50,000.01\u2013$100,000: base $1,038.05 + $9.64 per extra $1,000 of valuation above $50,000, plus digital filing 1% of the total fee, minimum $18.54.";
const TUCSON_KITCHEN_SPLIT =
  "Typical $35,000: valuation-table portion $785.60 + digital filing $18.54 = $804.14.";

/**
 * Tucson kitchen: FY27 Table 4-02.4 contract valuation plus digital filing.
 * Typical split is the recorded valuation-table portion $785.60 plus digital
 * filing $18.54, which matches the recorded $804.14. Low and high stay totals
 * only. Trade permits stay unpriced (feeUsd null) and are not in the building
 * total. Returns false if those anchors drift.
 */
function tucsonKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "tucson-az" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(TUCSON_KITCHEN_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(TUCSON_KITCHEN_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(TUCSON_KITCHEN_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== TUCSON_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== TUCSON_KITCHEN_SOURCE_NAME) return false;
  if (!/\(PDSD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const table = extras.find((e) => (e.name || "") === TUCSON_KITCHEN_TABLE_NAME);
  const digital = extras.find((e) => (e.name || "") === TUCSON_KITCHEN_DIGITAL_NAME);
  const trade = extras.find((e) => (e.name || "") === TUCSON_KITCHEN_TRADE_NAME);
  if (!table || cents(table.feeUsd ?? NaN) !== cents(TUCSON_KITCHEN_TABLE_USD)) return false;
  if (!digital || cents(digital.feeUsd ?? NaN) !== cents(TUCSON_KITCHEN_DIGITAL_USD)) return false;
  if (!trade || trade.feeUsd != null) return false;
  if ((table.note || "") !== "Included." || (digital.note || "") !== "Included.") return false;
  if ((trade.note || "") !== TUCSON_KITCHEN_TRADE_NOTE) return false;
  if (cents(table.feeUsd as number) + cents(digital.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  if ((permit.caveat || "") !== TUCSON_KITCHEN_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes(TUCSON_KITCHEN_BAND_LOW)) return false;
  if (!note.includes(TUCSON_KITCHEN_BAND_MID)) return false;
  if (!note.includes(TUCSON_KITCHEN_BAND_HIGH)) return false;
  if (!note.includes(TUCSON_KITCHEN_SPLIT)) return false;
  if (!note.includes("Low $15,000 = $406.34 total") || !note.includes("high $75,000 = $1,297.59 total")) {
    return false;
  }
  if (!/Trade permits \(plumbing fixture \/ electrical circuit\) are separate/.test(note)) return false;
  if (!/not added to the building total/.test(note)) return false;
  if (!/not unincorporated Pima County/.test(note)) return false;
  if (!/assumed contract valuation on Table 4-02\.4/.test(note)) return false;
  if (!/Level-2 15%-of-standard-building-valuation path is not used/.test(note)) return false;
  return true;
}

function tucsonKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonKitchenFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for kitchen remodel in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Table 4-02.4 at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function tucsonKitchenPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonKitchenFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function tucsonKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!tucsonKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This kitchen row uses recorded Table 4-02.4 contract valuation, with the valuation-table portion and digital filing included in the totals. Trade permits are separate and are not in the building total";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function tucsonKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed Table 4-02.4 at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the valuation-table portion and digital filing included. Trade permits are separate and are not in that total. Low and high totals are in the calculation note on this page",
  );
}

export type TucsonKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Tucson kitchen copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table 4-02.4 anchors and the verified
 * $785.60 + $18.54 split are both present. Trade permits stay unpriced.
 */
export function tucsonKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): TucsonKitchenPageCopy | null {
  if (!tucsonKitchenFacts(city, permit)) return null;
  const assumption = tucsonKitchenAssumption(permit);
  const fee = tucsonKitchenFeeParagraph(city, permit);
  const plan = tucsonKitchenPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Table 4-02.4 contract valuation, and the valuation-table portion plus digital filing are included in the typical fee. Trade permits (plumbing fixture / electrical circuit) are separate and are not in that total.",
    includedClause:
      "That " +
      typical +
      " includes the recorded " +
      TUCSON_KITCHEN_TABLE_NAME +
      " line and digital filing. Trade permits are separate and are not in that total.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with the valuation-table portion and digital filing included. Trade permits are separate and are not in that total. Low and high totals are in the calculation note on this page. Verify the Table 4-02.4 path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table 4-02.4 totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded " +
      TUCSON_KITCHEN_TABLE_NAME +
      " line is " +
      moneyExact(TUCSON_KITCHEN_TABLE_USD) +
      " and digital filing is " +
      moneyExact(TUCSON_KITCHEN_DIGITAL_USD) +
      ". Trade permits are separate and are not in that total. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4 (trade permits are not in that total)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4 is included in the all-in. Trade permits are not in that total.",
    typicalExact: typical,
    rangeExact:
      moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Tucson kitchen money page: Table 4-02.4 valuation with digital filing included.
 * Trade permits stay out of the building total. Band arithmetic stays in the
 * calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function tucsonKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "tucson-az" || project.projectSlug !== "kitchen-remodel") return null;
  const fee = tucsonKitchenFeeParagraph(city, permit);
  const plan = tucsonKitchenPlanParagraph(city, permit);
  const context = tucsonKitchenContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const TUCSON_DECK_LOW_USD = 245.69;
const TUCSON_DECK_TYPICAL_USD = 337.49;
const TUCSON_DECK_HIGH_USD = 521.09;
const TUCSON_DECK_TABLE_USD = 318.95;
const TUCSON_DECK_DIGITAL_USD = 18.54;
const TUCSON_DECK_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";
const TUCSON_DECK_SOURCE_NAME =
  "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026";
const TUCSON_DECK_TABLE_NAME = "4-02.4 Construction Valuation Table";
const TUCSON_DECK_DIGITAL_NAME = "Digital filing 1%, min $18.54";
const TUCSON_DECK_SPLIT =
  "valuation-table portion $318.95 + digital filing $18.54 = $337.49";
const TUCSON_DECK_BAND =
  "Band $2,000.01\u2013$25,000: base $89.45 + $22.95 per extra $1,000 of valuation above $2,000, plus digital filing 1% minimum $18.54.";
const TUCSON_DECK_CAVEAT =
  "New decks use the new-construction valuation table at the assumed job value. Shade-structure line points to the same building-permit table.";

/**
 * Tucson deck: FY27 Table 4-02.4 new-construction valuation plus digital filing.
 * Typical split is the recorded valuation-table portion $318.95 plus digital
 * filing $18.54, which matches the recorded $337.49. Low and high stay totals
 * only. The shade-structure line points at the same table and is not a new fee.
 * Returns false if those anchors drift.
 */
function tucsonDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "tucson-az" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(TUCSON_DECK_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(TUCSON_DECK_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(TUCSON_DECK_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== TUCSON_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== TUCSON_DECK_SOURCE_NAME) return false;
  if (!/\(PDSD\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras.find((e) => (e.name || "") === TUCSON_DECK_TABLE_NAME);
  const digital = extras.find((e) => (e.name || "") === TUCSON_DECK_DIGITAL_NAME);
  if (!table || cents(table.feeUsd ?? NaN) !== cents(TUCSON_DECK_TABLE_USD)) return false;
  if (!digital || cents(digital.feeUsd ?? NaN) !== cents(TUCSON_DECK_DIGITAL_USD)) return false;
  if ((table.note || "") !== "Included." || (digital.note || "") !== "Included.") return false;
  if (cents(table.feeUsd as number) + cents(digital.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  if ((permit.caveat || "") !== TUCSON_DECK_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes(TUCSON_DECK_BAND)) return false;
  if (!note.includes(TUCSON_DECK_SPLIT)) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $19,200 = $521.09 total")) {
    return false;
  }
  if (!/not unincorporated Pima County/.test(note)) return false;
  if (!/new-construction valuation table at the assumed job value/.test(note)) return false;
  if (!/Shade-structure line points to the same building-permit table/.test(note)) return false;
  return true;
}

function tucsonDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonDeckFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for a deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on Table 4-02.4 at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function tucsonDeckPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!tucsonDeckFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function tucsonDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!tucsonDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This deck row uses the recorded new-construction valuation table at the assumed job value, with the valuation-table portion and digital filing included in the totals. The shade-structure line points to the same building-permit table";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function tucsonDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the new-construction valuation table (Table 4-02.4) at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the valuation-table portion and digital filing included. The shade-structure line points to the same building-permit table. Low and high totals are in the calculation note on this page",
  );
}

export type TucsonDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Tucson deck copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless Table 4-02.4 anchors and the verified
 * $318.95 + $18.54 split are both present.
 */
export function tucsonDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): TucsonDeckPageCopy | null {
  if (!tucsonDeckFacts(city, permit)) return null;
  const assumption = tucsonDeckAssumption(permit);
  const fee = tucsonDeckFeeParagraph(city, permit);
  const plan = tucsonDeckPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is the new-construction valuation table (Table 4-02.4) at the assumed job value, and the valuation-table portion plus digital filing are included in the typical fee. The shade-structure line points to the same building-permit table.",
    includedClause:
      "That " +
      typical +
      " includes the recorded " +
      TUCSON_DECK_TABLE_NAME +
      " line and digital filing.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation, with the valuation-table portion and digital filing included. Low and high totals are in the calculation note on this page. Verify the Table 4-02.4 path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table 4-02.4 totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded " +
      TUCSON_DECK_TABLE_NAME +
      " line is " +
      moneyExact(TUCSON_DECK_TABLE_USD) +
      " and digital filing is " +
      moneyExact(TUCSON_DECK_DIGITAL_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table 4-02.4 is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Tucson deck money page: Table 4-02.4 new-construction valuation with digital
 * filing included. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function tucsonDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "tucson-az" || project.projectSlug !== "deck") return null;
  const fee = tucsonDeckFeeParagraph(city, permit);
  const plan = tucsonDeckPlanParagraph(city, permit);
  const context = tucsonDeckContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const SEATTLE_HVAC_LOW_USD = 63.37;
const SEATTLE_HVAC_TYPICAL_USD = 126.73;
const SEATTLE_HVAC_HIGH_USD = 190.1;
const SEATTLE_HVAC_EQUIPMENT_USD = 120.7;
const SEATTLE_HVAC_TECH_USD = 6.04;

/**
 * Seattle HVAC: SDCI Table D-8 mechanical equipment fee for a like-for-like
 * furnace/heat-pump change-out, plus the 5% technology fee. Not valuation DFI.
 * Returns false if the recorded anchors drift, so we do not invent a path.
 */
function seattleHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "seattle-wa" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(SEATTLE_HVAC_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(SEATTLE_HVAC_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(SEATTLE_HVAC_HIGH_USD)) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  const source = permit.sourceName || "";
  if (!/SDCI/.test(source) || !/Table D-8/.test(source) || !/22\.900D\.090/.test(source)) return false;

  const extras = permit.extras || [];
  const equipment = extras.find((e) => /Mechanical equipment fee \(Table D-8\)/i.test(e.name || ""));
  const tech = extras.find((e) => /Technology fee \(5%\)/i.test(e.name || ""));
  if (!equipment || cents(equipment.feeUsd ?? NaN) !== cents(SEATTLE_HVAC_EQUIPMENT_USD)) return false;
  if (!tech || cents(tech.feeUsd ?? NaN) !== cents(SEATTLE_HVAC_TECH_USD)) return false;

  const caveat = permit.caveat || "";
  if (!/Table D-8/.test(caveat) || !/22\.900D\.090/.test(caveat)) return false;
  if (!/not the valuation DFI/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Table D-8/.test(note) || !/22\.900D\.090/.test(note)) return false;
  if (!/SMC 22\.900A\.100/.test(note)) return false;
  if (!/Typical 2 units/.test(note) || !/Low 1 unit/.test(note) || !/High 3 units/.test(note)) return false;
  if (!note.includes("$63.37") || !note.includes("$126.73") || !note.includes("$190.10")) return false;
  if (!/Table D-14/.test(note) || !/Table D-2/.test(note)) return false;
  return true;
}

function seattleHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!seattleHvacFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the Table D-8 mechanical equipment fee for a typical 2-unit like-for-like furnace/heat-pump change-out plus the 5% technology fee (SMC 22.900A.100)";
  s += ". That path is not the valuation DFI";
  s += ". Low and high unit-count bands are in the calculation note on this page";
  return asSentence(s);
}

function seattleHvacAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!seattleHvacFacts(city, permit)) return null;
  return asSentence(
    "Alternate paths not used in the recorded totals, including a separate electrical permit and new duct systems on Table D-2 valuation, are in the calculation note on this page",
  );
}

function seattleHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!seattleHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This HVAC row uses the Table D-8 mechanical equipment fee plus the 5% technology fee, not valuation DFI";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function seattleHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed Seattle SDCI 2026 Fee Subtitle Table D-8 mechanical equipment fees for a typical 2-unit like-for-like furnace/heat-pump change-out plus the 5% technology fee (SMC 22.900A.100), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Low and high unit-count bands are in the calculation note on this page",
  );
}

export type SeattleHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Seattle HVAC copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the Table D-8 arithmetic. Null unless the recorded D-8 anchors match.
 */
export function seattleHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): SeattleHvacPageCopy | null {
  if (!seattleHvacFacts(city, permit)) return null;
  const assumption = seattleHvacAssumption(permit);
  const fee = seattleHvacFeeParagraph(city, permit);
  const alternate = seattleHvacAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const recordedValue =
    permit.typicalProjectValueUsd != null
      ? "The recorded typical project value is " + moneyExact(permit.typicalProjectValueUsd) + ". "
      : "";
  return {
    assumption,
    requiredClause:
      "The recorded path is Seattle SDCI Table D-8 (22.900D.090) mechanical equipment fees plus the 5% technology fee (SMC 22.900A.100), not valuation DFI.",
    includedClause:
      "That fee is the Table D-8 mechanical equipment charge for a typical 2-unit change-out plus the 5% technology fee. Separate electrical and new-duct Table D-2 paths are not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is " +
      typical +
      " for a 2-unit like-for-like furnace/heat-pump change-out on Table D-8 plus the 5% technology fee, not valuation DFI. Low and high unit-count bands and alternate paths are in the calculation note on this page. Verify the mechanical path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded Table D-8 bands are low 1 unit " +
      moneyExact(permit.feeLowUsd as number) +
      ", typical 2 units " +
      typical +
      ", and high 3 units " +
      moneyExact(permit.feeHighUsd as number) +
      ", each including the 5% technology fee (SMC 22.900A.100). Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      recordedValue +
      "This permit fee is the Table D-8 unit-count path, not a valuation (DFI) total. Low, typical, and high unit totals are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table D-8 (22.900D.090)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on Table D-8 (22.900D.090) is included in the all-in.",
  };
}

/**
 * Seattle HVAC money page: Table D-8 equipment fee plus technology fee.
 * Band arithmetic and alternate paths stay in the calculation note.
 * Returns null outside that row so other Seattle pages keep the generic blurb.
 */
function seattleHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "seattle-wa" || project.projectSlug !== "hvac-replacement") return null;
  const fee = seattleHvacFeeParagraph(city, permit);
  const alternate = seattleHvacAlternateParagraph(city, permit);
  const context = seattleHvacContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

/**
 * Crawlable "why costs differ here" blurb for shipped impression-cluster money URLs.
 * Grounded in on-file city, BLS wage, and permit-row fields only.
 */
const PORTLAND_ROOF_SOURCE_URL =
  "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download";

const PORTLAND_ROOF_SPLIT =
  "Typical $12,000: building permit $91.69 + Oregon 12% state surcharge $11.00 = $102.69";

/**
 * Portland roof: July 10, 2026 PP&D building-permit line plus the Oregon 12%
 * state surcharge. Plan review / development services is recorded with feeUsd
 * null and is not in the totals. Returns false if those anchors drift.
 */
function portlandRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "portland-or" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(81.68)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(102.69)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(155.22)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== PORTLAND_ROOF_SOURCE_URL) return false;
  if (
    permit.sourceName !==
    "City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026"
  ) {
    return false;
  }
  if (!/\(PP&D\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "")) return false;
  if (cents(building.feeUsd ?? NaN) !== cents(91.69)) return false;
  if (!/July 10, 2026 Building and Other Permits Fee Schedule/.test(building.note || "")) return false;
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "")) return false;
  if (cents(surcharge.feeUsd ?? NaN) !== cents(11)) return false;
  if (!/Charged on the building permit fee/.test(surcharge.note || "")) return false;
  if (!/^Plan review \/ development services$/.test(plan.name || "")) return false;
  if (plan.feeUsd != null) return false;
  if (!/not extracted/i.test(plan.note || "") || !/Real total is higher/i.test(plan.note || "")) return false;
  if (cents(building.feeUsd as number) + cents(surcharge.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Building-permit line \+ 12% Oregon surcharge only/.test(caveat)) return false;
  if (!/plan review/i.test(caveat) || !/not fully extracted/i.test(caveat)) return false;
  if (!/real totals are higher/i.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026/.test(note)) {
    return false;
  }
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PORTLAND_ROOF_SPLIT)) return false;
  if (!note.includes("Low $8,000 = $81.68 total") || !note.includes("high $22,000 = $155.22 total")) {
    return false;
  }
  if (!/building-permit line plus the 12% Oregon surcharge only/i.test(note)) return false;
  if (!/plan review/i.test(note) || !/not fully extracted/i.test(note)) return false;
  if (!/real totals are higher/i.test(note)) return false;
  return true;
}

function portlandRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026, at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function portlandRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandRoofFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function portlandRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!portlandRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This roof row uses the recorded building-permit line plus the 12% Oregon surcharge only. Plan review and other development-services fees were not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function portlandRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded building-permit line plus the 12% Oregon surcharge at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Plan review was not extracted, so real totals are higher. Low and high totals are in the calculation note on this page",
  );
}

export type PortlandRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Portland roof copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless the recorded building-permit plus 12% surcharge
 * anchors are present and plan review stays unpriced.
 */
export function portlandRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PortlandRoofPageCopy | null {
  if (!portlandRoofFacts(city, permit)) return null;
  const assumption = portlandRoofAssumption(permit);
  const fee = portlandRoofFeeParagraph(city, permit);
  const plan = portlandRoofPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const building = (permit.extras || [])[0];
  const surcharge = (permit.extras || [])[1];
  if (building?.feeUsd == null || surcharge?.feeUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is the building-permit line plus the 12% Oregon surcharge. Plan review and other development-services fees on the same schedule were not extracted, so real totals are higher.",
    includedClause:
      "That " +
      typical +
      " is the building-permit line plus the 12% Oregon surcharge only. Plan review was not extracted.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: building permit plus the 12% Oregon surcharge. Plan review was not extracted, so real totals are higher. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are building permit " +
      moneyExact(building.feeUsd) +
      " plus the Oregon 12% state surcharge " +
      moneyExact(surcharge.feeUsd) +
      ". Plan review was not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only)",
    permitSentence:
      "The recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Portland roof money page: building-permit line plus 12% Oregon surcharge.
 * Plan review was not extracted. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function portlandRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "portland-or" || project.projectSlug !== "roof-replacement") return null;
  const fee = portlandRoofFeeParagraph(city, permit);
  const plan = portlandRoofPlanParagraph(city, permit);
  const context = portlandRoofContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const PORTLAND_KITCHEN_SOURCE_URL =
  "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download";

const PORTLAND_KITCHEN_SPLIT =
  "Typical $35,000: building permit $187.56 + Oregon 12% state surcharge $22.51 = $210.07";

/**
 * Portland kitchen: July 10, 2026 PP&D building-permit line plus the Oregon 12%
 * state surcharge. Plan review / development services is recorded with feeUsd
 * null and is not in the totals. Separate plumbing, electrical, and mechanical
 * schedules are not in the totals. Returns false if those anchors drift.
 */
function portlandKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "portland-or" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(118.45)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(210.07)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(334.22)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== PORTLAND_KITCHEN_SOURCE_URL) return false;
  if (
    permit.sourceName !==
    "City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026"
  ) {
    return false;
  }
  if (!/\(PP&D\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "")) return false;
  if (cents(building.feeUsd ?? NaN) !== cents(187.56)) return false;
  if (!/July 10, 2026 Building and Other Permits Fee Schedule/.test(building.note || "")) return false;
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "")) return false;
  if (cents(surcharge.feeUsd ?? NaN) !== cents(22.51)) return false;
  if (!/Charged on the building permit fee/.test(surcharge.note || "")) return false;
  if (!/^Plan review \/ development services$/.test(plan.name || "")) return false;
  if (plan.feeUsd != null) return false;
  if (!/not extracted/i.test(plan.note || "") || !/Real total is higher/i.test(plan.note || "")) return false;
  if (cents(building.feeUsd as number) + cents(surcharge.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Building-permit line \+ 12% surcharge/.test(caveat)) return false;
  if (!/plumbing\/electrical\/mechanical schedules apply/i.test(caveat)) return false;
  if (!/not in this total/i.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026/.test(note)) {
    return false;
  }
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PORTLAND_KITCHEN_SPLIT)) return false;
  if (!note.includes("Low $15,000 = $118.45 total") || !note.includes("high $75,000 = $334.22 total")) {
    return false;
  }
  if (!/building-permit line plus the 12% Oregon surcharge only/i.test(note)) return false;
  if (!/plan review/i.test(note) || !/not fully extracted/i.test(note)) return false;
  if (!/real totals are higher/i.test(note)) return false;
  if (!/plumbing, electrical, and mechanical schedules are not in this total/i.test(note)) return false;
  return true;
}

function portlandKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandKitchenFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for kitchen remodel in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026, at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function portlandKitchenPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandKitchenFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function portlandKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!portlandKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This kitchen row uses the recorded building-permit line plus the 12% Oregon surcharge only. Plan review and other development-services fees were not extracted, and separate plumbing, electrical, and mechanical schedules are not in this total";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function portlandKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded building-permit line plus the 12% Oregon surcharge at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Plan review was not extracted, so real totals are higher. Low and high totals are in the calculation note on this page",
  );
}

export type PortlandKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Portland kitchen copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless the recorded building-permit plus 12% surcharge
 * anchors are present and plan review stays unpriced.
 */
export function portlandKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PortlandKitchenPageCopy | null {
  if (!portlandKitchenFacts(city, permit)) return null;
  const assumption = portlandKitchenAssumption(permit);
  const fee = portlandKitchenFeeParagraph(city, permit);
  const plan = portlandKitchenPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const building = (permit.extras || [])[0];
  const surcharge = (permit.extras || [])[1];
  if (building?.feeUsd == null || surcharge?.feeUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is the building-permit line plus the 12% Oregon surcharge. Plan review and other development-services fees on the same schedule were not extracted, so real totals are higher. Separate plumbing, electrical, and mechanical schedules are not in this total.",
    includedClause:
      "That " +
      typical +
      " is the building-permit line plus the 12% Oregon surcharge only. Plan review was not extracted. Separate plumbing, electrical, and mechanical schedules are not in this total.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: building permit plus the 12% Oregon surcharge. Plan review was not extracted, so real totals are higher. Separate plumbing, electrical, and mechanical schedules are not in this total. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are building permit " +
      moneyExact(building.feeUsd) +
      " plus the Oregon 12% state surcharge " +
      moneyExact(surcharge.feeUsd) +
      ". Plan review was not extracted. Separate plumbing, electrical, and mechanical schedules are not in this total. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only)",
    permitSentence:
      "The recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Portland kitchen money page: building-permit line plus 12% Oregon surcharge.
 * Plan review was not extracted. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function portlandKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "portland-or" || project.projectSlug !== "kitchen-remodel") return null;
  const fee = portlandKitchenFeeParagraph(city, permit);
  const plan = portlandKitchenPlanParagraph(city, permit);
  const context = portlandKitchenContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const PORTLAND_DECK_SOURCE_URL =
  "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download";

const PORTLAND_DECK_SPLIT =
  "Typical $12,000: building permit $91.69 + Oregon 12% state surcharge $11.00 = $102.69";

/**
 * Portland deck: July 10, 2026 PP&D building-permit line plus the Oregon 12%
 * state surcharge. Plan review / development services is recorded with feeUsd
 * null and is not in the totals. Returns false if those anchors drift.
 */
function portlandDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "portland-or" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(81.68)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(102.69)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(144.72)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== PORTLAND_DECK_SOURCE_URL) return false;
  if (
    permit.sourceName !==
    "City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026"
  ) {
    return false;
  }
  if (!/\(PP&D\)/.test(city.permitDeptName || "")) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "")) return false;
  if (cents(building.feeUsd ?? NaN) !== cents(91.69)) return false;
  if (!/July 10, 2026 Building and Other Permits Fee Schedule/.test(building.note || "")) return false;
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "")) return false;
  if (cents(surcharge.feeUsd ?? NaN) !== cents(11)) return false;
  if (!/Charged on the building permit fee/.test(surcharge.note || "")) return false;
  if (!/^Plan review \/ development services$/.test(plan.name || "")) return false;
  if (plan.feeUsd != null) return false;
  if (!/not extracted/i.test(plan.note || "") || !/Real total is higher/i.test(plan.note || "")) return false;
  if (cents(building.feeUsd as number) + cents(surcharge.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Building-permit line \+ 12% Oregon surcharge only/.test(caveat)) return false;
  if (!/plan review/i.test(caveat) || !/not fully extracted/i.test(caveat)) return false;
  if (!/real totals are higher/i.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026/.test(note)) {
    return false;
  }
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes(PORTLAND_DECK_SPLIT)) return false;
  if (!note.includes("Low $8,000 = $81.68 total") || !note.includes("high $19,200 = $144.72 total")) {
    return false;
  }
  if (!/building-permit line plus the 12% Oregon surcharge only/i.test(note)) return false;
  if (!/plan review/i.test(note) || !/not fully extracted/i.test(note)) return false;
  if (!/real totals are higher/i.test(note)) return false;
  return true;
}

function portlandDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandDeckFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for a deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026, at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function portlandDeckPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!portlandDeckFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function portlandDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!portlandDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This deck row uses the recorded building-permit line plus the 12% Oregon surcharge only. Plan review and other development-services fees were not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function portlandDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded building-permit line plus the 12% Oregon surcharge at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Plan review was not extracted, so real totals are higher. Low and high totals are in the calculation note on this page",
  );
}

export type PortlandDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Portland deck copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless the recorded building-permit plus 12% surcharge
 * anchors are present and plan review stays unpriced.
 */
export function portlandDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PortlandDeckPageCopy | null {
  if (!portlandDeckFacts(city, permit)) return null;
  const assumption = portlandDeckAssumption(permit);
  const fee = portlandDeckFeeParagraph(city, permit);
  const plan = portlandDeckPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const building = (permit.extras || [])[0];
  const surcharge = (permit.extras || [])[1];
  if (building?.feeUsd == null || surcharge?.feeUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is the building-permit line plus the 12% Oregon surcharge. Plan review and other development-services fees on the same schedule were not extracted, so real totals are higher.",
    includedClause:
      "That " +
      typical +
      " is the building-permit line plus the 12% Oregon surcharge only. Plan review was not extracted.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: building permit plus the 12% Oregon surcharge. Plan review was not extracted, so real totals are higher. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are building permit " +
      moneyExact(building.feeUsd) +
      " plus the Oregon 12% state surcharge " +
      moneyExact(surcharge.feeUsd) +
      ". Plan review was not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only)",
    permitSentence:
      "The recorded PP&D permit fee of " +
      typical +
      " (building permit plus the 12% Oregon surcharge only) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Portland deck money page: building-permit line plus 12% Oregon surcharge.
 * Plan review was not extracted. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other cluster pages keep their own blurbs.
 */
function portlandDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "portland-or" || project.projectSlug !== "deck") return null;
  const fee = portlandDeckFeeParagraph(city, permit);
  const plan = portlandDeckPlanParagraph(city, permit);
  const context = portlandDeckContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const CHARLOTTE_HVAC_LOW_USD = 62.7;
const CHARLOTTE_HVAC_TYPICAL_USD = 92.55;
const CHARLOTTE_HVAC_HIGH_USD = 162.22;
const CHARLOTTE_HVAC_TIP_USD = 89.55;
const CHARLOTTE_HVAC_TECH_USD = 3;

/**
 * Charlotte HVAC: LUESA Section II.D.1 TIP two-trade change-out plus the
 * Section II.A Note f technology charge. Not a valuation total.
 * Returns false if the recorded anchors drift, so we do not invent a path.
 */
function charlotteHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "charlotte-nc" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(CHARLOTTE_HVAC_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(CHARLOTTE_HVAC_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(CHARLOTTE_HVAC_HIGH_USD)) return false;
  if (permit.retrievedDate !== "2026-08-29") return false;
  const source = permit.sourceName || "";
  if (!/LUESA/.test(source) || !/Section II\.D\.1/.test(source) || !/Section II\.A Note f/.test(source)) {
    return false;
  }

  const extras = permit.extras || [];
  const tip = extras.find((e) => /TIP appliance\/equipment change-out/i.test(e.name || ""));
  const tech = extras.find((e) => /^Technology charge$/i.test(e.name || ""));
  const single = extras.find((e) => /Single-trade mechanical/i.test(e.name || ""));
  const nonTip = extras.find((e) => /Non-TIP path/i.test(e.name || ""));
  if (!tip || cents(tip.feeUsd ?? NaN) !== cents(CHARLOTTE_HVAC_TIP_USD)) return false;
  if (!tech || cents(tech.feeUsd ?? NaN) !== cents(CHARLOTTE_HVAC_TECH_USD)) return false;
  if (!single || single.feeUsd != null) return false;
  if (!nonTip || nonTip.feeUsd != null) return false;

  const caveat = permit.caveat || "";
  if (!/Section II\.D\.1/.test(caveat) || !/Section II\.A Note f/.test(caveat)) return false;
  if (!/typical TIP two-trade/i.test(caveat)) return false;
  if (!/160D-1110\(c\)\(3\)/.test(caveat)) return false;
  if (!caveat.includes("$62.70") || !caveat.includes("$92.55") || !caveat.includes("$162.22")) return false;

  const note = permit.calculationNote || "";
  if (!/Typical TIP two-trade change-out/.test(note)) return false;
  if (!/Section II\.D\.1/.test(note) || !/Note f/.test(note)) return false;
  if (!/1\.5 × \$59\.70/.test(note)) return false;
  if (!/Low single-trade/.test(note) || !/High non-TIP/.test(note)) return false;
  if (!/2 × \$79\.61/.test(note)) return false;
  if (!/Alternate path not used in the recorded typical/.test(note)) return false;
  if (!/160D-1110\(c\)\(3\)/.test(note)) return false;
  if (!note.includes("$92.55") || !note.includes("$62.70") || !note.includes("$162.22")) return false;
  return true;
}

function charlotteHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!charlotteHvacFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the LUESA Section II.D.1 TIP two-trade change-out plus the Section II.A Note f technology charge";
  s += ". Low and high bands are in the calculation note on this page";
  return asSentence(s);
}

function charlotteHvacAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!charlotteHvacFacts(city, permit)) return null;
  return asSentence(
    "Alternate paths not used in the recorded typical, including the low single-trade mechanical filing and the high non-TIP path when TIP is ineligible, are in the calculation note on this page",
  );
}

function charlotteHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!charlotteHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This HVAC row uses the Section II.D.1 TIP two-trade change-out plus the Section II.A Note f technology charge";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function charlotteHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed a typical TIP two-trade change-out under Mecklenburg County LUESA Fee Ordinance Section II.D.1 plus the Section II.A Note f technology charge, so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Low, high, and alternate non-TIP paths are in the calculation note on this page",
  );
}

export type CharlotteHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Charlotte HVAC copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the TIP arithmetic. Null unless the recorded LUESA/TIP anchors match.
 */
export function charlotteHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): CharlotteHvacPageCopy | null {
  if (!charlotteHvacFacts(city, permit)) return null;
  const assumption = charlotteHvacAssumption(permit);
  const fee = charlotteHvacFeeParagraph(city, permit);
  const alternate = charlotteHvacAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const recordedValue =
    permit.typicalProjectValueUsd != null
      ? "The recorded typical project value is " + moneyExact(permit.typicalProjectValueUsd) + ". "
      : "";
  return {
    assumption,
    requiredClause:
      "The recorded path is the LUESA Section II.D.1 TIP two-trade change-out plus the Section II.A Note f technology charge. Replacement of heating/AC equipment requires a permit even under $40,000 (N.C.G.S. 160D-1110(c)(3)).",
    includedClause:
      "That fee is the TIP two-trade change-out plus the technology charge. The low single-trade path and the high non-TIP path are not included in the typical.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is " +
      typical +
      " for a TIP two-trade change-out under LUESA Section II.D.1 plus the Section II.A Note f technology charge. Low, high, and alternate non-TIP paths are in the calculation note on this page. Verify the TIP path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded LUESA bands are low single-trade " +
      moneyExact(permit.feeLowUsd as number) +
      ", typical TIP two-trade " +
      typical +
      ", and high non-TIP " +
      moneyExact(permit.feeHighUsd as number) +
      ", each including the Section II.A Note f technology charge. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      recordedValue +
      "This permit fee is the LUESA Section II.D.1 TIP path, not a valuation total. Low, typical, and high totals are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Section II.D.1 TIP two-trade change-out",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Section II.D.1 TIP two-trade change-out is included in the all-in.",
  };
}

/**
 * Charlotte HVAC money page: TIP two-trade change-out plus the technology charge.
 * Band arithmetic and the non-TIP alternate stay in the calculation note.
 * Returns null outside that row so other Charlotte pages keep their own blurbs.
 */
function charlotteHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "charlotte-nc" || project.projectSlug !== "hvac-replacement") return null;
  const fee = charlotteHvacFeeParagraph(city, permit);
  const alternate = charlotteHvacAlternateParagraph(city, permit);
  const context = charlotteHvacContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const CHARLOTTE_KITCHEN_LOW_USD = 175.22;
const CHARLOTTE_KITCHEN_TYPICAL_USD = 257.83;
const CHARLOTTE_KITCHEN_HIGH_USD = 340.44;
const CHARLOTTE_KITCHEN_TRADE_USD = 79.61;
const CHARLOTTE_KITCHEN_TRADE_STACK_USD = 238.83;
const CHARLOTTE_KITCHEN_TECH_PER_PERMIT_USD = 3;
const CHARLOTTE_KITCHEN_TECH_USD = 9;
const CHARLOTTE_KITCHEN_RECOVERY_USD = 10;
const CHARLOTTE_KITCHEN_TYPICAL_VALUE_USD = 35000;
const CHARLOTTE_KITCHEN_ASSUMED_LOW_USD = 15000;
const CHARLOTTE_KITCHEN_ASSUMED_HIGH_USD = 75000;
const CHARLOTTE_KITCHEN_SOURCE_URL = "https://mecknc.widen.net/s/grxjph7rtx/luesa-fee-ordinance";
const CHARLOTTE_KITCHEN_SOURCE_NAME =
  "Mecklenburg County LUESA Fee Ordinance (revised July 1, 2026), Section II.A Note a and Note f";
const CHARLOTTE_KITCHEN_TRADE_NAME = "Renovation/upfit per-trade fee (Note a)";
const CHARLOTTE_KITCHEN_PER_SF_NAME = "Per-square-foot room charge (Note a)";
const CHARLOTTE_KITCHEN_TECH_NAME = "Technology charge ($3 per permit)";
const CHARLOTTE_KITCHEN_RECOVERY_NAME = "Homeowner Recovery Fund";
const CHARLOTTE_KITCHEN_CABINET_NAME =
  "Same-layout cabinet-only exemption (N.C.G.S. 160D-1110(c))";
const CHARLOTTE_KITCHEN_LDIRL_NAME = "City of Charlotte LDIRL (zoning / stormwater / inspection)";
const CHARLOTTE_KITCHEN_DEPT =
  "Mecklenburg County Code Enforcement (LUESA) — issues City of Charlotte building/trade permits";
const CHARLOTTE_KITCHEN_ANCHOR_ERROR =
  "Charlotte kitchen fee anchors drifted: expected feeLowUsd 175.22, feeTypicalUsd 257.83, feeHighUsd 340.44, Note a per-trade $238.83, technology $9, Homeowner Recovery Fund $10, per-sf and cabinet-only and LDIRL null.";

/**
 * Charlotte kitchen: LUESA Section II.A Note a renovation/upfit trade bands
 * under $100,000, plus Note f technology and the Section II.D.13 Homeowner
 * Recovery Fund. Low is 2 trades, typical is 3 (B+E+P), high is 4 (BEMP).
 * The Note a per-sf room charge, cabinet-only exemption, and City LDIRL stay
 * null. Returns false if those anchors drift, so we do not invent a path.
 */
function charlotteKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "charlotte-nc" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== CHARLOTTE_KITCHEN_TYPICAL_VALUE_USD) return false;
  const assumed = permit.assumedValuationUsd;
  if (
    !assumed ||
    assumed.low !== CHARLOTTE_KITCHEN_ASSUMED_LOW_USD ||
    assumed.typical !== CHARLOTTE_KITCHEN_TYPICAL_VALUE_USD ||
    assumed.high !== CHARLOTTE_KITCHEN_ASSUMED_HIGH_USD
  ) {
    return false;
  }
  if (permit.retrievedDate !== "2026-08-29") return false;
  if (permit.sourceUrl !== CHARLOTTE_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== CHARLOTTE_KITCHEN_SOURCE_NAME) return false;
  if (city.permitDeptName !== CHARLOTTE_KITCHEN_DEPT) return false;

  const tradeCents = cents(CHARLOTTE_KITCHEN_TRADE_USD);
  const techPerPermitCents = cents(CHARLOTTE_KITCHEN_TECH_PER_PERMIT_USD);
  const recoveryCents = cents(CHARLOTTE_KITCHEN_RECOVERY_USD);
  if (cents(CHARLOTTE_KITCHEN_TRADE_STACK_USD) !== tradeCents * 3) return false;
  if (cents(CHARLOTTE_KITCHEN_TECH_USD) !== techPerPermitCents * 3) return false;
  if (cents(permit.feeLowUsd as number) !== tradeCents * 2 + techPerPermitCents * 2 + recoveryCents) {
    return false;
  }
  if (
    cents(permit.feeTypicalUsd as number) !==
    tradeCents * 3 + techPerPermitCents * 3 + recoveryCents
  ) {
    return false;
  }
  if (cents(permit.feeHighUsd as number) !== tradeCents * 4 + techPerPermitCents * 4 + recoveryCents) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 6) return false;
  const trade = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_TRADE_NAME);
  const perSf = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_PER_SF_NAME);
  const tech = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_TECH_NAME);
  const recovery = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_RECOVERY_NAME);
  const cabinet = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_CABINET_NAME);
  const ldirl = extras.find((e) => (e.name || "") === CHARLOTTE_KITCHEN_LDIRL_NAME);
  if (!trade || cents(trade.feeUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_TRADE_STACK_USD)) return false;
  if (!perSf || perSf.feeUsd != null) return false;
  if (!tech || cents(tech.feeUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_TECH_USD)) return false;
  if (!recovery || cents(recovery.feeUsd ?? NaN) !== cents(CHARLOTTE_KITCHEN_RECOVERY_USD)) return false;
  if (!cabinet || cabinet.feeUsd != null) return false;
  if (!ldirl || ldirl.feeUsd != null) return false;

  const caveat = permit.caveat || "";
  if (!/Section II\.A Note a and Note f/.test(caveat)) return false;
  if (!/Section II\.D\.13/.test(caveat)) return false;
  if (!/low 2 trades/.test(caveat) || !/typical 3 trades/.test(caveat) || !/high 4 trades/.test(caveat)) {
    return false;
  }
  if (!caveat.includes("$175.22") || !caveat.includes("$257.83") || !caveat.includes("$340.44")) {
    return false;
  }
  if (!/\$0\.12\/\$0\.08/.test(caveat)) return false;
  if (!/160D-1110\(c\)/.test(caveat)) return false;
  if (!/not on the City LDIRL project list/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Typical renovation\/upfit under \$100,000 \(3 trades B\+E\+P\)/.test(note)) return false;
  if (!/3 × \$79\.61/.test(note) || !/2 × \$79\.61/.test(note) || !/4 × \$79\.61/.test(note)) return false;
  if (!/Note f 3 × \$3 tech/.test(note)) return false;
  if (!/Homeowner Recovery Fund/.test(note)) return false;
  if (!note.includes("$175.22") || !note.includes("$257.83") || !note.includes("$340.44")) return false;
  if (!/\$0\.12\/\$0\.08 per-sf-of-room/.test(note)) return false;
  if (!/feeUsd null/.test(note)) return false;
  if (!/same-layout cabinet-only/.test(note)) return false;
  if (!/160D-1110\(c\)/.test(note)) return false;
  if (!/not on the City LDIRL project list/.test(note)) return false;
  return true;
}

/**
 * Fail the build when this row is Charlotte kitchen but the recorded anchors moved.
 * Other cities and projects return without throwing.
 */
function assertCharlotteKitchenAnchors(
  city: City,
  permit: Permit | null | undefined,
  projectSlug?: string,
): void {
  const slug = permit?.projectSlug ?? projectSlug;
  if (city.slug !== "charlotte-nc" || slug !== "kitchen-remodel") return;
  if (!charlotteKitchenFacts(city, permit)) {
    throw new Error(CHARLOTTE_KITCHEN_ANCHOR_ERROR);
  }
}

function charlotteKitchenBands(permit: Permit): string {
  return (
    "low " +
    moneyExact(permit.feeLowUsd as number) +
    ", typical " +
    moneyExact(permit.feeTypicalUsd as number) +
    ", and high " +
    moneyExact(permit.feeHighUsd as number)
  );
}

function charlotteKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!charlotteKitchenFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  return asSentence(
    "The recorded typical permit fee for kitchen remodel in " +
      cityLabel(city) +
      " is " +
      moneyExact(permit.feeTypicalUsd) +
      ", the LUESA Section II.A Note a 3-trade renovation/upfit plus the Note f technology charge and the Homeowner Recovery Fund. Recorded trade bands are " +
      charlotteKitchenBands(permit) +
      ". Band arithmetic is in the calculation note on this page",
  );
}

function charlotteKitchenAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!charlotteKitchenFacts(city, permit)) return null;
  return asSentence(
    "The Note a per-square-foot room charge is not included because kitchen square footage is not recorded. The same-layout cabinet-only exemption and City of Charlotte LDIRL are not used in the recorded totals. Those alternates are in the calculation note on this page",
  );
}

function charlotteKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!charlotteKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This kitchen row uses the Section II.A Note a trade bands plus Note f and the Homeowner Recovery Fund. The per-trade walk stays in the calculation note on this page";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function charlotteKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  return asSentence(
    "For the permit line we assumed a typical 3-trade renovation/upfit (building, electrical, and plumbing) under Mecklenburg County LUESA Fee Ordinance Section II.A Note a, plus the Note f technology charge and the Homeowner Recovery Fund, so recorded trade bands are " +
      charlotteKitchenBands(permit) +
      ". The per-trade walk, the Note a per-square-foot charge that is not in these totals, and the cabinet-only alternate are in the calculation note on this page",
  );
}

export type CharlotteKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
};

/**
 * On-page Charlotte kitchen copy from the permit row.
 * Assumption, why, and how-calculated stay short, name the recorded trade-band
 * fees, and point at the calculation note. Null unless the recorded LUESA
 * anchors match. Throws on this row when those anchors drift so the static
 * build fails instead of pasting the note wall.
 */
export function charlotteKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): CharlotteKitchenPageCopy | null {
  assertCharlotteKitchenAnchors(city, permit);
  if (!charlotteKitchenFacts(city, permit)) return null;
  const assumption = charlotteKitchenAssumption(permit);
  const fee = charlotteKitchenFeeParagraph(city, permit);
  const alternate = charlotteKitchenAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) {
    throw new Error(CHARLOTTE_KITCHEN_ANCHOR_ERROR);
  }
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const bands = charlotteKitchenBands(permit);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  const recordedValue =
    permit.typicalProjectValueUsd != null
      ? "The recorded typical project value is " + moneyExact(permit.typicalProjectValueUsd) + ". "
      : "";
  const assumedBits =
    assumed &&
    typeof assumed.low === "number" &&
    typeof assumed.typical === "number" &&
    typeof assumed.high === "number"
      ? "Recorded assumed values are low " +
        moneyExact(assumed.low) +
        ", typical " +
        moneyExact(assumed.typical) +
        ", and high " +
        moneyExact(assumed.high) +
        ". "
      : "";
  return {
    assumption,
    requiredClause:
      "The recorded path is the LUESA Section II.A Note a trade-band fee. Recorded bands are " +
      bands +
      ".",
    includedClause:
      "That fee is the recorded 3-trade Note a stack plus the technology charge and the Homeowner Recovery Fund. The Note a per-square-foot charge, the cabinet-only exemption, and City LDIRL are not included in the typical.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (tiered). Recorded trade bands are " +
      bands +
      ". Band arithmetic, the Note a per-square-foot charge that is not in these totals, and the cabinet-only alternate are in the calculation note on this page. Verify the trade count with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded LUESA trade bands are " +
      bands +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      recordedValue +
      assumedBits +
      "This permit fee is the LUESA Section II.A Note a trade-band path, not a valuation total. Recorded fees are " +
      bands +
      ". The walk is in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Section II.A Note a 3-trade band",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the Section II.A Note a 3-trade band is included in the all-in.",
    typicalExact: typical,
  };
}

/**
 * Charlotte kitchen money page: Note a trade bands plus tech and recovery.
 * The per-trade walk, null per-sf add-on, cabinet-only exemption, and LDIRL
 * stay in the calculation note. Returns null outside that row so other
 * Charlotte pages keep their own blurbs. Throws when this row's fee anchors drift.
 */
function charlotteKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "charlotte-nc" || project.projectSlug !== "kitchen-remodel") return null;
  assertCharlotteKitchenAnchors(city, permit, project.projectSlug);
  const fee = charlotteKitchenFeeParagraph(city, permit);
  const alternate = charlotteKitchenAlternateParagraph(city, permit);
  const context = charlotteKitchenContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) {
    throw new Error(CHARLOTTE_KITCHEN_ANCHOR_ERROR);
  }

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const NASHVILLE_ROOF_LOW_USD = 69;
const NASHVILLE_ROOF_TYPICAL_USD = 91;
const NASHVILLE_ROOF_HIGH_USD = 146;
const NASHVILLE_ROOF_BUILDING_USD = 60;
const NASHVILLE_ROOF_TECH_USD = 6;
const NASHVILLE_ROOF_ZONING_USD = 25;
const NASHVILLE_ROOF_SOURCE_URL =
  "https://www.nashville.gov/sites/default/files/2025-12/Building-Permit-Fee-Scheudle-2025.pdf";
const NASHVILLE_ROOF_SOURCE_NAME = "Metro Nashville Codes Fee Schedule (16.28.110), Dec 2025 PDF";
const NASHVILLE_ROOF_BUILDING_NAME = "Building valuation fee ($5 / $1,000)";
const NASHVILLE_ROOF_TECH_NAME = "Codes tech fee (10% of valuation fee)";
const NASHVILLE_ROOF_ZONING_NAME = "Zoning examination";
const NASHVILLE_ROOF_PLAN_NAME = "Plan review (1-2 family reroof)";
const NASHVILLE_ROOF_BUILDING_NOTE =
  "Included at the $12,000 typical valuation ($60). Low $8,000 building fee $40; high $22,000 building fee $110. Per 16.28.110 A.1 for 1-2 family / townhouses.";
const NASHVILLE_ROOF_TECH_NOTE =
  "Included. Typical $6 (10% of $60); low $4 (10% of $40); high $11 (10% of $110).";
const NASHVILLE_ROOF_ZONING_NOTE = "Included flat $25 at low / typical / high.";
const NASHVILLE_ROOF_PLAN_NOTE =
  "Not included in totals. Plan review is exempt for 1-2 family reroof per Metro Nashville Codes Fee Schedule / recorded caveat.";
const NASHVILLE_ROOF_CAVEAT =
  "1-2 family reroof: $5/$1,000 building valuation + 10% codes tech + $25 zoning (plan review exempt; not included in recorded typical/low/high). Confirm if your reroof is treated as residential construction valuation.";
const NASHVILLE_ROOF_DEPT = "Department of Codes and Building Safety";

/**
 * Nashville roof: Metro Nashville Codes Fee Schedule 16.28.110 A.1 valuation
 * ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a
 * 1-2 family reroof and is not in the totals.
 * Returns false if the recorded $69 / $91 / $146 anchors drift.
 */
function nashvilleRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "nashville-tn" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(NASHVILLE_ROOF_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(NASHVILLE_ROOF_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(NASHVILLE_ROOF_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== NASHVILLE_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== NASHVILLE_ROOF_SOURCE_NAME) return false;
  if (city.permitDeptName !== NASHVILLE_ROOF_DEPT) return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const building = extras.find((e) => e.name === NASHVILLE_ROOF_BUILDING_NAME);
  const tech = extras.find((e) => e.name === NASHVILLE_ROOF_TECH_NAME);
  const zoning = extras.find((e) => e.name === NASHVILLE_ROOF_ZONING_NAME);
  const plan = extras.find((e) => e.name === NASHVILLE_ROOF_PLAN_NAME);
  if (!building || cents(building.feeUsd ?? NaN) !== cents(NASHVILLE_ROOF_BUILDING_USD)) return false;
  if (!tech || cents(tech.feeUsd ?? NaN) !== cents(NASHVILLE_ROOF_TECH_USD)) return false;
  if (!zoning || cents(zoning.feeUsd ?? NaN) !== cents(NASHVILLE_ROOF_ZONING_USD)) return false;
  if (!plan || plan.feeUsd != null) return false;
  if ((building.note || "") !== NASHVILLE_ROOF_BUILDING_NOTE) return false;
  if ((tech.note || "") !== NASHVILLE_ROOF_TECH_NOTE) return false;
  if ((zoning.note || "") !== NASHVILLE_ROOF_ZONING_NOTE) return false;
  if ((plan.note || "") !== NASHVILLE_ROOF_PLAN_NOTE) return false;
  if (
    cents(building.feeUsd as number) + cents(tech.feeUsd as number) + cents(zoning.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }

  if ((permit.caveat || "") !== NASHVILLE_ROOF_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(NASHVILLE_ROOF_SOURCE_NAME) || !note.includes("source retrieved 2026-08-13")) {
    return false;
  }
  if (!/16\.28\.110 A\.1/.test(note)) return false;
  if (!note.includes("Typical $12,000: $5 × 12 = $60")) return false;
  if (!note.includes("Low $8,000: $5 × 8 = $40")) return false;
  if (!note.includes("High $22,000: $5 × 22 = $110")) return false;
  if (!/feeLowUsd \$69/.test(note) || !/feeTypicalUsd \$91/.test(note) || !/feeHighUsd \$146/.test(note)) {
    return false;
  }
  if (!/\$8,000, \$12,000, and \$22,000/.test(note)) return false;
  if (!/produces \$69, \$91, and \$146/.test(note)) return false;
  if (!/typical project value is \$12,000/.test(note)) return false;
  if (!/Plan review is exempt for a 1-2 family reroof/.test(note)) return false;
  if (!/residential construction valuation/.test(note)) return false;
  return true;
}

function nashvilleRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!nashvilleRoofFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " under Metro Nashville Codes Fee Schedule 16.28.110 A.1 at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation ($5/$1,000 + 10% codes tech + $25 zoning)";
  s += ". Low and high bands and the plan-review exemption are in the calculation note on this page";
  return asSentence(s);
}

function nashvilleRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!nashvilleRoofFacts(city, permit)) return null;
  return asSentence(
    "Plan review is exempt for a 1-2 family reroof and is not included in the recorded typical, low, or high totals. That exemption is in the calculation note on this page",
  );
}

function nashvilleRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!nashvilleRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This roof row uses the 16.28.110 A.1 valuation stack ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a 1-2 family reroof";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function nashvilleRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed a typical valuation of " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " under the Metro Nashville Codes Fee Schedule 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Low and high bands and the plan-review exemption are in the calculation note on this page",
  );
}

export type NashvilleRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Nashville roof copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the 16.28.110 valuation arithmetic. Null unless the recorded
 * $69 / $91 / $146 anchors match.
 */
export function nashvilleRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): NashvilleRoofPageCopy | null {
  if (!nashvilleRoofFacts(city, permit)) return null;
  const assumption = nashvilleRoofAssumption(permit);
  const fee = nashvilleRoofFeeParagraph(city, permit);
  const plan = nashvilleRoofPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Metro Nashville Codes Fee Schedule 16.28.110 A.1: $5 per $1,000 of valuation, plus the 10% codes tech fee, plus the $25 zoning examination. Plan review is exempt for a 1-2 family reroof. Low and high bands are in the calculation note on this page.",
    includedClause:
      "That fee is the building valuation fee plus the 10% codes tech fee plus the $25 zoning examination. Plan review is exempt for a 1-2 family reroof and is not included. Low and high bands are in the calculation note on this page.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation under 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning). Low and high bands and the plan-review exemption are in the calculation note on this page. Verify the valuation path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded bands are low " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", typical " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      " under Metro Nashville Codes Fee Schedule 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a 1-2 family reroof. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values, and the plan-review exemption, are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " under 16.28.110 A.1 ($60 building + $6 codes tech + $25 zoning; low and high bands are in the calculation note)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " under 16.28.110 A.1 ($60 building + $6 codes tech + $25 zoning) is included in the all-in. Low and high bands are in the calculation note on this page.",
  };
}

/**
 * Nashville roof money page: 16.28.110 A.1 valuation stack.
 * Band arithmetic and the plan-review exemption stay in the calculation note.
 * Returns null outside that row so other Nashville pages keep their own blurbs.
 */
function nashvilleRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "nashville-tn" || project.projectSlug !== "roof-replacement") return null;
  const fee = nashvilleRoofFeeParagraph(city, permit);
  const plan = nashvilleRoofPlanParagraph(city, permit);
  const context = nashvilleRoofContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const NASHVILLE_DECK_LOW_USD = 69;
const NASHVILLE_DECK_TYPICAL_USD = 91;
const NASHVILLE_DECK_HIGH_USD = 135;
const NASHVILLE_DECK_BUILDING_USD = 60;
const NASHVILLE_DECK_TECH_USD = 6;
const NASHVILLE_DECK_ZONING_USD = 25;

/**
 * Nashville deck: Metro Nashville Codes Fee Schedule 16.28.110 A.1 valuation
 * ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a
 * 1-2 family new deck and is not in the totals.
 * Returns false if the recorded anchors drift, so we do not invent a path.
 */
function nashvilleDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "nashville-tn" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(NASHVILLE_DECK_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(NASHVILLE_DECK_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(NASHVILLE_DECK_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceName !== "Metro Nashville Codes Fee Schedule (16.28.110), Dec 2025 PDF") return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const building = extras.find((e) => e.name === "Building valuation fee ($5 / $1,000)");
  const tech = extras.find((e) => e.name === "Codes tech fee (10% of valuation fee)");
  const zoning = extras.find((e) => e.name === "Zoning examination");
  const plan = extras.find((e) => e.name === "Plan review (1-2 family new deck)");
  if (!building || cents(building.feeUsd ?? NaN) !== cents(NASHVILLE_DECK_BUILDING_USD)) return false;
  if (!tech || cents(tech.feeUsd ?? NaN) !== cents(NASHVILLE_DECK_TECH_USD)) return false;
  if (!zoning || cents(zoning.feeUsd ?? NaN) !== cents(NASHVILLE_DECK_ZONING_USD)) return false;
  if (!plan || plan.feeUsd != null) return false;
  if (!/exempt/i.test(plan.note || "")) return false;
  if (
    cents(building.feeUsd as number) + cents(tech.feeUsd as number) + cents(zoning.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/plan review exempt/i.test(caveat) || !/16\.28\.110/.test(caveat)) return false;
  if (!/new deck/i.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes("$91") || !note.includes("$69") || !note.includes("$135")) return false;
  if (!/16\.28\.110/.test(note)) return false;
  if (!/plan review is exempt/i.test(note)) return false;
  if (!/new deck/i.test(note)) return false;
  if (!note.includes("Low $8,000") || !note.includes("high $19,200")) return false;
  return true;
}

function nashvilleDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!nashvilleDeckFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null) return null;
  let s =
    "The recorded typical permit fee for a deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " under Metro Nashville Codes Fee Schedule 16.28.110 A.1 at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation ($5/$1,000 + 10% codes tech + $25 zoning)";
  s += ". Low and high bands and the plan-review exemption are in the calculation note on this page";
  return asSentence(s);
}

function nashvilleDeckPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!nashvilleDeckFacts(city, permit)) return null;
  return asSentence(
    "Plan review is exempt for a 1-2 family new deck and is not included in the recorded typical, low, or high totals. That exemption is in the calculation note on this page",
  );
}

function nashvilleDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!nashvilleDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This deck row uses the 16.28.110 A.1 valuation stack ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a 1-2 family new deck";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function nashvilleDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed a typical valuation of " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " under the Metro Nashville Codes Fee Schedule 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Low and high bands and the plan-review exemption are in the calculation note on this page",
  );
}

export type NashvilleDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Nashville deck copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the 16.28.110 valuation arithmetic. Null unless the recorded anchors match.
 */
export function nashvilleDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): NashvilleDeckPageCopy | null {
  if (!nashvilleDeckFacts(city, permit)) return null;
  const assumption = nashvilleDeckAssumption(permit);
  const fee = nashvilleDeckFeeParagraph(city, permit);
  const plan = nashvilleDeckPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  return {
    assumption,
    requiredClause:
      "The recorded path is Metro Nashville Codes Fee Schedule 16.28.110 A.1: $5 per $1,000 of valuation, plus the 10% codes tech fee, plus the $25 zoning examination. Plan review is exempt for a 1-2 family new deck.",
    includedClause:
      "That fee is the building valuation fee plus the 10% codes tech fee plus the $25 zoning examination. Plan review is exempt for a 1-2 family new deck and is not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (valuation). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation under 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning). Low and high bands and the plan-review exemption are in the calculation note on this page. Verify the valuation path with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded bands are low " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", typical " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      " under Metro Nashville Codes Fee Schedule 16.28.110 A.1 ($5/$1,000 + 10% codes tech + $25 zoning). Plan review is exempt for a 1-2 family new deck. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values, and the plan-review exemption, are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " under Metro Nashville Codes Fee Schedule 16.28.110 A.1",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " under Metro Nashville Codes Fee Schedule 16.28.110 A.1 is included in the all-in.",
  };
}

/**
 * Nashville deck money page: 16.28.110 A.1 valuation stack.
 * Band arithmetic and the plan-review exemption stay in the calculation note.
 * Returns null outside that row so other Nashville pages keep their own blurbs.
 */
function nashvilleDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "nashville-tn" || project.projectSlug !== "deck") return null;
  const fee = nashvilleDeckFeeParagraph(city, permit);
  const plan = nashvilleDeckPlanParagraph(city, permit);
  const context = nashvilleDeckContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const ATLANTA_ROOF_FLOOR_USD = 175;
const ATLANTA_ROOF_MINIMUM_USD = 150;
const ATLANTA_ROOF_TECH_USD = 25;
const ATLANTA_ROOF_SOURCE_NAME =
  "City of Atlanta ATL311 — Residential construction permits (Office of Buildings)";
const ATLANTA_ROOF_SOURCE_URL = "https://www.atl311.com/en-us/knowledgearticle/?code=KB0012509";
const ATLANTA_ROOF_MINIMUM_NAME = "Minimum permit fee";
const ATLANTA_ROOF_TECH_NAME = "Technology fee";
const ATLANTA_ROOF_VALUATION_NAME =
  "Valuation-based fee above the published minimum (Code of Ordinances Part 19)";
const ATLANTA_ROOF_DEPT = "Department of City Planning, Office of Buildings";

/**
 * Atlanta roof: Office of Buildings published minimum ($150 + $25 technology
 * = $175). No assumed project value is recorded, and feeHighUsd stays null
 * because the Part 19 valuation table was not extracted.
 * Returns false if those anchors drift, so we do not invent a path.
 */
function atlantaRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "atlanta-ga" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "unknown") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(ATLANTA_ROOF_FLOOR_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(ATLANTA_ROOF_FLOOR_USD)) return false;
  if (permit.feeHighUsd != null) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.typicalProjectValueUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== ATLANTA_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== ATLANTA_ROOF_SOURCE_NAME) return false;
  if (city.permitDeptName !== ATLANTA_ROOF_DEPT) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const minimum = extras[0];
  const tech = extras[1];
  const valuation = extras[2];
  if (!minimum || (minimum.name || "") !== ATLANTA_ROOF_MINIMUM_NAME) return false;
  if (cents(minimum.feeUsd ?? NaN) !== cents(ATLANTA_ROOF_MINIMUM_USD)) return false;
  if (!tech || (tech.name || "") !== ATLANTA_ROOF_TECH_NAME) return false;
  if (cents(tech.feeUsd ?? NaN) !== cents(ATLANTA_ROOF_TECH_USD)) return false;
  if (!valuation || (valuation.name || "") !== ATLANTA_ROOF_VALUATION_NAME) return false;
  if (valuation.feeUsd != null) return false;
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeLowUsd as number)
  ) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Office of Buildings residential permit required for reroof in typical cases/.test(caveat)) {
    return false;
  }
  if (!/\$150 \+ \$25 tech = \$175/.test(caveat)) return false;
  if (!/feeHighUsd is null/.test(caveat)) return false;
  if (!/Code of Ordinances Part 19/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Published city minimum: permit \$150 \+ technology fee \$25 = \$175/.test(note)) return false;
  if (!/feeHighUsd is null/.test(note)) return false;
  if (!/No assumed project value is recorded on this row/.test(note)) return false;
  if (!/not computed from a valuation formula/.test(note)) return false;
  if (!/Alternate path not used in recorded totals/.test(note)) return false;
  if (!/Code of Ordinances Part 19/.test(note)) return false;
  if (!/amounts above \$175 stay null/.test(note)) return false;
  if (!note.includes("$150") || !note.includes("$25") || !note.includes("$175")) return false;
  return true;
}

function atlantaRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaRoofFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the Office of Buildings published minimum ($150 minimum permit + $25 technology)";
  s +=
    ". Low uses the same floor. The floor arithmetic and the unused Part 19 valuation alternate are in the calculation note on this page";
  return asSentence(s);
}

function atlantaRoofAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaRoofFacts(city, permit)) return null;
  return asSentence(
    "No assumed project value is recorded on this row, so the $175 floor is not a valuation-formula result. The high fee stays blank because the Code of Ordinances Part 19 valuation table was not extracted. That unused alternate is in the calculation note on this page",
  );
}

function atlantaRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!atlantaRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This roof row uses the published city minimum ($150 minimum permit + $25 technology = $175). The Part 19 valuation table above that floor was not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function atlantaRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.feeLowUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded Office of Buildings published minimum of " +
      moneyExact(permit.feeTypicalUsd) +
      " ($150 minimum permit + $25 technology), so low and typical are both " +
      moneyExact(permit.feeLowUsd) +
      ". No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page",
  );
}

export type AtlantaRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Atlanta roof copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the published-minimum floor and the unused Part 19 alternate.
 * Null unless the recorded $175 anchors match.
 */
export function atlantaRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AtlantaRoofPageCopy | null {
  if (!atlantaRoofFacts(city, permit)) return null;
  const assumption = atlantaRoofAssumption(permit);
  const fee = atlantaRoofFeeParagraph(city, permit);
  const alternate = atlantaRoofAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded path is the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). A residential permit is required for reroof in typical cases.",
    includedClause:
      "That fee is the $150 minimum permit plus the $25 technology fee. The Part 19 valuation path above that published minimum is not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (unknown). The typical path is " +
      typical +
      ", the Office of Buildings published minimum ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page. Verify the published minimum with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded low and typical both use the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "No assumed project value is recorded on this row, so the " +
      typical +
      " floor is not a valuation-formula result. The high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum is included in the all-in.",
  };
}

/**
 * Atlanta roof money page: published Office of Buildings minimum.
 * Floor arithmetic and the unused Part 19 valuation alternate stay in the
 * calculation note. Returns null outside that row so other Atlanta pages
 * keep their own blurbs.
 */
function atlantaRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "atlanta-ga" || project.projectSlug !== "roof-replacement") return null;
  const fee = atlantaRoofFeeParagraph(city, permit);
  const alternate = atlantaRoofAlternateParagraph(city, permit);
  const context = atlantaRoofContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const ATLANTA_HVAC_FLOOR_USD = 175;
const ATLANTA_HVAC_MINIMUM_USD = 150;
const ATLANTA_HVAC_TECH_USD = 25;
const ATLANTA_HVAC_SOURCE_NAME =
  "City of Atlanta ATL311 — Residential construction permits (Office of Buildings)";
const ATLANTA_HVAC_SOURCE_URL = "https://www.atl311.com/en-us/knowledgearticle/?code=KB0012509";
const ATLANTA_HVAC_MINIMUM_NAME = "Minimum permit fee";
const ATLANTA_HVAC_TECH_NAME = "Technology fee";
const ATLANTA_HVAC_VALUATION_NAME =
  "Valuation-based / trade-specific fee above the published minimum (Code of Ordinances Part 19)";
const ATLANTA_HVAC_DEPT = "Department of City Planning, Office of Buildings";
const ATLANTA_HVAC_ANCHOR_ERROR =
  "Atlanta HVAC fee anchors drifted: expected feeLowUsd 175, feeTypicalUsd 175, feeHighUsd null, minimum permit $150 + technology fee $25, Part 19 / trade-specific above the minimum blank.";

/**
 * Atlanta HVAC: Office of Buildings published minimum ($150 + $25 technology
 * = $175). No assumed project value is recorded, and feeHighUsd stays null
 * because the trade-specific schedule and Part 19 valuation table were not
 * extracted. Returns false if those anchors drift, so we do not invent a path.
 */
function atlantaHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "atlanta-ga" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "unknown") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(ATLANTA_HVAC_FLOOR_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(ATLANTA_HVAC_FLOOR_USD)) return false;
  if (permit.feeHighUsd != null) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.typicalProjectValueUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== ATLANTA_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== ATLANTA_HVAC_SOURCE_NAME) return false;
  if (city.permitDeptName !== ATLANTA_HVAC_DEPT) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const minimum = extras[0];
  const tech = extras[1];
  const valuation = extras[2];
  if (!minimum || (minimum.name || "") !== ATLANTA_HVAC_MINIMUM_NAME) return false;
  if (cents(minimum.feeUsd ?? NaN) !== cents(ATLANTA_HVAC_MINIMUM_USD)) return false;
  if (!tech || (tech.name || "") !== ATLANTA_HVAC_TECH_NAME) return false;
  if (cents(tech.feeUsd ?? NaN) !== cents(ATLANTA_HVAC_TECH_USD)) return false;
  if (!valuation || (valuation.name || "") !== ATLANTA_HVAC_VALUATION_NAME) return false;
  if (valuation.feeUsd != null) return false;
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeLowUsd as number)
  ) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Mechanical permit required/.test(caveat)) return false;
  if (!/\$150 \+ \$25 tech = \$175/.test(caveat)) return false;
  if (!/feeHighUsd is null/.test(caveat)) return false;
  if (!/trade-specific schedule/.test(caveat)) return false;
  if (!/Code of Ordinances Part 19/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Published city minimum: permit \$150 \+ technology fee \$25 = \$175/.test(note)) return false;
  if (!/mechanical permit required per ATL311/.test(note)) return false;
  if (!/feeHighUsd is null/.test(note)) return false;
  if (!/Alternate path not used in recorded totals/.test(note)) return false;
  if (!/trade-specific fees above the published minimum/.test(note)) return false;
  if (!/Code of Ordinances Part 19/.test(note)) return false;
  if (!/amounts above \$175 stay null/.test(note)) return false;
  if (!/mechanical fees via ATL311/.test(note)) return false;
  if (!note.includes("$150") || !note.includes("$25") || !note.includes("$175")) return false;
  return true;
}

/**
 * Fail the build when this row is Atlanta HVAC but the recorded anchors moved.
 * Other cities and projects return without throwing.
 */
function assertAtlantaHvacAnchors(
  city: City,
  permit: Permit | null | undefined,
  projectSlug?: string,
): void {
  const slug = permit?.projectSlug ?? projectSlug;
  if (city.slug !== "atlanta-ga" || slug !== "hvac-replacement") return;
  if (!atlantaHvacFacts(city, permit)) {
    throw new Error(ATLANTA_HVAC_ANCHOR_ERROR);
  }
}

function atlantaHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaHvacFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the Office of Buildings published minimum ($150 minimum permit + $25 technology)";
  s +=
    ". Low uses the same floor. The floor arithmetic and the unused Part 19 valuation / trade-specific alternate are in the calculation note on this page";
  return asSentence(s);
}

function atlantaHvacAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaHvacFacts(city, permit)) return null;
  return asSentence(
    "No assumed project value is recorded on this row, so the $175 floor is not a valuation-formula result. The high fee stays blank because the trade-specific schedule and the Code of Ordinances Part 19 valuation table were not extracted. That unused alternate is in the calculation note on this page",
  );
}

function atlantaHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!atlantaHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This HVAC row uses the published city minimum ($150 minimum permit + $25 technology = $175). The trade-specific schedule and the Part 19 valuation table above that floor were not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function atlantaHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.feeLowUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded Office of Buildings published minimum of " +
      moneyExact(permit.feeTypicalUsd) +
      " ($150 minimum permit + $25 technology), so low and typical are both " +
      moneyExact(permit.feeLowUsd) +
      ". No assumed project value is recorded on this row, and the high fee stays blank because the trade-specific schedule and the Part 19 valuation table were not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page",
  );
}

export type AtlantaHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  tradeFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Atlanta HVAC copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the published-minimum floor and the unused Part 19 / trade-specific
 * alternate. Null unless the recorded $175 anchors match. Throws on this row
 * when those anchors drift so the static build fails.
 */
export function atlantaHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AtlantaHvacPageCopy | null {
  assertAtlantaHvacAnchors(city, permit);
  if (!atlantaHvacFacts(city, permit)) return null;
  const assumption = atlantaHvacAssumption(permit);
  const fee = atlantaHvacFeeParagraph(city, permit);
  const alternate = atlantaHvacAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded path is the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). A mechanical permit is required per ATL311.",
    includedClause:
      "That fee is the $150 minimum permit plus the $25 technology fee. The Part 19 valuation and trade-specific path above that published minimum is not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (unknown). The typical path is " +
      typical +
      ", the Office of Buildings published minimum ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the trade-specific schedule and the Part 19 valuation table were not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page. Verify the published minimum with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded low and typical both use the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the trade-specific schedule and the Part 19 valuation table were not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "No assumed project value is recorded on this row, so the " +
      typical +
      " floor is not a valuation-formula result. The high fee stays blank because the trade-specific schedule and the Part 19 valuation table were not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page.",
    tradeFaq:
      "The recorded typical uses the Office of Buildings published minimum ($150 minimum permit + $25 technology). A valuation-based or trade-specific fee above that minimum was not extracted, so it is not included. That unused alternate is in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum is included in the all-in.",
  };
}

/**
 * Atlanta HVAC money page: published Office of Buildings minimum.
 * Floor arithmetic and the unused Part 19 / trade-specific alternate stay in
 * the calculation note. Returns null outside that row so other Atlanta pages
 * keep their own blurbs. Throws when this row's fee anchors drift.
 */
function atlantaHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "atlanta-ga" || project.projectSlug !== "hvac-replacement") return null;
  assertAtlantaHvacAnchors(city, permit, project.projectSlug);
  const fee = atlantaHvacFeeParagraph(city, permit);
  const alternate = atlantaHvacAlternateParagraph(city, permit);
  const context = atlantaHvacContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const ATLANTA_DECK_FLOOR_USD = 175;
const ATLANTA_DECK_MINIMUM_USD = 150;
const ATLANTA_DECK_TECH_USD = 25;
const ATLANTA_DECK_SOURCE_NAME =
  "City of Atlanta ATL311 — Residential construction permits (Office of Buildings)";
const ATLANTA_DECK_SOURCE_URL = "https://www.atl311.com/en-us/knowledgearticle/?code=KB0012509";
const ATLANTA_DECK_MINIMUM_NAME = "Minimum permit fee";
const ATLANTA_DECK_TECH_NAME = "Technology fee";
const ATLANTA_DECK_VALUATION_NAME =
  "Valuation-based fee above the published minimum (Code of Ordinances Part 19)";
const ATLANTA_DECK_DEPT = "Department of City Planning, Office of Buildings";
const ATLANTA_DECK_ANCHOR_ERROR =
  "Atlanta deck fee anchors drifted: expected feeLowUsd 175, feeTypicalUsd 175, feeHighUsd null, minimum permit $150 + technology fee $25, Part 19 valuation above the minimum blank.";

/**
 * Atlanta deck: Office of Buildings published minimum ($150 + $25 technology
 * = $175). ATL311 lists deck/patio addition as a residential permit type.
 * No assumed project value is recorded, and feeHighUsd stays null because the
 * Part 19 valuation table was not extracted. Returns false if those anchors
 * drift, so we do not invent a path.
 */
function atlantaDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "atlanta-ga" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "unknown") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(ATLANTA_DECK_FLOOR_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(ATLANTA_DECK_FLOOR_USD)) return false;
  if (permit.feeHighUsd != null) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.typicalProjectValueUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== ATLANTA_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== ATLANTA_DECK_SOURCE_NAME) return false;
  if (city.permitDeptName !== ATLANTA_DECK_DEPT) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const minimum = extras[0];
  const tech = extras[1];
  const valuation = extras[2];
  if (!minimum || (minimum.name || "") !== ATLANTA_DECK_MINIMUM_NAME) return false;
  if (cents(minimum.feeUsd ?? NaN) !== cents(ATLANTA_DECK_MINIMUM_USD)) return false;
  if (!tech || (tech.name || "") !== ATLANTA_DECK_TECH_NAME) return false;
  if (cents(tech.feeUsd ?? NaN) !== cents(ATLANTA_DECK_TECH_USD)) return false;
  if (!valuation || (valuation.name || "") !== ATLANTA_DECK_VALUATION_NAME) return false;
  if (valuation.feeUsd != null) return false;
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeLowUsd as number)
  ) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/ATL311 lists deck\/patio addition as a residential permit type/.test(caveat)) return false;
  if (!/\$150 \+ \$25 tech = \$175/.test(caveat)) return false;
  if (!/feeHighUsd is null/.test(caveat)) return false;
  if (!/Code of Ordinances Part 19/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Published city minimum: permit \$150 \+ technology fee \$25 = \$175/.test(note)) return false;
  if (!/ATL311 lists deck\/patio addition as a residential permit type/.test(note)) return false;
  if (!/feeHighUsd is null/.test(note)) return false;
  if (!/Alternate path not used in recorded totals/.test(note)) return false;
  if (!/valuation-based fees above the published minimum/.test(note)) return false;
  if (!/Code of Ordinances Part 19/.test(note)) return false;
  if (!/amounts above \$175 stay null/.test(note)) return false;
  if (!/deck-patio fees via ATL311/.test(note)) return false;
  if (!note.includes("$150") || !note.includes("$25") || !note.includes("$175")) return false;
  return true;
}

/**
 * Fail the build when this row is Atlanta deck but the recorded anchors moved.
 * Other cities and projects return without throwing.
 */
function assertAtlantaDeckAnchors(
  city: City,
  permit: Permit | null | undefined,
  projectSlug?: string,
): void {
  const slug = permit?.projectSlug ?? projectSlug;
  if (city.slug !== "atlanta-ga" || slug !== "deck") return;
  if (!atlantaDeckFacts(city, permit)) {
    throw new Error(ATLANTA_DECK_ANCHOR_ERROR);
  }
}

function atlantaDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaDeckFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the Office of Buildings published minimum ($150 minimum permit + $25 technology)";
  s +=
    ". Low uses the same floor. The floor arithmetic and the unused Part 19 valuation alternate are in the calculation note on this page";
  return asSentence(s);
}

function atlantaDeckAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaDeckFacts(city, permit)) return null;
  return asSentence(
    "No assumed project value is recorded on this row, so the $175 floor is not a valuation-formula result. The high fee stays blank because the Code of Ordinances Part 19 valuation table was not extracted. That unused alternate is in the calculation note on this page",
  );
}

function atlantaDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!atlantaDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This deck row uses the published city minimum ($150 minimum permit + $25 technology = $175). The Part 19 valuation table above that floor was not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function atlantaDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.feeLowUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded Office of Buildings published minimum of " +
      moneyExact(permit.feeTypicalUsd) +
      " ($150 minimum permit + $25 technology), so low and typical are both " +
      moneyExact(permit.feeLowUsd) +
      ". No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page",
  );
}

export type AtlantaDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Atlanta deck copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the published-minimum floor and the unused Part 19 alternate.
 * Null unless the recorded $175 anchors match. Throws on this row when those
 * anchors drift so the static build fails instead of pasting the note wall.
 */
export function atlantaDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AtlantaDeckPageCopy | null {
  assertAtlantaDeckAnchors(city, permit);
  if (!atlantaDeckFacts(city, permit)) return null;
  const assumption = atlantaDeckAssumption(permit);
  const fee = atlantaDeckFeeParagraph(city, permit);
  const alternate = atlantaDeckAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded path is the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). ATL311 lists deck/patio addition as a residential permit type.",
    includedClause:
      "That fee is the $150 minimum permit plus the $25 technology fee. The Part 19 valuation path above that published minimum is not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (unknown). The typical path is " +
      typical +
      ", the Office of Buildings published minimum ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page. Verify the published minimum with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded low and typical both use the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "No assumed project value is recorded on this row, so the " +
      typical +
      " floor is not a valuation-formula result. The high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum is included in the all-in.",
  };
}

/**
 * Atlanta deck money page: published Office of Buildings minimum.
 * Floor arithmetic and the unused Part 19 valuation alternate stay in the
 * calculation note. Returns null outside that row so other Atlanta pages
 * keep their own blurbs. Throws when this row's fee anchors drift.
 */
function atlantaDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "atlanta-ga" || project.projectSlug !== "deck") return null;
  assertAtlantaDeckAnchors(city, permit, project.projectSlug);
  const fee = atlantaDeckFeeParagraph(city, permit);
  const alternate = atlantaDeckAlternateParagraph(city, permit);
  const context = atlantaDeckContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const ATLANTA_KITCHEN_FLOOR_USD = 175;
const ATLANTA_KITCHEN_MINIMUM_USD = 150;
const ATLANTA_KITCHEN_TECH_USD = 25;
const ATLANTA_KITCHEN_SOURCE_NAME =
  "City of Atlanta ATL311 — Residential construction permits (Office of Buildings)";
const ATLANTA_KITCHEN_SOURCE_URL = "https://www.atl311.com/en-us/knowledgearticle/?code=KB0012509";
const ATLANTA_KITCHEN_MINIMUM_NAME = "Minimum permit fee";
const ATLANTA_KITCHEN_TECH_NAME = "Technology fee";
const ATLANTA_KITCHEN_VALUATION_NAME =
  "Valuation-based fee above the published minimum (Code of Ordinances Part 19)";
const ATLANTA_KITCHEN_DEPT = "Department of City Planning, Office of Buildings";
const ATLANTA_KITCHEN_ANCHOR_ERROR =
  "Atlanta kitchen fee anchors drifted: expected feeLowUsd 175, feeTypicalUsd 175, feeHighUsd null, minimum permit $150 + technology fee $25, Part 19 valuation above the minimum blank.";

/**
 * Atlanta kitchen: Office of Buildings published minimum ($150 + $25 technology
 * = $175). ATL311 lists interior alterations as a residential permit type;
 * cosmetic cabinet-only may be exempt. No assumed project value is recorded,
 * and feeHighUsd stays null because the Part 19 valuation table was not
 * extracted. Returns false if those anchors drift, so we do not invent a path.
 */
function atlantaKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "atlanta-ga" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "unknown") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(ATLANTA_KITCHEN_FLOOR_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(ATLANTA_KITCHEN_FLOOR_USD)) return false;
  if (permit.feeHighUsd != null) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.typicalProjectValueUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== ATLANTA_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== ATLANTA_KITCHEN_SOURCE_NAME) return false;
  if (city.permitDeptName !== ATLANTA_KITCHEN_DEPT) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const minimum = extras[0];
  const tech = extras[1];
  const valuation = extras[2];
  if (!minimum || (minimum.name || "") !== ATLANTA_KITCHEN_MINIMUM_NAME) return false;
  if (cents(minimum.feeUsd ?? NaN) !== cents(ATLANTA_KITCHEN_MINIMUM_USD)) return false;
  if (!tech || (tech.name || "") !== ATLANTA_KITCHEN_TECH_NAME) return false;
  if (cents(tech.feeUsd ?? NaN) !== cents(ATLANTA_KITCHEN_TECH_USD)) return false;
  if (!valuation || (valuation.name || "") !== ATLANTA_KITCHEN_VALUATION_NAME) return false;
  if (valuation.feeUsd != null) return false;
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }
  if (
    cents(minimum.feeUsd as number) + cents(tech.feeUsd as number) !==
    cents(permit.feeLowUsd as number)
  ) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Interior alterations are a listed residential permit type/.test(caveat)) return false;
  if (!/Cosmetic cabinet-only same-layout work may be exempt/.test(caveat)) return false;
  if (!/\$150 \+ \$25 tech = \$175/.test(caveat)) return false;
  if (!/feeHighUsd is null/.test(caveat)) return false;
  if (!/Code of Ordinances Part 19/.test(caveat)) return false;

  const note = permit.calculationNote || "";
  if (!/Published city minimum: permit \$150 \+ technology fee \$25 = \$175/.test(note)) return false;
  if (!/ATL311 lists interior alterations as a residential permit type/.test(note)) return false;
  if (!/cosmetic cabinet-only may be exempt/.test(note)) return false;
  if (!/feeHighUsd is null/.test(note)) return false;
  if (!/Alternate path not used in recorded totals/.test(note)) return false;
  if (!/valuation-based fees above the published minimum/.test(note)) return false;
  if (!/Code of Ordinances Part 19/.test(note)) return false;
  if (!/amounts above \$175 stay null/.test(note)) return false;
  if (!/interior-alteration fees via ATL311/.test(note)) return false;
  if (!note.includes("$150") || !note.includes("$25") || !note.includes("$175")) return false;
  return true;
}

/**
 * Fail the build when this row is Atlanta kitchen but the recorded anchors moved.
 * Other cities and projects return without throwing.
 */
function assertAtlantaKitchenAnchors(
  city: City,
  permit: Permit | null | undefined,
  projectSlug?: string,
): void {
  const slug = permit?.projectSlug ?? projectSlug;
  if (city.slug !== "atlanta-ga" || slug !== "kitchen-remodel") return;
  if (!atlantaKitchenFacts(city, permit)) {
    throw new Error(ATLANTA_KITCHEN_ANCHOR_ERROR);
  }
}

function atlantaKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaKitchenFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for kitchen remodel in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the Office of Buildings published minimum ($150 minimum permit + $25 technology)";
  s +=
    ". Low uses the same floor. The floor arithmetic and the unused Part 19 valuation alternate are in the calculation note on this page";
  return asSentence(s);
}

function atlantaKitchenAlternateParagraph(city: City, permit: Permit | null): string | null {
  if (!atlantaKitchenFacts(city, permit)) return null;
  return asSentence(
    "No assumed project value is recorded on this row, so the $175 floor is not a valuation-formula result. The high fee stays blank because the Code of Ordinances Part 19 valuation table was not extracted. That unused alternate is in the calculation note on this page",
  );
}

function atlantaKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!atlantaKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This kitchen row uses the published city minimum ($150 minimum permit + $25 technology = $175). ATL311 lists interior alterations as a residential permit type; cosmetic cabinet-only may be exempt. The Part 19 valuation table above that floor was not extracted";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function atlantaKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.feeLowUsd == null) return null;
  return asSentence(
    "For the permit line we assumed the recorded Office of Buildings published minimum of " +
      moneyExact(permit.feeTypicalUsd) +
      " ($150 minimum permit + $25 technology), so low and typical are both " +
      moneyExact(permit.feeLowUsd) +
      ". No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page",
  );
}

export type AtlantaKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Atlanta kitchen copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the published-minimum floor and the unused Part 19 alternate.
 * Null unless the recorded $175 anchors match. Throws on this row when those
 * anchors drift so the static build fails instead of pasting the note wall.
 */
export function atlantaKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): AtlantaKitchenPageCopy | null {
  assertAtlantaKitchenAnchors(city, permit);
  if (!atlantaKitchenFacts(city, permit)) return null;
  const assumption = atlantaKitchenAssumption(permit);
  const fee = atlantaKitchenFeeParagraph(city, permit);
  const alternate = atlantaKitchenAlternateParagraph(city, permit);
  if (!assumption || !fee || !alternate) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = shortDeptName(city);
  const label = cityLabel(city);
  return {
    assumption,
    requiredClause:
      "The recorded path is the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). ATL311 lists interior alterations as a residential permit type; cosmetic cabinet-only may be exempt.",
    includedClause:
      "That fee is the $150 minimum permit plus the $25 technology fee. The Part 19 valuation path above that published minimum is not included.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (unknown). The typical path is " +
      typical +
      ", the Office of Buildings published minimum ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page. Verify the published minimum with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded low and typical both use the Office of Buildings published minimum of " +
      typical +
      " ($150 minimum permit + $25 technology). No assumed project value is recorded on this row, and the high fee stays blank because the Part 19 valuation table was not extracted. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "No assumed project value is recorded on this row, so the " +
      typical +
      " floor is not a valuation-formula result. The high fee stays blank because the Part 19 valuation table was not extracted. The floor arithmetic and the unused valuation alternate are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " on the published minimum is included in the all-in.",
  };
}

/**
 * Atlanta kitchen money page: published Office of Buildings minimum.
 * Floor arithmetic and the unused Part 19 valuation alternate stay in the
 * calculation note. Returns null outside that row so other Atlanta pages
 * keep their own blurbs. Throws when this row's fee anchors drift.
 */
function atlantaKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "atlanta-ga" || project.projectSlug !== "kitchen-remodel") return null;
  assertAtlantaKitchenAnchors(city, permit, project.projectSlug);
  const fee = atlantaKitchenFeeParagraph(city, permit);
  const alternate = atlantaKitchenAlternateParagraph(city, permit);
  const context = atlantaKitchenContextParagraph(city, project, permit);
  if (!fee || !alternate || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, alternate, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}


const RALEIGH_HVAC_LOW_USD = 124;
const RALEIGH_HVAC_TYPICAL_USD = 124;
const RALEIGH_HVAC_HIGH_USD = 248;
const RALEIGH_HVAC_TRADE_USD = 124;
const RALEIGH_HVAC_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";
const RALEIGH_HVAC_SOURCE_NAME =
  "City of Raleigh FY27 Development Fee Guide — Minimum Trade Permit Fee";
const RALEIGH_HVAC_MECH_NAME = "Minimum trade permit (mechanical)";
const RALEIGH_HVAC_ELEC_NAME = "Second trade (electrical) if new circuit/disconnect";
const RALEIGH_HVAC_MECH_NOTE = "FY27 Minimum Trade Permit Fee $124 per trade.";
const RALEIGH_HVAC_ELEC_NOTE = "Included in high only.";
const RALEIGH_HVAC_SPLIT = "$124 + $124 = $248";
const RALEIGH_HVAC_CAVEAT =
  "Like-for-like change-out typically one mechanical trade at the $124 minimum. High assumes mechanical + electrical.";

/**
 * Raleigh HVAC: FY27 Development Fee Guide minimum trade permit, $124 per trade.
 * Like-for-like change-out is one mechanical trade, so low and typical are $124.
 * High adds a second electrical trade (new circuit/disconnect) for $248.
 * Assumed valuation is not recorded. Returns false if those anchors drift.
 */
function raleighHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "raleigh-nc" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(RALEIGH_HVAC_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(RALEIGH_HVAC_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(RALEIGH_HVAC_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== RALEIGH_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== RALEIGH_HVAC_SOURCE_NAME) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const mechanical = extras.find((e) => (e.name || "") === RALEIGH_HVAC_MECH_NAME);
  const electrical = extras.find((e) => (e.name || "") === RALEIGH_HVAC_ELEC_NAME);
  if (!mechanical || cents(mechanical.feeUsd ?? NaN) !== cents(RALEIGH_HVAC_TRADE_USD)) return false;
  if (!electrical || cents(electrical.feeUsd ?? NaN) !== cents(RALEIGH_HVAC_TRADE_USD)) return false;
  if ((mechanical.note || "") !== RALEIGH_HVAC_MECH_NOTE) return false;
  if ((electrical.note || "") !== RALEIGH_HVAC_ELEC_NOTE) return false;
  if (cents(mechanical.feeUsd as number) !== cents(permit.feeTypicalUsd as number)) return false;
  if (cents(mechanical.feeUsd as number) !== cents(permit.feeLowUsd as number)) return false;
  if (
    cents(mechanical.feeUsd as number) + cents(electrical.feeUsd as number) !==
    cents(permit.feeHighUsd as number)
  ) {
    return false;
  }

  if ((permit.caveat || "") !== RALEIGH_HVAC_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(RALEIGH_HVAC_SOURCE_NAME) || !note.includes("2026-08-13")) return false;
  if (!/Minimum Trade Permit Fee is \$124 per trade/.test(note)) return false;
  if (!/Like-for-like change-out typically one mechanical trade/.test(note)) return false;
  if (!/recorded low and typical fees are each \$124/.test(note)) return false;
  if (!note.includes(RALEIGH_HVAC_SPLIT)) return false;
  if (!/included in high only/.test(note)) return false;
  if (!/fee model is flat/.test(note)) return false;
  if (!/Assumed valuation is not recorded/.test(note)) return false;
  if (!/not recorded as feeUsd must not be invented/.test(note)) return false;
  if (!/city fee calculator/.test(note) || !/Development Fee Guide/.test(note)) return false;
  return true;
}

function raleighHvacFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighHvacFacts(city, permit) || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for HVAC replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    ", the FY27 minimum trade permit for one mechanical trade";
  s += ". Low and high totals are in the calculation note on this page";
  return asSentence(s);
}

function raleighHvacHighParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighHvacFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function raleighHvacContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!raleighHvacFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This HVAC row uses the FY27 Minimum Trade Permit Fee of $124 per trade. Like-for-like change-out is one mechanical trade; high adds the recorded electrical trade when a new circuit or disconnect is required";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function raleighHvacAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null) return null;
  return asSentence(
    "For the permit line we assumed a like-for-like change-out as one mechanical trade at the FY27 $124 minimum trade permit fee, so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      ". Low and high totals are in the calculation note on this page",
  );
}

export type RaleighHvacPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
};

/**
 * On-page Raleigh HVAC copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the $124-per-trade arithmetic. Null unless the FY27 minimum-trade
 * anchors and the verified $124 / $124 / $248 bands are present.
 */
export function raleighHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): RaleighHvacPageCopy | null {
  if (!raleighHvacFacts(city, permit)) return null;
  const assumption = raleighHvacAssumption(permit);
  const fee = raleighHvacFeeParagraph(city, permit);
  const high = raleighHvacHighParagraph(city, permit);
  if (!assumption || !fee || !high) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const dept = city.permitDeptName;
  const label = cityLabel(city);
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const recordedValue =
    permit.typicalProjectValueUsd != null
      ? "The recorded typical project value is " + moneyExact(permit.typicalProjectValueUsd) + ". "
      : "";
  return {
    assumption,
    requiredClause:
      "The recorded path is the FY27 Minimum Trade Permit Fee of $124 per trade. A like-for-like change-out is one mechanical trade at that $124 minimum. High adds a second electrical trade when a new circuit or disconnect is required.",
    includedClause:
      "That " +
      typical +
      " is the minimum trade permit for one mechanical trade. The second trade (electrical) is included in the high only.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (flat). The typical path is " +
      typical +
      " for one mechanical trade at the FY27 $124 minimum. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded FY27 bands are low " +
      moneyExact(permit.feeLowUsd) +
      " and typical " +
      typical +
      " for one mechanical trade, and high " +
      moneyExact(permit.feeHighUsd) +
      " for mechanical plus electrical. Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      recordedValue +
      "This permit fee is the FY27 minimum trade permit of $124 per trade, not a valuation total. Assumed valuation is not recorded on this row. Low, typical, and high totals are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " (FY27 minimum trade permit, one mechanical trade)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " (FY27 minimum trade permit, one mechanical trade) is included in the all-in.",
  };
}

/**
 * Raleigh HVAC money page: FY27 minimum trade permit, $124 per trade.
 * Band arithmetic stays in the calculation note.
 * Returns null outside that row so other Raleigh pages keep their own blurbs.
 */
function raleighHvacWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "hvac-replacement") return null;
  const fee = raleighHvacFeeParagraph(city, permit);
  const high = raleighHvacHighParagraph(city, permit);
  const context = raleighHvacContextParagraph(city, project, permit);
  if (!fee || !high || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, high, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const RALEIGH_ROOF_LOW_USD = 248;
const RALEIGH_ROOF_TYPICAL_USD = 248;
const RALEIGH_ROOF_HIGH_USD = 248;
const RALEIGH_ROOF_LEVEL1_USD = 124;
const RALEIGH_ROOF_PLAN_USD = 124;
const RALEIGH_ROOF_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";
const RALEIGH_ROOF_SOURCE_NAME =
  "City of Raleigh FY27 Development Fee Guide (Jul 1, 2026–Jun 30, 2027)";
const RALEIGH_ROOF_LEVEL1_NAME =
  "Level 1 alteration building permit (28% of 0.38% value, min $124)";
const RALEIGH_ROOF_PLAN_NAME = "Alteration plan review (55% of building-permit base, min $124)";
const RALEIGH_ROOF_LEVEL1_NOTE = "FY27. Like-for-like covering replacement is Level 1.";
const RALEIGH_ROOF_PLAN_NOTE =
  "Included. Some reroofs may be inspection-only; confirm with the city calculator.";
const RALEIGH_ROOF_SPLIT =
  "Level 1 alteration building permit $124 + alteration plan review $124 = $248";
const RALEIGH_ROOF_BAND =
  "Low $8,000 = $248 total; high $22,000 = $248 total";
const RALEIGH_ROOF_FLOOR = "$124 + $124 = $248";
const RALEIGH_ROOF_CAVEAT =
  "Interpretation: alteration fee = (0.38% × value) × Level rate, with $124 minimums. Most typical roofs hit the $124+$124 floor. Confirm in the official fee calculator.";

/**
 * Raleigh roof: FY27 Development Fee Guide Level 1 alteration.
 * Building permit is 28% of 0.38% of value, minimum $124. Plan review is 55%
 * of the building-permit base, minimum $124. At the recorded $8,000 / $12,000 /
 * $22,000 valuations both lines sit on the $124 floor, so every band is $248.
 * Returns false if those anchors drift.
 */
function raleighRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "raleigh-nc" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(RALEIGH_ROOF_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(RALEIGH_ROOF_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(RALEIGH_ROOF_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== RALEIGH_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== RALEIGH_ROOF_SOURCE_NAME) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level1 = extras.find((e) => (e.name || "") === RALEIGH_ROOF_LEVEL1_NAME);
  const plan = extras.find((e) => (e.name || "") === RALEIGH_ROOF_PLAN_NAME);
  if (!level1 || cents(level1.feeUsd ?? NaN) !== cents(RALEIGH_ROOF_LEVEL1_USD)) return false;
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(RALEIGH_ROOF_PLAN_USD)) return false;
  if ((level1.note || "") !== RALEIGH_ROOF_LEVEL1_NOTE) return false;
  if ((plan.note || "") !== RALEIGH_ROOF_PLAN_NOTE) return false;
  if (
    cents(level1.feeUsd as number) + cents(plan.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }

  if ((permit.caveat || "") !== RALEIGH_ROOF_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(RALEIGH_ROOF_SOURCE_NAME) || !note.includes("2026-08-13")) return false;
  if (!/Like-for-like covering replacement is Level 1/.test(note)) return false;
  if (!/0\.38% × value/.test(note) || !/\$124 minimums/.test(note)) return false;
  if (!/28% of 0\.38% of value, minimum \$124/.test(note)) return false;
  if (!/55% of the building-permit base, minimum \$124/.test(note)) return false;
  if (!note.includes("Typical $12,000: " + RALEIGH_ROOF_SPLIT)) return false;
  if (!note.includes(RALEIGH_ROOF_BAND)) return false;
  if (!note.includes(RALEIGH_ROOF_FLOOR)) return false;
  if (!/\$8,000, \$12,000, and \$22,000 valuations/.test(note)) return false;
  if (!/inspection-only/.test(note) || !/city calculator/.test(note)) return false;
  return true;
}

function raleighRoofFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighRoofFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for roof replacement in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Raleigh FY27 Development Fee Guide at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function raleighRoofPlanParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighRoofFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function raleighRoofContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!raleighRoofFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This roof row uses the Level 1 alteration path: (0.38% × value) × the Level rate, with $124 minimums, plus alteration plan review at 55% of the building-permit base, minimum $124. At the recorded valuations both lines sit on the $124 floor. Some reroofs may be inspection-only";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function raleighRoofAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the Level 1 alteration path at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the $124 building-permit minimum and the $124 plan-review minimum included. Low and high totals are in the calculation note on this page",
  );
}

export type RaleighRoofPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Raleigh roof copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless the FY27 Level 1 anchors and the verified
 * $124 + $124 floor are both present.
 */
export function raleighRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): RaleighRoofPageCopy | null {
  if (!raleighRoofFacts(city, permit)) return null;
  const assumption = raleighRoofAssumption(permit);
  const fee = raleighRoofFeeParagraph(city, permit);
  const plan = raleighRoofPlanParagraph(city, permit);
  if (!assumption || !fee || !plan) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const dept = city.permitDeptName;
  return {
    assumption,
    requiredClause:
      "The recorded path is a Level 1 alteration: (0.38% × value) × the Level 1 rate, with $124 minimums, plus alteration plan review at 55% of the building-permit base, minimum $124. At the recorded valuations both lines sit on the $124 floor.",
    includedClause:
      "That " +
      typical +
      " is the Level 1 alteration building permit minimum plus the alteration plan review minimum. Some reroofs may be inspection-only; confirm with the city calculator.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (tiered). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: Level 1 building permit plus alteration plan review, both at the $124 minimum. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded FY27 totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are Level 1 alteration building permit " +
      moneyExact(RALEIGH_ROOF_LEVEL1_USD) +
      " plus alteration plan review " +
      moneyExact(RALEIGH_ROOF_PLAN_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 1 building permit $124 + plan review $124)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 1 building permit $124 + plan review $124) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Raleigh roof money page: Level 1 alteration with $124 minimums on the
 * building permit and plan review. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other Raleigh pages keep their own blurbs.
 */
function raleighRoofWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "roof-replacement") return null;
  const fee = raleighRoofFeeParagraph(city, permit);
  const plan = raleighRoofPlanParagraph(city, permit);
  const context = raleighRoofContextParagraph(city, project, permit);
  if (!fee || !plan || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, plan, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const RALEIGH_KITCHEN_LOW_USD = 496;
const RALEIGH_KITCHEN_TYPICAL_USD = 496;
const RALEIGH_KITCHEN_HIGH_USD = 547.25;
const RALEIGH_KITCHEN_TRADE_USD = 124;
const RALEIGH_KITCHEN_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";
const RALEIGH_KITCHEN_SOURCE_NAME = "City of Raleigh FY27 Development Fee Guide";
const RALEIGH_KITCHEN_LEVEL2_NAME = "Level 2 alteration building (50% of 0.38% value, min $124)";
const RALEIGH_KITCHEN_PLAN_NAME = "Plan review (55%, min $124)";
const RALEIGH_KITCHEN_ELEC_NAME = "Electrical trade (minimum)";
const RALEIGH_KITCHEN_PLUMB_NAME = "Plumbing trade (minimum)";
const RALEIGH_KITCHEN_LEVEL2_NOTE = "Layout change / added equipment is Level 2.";
const RALEIGH_KITCHEN_PLAN_NOTE = "Included.";
const RALEIGH_KITCHEN_ELEC_NOTE = "Included in totals (3 trades: building + E + P).";
const RALEIGH_KITCHEN_PLUMB_NOTE = "Included in totals.";
const RALEIGH_KITCHEN_FLOOR = "$124 + $124 + $124 + $124 = $496";
const RALEIGH_KITCHEN_HIGH_BASE = "0.38% × $75,000 = $285";
const RALEIGH_KITCHEN_HIGH_LEVEL2 = "50% × $285 = $142.50";
const RALEIGH_KITCHEN_HIGH_PLAN = "55% of the full 0.38% value (= $156.75)";
const RALEIGH_KITCHEN_HIGH_SUM = "$142.50 + $156.75 + $124 + $124 = $547.25";
const RALEIGH_KITCHEN_CAVEAT =
  "Typical = Level 2 building min + plan-review min + two additional trade mins ($124×4). Same-layout cabinet-only may need fewer trades. Confirm with the official calculator.";

/**
 * Raleigh kitchen: FY27 Development Fee Guide Level 2 alteration.
 * Building permit is 50% of 0.38% of value, minimum $124. Plan review is 55%
 * of the full 0.38% value, minimum $124. Electrical and plumbing trade minimums
 * are $124 each. At $15,000 and $35,000 every line sits on the $124 floor
 * ($496). At $75,000 the recorded high is $547.25. Returns false if those
 * anchors drift.
 */
function raleighKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "raleigh-nc" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(RALEIGH_KITCHEN_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(RALEIGH_KITCHEN_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(RALEIGH_KITCHEN_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== RALEIGH_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== RALEIGH_KITCHEN_SOURCE_NAME) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const level2 = extras.find((e) => (e.name || "") === RALEIGH_KITCHEN_LEVEL2_NAME);
  const plan = extras.find((e) => (e.name || "") === RALEIGH_KITCHEN_PLAN_NAME);
  const elec = extras.find((e) => (e.name || "") === RALEIGH_KITCHEN_ELEC_NAME);
  const plumb = extras.find((e) => (e.name || "") === RALEIGH_KITCHEN_PLUMB_NAME);
  if (!level2 || cents(level2.feeUsd ?? NaN) !== cents(RALEIGH_KITCHEN_TRADE_USD)) return false;
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(RALEIGH_KITCHEN_TRADE_USD)) return false;
  if (!elec || cents(elec.feeUsd ?? NaN) !== cents(RALEIGH_KITCHEN_TRADE_USD)) return false;
  if (!plumb || cents(plumb.feeUsd ?? NaN) !== cents(RALEIGH_KITCHEN_TRADE_USD)) return false;
  if ((level2.note || "") !== RALEIGH_KITCHEN_LEVEL2_NOTE) return false;
  if ((plan.note || "") !== RALEIGH_KITCHEN_PLAN_NOTE) return false;
  if ((elec.note || "") !== RALEIGH_KITCHEN_ELEC_NOTE) return false;
  if ((plumb.note || "") !== RALEIGH_KITCHEN_PLUMB_NOTE) return false;
  const floorCents =
    cents(level2.feeUsd as number) +
    cents(plan.feeUsd as number) +
    cents(elec.feeUsd as number) +
    cents(plumb.feeUsd as number);
  if (floorCents !== cents(permit.feeTypicalUsd as number)) return false;
  if (floorCents !== cents(permit.feeLowUsd as number)) return false;
  // High band is the recorded formula at $75,000, not a fifth feeUsd line:
  // 0.38% × 75000 = 285; Level 2 = 50% × 285 = 142.50; plan review = 55% of
  // that full 0.38% base = 156.75; plus the two recorded $124 trades.
  const highCents = cents(142.5) + cents(156.75) + cents(124) + cents(124);
  if (highCents !== cents(RALEIGH_KITCHEN_HIGH_USD)) return false;
  if (highCents !== cents(permit.feeHighUsd as number)) return false;

  if ((permit.caveat || "") !== RALEIGH_KITCHEN_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(RALEIGH_KITCHEN_SOURCE_NAME) || !note.includes("2026-08-13")) return false;
  if (!note.includes(RALEIGH_KITCHEN_LEVEL2_NOTE.replace(/\.$/, ""))) return false;
  if (!/Level 2 alteration building is 50% of 0\.38% of value/.test(note)) return false;
  if (!/\$124 minimum/.test(note)) return false;
  if (!/Plan review is 55% of the full 0\.38% value/.test(note)) return false;
  if (!/Electrical trade minimum is \$124/.test(note)) return false;
  if (!/plumbing trade minimum is \$124/.test(note)) return false;
  if (!note.includes("Typical $35,000") || !note.includes("low $15,000")) return false;
  if (!note.includes(RALEIGH_KITCHEN_FLOOR)) return false;
  if (!note.includes("High $75,000")) return false;
  if (!note.includes(RALEIGH_KITCHEN_HIGH_BASE)) return false;
  if (!note.includes(RALEIGH_KITCHEN_HIGH_LEVEL2)) return false;
  if (!note.includes(RALEIGH_KITCHEN_HIGH_PLAN)) return false;
  if (!note.includes(RALEIGH_KITCHEN_HIGH_SUM)) return false;
  if (!/Do not invent amounts not recorded as feeUsd/.test(note)) return false;
  if (!/Same-layout cabinet-only may need fewer trades/.test(note)) return false;
  if (!/official calculator/.test(note)) return false;
  return true;
}

function raleighKitchenFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighKitchenFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for kitchen remodel in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Raleigh FY27 Development Fee Guide at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function raleighKitchenCaveatParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighKitchenFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function raleighKitchenContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!raleighKitchenFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This kitchen row uses the Level 2 alteration path: 50% of 0.38% of value, with a $124 minimum, plus plan review at 55% of the full 0.38% value, minimum $124, plus electrical and plumbing trade minimums at $124 each. At the recorded $15,000 and $35,000 valuations those lines sit on the $124 floor. Same-layout cabinet-only may need fewer trades";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function raleighKitchenAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the Level 2 alteration path at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the $124 Level 2 building minimum, the $124 plan-review minimum, and the $124 electrical and $124 plumbing trade minimums included. Low and high totals are in the calculation note on this page",
  );
}

export type RaleighKitchenPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Raleigh kitchen copy from the permit row.
 * Assumption, why, and how-calculated stay short and point at the calculation
 * note for the $124 floor and the $75,000 high. Null unless the FY27 Level 2
 * anchors and the verified $496 / $496 / $547.25 bands are present.
 */
export function raleighKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): RaleighKitchenPageCopy | null {
  if (!raleighKitchenFacts(city, permit)) return null;
  const assumption = raleighKitchenAssumption(permit);
  const fee = raleighKitchenFeeParagraph(city, permit);
  const caveat = raleighKitchenCaveatParagraph(city, permit);
  if (!assumption || !fee || !caveat) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const dept = city.permitDeptName;
  return {
    assumption,
    requiredClause:
      "The recorded path is a Level 2 alteration: 50% of 0.38% of value, with a $124 minimum, plus plan review at 55% of the full 0.38% value, minimum $124, plus electrical and plumbing trade minimums at $124 each. At the recorded $15,000 and $35,000 valuations those lines sit on the $124 floor.",
    includedClause:
      "That " +
      typical +
      " is the Level 2 building minimum plus the plan-review minimum plus the electrical and plumbing trade minimums. Same-layout cabinet-only may need fewer trades; confirm with the official calculator.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (tiered). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: Level 2 building, plan review, electrical, and plumbing, each at the $124 minimum. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded FY27 totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are Level 2 alteration building " +
      moneyExact(RALEIGH_KITCHEN_TRADE_USD) +
      ", plan review " +
      moneyExact(RALEIGH_KITCHEN_TRADE_USD) +
      ", electrical trade " +
      moneyExact(RALEIGH_KITCHEN_TRADE_USD) +
      ", and plumbing trade " +
      moneyExact(RALEIGH_KITCHEN_TRADE_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 2 building $124 + plan review $124 + electrical $124 + plumbing $124)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 2 building $124 + plan review $124 + electrical $124 + plumbing $124) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Raleigh kitchen money page: Level 2 alteration with $124 minimums on the
 * building permit, plan review, and two trade lines. Band arithmetic stays in
 * the calculation note. Returns null outside that row so other Raleigh pages
 * keep their own blurbs.
 */
function raleighKitchenWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "kitchen-remodel") return null;
  const fee = raleighKitchenFeeParagraph(city, permit);
  const caveat = raleighKitchenCaveatParagraph(city, permit);
  const context = raleighKitchenContextParagraph(city, project, permit);
  if (!fee || !caveat || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, caveat, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
}

const RALEIGH_DECK_LOW_USD = 248;
const RALEIGH_DECK_TYPICAL_USD = 248;
const RALEIGH_DECK_HIGH_USD = 248;
const RALEIGH_DECK_LINE_USD = 124;
const RALEIGH_DECK_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";
const RALEIGH_DECK_SOURCE_NAME = "City of Raleigh FY27 Development Fee Guide";
const RALEIGH_DECK_LEVEL2_NAME =
  "Level 2 alteration / new accessory structure path (50% of 0.38% value, min $124)";
const RALEIGH_DECK_PLAN_NAME = "Plan review (55%, min $124)";
const RALEIGH_DECK_LEVEL2_NOTE =
  "FY27. New decks may instead be assessed as new residential construction at 0.38% of value (still usually the $124 floor at these sizes).";
const RALEIGH_DECK_PLAN_NOTE = "Included.";
const RALEIGH_DECK_SPLIT =
  "Level 2 alteration / new accessory structure path $124 + plan review $124 = $248";
const RALEIGH_DECK_BAND = "Low $8,000 = $248 total; high $19,200 = $248 total";
const RALEIGH_DECK_FLOOR = "$124 + $124 = $248";
const RALEIGH_DECK_ALT =
  "New decks may instead be assessed as new residential construction at 0.38% of value (still usually the $124 floor at these sizes)";
const RALEIGH_DECK_CAVEAT =
  "Typical home decks hit the $124 + $124 minimums under this reading of the FY27 guide. Use the city's fee calculator for the billed amount.";

/**
 * Raleigh deck: FY27 Development Fee Guide Level 2 alteration / new accessory
 * structure path. Level 2 is 50% of 0.38% of value, minimum $124. Plan review
 * is 55%, minimum $124. At the recorded $8,000 / $12,000 / $19,200 valuations
 * both lines sit on the $124 floor, so every band is $248. Returns false if
 * those anchors drift.
 */
function raleighDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "raleigh-nc" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (cents(permit.feeLowUsd ?? NaN) !== cents(RALEIGH_DECK_LOW_USD)) return false;
  if (cents(permit.feeTypicalUsd ?? NaN) !== cents(RALEIGH_DECK_TYPICAL_USD)) return false;
  if (cents(permit.feeHighUsd ?? NaN) !== cents(RALEIGH_DECK_HIGH_USD)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceUrl !== RALEIGH_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== RALEIGH_DECK_SOURCE_NAME) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level2 = extras.find((e) => (e.name || "") === RALEIGH_DECK_LEVEL2_NAME);
  const plan = extras.find((e) => (e.name || "") === RALEIGH_DECK_PLAN_NAME);
  if (!level2 || cents(level2.feeUsd ?? NaN) !== cents(RALEIGH_DECK_LINE_USD)) return false;
  if (!plan || cents(plan.feeUsd ?? NaN) !== cents(RALEIGH_DECK_LINE_USD)) return false;
  if ((level2.note || "") !== RALEIGH_DECK_LEVEL2_NOTE) return false;
  if ((plan.note || "") !== RALEIGH_DECK_PLAN_NOTE) return false;
  if (
    cents(level2.feeUsd as number) + cents(plan.feeUsd as number) !==
    cents(permit.feeTypicalUsd as number)
  ) {
    return false;
  }
  if (cents(permit.feeLowUsd as number) !== cents(permit.feeTypicalUsd as number)) return false;
  if (cents(permit.feeHighUsd as number) !== cents(permit.feeTypicalUsd as number)) return false;

  if ((permit.caveat || "") !== RALEIGH_DECK_CAVEAT) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(RALEIGH_DECK_SOURCE_NAME) || !note.includes("2026-08-13")) return false;
  if (!/Level 2 alteration \/ new accessory structure path/.test(note)) return false;
  if (!/Level 2 is 50% of 0\.38% of value, minimum \$124/.test(note)) return false;
  if (!/Plan review is 55%, minimum \$124, and is included/.test(note)) return false;
  if (!note.includes("Typical $12,000: " + RALEIGH_DECK_SPLIT)) return false;
  if (!note.includes(RALEIGH_DECK_BAND)) return false;
  if (!note.includes(RALEIGH_DECK_FLOOR)) return false;
  if (!/\$8,000, \$12,000, and \$19,200 valuations/.test(note)) return false;
  if (!note.includes(RALEIGH_DECK_ALT)) return false;
  if (!/Typical home decks hit the \$124 \+ \$124 minimums/.test(note)) return false;
  if (!/Do not invent amounts not recorded as feeUsd/.test(note)) return false;
  if (!/city's fee calculator/.test(note)) return false;
  return true;
}

function raleighDeckFeeParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighDeckFacts(city, permit)) return null;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.typical == null || permit.feeTypicalUsd == null) return null;
  let s =
    "The recorded typical permit fee for deck in " +
    cityLabel(city) +
    " is " +
    moneyExact(permit.feeTypicalUsd) +
    " on the City of Raleigh FY27 Development Fee Guide at the recorded " +
    moneyExact(assumed.typical) +
    " typical valuation";
  s += ". Low and high totals for the recorded valuation bands are in the calculation note on this page";
  return asSentence(s);
}

function raleighDeckCaveatParagraph(city: City, permit: Permit | null): string | null {
  if (!raleighDeckFacts(city, permit)) return null;
  const caveat = (permit.caveat || "").trim();
  if (!caveat) return null;
  return asSentence(caveat);
}

function raleighDeckContextParagraph(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string | null {
  if (!raleighDeckFacts(city, permit)) return null;
  const dept = deptDisplay(city);
  if (!dept) return null;
  const peers: string[] = [];
  for (const slug of PRIORITY_CLUSTER) {
    if (slug === city.slug) continue;
    const peer = getCity(slug);
    const peerPermit = getPermit(slug, project.projectSlug);
    if (!peer || !peerPermit || peerPermit.feeTypicalUsd == null) continue;
    peers.push(cityLabel(peer) + " " + moneyExact(peerPermit.feeTypicalUsd));
  }

  let s = "Building and trade permits for " + cityLabel(city) + " run through " + dept;
  if (city.feeScheduleYear != null) {
    s += " under the recorded " + city.feeScheduleYear + " fee schedule";
  }
  if (permit.sourceName) s += ". The cited schedule is " + permit.sourceName;
  if (permit.retrievedDate) s += " (source retrieved " + permit.retrievedDate + ")";
  s +=
    ". This deck row uses the Level 2 alteration / new accessory structure path: 50% of 0.38% of value, minimum $124, plus plan review at 55%, minimum $124. At the recorded valuations both lines sit on the $124 floor. New decks may instead be assessed as new residential construction at 0.38% of value (still usually the $124 floor at these sizes)";
  if (peers.length) {
    s += ". Peer recorded typical permit fees in this cluster include " + peers.join(", ");
  }
  s += ". We only use fees extracted from the official schedule";
  return asSentence(s);
}

function raleighDeckAssumption(permit: Permit): string | null {
  if (permit.feeTypicalUsd == null || permit.assumedValuationUsd?.typical == null) return null;
  return asSentence(
    "For the permit line we assumed the Level 2 alteration / new accessory structure path at the recorded " +
      moneyExact(permit.assumedValuationUsd.typical) +
      " typical valuation (not a city-assessed value), so the typical fee is " +
      moneyExact(permit.feeTypicalUsd) +
      " with the $124 Level 2 minimum and the $124 plan-review minimum included. Low and high totals are in the calculation note on this page",
  );
}

export type RaleighDeckPageCopy = {
  assumption: string;
  requiredClause: string;
  includedClause: string;
  differ: string;
  howCalculated: string;
  valuationFaq: string;
  includedMid: string;
  permitSentence: string;
  typicalExact: string;
  rangeExact: string;
};

/**
 * On-page Raleigh deck copy from the permit row.
 * Assumption and why stay short and point at the calculation note for the
 * band arithmetic. Null unless the FY27 Level 2 anchors and the verified
 * $124 + $124 floor are both present.
 */
export function raleighDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): RaleighDeckPageCopy | null {
  if (!raleighDeckFacts(city, permit)) return null;
  const assumption = raleighDeckAssumption(permit);
  const fee = raleighDeckFeeParagraph(city, permit);
  const caveat = raleighDeckCaveatParagraph(city, permit);
  if (!assumption || !fee || !caveat) return null;
  const typical = moneyExact(permit.feeTypicalUsd as number);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return null;
  if (permit.feeLowUsd == null || permit.feeHighUsd == null) return null;
  const dept = city.permitDeptName;
  return {
    assumption,
    requiredClause:
      "The recorded path is a Level 2 alteration / new accessory structure path: 50% of 0.38% of value, with a $124 minimum, plus plan review at 55%, minimum $124. At the recorded valuations both lines sit on the $124 floor.",
    includedClause:
      "That " +
      typical +
      " is the Level 2 alteration minimum plus the plan-review minimum. New decks may instead be assessed as new residential construction at 0.38% of value (still usually the $124 floor at these sizes). Use the city's fee calculator for the billed amount.",
    differ:
      "The recorded " +
      label +
      " fee comes from " +
      (permit.sourceName || "the official schedule on file") +
      " (tiered). The typical path is " +
      typical +
      " at the recorded " +
      moneyExact(assumed.typical) +
      " valuation: Level 2 alteration and plan review, both at the $124 minimum. Low and high totals are in the calculation note on this page. Verify with " +
      city.permitDeptName +
      ".",
    howCalculated:
      "Recorded FY27 totals are " +
      moneyExact(permit.feeLowUsd) +
      " at " +
      moneyExact(assumed.low) +
      ", " +
      typical +
      " at " +
      moneyExact(assumed.typical) +
      ", and " +
      moneyExact(permit.feeHighUsd) +
      " at " +
      moneyExact(assumed.high) +
      ". At the typical valuation the recorded lines are Level 2 alteration / new accessory structure path " +
      moneyExact(RALEIGH_DECK_LINE_USD) +
      " plus plan review " +
      moneyExact(RALEIGH_DECK_LINE_USD) +
      ". Full arithmetic is in the calculation note on this page.",
    valuationFaq:
      "Recorded assumed values are low " +
      moneyExact(assumed.low) +
      ", typical " +
      moneyExact(assumed.typical) +
      ", and high " +
      moneyExact(assumed.high) +
      ". The permit totals at those values are in the calculation note on this page.",
    includedMid:
      "including the recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 2 $124 + plan review $124)",
    permitSentence:
      "The recorded " +
      dept +
      " permit fee of " +
      typical +
      " (Level 2 $124 + plan review $124) is included in the all-in.",
    typicalExact: typical,
    rangeExact: moneyExact(permit.feeLowUsd) + " – " + moneyExact(permit.feeHighUsd),
  };
}

/**
 * Raleigh deck money page: Level 2 alteration with $124 minimums on the
 * Level 2 line and plan review. Band arithmetic stays in the calculation note.
 * Returns null outside that row so other Raleigh pages keep their own blurbs.
 */
function raleighDeckWhy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): WhyCostsDifferModel | null {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "deck") return null;
  const fee = raleighDeckFeeParagraph(city, permit);
  const caveat = raleighDeckCaveatParagraph(city, permit);
  const context = raleighDeckContextParagraph(city, project, permit);
  if (!fee || !caveat || !context) return null;

  const paragraphs: string[] = [];
  const labor = laborParagraph(project, city);
  if (labor) paragraphs.push(labor);
  paragraphs.push(fee, caveat, context);

  return {
    heading: keepHvac(
      "Why " + shortProjectName(project.projectSlug).toLowerCase() + " costs differ in " + cityLabel(city),
    ),
    paragraphs,
    footnote:
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
  };
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

  const charlotteHvac = charlotteHvacWhy(city, project, permit ?? null);
  if (charlotteHvac) return charlotteHvac;

  const charlotteKitchen = charlotteKitchenWhy(city, project, permit ?? null);
  if (charlotteKitchen) return charlotteKitchen;

  const denverHvac = denverHvacWhy(city, project, permit ?? null);
  if (denverHvac) return denverHvac;

  const denverRoof = denverRoofWhy(city, project, permit ?? null);
  if (denverRoof) return denverRoof;

  const denverDeck = denverDeckWhy(city, project, permit ?? null);
  if (denverDeck) return denverDeck;

  const austinRoof = austinRoofWhy(city, project, permit ?? null);
  if (austinRoof) return austinRoof;

  const austinHvac = austinHvacWhy(city, project, permit ?? null);
  if (austinHvac) return austinHvac;

  const austinKitchen = austinKitchenWhy(city, project, permit ?? null);
  if (austinKitchen) return austinKitchen;

  const austinDeck = austinDeckWhy(city, project, permit ?? null);
  if (austinDeck) return austinDeck;

  const phoenixRoof = phoenixRoofWhy(city, project, permit ?? null);
  if (phoenixRoof) return phoenixRoof;

  const phoenixHvac = phoenixHvacWhy(city, project, permit ?? null);
  if (phoenixHvac) return phoenixHvac;

  const phoenixKitchen = phoenixKitchenWhy(city, project, permit ?? null);
  if (phoenixKitchen) return phoenixKitchen;

  const phoenixDeck = phoenixDeckWhy(city, project, permit ?? null);
  if (phoenixDeck) return phoenixDeck;

  const tucsonRoof = tucsonRoofWhy(city, project, permit ?? null);
  if (tucsonRoof) return tucsonRoof;

  const tucsonHvac = tucsonHvacWhy(city, project, permit ?? null);
  if (tucsonHvac) return tucsonHvac;

  const tucsonKitchen = tucsonKitchenWhy(city, project, permit ?? null);
  if (tucsonKitchen) return tucsonKitchen;

  const tucsonDeck = tucsonDeckWhy(city, project, permit ?? null);
  if (tucsonDeck) return tucsonDeck;

  const seattleHvac = seattleHvacWhy(city, project, permit ?? null);
  if (seattleHvac) return seattleHvac;

  const nashvilleRoof = nashvilleRoofWhy(city, project, permit ?? null);
  if (nashvilleRoof) return nashvilleRoof;

  const nashvilleDeck = nashvilleDeckWhy(city, project, permit ?? null);
  if (nashvilleDeck) return nashvilleDeck;

  const portlandRoof = portlandRoofWhy(city, project, permit ?? null);
  if (portlandRoof) return portlandRoof;

  const portlandKitchen = portlandKitchenWhy(city, project, permit ?? null);
  if (portlandKitchen) return portlandKitchen;
  const portlandDeck = portlandDeckWhy(city, project, permit ?? null);
  if (portlandDeck) return portlandDeck;

  const raleighHvac = raleighHvacWhy(city, project, permit ?? null);
  if (raleighHvac) return raleighHvac;

  const raleighRoof = raleighRoofWhy(city, project, permit ?? null);
  if (raleighRoof) return raleighRoof;

  const raleighKitchen = raleighKitchenWhy(city, project, permit ?? null);
  if (raleighKitchen) return raleighKitchen;

  const raleighDeck = raleighDeckWhy(city, project, permit ?? null);
  if (raleighDeck) return raleighDeck;

  const atlantaRoof = atlantaRoofWhy(city, project, permit ?? null);
  if (atlantaRoof) return atlantaRoof;

  const atlantaHvac = atlantaHvacWhy(city, project, permit ?? null);
  if (atlantaHvac) return atlantaHvac;

  const atlantaDeck = atlantaDeckWhy(city, project, permit ?? null);
  if (atlantaDeck) return atlantaDeck;

  const atlantaKitchen = atlantaKitchenWhy(city, project, permit ?? null);
  if (atlantaKitchen) return atlantaKitchen;

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
