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
  "austin-tx/hvac-replacement",
  "austin-tx/kitchen-remodel",
  "austin-tx/deck",
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

  const denverHvac = denverHvacWhy(city, project, permit ?? null);
  if (denverHvac) return denverHvac;

  const denverRoof = denverRoofWhy(city, project, permit ?? null);
  if (denverRoof) return denverRoof;

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
