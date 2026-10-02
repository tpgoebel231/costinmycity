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

export function moneyExact(n: number): string {
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

/** Minneapolis roof valuation row only. Minneapolis HVAC and Minneapolis deck have their own exact rows. Other Minneapolis jobs stay on rounded usd(). */
function minneapolisRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "minneapolis-mn" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 379.87) || !sameMoney(permit.feeTypicalUsd, 517.83)) return false;
  if (!sameMoney(permit.feeHighUsd, 862.73)) return false;
  return true;
}

function isMinneapolisRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "minneapolis-mn" || project.projectSlug !== "roof-replacement") return false;
  return minneapolisRoofExactRow(permit);
}

/** Minneapolis HVAC tiered row only. Other Minneapolis jobs stay on their own helpers or rounded usd(). */
function minneapolisHvacExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "minneapolis-mn" || permit.projectSlug !== "hvac-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 133.4) || !sameMoney(permit.feeTypicalUsd, 217.6)) return false;
  if (!sameMoney(permit.feeHighUsd, 217.6)) return false;
  return true;
}

function isMinneapolisHvacSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "minneapolis-mn" || project.projectSlug !== "hvac-replacement") return false;
  return minneapolisHvacExactRow(permit);
}

/** Minneapolis deck valuation row only. Other Minneapolis jobs stay on their own helpers or rounded usd(). */
function minneapolisDeckExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "minneapolis-mn" || permit.projectSlug !== "deck") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 379.87) || !sameMoney(permit.feeTypicalUsd, 517.83)) return false;
  if (!sameMoney(permit.feeHighUsd, 793.35)) return false;
  return true;
}

function isMinneapolisDeckSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "minneapolis-mn" || project.projectSlug !== "deck") return false;
  return minneapolisDeckExactRow(permit);
}

/** Miami roof valuation row only. Miami HVAC and Miami kitchen have their own exact rows. Other Miami jobs stay on rounded usd(). */
function miamiRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "miami-fl" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 158.8) || !sameMoney(permit.feeTypicalUsd, 161.2)) return false;
  if (!sameMoney(permit.feeHighUsd, 167.2)) return false;
  return true;
}

function isMiamiRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "miami-fl" || project.projectSlug !== "roof-replacement") return false;
  return miamiRoofExactRow(permit);
}

/** Miami HVAC valuation row only. Miami kitchen and Miami deck have their own exact rows. Other Miami jobs stay on rounded usd(). */
function miamiHvacExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "miami-fl" || permit.projectSlug !== "hvac-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 183) || !sameMoney(permit.feeTypicalUsd, 184.5)) return false;
  if (!sameMoney(permit.feeHighUsd, 198.8)) return false;
  return true;
}

function isMiamiHvacSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "miami-fl" || project.projectSlug !== "hvac-replacement") return false;
  return miamiHvacExactRow(permit);
}

/** Miami kitchen valuation row only. Other Miami jobs stay on their own helpers or rounded usd(). */
function miamiKitchenExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "miami-fl" || permit.projectSlug !== "kitchen-remodel") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 196) || !sameMoney(permit.feeTypicalUsd, 317.62)) return false;
  if (!sameMoney(permit.feeHighUsd, 634.38)) return false;
  return true;
}

function isMiamiKitchenSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "miami-fl" || project.projectSlug !== "kitchen-remodel") return false;
  return miamiKitchenExactRow(permit);
}

/** Miami deck valuation row only. Other Miami jobs stay on their own helpers or rounded usd(). */
function miamiDeckExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "miami-fl" || permit.projectSlug !== "deck") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 184.8) || !sameMoney(permit.feeTypicalUsd, 187.6)) return false;
  if (!sameMoney(permit.feeHighUsd, 207.76)) return false;
  return true;
}

function isMiamiDeckSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "miami-fl" || project.projectSlug !== "deck") return false;
  return miamiDeckExactRow(permit);
}

/** Houston deck area row only. Houston HVAC stays on its own helpers. Other Houston jobs stay on rounded usd(). */
function houstonDeckExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "houston-tx" || permit.projectSlug !== "deck") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "area") return false;
  if (!sameMoney(permit.feeLowUsd, 177.04) || !sameMoney(permit.feeTypicalUsd, 257.44)) return false;
  if (!sameMoney(permit.feeHighUsd, 305.68)) return false;
  return true;
}

function isHoustonDeckSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "houston-tx" || project.projectSlug !== "deck") return false;
  return houstonDeckExactRow(permit);
}

/** Philadelphia roof flat row only. Other Philadelphia jobs stay on rounded usd(). */
function philadelphiaRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "philadelphia-pa" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 76.5) || !sameMoney(permit.feeTypicalUsd, 76.5)) return false;
  if (!sameMoney(permit.feeHighUsd, 76.5)) return false;
  return true;
}

function isPhiladelphiaRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "philadelphia-pa" || project.projectSlug !== "roof-replacement") return false;
  return philadelphiaRoofExactRow(permit);
}

/** Detroit roof valuation row only. Other Detroit jobs stay on rounded usd(). */
function detroitRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "detroit-mi" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 475.97) || !sameMoney(permit.feeTypicalUsd, 612.33)) return false;
  if (!sameMoney(permit.feeHighUsd, 953.23)) return false;
  return true;
}

function isDetroitRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "detroit-mi" || project.projectSlug !== "roof-replacement") return false;
  return detroitRoofExactRow(permit);
}

/** San Antonio roof flat row only. San Antonio HVAC has its own exact row. Other San Antonio jobs stay on rounded usd(). */
function sanAntonioRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "san-antonio-tx" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 25) || !sameMoney(permit.feeTypicalUsd, 25)) return false;
  if (!sameMoney(permit.feeHighUsd, 25)) return false;
  return true;
}

function isSanAntonioRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "san-antonio-tx" || project.projectSlug !== "roof-replacement") return false;
  return sanAntonioRoofExactRow(permit);
}

/** San Antonio HVAC mechanical-device row only. Other San Antonio jobs stay on rounded usd(). */
function sanAntonioHvacExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "san-antonio-tx" || permit.projectSlug !== "hvac-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 56.25) || !sameMoney(permit.feeTypicalUsd, 65.85)) return false;
  if (!sameMoney(permit.feeHighUsd, 72.1)) return false;
  return true;
}

function isSanAntonioHvacSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "san-antonio-tx" || project.projectSlug !== "hvac-replacement") return false;
  return sanAntonioHvacExactRow(permit);
}

/** Tampa roof flat row only. Other Tampa jobs stay on rounded usd(). */
function tampaRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "tampa-fl" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 181.43) || !sameMoney(permit.feeTypicalUsd, 181.43)) return false;
  if (!sameMoney(permit.feeHighUsd, 181.43)) return false;
  return true;
}

function isTampaRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "tampa-fl" || project.projectSlug !== "roof-replacement") return false;
  return tampaRoofExactRow(permit);
}

/** Orlando HVAC valuation row only. Deck and kitchen stay on rounded usd(). */
function orlandoHvacExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "orlando-fl" || permit.projectSlug !== "hvac-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 113.67) || !sameMoney(permit.feeTypicalUsd, 147.75)) return false;
  if (!sameMoney(permit.feeHighUsd, 238.64)) return false;
  return true;
}

function isOrlandoHvacSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "orlando-fl" || project.projectSlug !== "hvac-replacement") return false;
  return orlandoHvacExactRow(permit);
}

/** Orlando roof valuation row only. Orlando HVAC has its own exact row. Deck and kitchen stay on rounded usd(). */
function orlandoRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "orlando-fl" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 108.88) || !sameMoney(permit.feeTypicalUsd, 127.93)) return false;
  if (!sameMoney(permit.feeHighUsd, 175.94)) return false;
  return true;
}

function isOrlandoRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "orlando-fl" || project.projectSlug !== "roof-replacement") return false;
  return orlandoRoofExactRow(permit);
}

/** Boston roof short-form row only. Other Boston jobs stay on rounded usd(). */
function bostonRoofExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "boston-ma" || permit.projectSlug !== "roof-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 100) || !sameMoney(permit.feeTypicalUsd, 140)) return false;
  if (!sameMoney(permit.feeHighUsd, 240)) return false;
  return true;
}

/** Boston HVAC gas + sheet-metal row only. Other Boston jobs stay on rounded usd(). */
function bostonHvacExactRow(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "boston-ma" || permit.projectSlug !== "hvac-replacement") {
    return false;
  }
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 120.4) || !sameMoney(permit.feeTypicalUsd, 122.2)) return false;
  if (!sameMoney(permit.feeHighUsd, 125.8)) return false;
  return true;
}

/** Denver deck ADMIN 138 row only. Other Denver jobs stay on rounded usd(). */
function isDenverDeckAdmin(permit: Permit | null | undefined): boolean {
  if (!permit || permit.citySlug !== "denver-co" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 124.5) || !sameMoney(permit.feeTypicalUsd, 172.5)) return false;
  if (!sameMoney(permit.feeHighUsd, 268.5)) return false;
  return true;
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

const PORTLAND_ROOF_SOURCE_URL =
  "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download";

/**
 * Portland roof: building-permit line plus the 12% Oregon surcharge.
 * Plan review stays unpriced. Other Portland jobs stay on the generic sentence.
 */
function isPortlandRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "portland-or" || project.projectSlug !== "roof-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 81.68) || !sameMoney(permit.feeTypicalUsd, 102.69)) return false;
  if (!sameMoney(permit.feeHighUsd, 155.22)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.sourceUrl !== PORTLAND_ROOF_SOURCE_URL) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "") || !sameMoney(building.feeUsd, 91.69)) {
    return false;
  }
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "") || !sameMoney(surcharge.feeUsd, 11)) {
    return false;
  }
  if (!/^Plan review \/ development services$/.test(plan.name || "") || plan.feeUsd != null) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit $91.69 + Oregon 12% state surcharge $11.00 = $102.69")) return false;
  if (!note.includes("Low $8,000 = $81.68 total") || !note.includes("high $22,000 = $155.22 total")) {
    return false;
  }
  if (!/not fully extracted/i.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Portland roof building-permit plus
 * surcharge path. Names PP&D and the recorded typical. Null for every other row.
 */
export function portlandRoofScheduleLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPortlandRoofSchedule(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded PP&D permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " (building permit plus the 12% Oregon surcharge only)",
  );
}

/**
 * Portland kitchen: building-permit line plus the 12% Oregon surcharge.
 * Plan review stays unpriced. Other Portland jobs stay on the generic sentence.
 */
function isPortlandKitchenSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "portland-or" || project.projectSlug !== "kitchen-remodel") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 118.45) || !sameMoney(permit.feeTypicalUsd, 210.07)) return false;
  if (!sameMoney(permit.feeHighUsd, 334.22)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.sourceUrl !== PORTLAND_ROOF_SOURCE_URL) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "") || !sameMoney(building.feeUsd, 187.56)) {
    return false;
  }
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "") || !sameMoney(surcharge.feeUsd, 22.51)) {
    return false;
  }
  if (!/^Plan review \/ development services$/.test(plan.name || "") || plan.feeUsd != null) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit $187.56 + Oregon 12% state surcharge $22.51 = $210.07")) return false;
  if (!note.includes("Low $15,000 = $118.45 total") || !note.includes("high $75,000 = $334.22 total")) {
    return false;
  }
  if (!/not fully extracted/i.test(note)) return false;
  if (!/plumbing, electrical, and mechanical schedules are not in this total/i.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Portland kitchen building-permit plus
 * surcharge path. Names PP&D and the recorded typical. Null for every other row.
 */
export function portlandKitchenScheduleLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPortlandKitchenSchedule(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded PP&D permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " (building permit plus the 12% Oregon surcharge only)",
  );
}

/**
 * Portland deck: building-permit line plus the 12% Oregon surcharge.
 * Plan review stays unpriced. Other Portland jobs stay on the generic sentence.
 */
function isPortlandDeckSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "portland-or" || project.projectSlug !== "deck") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 81.68) || !sameMoney(permit.feeTypicalUsd, 102.69)) return false;
  if (!sameMoney(permit.feeHighUsd, 144.72)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.sourceUrl !== PORTLAND_ROOF_SOURCE_URL) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  if (!/^Building permit \(PP&D table\)$/.test(building.name || "") || !sameMoney(building.feeUsd, 91.69)) {
    return false;
  }
  if (!/^Oregon 12% state surcharge$/.test(surcharge.name || "") || !sameMoney(surcharge.feeUsd, 11)) {
    return false;
  }
  if (!/^Plan review \/ development services$/.test(plan.name || "") || plan.feeUsd != null) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("building permit $91.69 + Oregon 12% state surcharge $11.00 = $102.69")) return false;
  if (!note.includes("Low $8,000 = $81.68 total") || !note.includes("high $19,200 = $144.72 total")) {
    return false;
  }
  if (!/not fully extracted/i.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Portland deck building-permit plus
 * surcharge path. Names PP&D and the recorded typical. Null for every other row.
 */
export function portlandDeckScheduleLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isPortlandDeckSchedule(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded PP&D permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " (building permit plus the 12% Oregon surcharge only)",
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

const TUCSON_ROOF_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";

/** Tucson roof Table 4-02.4 row only. Other cities and other Tucson jobs stay on the generic sentence. */
function isTucsonRoofTable(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "tucson-az" || project.projectSlug !== "roof-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 245.69) || !sameMoney(permit.feeTypicalUsd, 337.49)) return false;
  if (!sameMoney(permit.feeHighUsd, 566.99)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras.find((e) => (e.name || "") === "4-02.4 Construction Valuation Table");
  const digital = extras.find((e) => (e.name || "") === "Digital filing 1%, min $18.54");
  if (!table || !sameMoney(table.feeUsd, 318.95) || (table.note || "") !== "Included.") return false;
  if (!digital || !sameMoney(digital.feeUsd, 18.54) || (digital.note || "") !== "Included.") return false;
  if (permit.sourceUrl !== TUCSON_ROOF_SOURCE_URL) return false;
  if (!/FY27/.test(permit.sourceName || "") || !/Table 4-02\.4|effective July 1, 2026/.test(permit.sourceName || "")) {
    return false;
  }
  const note = permit.calculationNote || "";
  if (!note.includes("valuation-table portion $318.95 + digital filing $18.54 = $337.49")) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $22,000 = $566.99 total")) return false;
  if (!/Table 4-02\.4/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Tucson roof Table 4-02.4 path.
 * Names PDSD, Table 4-02.4, and the recorded typical. Null for every other row.
 */
export function tucsonRoofTableLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isTucsonRoofTable(city, project, permit)) return null;
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
      " on Table 4-02.4",
  );
}

/** Tucson HVAC 4-02.9 trade-permit row only. Other cities and other Tucson jobs stay on the generic sentence. */
function isTucsonHvacTrade(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "tucson-az" || project.projectSlug !== "hvac-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 168.54) || !sameMoney(permit.feeTypicalUsd, 218.54)) return false;
  if (!sameMoney(permit.feeHighUsd, 218.54)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const first = extras.find((e) => (e.name || "") === "Trade permit first item (AC/heater replace, max 2)");
  const additional = extras.find((e) => (e.name || "") === "Each additional trade item");
  const digital = extras.find((e) => (e.name || "") === "Digital filing 1%, min $18.54");
  if (!first || !sameMoney(first.feeUsd, 150) || (first.note || "") !== "Included.") return false;
  if (!additional || !sameMoney(additional.feeUsd, 50) || (additional.note || "") !== "Second unit in typical. Included.") {
    return false;
  }
  if (!digital || !sameMoney(digital.feeUsd, 18.54) || (digital.note || "") !== "Included.") return false;
  if (permit.sourceUrl !== TUCSON_ROOF_SOURCE_URL) return false;
  if (!/4-02\.9 Trade Permits/.test(permit.sourceName || "")) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("first trade item $150 + digital filing min $18.54 = $168.54")) return false;
  if (!note.includes("each additional trade item $50 + digital filing $18.54 = $218.54")) return false;
  if (!/4-02\.9 Trade Permits/.test(note)) return false;
  if (!/not the valuation table/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Tucson HVAC 4-02.9 trade path.
 * Names PDSD, 4-02.9, and the recorded typical. Null for every other row.
 */
export function tucsonHvacTradeLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isTucsonHvacTrade(city, project, permit)) return null;
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
      " on 4-02.9 Trade Permits",
  );
}

/** Tucson kitchen Table 4-02.4 row only. Other cities and other Tucson jobs stay on the generic sentence. */
function isTucsonKitchenTable(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "tucson-az" || project.projectSlug !== "kitchen-remodel") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 406.34) || !sameMoney(permit.feeTypicalUsd, 804.14)) return false;
  if (!sameMoney(permit.feeHighUsd, 1297.59)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const table = extras.find((e) => (e.name || "") === "4-02.4 Construction Valuation Table");
  const digital = extras.find((e) => (e.name || "") === "Digital filing 1%, min $18.54");
  const trade = extras.find((e) => (e.name || "") === "Trade permits (plumbing fixture / electrical circuit)");
  if (!table || !sameMoney(table.feeUsd, 785.6) || (table.note || "") !== "Included.") return false;
  if (!digital || !sameMoney(digital.feeUsd, 18.54) || (digital.note || "") !== "Included.") return false;
  if (!trade || trade.feeUsd != null) return false;
  if (!/not added to the building total/i.test(trade.note || "")) return false;
  if (permit.sourceUrl !== TUCSON_ROOF_SOURCE_URL) return false;
  if (!/FY27/.test(permit.sourceName || "") || !/effective July 1, 2026/.test(permit.sourceName || "")) {
    return false;
  }
  const note = permit.calculationNote || "";
  if (!note.includes("valuation-table portion $785.60 + digital filing $18.54 = $804.14")) return false;
  if (!note.includes("Low $15,000 = $406.34 total") || !note.includes("high $75,000 = $1,297.59 total")) return false;
  if (!/Table 4-02\.4/.test(note)) return false;
  if (!/not added to the building total/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Tucson kitchen Table 4-02.4 path.
 * Names PDSD, Table 4-02.4, and the recorded typical. Null for every other row.
 */
export function tucsonKitchenTableLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isTucsonKitchenTable(city, project, permit)) return null;
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
      " on Table 4-02.4",
  );
}

