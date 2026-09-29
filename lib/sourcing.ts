import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { projectMeta, shortProjectName } from "@/lib/projects";
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

function moneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (negative ? "-$" : "$") + body;
}

function sameMoney(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/** Austin HVAC Change-Out row only. Other cities and other Austin jobs stay on the generic sentence. */
function isAustinHvacChangeOut(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "austin-tx" || project.projectSlug !== "hvac-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 80.09) || !sameMoney(permit.feeTypicalUsd, 80.09)) return false;
  if (!sameMoney(permit.feeHighUsd, 121.56)) return false;
  const extras = permit.extras || [];
  const first = extras.find((e) => /Change-Out Program/i.test(e.name || "") && /first system/i.test(e.name || ""));
  const additional = extras.find((e) => /additional HVAC system/i.test(e.name || ""));
  if (!first || !sameMoney(first.feeUsd, 80.09)) return false;
  if (!additional || !sameMoney(additional.feeUsd, 41.47)) return false;
  const caveat = permit.caveat || "";
  if (!/residential Change-Out Program \(like-for-like HVAC\)/.test(caveat)) return false;
  if (!/New systems, duct redesign, or work outside the program/.test(caveat)) return false;
  return true;
}

/** Austin kitchen interior-remodel row only. Other cities and other Austin jobs stay on the generic sentence. */
function isAustinKitchenInterior(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "austin-tx" || project.projectSlug !== "kitchen-remodel") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (permit.feeLowUsd != null || permit.feeHighUsd != null) return false;
  if (!sameMoney(permit.feeTypicalUsd, 1267.28)) return false;
  const extras = permit.extras || [];
  const plan = extras.find((e) => /Interior remodel plan review/i.test(e.name || "") && /201/.test(e.name || ""));
  const processing = extras.find((e) => /plan review application processing/i.test(e.name || ""));
  const building = extras.find((e) => /building permit fee/i.test(e.name || ""));
  const electric = extras.find((e) => /^Electric fee/i.test(e.name || ""));
  const plumbing = extras.find((e) => /^Plumbing fee/i.test(e.name || ""));
  const energy = extras.find((e) => /^Energy fee$/i.test((e.name || "").trim()));
  const express = extras.find((e) => /Express kitchen-remodel inspection/i.test(e.name || ""));
  if (!plan || !sameMoney(plan.feeUsd, 342.7)) return false;
  if (!processing || !sameMoney(processing.feeUsd, 136.45)) return false;
  if (!building || !sameMoney(building.feeUsd, 334.74)) return false;
  if (!electric || !sameMoney(electric.feeUsd, 166.9)) return false;
  if (!plumbing || !sameMoney(plumbing.feeUsd, 200.43)) return false;
  if (!energy || !sameMoney(energy.feeUsd, 86.06)) return false;
  if (!express || !sameMoney(express.feeUsd, 87.49)) return false;
  if (!/Not added into typical/i.test(express.note || "")) return false;
  const note = permit.calculationNote || "";
  if (
    !note.includes(
      "interior remodel plan review (201\u2013300 sq ft) $342.70 + residential plan review application processing $136.45 + residential building permit fee (\u22641,000 sq ft) $334.74 + electric fee (\u22641,000 sq ft) $166.90 + plumbing fee (\u22641,000 sq ft) $200.43 + energy fee $86.06 = $1,267.28",
    )
  ) {
    return false;
  }
  if (!/tiered on remodel square footage and trade mix/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Austin kitchen interior-remodel path.
 * Names the path and the recorded typical. Null for every other row.
 */
export function austinKitchenInteriorLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isAustinKitchenInterior(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " interior-remodel permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " for a 201–300 sq ft kitchen with building, electric, plumbing, and energy",
  );
}

/** Austin deck Small Projects row only. Other cities and other Austin jobs stay on the generic sentence. */
function isAustinDeckSmallProjects(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "austin-tx" || project.projectSlug !== "deck") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 529.11) || !sameMoney(permit.feeTypicalUsd, 529.11)) return false;
  if (!sameMoney(permit.feeHighUsd, 529.11)) return false;
  const extras = permit.extras || [];
  const plan = extras.find((e) => /Small Projects Plan Review/i.test(e.name || ""));
  const processing = extras.find((e) => /Residential Plan Review Application Processing/i.test(e.name || ""));
  const building = extras.find((e) => /building permit fee/i.test(e.name || ""));
  const electric = extras.find((e) => /^Electric fee/i.test(e.name || ""));
  if (!plan || !sameMoney(plan.feeUsd, 132.86)) return false;
  if (!processing || !sameMoney(processing.feeUsd, 106.72)) return false;
  if (!building || !sameMoney(building.feeUsd, 289.53)) return false;
  if (!electric || !sameMoney(electric.feeUsd, 166.99)) return false;
  if (!/Not added unless the deck adds lighting or outlets/i.test(electric.note || "")) return false;
  const note = permit.calculationNote || "";
  if (
    !note.includes(
      "Small Projects Plan Review $132.86 + Residential Plan Review Application Processing $106.72 + Residential building permit fee (base, \u22641,000 sq ft) $289.53 = $529.11",
    )
  ) {
    return false;
  }
  if (!/not in the \$529\.11 typical/.test(note)) return false;
  if (!/fee model is flat/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Austin deck Small Projects path.
 * Names the path and the recorded typical. Null for every other row.
 */
export function austinDeckSmallProjectsLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isAustinDeckSmallProjects(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on the Small Projects Plan Review path",
  );
}