/** Tucson deck Table 4-02.4 row only. Other cities and other Tucson jobs stay on the generic sentence. */
function isTucsonDeckTable(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "tucson-az" || project.projectSlug !== "deck") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 245.69) || !sameMoney(permit.feeTypicalUsd, 337.49)) return false;
  if (!sameMoney(permit.feeHighUsd, 521.09)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras.find((e) => (e.name || "") === "4-02.4 Construction Valuation Table");
  const digital = extras.find((e) => (e.name || "") === "Digital filing 1%, min $18.54");
  if (!table || !sameMoney(table.feeUsd, 318.95) || (table.note || "") !== "Included.") return false;
  if (!digital || !sameMoney(digital.feeUsd, 18.54) || (digital.note || "") !== "Included.") return false;
  if (permit.sourceUrl !== TUCSON_ROOF_SOURCE_URL) return false;
  if (!/FY27/.test(permit.sourceName || "") || !/effective July 1, 2026/.test(permit.sourceName || "")) {
    return false;
  }
  const note = permit.calculationNote || "";
  if (!note.includes("valuation-table portion $318.95 + digital filing $18.54 = $337.49")) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $19,200 = $521.09 total")) return false;
  if (!/Table 4-02\.4/.test(note)) return false;
  if (!/new-construction valuation table/.test(note)) return false;
  if (!/Shade-structure line points to the same building-permit table/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Tucson deck Table 4-02.4 path.
 * Names PDSD, Table 4-02.4, and the recorded typical. Null for every other row.
 */
export function tucsonDeckTableLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isTucsonDeckTable(city, project, permit)) return null;
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
      " on Table 4-02.4",
  );
}

const RALEIGH_ROOF_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";

/**
 * Raleigh roof FY27 Level 1 alteration row only.
 * Other cities and other Raleigh jobs stay on the generic sentence.
 */
function isRaleighRoofGuide(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "roof-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 248) || !sameMoney(permit.feeTypicalUsd, 248)) return false;
  if (!sameMoney(permit.feeHighUsd, 248)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.sourceUrl !== RALEIGH_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide (Jul 1, 2026–Jun 30, 2027)") {
    return false;
  }
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level1 = extras.find(
    (e) => (e.name || "") === "Level 1 alteration building permit (28% of 0.38% value, min $124)",
  );
  const plan = extras.find(
    (e) => (e.name || "") === "Alteration plan review (55% of building-permit base, min $124)",
  );
  if (!level1 || !sameMoney(level1.feeUsd, 124)) return false;
  if (!plan || !sameMoney(plan.feeUsd, 124)) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("Level 1 alteration building permit $124 + alteration plan review $124 = $248")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $248 total") || !note.includes("high $22,000 = $248 total")) return false;
  if (!/\$124 \+ \$124 = \$248/.test(note)) return false;
  if (!/Like-for-like covering replacement is Level 1/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Raleigh roof Level 1 path.
 * Names the FY27 guide and the recorded $248 floor. Null for every other row.
 */
export function raleighRoofGuideLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isRaleighRoofGuide(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      city.permitDeptName +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on the Level 1 alteration path (building permit $124 + plan review $124)",
  );
}

const NASHVILLE_ROOF_SOURCE_URL =
  "https://www.nashville.gov/sites/default/files/2025-12/Building-Permit-Fee-Scheudle-2025.pdf";
const NASHVILLE_ROOF_SOURCE_NAME = "Metro Nashville Codes Fee Schedule (16.28.110), Dec 2025 PDF";

/**
 * Nashville roof 16.28.110 A.1 valuation row only.
 * Other cities and other Nashville jobs stay on the generic sentence.
 */
function isNashvilleRoofSchedule(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "nashville-tn" || project.projectSlug !== "roof-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!sameMoney(permit.feeLowUsd, 69) || !sameMoney(permit.feeTypicalUsd, 91)) return false;
  if (!sameMoney(permit.feeHighUsd, 146)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.sourceUrl !== NASHVILLE_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== NASHVILLE_ROOF_SOURCE_NAME) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const building = extras.find((e) => (e.name || "") === "Building valuation fee ($5 / $1,000)");
  const tech = extras.find((e) => (e.name || "") === "Codes tech fee (10% of valuation fee)");
  const zoning = extras.find((e) => (e.name || "") === "Zoning examination");
  const plan = extras.find((e) => (e.name || "") === "Plan review (1-2 family reroof)");
  if (!building || !sameMoney(building.feeUsd, 60)) return false;
  if (!tech || !sameMoney(tech.feeUsd, 6)) return false;
  if (!zoning || !sameMoney(zoning.feeUsd, 25)) return false;
  if (!plan || plan.feeUsd != null) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("Typical $12,000: $5 × 12 = $60")) return false;
  if (!note.includes("Low $8,000: $5 × 8 = $40")) return false;
  if (!note.includes("High $22,000: $5 × 22 = $110")) return false;
  if (!/feeLowUsd \$69/.test(note) || !/feeTypicalUsd \$91/.test(note) || !/feeHighUsd \$146/.test(note)) {
    return false;
  }
  if (!/Plan review is exempt for a 1-2 family reroof/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Nashville roof valuation path.
 * Names 16.28.110 A.1 and points at the calculation note for band math.
 * Null for every other row.
 */
export function nashvilleRoofScheduleLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isNashvilleRoofSchedule(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      city.permitDeptName +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " under 16.28.110 A.1 ($5 per $1,000 + 10% codes tech + $25 zoning). Low and high bands are in the calculation note on this page",
  );
}

const RALEIGH_HVAC_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";

/**
 * Raleigh HVAC FY27 minimum-trade row only.
 * Other cities and other Raleigh jobs stay on the generic sentence.
 */
function isRaleighHvacTrade(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "hvac-replacement") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sameMoney(permit.feeLowUsd, 124) || !sameMoney(permit.feeTypicalUsd, 124)) return false;
  if (!sameMoney(permit.feeHighUsd, 248)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.sourceUrl !== RALEIGH_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide — Minimum Trade Permit Fee") {
    return false;
  }
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const mechanical = extras.find((e) => (e.name || "") === "Minimum trade permit (mechanical)");
  const electrical = extras.find(
    (e) => (e.name || "") === "Second trade (electrical) if new circuit/disconnect",
  );
  if (!mechanical || !sameMoney(mechanical.feeUsd, 124)) return false;
  if (!electrical || !sameMoney(electrical.feeUsd, 124)) return false;
  if ((electrical.note || "") !== "Included in high only.") return false;
  const note = permit.calculationNote || "";
  if (!note.includes("$124 + $124 = $248")) return false;
  if (!/Like-for-like change-out typically one mechanical trade/.test(note)) return false;
  if (!/recorded low and typical fees are each \$124/.test(note)) return false;
  if (!/not recorded as feeUsd must not be invented/.test(note)) return false;
  return true;
}

const RALEIGH_KITCHEN_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";

/**
 * Raleigh kitchen FY27 Level 2 row only.
 * Other cities and other Raleigh jobs stay on the generic sentence.
 */
function isRaleighKitchenGuide(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "kitchen-remodel") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 496) || !sameMoney(permit.feeTypicalUsd, 496)) return false;
  if (!sameMoney(permit.feeHighUsd, 547.25)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.sourceUrl !== RALEIGH_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) {
    return false;
  }
  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const level2 = extras.find(
    (e) => (e.name || "") === "Level 2 alteration building (50% of 0.38% value, min $124)",
  );
  const plan = extras.find((e) => (e.name || "") === "Plan review (55%, min $124)");
  const elec = extras.find((e) => (e.name || "") === "Electrical trade (minimum)");
  const plumb = extras.find((e) => (e.name || "") === "Plumbing trade (minimum)");
  if (!level2 || !sameMoney(level2.feeUsd, 124)) return false;
  if (!plan || !sameMoney(plan.feeUsd, 124)) return false;
  if (!elec || !sameMoney(elec.feeUsd, 124)) return false;
  if (!plumb || !sameMoney(plumb.feeUsd, 124)) return false;
  const note = permit.calculationNote || "";
  if (!note.includes("$124 + $124 + $124 + $124 = $496")) return false;
  if (!note.includes("$142.50 + $156.75 + $124 + $124 = $547.25")) return false;
  if (!/Same-layout cabinet-only may need fewer trades/.test(note)) return false;
  if (!/Do not invent amounts not recorded as feeUsd/.test(note)) return false;
  return true;
}

const RALEIGH_DECK_SOURCE_URL =
  "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf";

/**
 * Raleigh deck FY27 Level 2 alteration row only.
 * Other cities and other Raleigh jobs stay on the generic sentence.
 */