/** Phoenix roof Table A row only. Other cities and other Phoenix jobs stay on the generic sentence. */
function isPhoenixRoofTableA(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "roof-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 558) || !sameMoney(permit.feeTypicalUsd, 646)) return false;
  if (!sameMoney(permit.feeHighUsd, 846)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "") || !sameMoney(plan.feeUsd, 323)) return false;
  if (!/100% of permit fee/.test(plan.note || "") || !/Included in totals/i.test(plan.note || "")) return false;
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit portion $323 + plan review $323 (100% of the permit fee) = $646")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $558 total") || !note.includes("high $22,000 = $846 total")) return false;
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  return true;
}

/** Phoenix HVAC Table A row only. Other cities and other Phoenix jobs stay on the generic sentence. */
function isPhoenixHvacTableA(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "hvac-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 243) || !sameMoney(permit.feeTypicalUsd, 558)) return false;
  if (!sameMoney(permit.feeHighUsd, 726)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 5000 || assumed.typical !== 7500 || assumed.high !== 16000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "") || !sameMoney(plan.feeUsd, 279)) return false;
  if (!/100% of permit fee/.test(plan.note || "") || !/Included in totals/i.test(plan.note || "")) return false;
  if (!/valuation > \$5,000/.test(plan.note || "")) return false;
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) return false;
  if (!/no separate mechanical permit/.test(permit.caveat || "")) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit portion $279 + plan review $279 (100% of the permit fee) = $558")) {
    return false;
  }
  if (!note.includes("Low $5,000 = $243 total") || !note.includes("high $16,000 = $726 total")) return false;
  if (!/no separate plan-review dollar/.test(note)) return false;
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  return true;
}

/** Phoenix kitchen Table A row only. Other cities and other Phoenix jobs stay on the generic sentence. */
function isPhoenixKitchenTableA(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "kitchen-remodel") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 706) || !sameMoney(permit.feeTypicalUsd, 1106)) return false;
  if (!sameMoney(permit.feeHighUsd, 1670.4)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "") || !sameMoney(plan.feeUsd, 553)) return false;
  if (!/100% of permit fee/.test(plan.note || "") || !/Included in totals/i.test(plan.note || "")) return false;
  if (!/Residential ≤\$50k/.test(plan.note || "") || !/valuation > \$5,000/.test(plan.note || "")) return false;
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) return false;
  if (!/Remodel existing building uses Table A/.test(permit.caveat || "")) return false;
  if (!/moving walls\/MEP does/.test(permit.caveat || "")) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit portion $553 + plan review $553 (100% of the permit fee) = $1,106")) {
    return false;
  }
  if (!note.includes("Low $15,000 = $706 total") || !note.includes("high $75,000 = $1,670.40 total")) return false;
  if (!/Residential ≤\$50k/.test(note)) return false;
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  return true;
}

/** Phoenix deck Table A row only. Other cities and other Phoenix jobs stay on the generic sentence. */
function isPhoenixDeckTableA(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "deck") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 558) || !sameMoney(permit.feeTypicalUsd, 646)) return false;
  if (!sameMoney(permit.feeHighUsd, 806)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan.name || "") || !sameMoney(plan.feeUsd, 323)) return false;
  if (!/100% of permit fee/.test(plan.note || "") || !/Included in totals/i.test(plan.note || "")) return false;
  if (!/Residential ≤\$50k/.test(plan.note || "") || !/valuation > \$5,000/.test(plan.note || "")) return false;
  if (!/Ordinance G-7465/.test(permit.sourceName || "") || !/Table A/.test(permit.sourceName || "")) return false;
  if (!/Unroofed patios are excluded from sf valuation rules/.test(permit.caveat || "")) return false;
  if (!/a deck still needs a permit based on project valuation/.test(permit.caveat || "")) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit portion $323 + plan review $323 (100% of the permit fee) = $646")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $558 total") || !note.includes("high $19,200 = $806 total")) return false;
  if (!/Residential ≤\$50k/.test(note)) return false;
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Phoenix deck Table A path.
 * Names PDD, Table A, and the recorded typical. Null for every other row.
 */
export function phoenixDeckTableALead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPhoenixDeckTableA(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on Table A (Ordinance G-7465)",
  );
}

/**
 * City-hub and money-page lead for the Phoenix kitchen Table A path.
 * Names PDD, Table A, and the recorded typical. Null for every other row.
 */
export function phoenixKitchenTableALead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPhoenixKitchenTableA(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on Table A (Ordinance G-7465)",
  );
}

/**
 * City-hub and money-page lead for the Phoenix HVAC Table A path.
 * Names PDD, Table A, and the recorded typical. Null for every other row.
 */
export function phoenixHvacTableALead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPhoenixHvacTableA(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on Table A (Ordinance G-7465)",
  );
}

/**
 * City-hub and money-page lead for the Phoenix roof Table A path.
 * Names PDD, Table A, and the recorded typical. Null for every other row.
 */
export function phoenixRoofTableALead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPhoenixRoofTableA(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on Table A (Ordinance G-7465)",
  );
}

/**
 * City-hub and money-page lead for the Austin HVAC Change-Out path.
 * Names the program and the recorded typical. Null for every other row.
 */
export function austinHvacChangeOutLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isAustinHvacChangeOut(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      shortDeptName(city) +
      " Change-Out Program fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " for a like-for-like first system",
  );
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
    if (/plan review/.test(n)) {
      // Seattle roof recorded extra "Plan review (STFI, 40% of DFI)" — ground STFI in name only.
      if (/\bstfi\b/.test(n)) return amt + " STFI plan review";
      return amt + " plan review";
    }
    if (/building permit|building valuation/.test(n)) return amt + " building";
    // Seattle HVAC Table D-8 mechanical equipment (typical 2-unit included dollars).
    if (/mechanical|equipment fee/.test(n)) return amt + " mechanical";
    // Charlotte HVAC TIP change-out (before "minimum" in the TIP label).
    if (/\btip\b/.test(n)) return amt + " TIP";
    // Charlotte kitchen Note a per-trade renovation/upfit (before bare dollar fallthrough).
    if (/renovation|upfit|per-trade/.test(n)) return amt + " trades";
    // Mecklenburg Homeowner Recovery Fund (Charlotte kitchen/deck).
    if (/homeowner recovery|recovery fund/.test(n)) return amt + " recovery";
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

/**
 * When the recorded typical path is Quick Permit with no plan review in totals
 * (and no multi-part fee note), return a short parenthetical for SERP/hero CTR.
 * Does not invent plan-review dollars for the unused alternate path.
 */
export function recordedQuickPermitPathNote(permit: Permit): string | null {
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return null;
  // Avoid stacking with multi-part fee parentheticals (Seattle/Atlanta/Nashville).
  if (recordedFeePartsNote(permit)) return null;
  const blob = [
    permit.caveat,
    permit.calculationNote,
    ...(permit.extras || []).map((e) => e.note || ""),
  ].join(" ");
  if (!/quick permit/i.test(blob)) return null;
  const planReviewExtras = (permit.extras || []).filter((e) =>
    /plan review/i.test(e.name || ""),
  );
  const planReviewNullInExtras =
    planReviewExtras.length > 0 &&
    planReviewExtras.every((e) => e.feeUsd == null);
  const noPlanReviewInBlob = /no plan review/i.test(blob);
  if (!planReviewNullInExtras && !noPlanReviewInBlob) return null;
  return "(Quick Permit; no plan review)";
}

/**
 * Hub tables and fee lists. Austin kitchen keeps the recorded $1,267.28.
 * Austin deck keeps the recorded $529.11.
 * Roof and HVAC stay on rounded usd().
 */