function isRaleighDeckGuide(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): boolean {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "deck") return false;
  if (!permit || permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sameMoney(permit.feeLowUsd, 248) || !sameMoney(permit.feeTypicalUsd, 248)) return false;
  if (!sameMoney(permit.feeHighUsd, 248)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.sourceUrl !== RALEIGH_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) {
    return false;
  }
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level2 = extras.find(
    (e) =>
      (e.name || "") ===
      "Level 2 alteration / new accessory structure path (50% of 0.38% value, min $124)",
  );
  const plan = extras.find((e) => (e.name || "") === "Plan review (55%, min $124)");
  if (!level2 || !sameMoney(level2.feeUsd, 124)) return false;
  if (!plan || !sameMoney(plan.feeUsd, 124)) return false;
  const note = permit.calculationNote || "";
  if (
    !note.includes(
      "Level 2 alteration / new accessory structure path $124 + plan review $124 = $248",
    )
  ) {
    return false;
  }
  if (!note.includes("Low $8,000 = $248 total") || !note.includes("high $19,200 = $248 total")) {
    return false;
  }
  if (!/\$124 \+ \$124 = \$248/.test(note)) return false;
  if (!/Level 2 is 50% of 0\.38% of value/.test(note)) return false;
  if (!/still usually the \$124 floor at these sizes/.test(note)) return false;
  if (!/Do not invent amounts not recorded as feeUsd/.test(note)) return false;
  return true;
}

/**
 * City-hub and money-page lead for the Raleigh deck Level 2 path.
 * Names the FY27 guide and the recorded $248 floor. Null for every other row.
 */
export function raleighDeckGuideLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isRaleighDeckGuide(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      city.permitDeptName +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on the Level 2 alteration path (Level 2 $124 + plan review $124)",
  );
}

/**
 * City-hub and money-page lead for the Raleigh kitchen Level 2 path.
 * Names the FY27 guide and the recorded $496 floor. Null for every other row.
 */
export function raleighKitchenGuideLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isRaleighKitchenGuide(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      city.permitDeptName +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on the Level 2 alteration path (building $124 + plan review $124 + electrical $124 + plumbing $124)",
  );
}

/**
 * City-hub and money-page lead for the Raleigh HVAC minimum-trade path.
 * Names the FY27 guide and the recorded $124 mechanical minimum. Null for every other row.
 */
export function raleighHvacTradeLead(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || permit.feeTypicalUsd == null || !isRaleighHvacTrade(city, project, permit)) return null;
  const est = buildEstimate(project, city, permit);
  return asSentence(
    "A typical " +
      jobPhrase(project) +
      " in " +
      cityLabel(city) +
      " runs about " +
      usd(est.allInTypical) +
      " all-in on our wage-indexed model, including the recorded " +
      city.permitDeptName +
      " permit fee of " +
      moneyExact(permit.feeTypicalUsd) +
      " on the FY27 minimum trade permit (one mechanical trade)",
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
  const exactCents =
    isDenverDeckAdmin(permit) ||
    minneapolisRoofExactRow(permit) ||
    minneapolisHvacExactRow(permit) ||
    minneapolisDeckExactRow(permit) ||
    miamiRoofExactRow(permit) ||
    miamiHvacExactRow(permit) ||
    miamiKitchenExactRow(permit) ||
    miamiDeckExactRow(permit) ||
    houstonDeckExactRow(permit) ||
    philadelphiaRoofExactRow(permit) ||
    detroitRoofExactRow(permit) ||
    sanAntonioRoofExactRow(permit) ||
    sanAntonioHvacExactRow(permit) ||
    tampaRoofExactRow(permit) ||
    orlandoRoofExactRow(permit) ||
    orlandoHvacExactRow(permit) ||
    bostonRoofExactRow(permit) ||
    bostonHvacExactRow(permit);
  const bits = parts.map((e) => {
    const n = (e.name || "").toLowerCase();
    const amt = exactCents ? moneyExact(e.feeUsd as number) : usd(e.feeUsd as number);
    if (miamiRoofExactRow(permit)) {
      if (/city permit/.test(n)) return amt + " city permit";
      if (/application/.test(n)) return amt + " application";
      if (/553\.721|468\.631/.test(n)) return amt + " state";
      if (/8-12|miami-dade/.test(n)) return amt + " county";
    }
    if (bostonRoofExactRow(permit)) {
      if (/short-form/.test(n)) return amt + " short-form";
      if (/1,000/.test(n)) return amt + " per $1,000";
    }
    if (bostonHvacExactRow(permit)) {
      if (/gas furnace/.test(n)) return amt + " gas furnace";
      if (/sheet metal/.test(n)) return amt + " sheet metal";
    }
    if (sanAntonioHvacExactRow(permit)) {
      if (/basic heating/.test(n)) return amt + " basic mechanical";
      if (/gas furnace/.test(n)) return amt + " gas furnace";
      if (/condensing unit|heat pump|air handler/.test(n)) return amt + " device";
    }
    if (houstonDeckExactRow(permit)) {
      if (/administrative/.test(n)) return amt + " admin";
      if (/type vb|new-construction/.test(n)) return amt + " Type VB";
    }
    if (philadelphiaRoofExactRow(permit)) {
      if (/roof covering/.test(n)) return amt + " roof covering";
      if (/city \$3|pa state/.test(n)) return amt + " city and state";
    }
    if (tampaRoofExactRow(permit)) {
      if (/roofing/.test(n)) return amt + " roofing";
      if (/surcharge/.test(n)) return amt + " FL surcharge";
    }
    if (orlandoRoofExactRow(permit)) {
      if (/building permit fee/.test(n)) return amt + " BLD";
      if (/administrative inspection/.test(n)) return amt + " AIF";
      if (/operational trust/.test(n)) return amt + " trust";
      if (/technology/.test(n)) return amt + " tech";
      if (/concurrency/.test(n)) return amt + " concurrency";
    }
    if (orlandoHvacExactRow(permit)) {
      if (/mechanical/.test(n)) return amt + " mechanical";
      if (/technology/.test(n)) return amt + " tech";
    }
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
 * Tucson roof keeps the recorded $337.49.
 * Tucson HVAC keeps the recorded $218.54.
 * Tucson kitchen keeps the recorded $804.14.
 * Tucson deck keeps the recorded $337.49.
 * Portland roof keeps the recorded $102.69.
 * Portland kitchen keeps the recorded $210.07.
 * Portland deck keeps the recorded $102.69.
 * Miami HVAC keeps the recorded $184.50.
 * Minneapolis HVAC keeps the recorded $217.60.
 * Minneapolis deck keeps the recorded $517.83.
 * Houston deck keeps the recorded $257.44.
 * Philadelphia roof keeps the recorded $76.50.
 * Detroit roof keeps the recorded $612.33.
 * San Antonio roof keeps the recorded $25.
 * San Antonio HVAC keeps the recorded $65.85.
 * Tampa roof keeps the recorded $181.43.
 * Orlando roof keeps the recorded $127.93.
 * Orlando HVAC keeps the recorded $147.75.
 * Miami kitchen keeps the recorded $317.62.
 * Miami deck keeps the recorded $187.60.
 * Boston HVAC keeps the recorded $122.20.
 * Other roof and HVAC rows stay on rounded usd().
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
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "roof-replacement" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeHighUsd, 566.99) &&
    sameMoney(permit.feeTypicalUsd, 337.49)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 168.54) &&
    sameMoney(permit.feeHighUsd, 218.54) &&
    sameMoney(permit.feeTypicalUsd, 218.54)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 406.34) &&
    sameMoney(permit.feeHighUsd, 1297.59) &&
    sameMoney(permit.feeTypicalUsd, 804.14)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "deck" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeHighUsd, 521.09) &&
    sameMoney(permit.feeTypicalUsd, 337.49)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "roof-replacement" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeHighUsd, 155.22) &&
    sameMoney(permit.feeTypicalUsd, 102.69)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 118.45) &&
    sameMoney(permit.feeHighUsd, 334.22) &&
    sameMoney(permit.feeTypicalUsd, 210.07)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "deck" &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeHighUsd, 144.72) &&
    sameMoney(permit.feeTypicalUsd, 102.69)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (miamiHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (minneapolisHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (minneapolisDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (houstonDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (philadelphiaRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (detroitRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (sanAntonioRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (sanAntonioHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (tampaRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (orlandoRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (orlandoHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (miamiKitchenExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (miamiDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (bostonHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  return usd(permit.feeTypicalUsd);
}

/**
 * Compare-table permit cell. Tucson roof, Tucson HVAC, Tucson kitchen, Tucson deck, Portland roof,
 * Portland kitchen, and Portland deck keep recorded cents. Miami HVAC keeps the
 * recorded $184.50. Minneapolis HVAC keeps the recorded $217.60. Minneapolis deck keeps the recorded $517.83. Houston deck keeps the recorded $257.44. Philadelphia roof keeps the recorded $76.50. Detroit roof keeps the recorded $612.33. San Antonio roof keeps the recorded $25. San Antonio HVAC keeps the recorded $65.85. Tampa roof keeps the recorded $181.43. Orlando roof keeps the recorded $127.93. Orlando HVAC keeps the recorded $147.75. Miami kitchen keeps the recorded $317.62. Miami deck keeps the recorded $187.60. Boston HVAC keeps the recorded $122.20. Other rows stay on rounded usd(),
 * including Austin kitchen and deck, which already use exact cents only on
 * the city-hub label.
 */
export function clusterPermitFeeLabel(permit: Permit): string {
  if (permit.feeTypicalUsd == null) return usd(permit.feeTypicalUsd);
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeHighUsd, 566.99) &&
    sameMoney(permit.feeTypicalUsd, 337.49)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 168.54) &&
    sameMoney(permit.feeHighUsd, 218.54) &&
    sameMoney(permit.feeTypicalUsd, 218.54)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(permit.feeLowUsd, 406.34) &&
    sameMoney(permit.feeHighUsd, 1297.59) &&
    sameMoney(permit.feeTypicalUsd, 804.14)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "deck" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeHighUsd, 521.09) &&
    sameMoney(permit.feeTypicalUsd, 337.49)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeTypicalUsd, 102.69) &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeHighUsd, 155.22)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(permit.feeTypicalUsd, 210.07) &&
    sameMoney(permit.feeLowUsd, 118.45) &&
    sameMoney(permit.feeHighUsd, 334.22)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "deck" &&
    sameMoney(permit.feeTypicalUsd, 102.69) &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeHighUsd, 144.72)
  ) {
    return moneyExact(permit.feeTypicalUsd);
  }
  if (isDenverDeckAdmin(permit)) return moneyExact(permit.feeTypicalUsd);
  if (minneapolisHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (minneapolisDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (houstonDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (philadelphiaRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (detroitRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (sanAntonioRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (sanAntonioHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (tampaRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (orlandoRoofExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (orlandoHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (miamiHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (miamiKitchenExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (miamiDeckExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  if (bostonHvacExactRow(permit)) return moneyExact(permit.feeTypicalUsd);
  return usd(permit.feeTypicalUsd);
}

/** Typical fee dollars plus optional recorded parts/path note for SERP/hero CTR. */
export function recordedPermitFeeBit(permit: Permit): string {
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return usd(fee);
  const partsNote = recordedFeePartsNote(permit);
  const pathNote = partsNote ? null : recordedQuickPermitPathNote(permit);
  const note = partsNote || pathNote;
  const feeLabel =
    isDenverDeckAdmin(permit) ||
    minneapolisRoofExactRow(permit) ||
    minneapolisHvacExactRow(permit) ||
    minneapolisDeckExactRow(permit) ||
    houstonDeckExactRow(permit) ||
    philadelphiaRoofExactRow(permit) ||
    detroitRoofExactRow(permit) ||
    sanAntonioRoofExactRow(permit) ||
    sanAntonioHvacExactRow(permit) ||
    tampaRoofExactRow(permit) ||
    orlandoRoofExactRow(permit) ||
    orlandoHvacExactRow(permit) ||
    miamiRoofExactRow(permit) ||
    miamiHvacExactRow(permit) ||
    miamiKitchenExactRow(permit) ||
    miamiDeckExactRow(permit) ||
    bostonRoofExactRow(permit) ||
    bostonHvacExactRow(permit)
      ? moneyExact(fee)
      : usd(fee);
  return feeLabel + (note ? " " + note : "");
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
    } else if (
      city.slug === "chicago-il" &&
      project.projectSlug === "roof-replacement" &&
      permit?.permitRequired === false &&
      permit?.feeModel === "none" &&
      sameMoney(permit?.feeLowUsd, 0) &&
      sameMoney(permit?.feeTypicalUsd, 0) &&
      sameMoney(permit?.feeHighUsd, 0) &&
      /Group R/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /2:12/.test((permit?.caveat || "") + " " + (permit?.calculationNote || "")) &&
      /no structural work/.test((permit?.caveat || "") + " " + (permit?.calculationNote || ""))
    ) {
      s +=
        " because a Group R building of 4 stories or fewer with pitch at least 2:12 and no structural work is exempt";
    } else if (
      city.slug === "chicago-il" &&
      project.projectSlug === "hvac-replacement" &&
      permit?.permitRequired === false &&
      permit?.feeModel === "none" &&
      sameMoney(permit?.feeLowUsd, 0) &&
      sameMoney(permit?.feeTypicalUsd, 0) &&
      sameMoney(permit?.feeHighUsd, 0) &&
      /in-kind furnace, boiler, or air conditioning appliance/.test(
        (permit?.caveat || "") + " " + (permit?.calculationNote || ""),
      ) &&
      /Group R building of 4 stories or fewer/.test(
        (permit?.caveat || "") + " " + (permit?.calculationNote || ""),
      ) &&
      /Valuation is not an input/.test((permit?.caveat || "") + " " + (permit?.calculationNote || ""))
    ) {
      s +=
        " because an in-kind furnace, boiler, or AC appliance swap in a Group R building of 4 stories or fewer is exempt";
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

  const tucsonRoofLead = tucsonRoofTableLead(city, project, permit);
  if (tucsonRoofLead) return tucsonRoofLead;

  const tucsonHvacLead = tucsonHvacTradeLead(city, project, permit);
  if (tucsonHvacLead) return tucsonHvacLead;

  const tucsonKitchenLead = tucsonKitchenTableLead(city, project, permit);
  if (tucsonKitchenLead) return tucsonKitchenLead;

  const tucsonDeckLead = tucsonDeckTableLead(city, project, permit);
  if (tucsonDeckLead) return tucsonDeckLead;

  const raleighRoofLead = raleighRoofGuideLead(city, project, permit);
  if (raleighRoofLead) return raleighRoofLead;

  const nashvilleRoofLead = nashvilleRoofScheduleLead(city, project, permit);
  if (nashvilleRoofLead) return nashvilleRoofLead;

  const raleighHvacLead = raleighHvacTradeLead(city, project, permit);
  if (raleighHvacLead) return raleighHvacLead;

  const raleighKitchenLead = raleighKitchenGuideLead(city, project, permit);
  if (raleighKitchenLead) return raleighKitchenLead;

  const raleighDeckLead = raleighDeckGuideLead(city, project, permit);
  if (raleighDeckLead) return raleighDeckLead;

  const portlandRoofLead = portlandRoofScheduleLead(city, project, permit);
  if (portlandRoofLead) return portlandRoofLead;

  const portlandKitchenLead = portlandKitchenScheduleLead(city, project, permit);
  if (portlandKitchenLead) return portlandKitchenLead;

  const portlandDeckLead = portlandDeckScheduleLead(city, project, permit);
  if (portlandDeckLead) return portlandDeckLead;

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
      isAustinDeckSmallProjects(city, project, permit) ||
      isTucsonRoofTable(city, project, permit) ||
      isTucsonHvacTrade(city, project, permit) ||
      isTucsonKitchenTable(city, project, permit) ||
      isTucsonDeckTable(city, project, permit) ||
      isPortlandRoofSchedule(city, project, permit) ||
      isPortlandKitchenSchedule(city, project, permit) ||
      isPortlandDeckSchedule(city, project, permit) ||
      isDenverDeckAdmin(permit) ||
      isMinneapolisRoofSchedule(city, project, permit) ||
      isMinneapolisHvacSchedule(city, project, permit) ||
      isMinneapolisDeckSchedule(city, project, permit) ||
      isHoustonDeckSchedule(city, project, permit) ||
      isPhiladelphiaRoofSchedule(city, project, permit) ||
      isDetroitRoofSchedule(city, project, permit) ||
      isSanAntonioRoofSchedule(city, project, permit) ||
      isSanAntonioHvacSchedule(city, project, permit) ||
      isTampaRoofSchedule(city, project, permit) ||
      isOrlandoRoofSchedule(city, project, permit) ||
      isOrlandoHvacSchedule(city, project, permit) ||
      isMiamiRoofSchedule(city, project, permit) ||
      isMiamiHvacSchedule(city, project, permit) ||
      isMiamiKitchenSchedule(city, project, permit) ||
      isMiamiDeckSchedule(city, project, permit) ||
      bostonRoofExactRow(permit) ||
      bostonHvacExactRow(permit)
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