export function recordedHubPermitFeeLabel(permit: Permit): string {
  if (permit.feeTypicalUsd == null) return usd(permit.feeTypicalUsd);
  if (
    permit.citySlug === "austin-tx" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.feeModel === "tiered" &&
    permit.feeLowUsd == null &&
    permit.feeHighUsd == null &&
    sameMoney(permit.feeTypicalUsd, 1267.28)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "austin-tx" &&
    permit.projectSlug === "deck" &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 529.11) &&
    sameMoney(permit.feeHighUsd, 529.11) &&
    sameMoney(permit.feeTypicalUsd, 529.11)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  return usd(permit.feeTypicalUsd);
}

/** Typical fee dollars plus optional recorded parts/path note for SERP/hero CTR. */
export function recordedPermitFeeBit(permit: Permit): string {
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return usd(fee);
  const partsNote = recordedFeePartsNote(permit);
  const pathNote = partsNote ? null : recordedQuickPermitPathNote(permit);
  const note = partsNote || pathNote;
  return usd(fee) + (note ? " " + note : "");
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
    if (
      city.slug === "charlotte-nc" &&
      project.projectSlug === "roof-replacement" &&
      /160D-1110\(c\)\(5\)/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /\$40,000/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /like-for-like/i.test((permit?.caveat || "") + " " + (permit?.calculationNote || ""))
    ) {
      s +=
        " because a like-for-like reroof at or under $40,000 is exempt under N.C.G.S. 160D-1110(c)(5)";
    } else if (
      city.slug === "austin-tx" &&
      project.projectSlug === "roof-replacement" &&
      permit?.permitRequired === false &&
      /items 12/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /\b13\b/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /asphalt/i.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /Wildland-Urban Interface/i.test((permit?.caveat || "") + " " + (permit?.calculationNote || ""))
    ) {
      s +=
        " because an asphalt-on-asphalt reroof is exempt under Work Exempt residential items 12 and 13";
    } else if (mentionsExemption(permit) || permit?.permitRequired === false) {
      s += " because of a documented exemption";
    }
    return asSentence(s);
  }

  const kitchenLead = austinKitchenInteriorLead(city, project, permit);
  if (kitchenLead) return kitchenLead;

  const changeOutLead = austinHvacChangeOutLead(city, project, permit);
  if (changeOutLead) return changeOutLead;

  const deckLead = austinDeckSmallProjectsLead(city, project, permit);
  if (deckLead) return deckLead;

  const phoenixRoofLead = phoenixRoofTableALead(city, project, permit);
  if (phoenixRoofLead) return phoenixRoofLead;

  const phoenixHvacLead = phoenixHvacTableALead(city, project, permit);
  if (phoenixHvacLead) return phoenixHvacLead;

  const phoenixKitchenLead = phoenixKitchenTableALead(city, project, permit);
  if (phoenixKitchenLead) return phoenixKitchenLead;

  const phoenixDeckLead = phoenixDeckTableALead(city, project, permit);
  if (phoenixDeckLead) return phoenixDeckLead;

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
    const recordedTypical =
      isAustinHvacChangeOut(city, project, permit) ||
      isAustinKitchenInterior(city, project, permit) ||
      isAustinDeckSmallProjects(city, project, permit)
        ? moneyExact(permit.feeTypicalUsd)
        : usd(permit.feeTypicalUsd);
    p += ", is " + recordedTypical;
    if (permit.feeModel) p += ". Fee model: " + permit.feeModel.replace(/_/g, " ");
    out.push(asSentence(p));
  } else {
    let p = "The official permit fee was not extracted from the published schedule, so the permit line stays blank";
    if (permit?.sourceName) p += ". Source on file: " + permit.sourceName;
    if (permit?.retrievedDate) p += ", retrieved " + permit.retrievedDate;
    if (permit?.caveat) p += ". " + firstSentence(permit.caveat);
    out.push(asSentence(p));
  }

  const meta = projectMeta(project.projectSlug);
  let national =
    "The national typical for this job is " + usd(project.nationalTypical);
  // Unit-priced jobs (kitchen/deck per sqft) store nationalTypical as a rate,
  // not a whole-job total — append project.unit so copy does not read as $150 job.
  if (meta.pricing === "per-unit" && (project.unit || "").trim()) {
    national += " " + project.unit.trim();
  }
  national +=
    ". Materials stay at the national figure while labor is wage-indexed for " +
    label;
  out.push(asSentence(national));

  return out.slice(0, 4).map(keepHvac);
}
