import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { moneyExact, recordedFeePartsNote, recordedQuickPermitPathNote, shortDeptName } from "@/lib/sourcing";
import {
  austinDeckPageCopy,
  austinHvacPageCopy,
  austinKitchenPageCopy,
  austinRoofPageCopy,
  phoenixDeckPageCopy,
  phoenixHvacPageCopy,
  phoenixKitchenPageCopy,
  phoenixRoofPageCopy,
  portlandDeckPageCopy,
  portlandKitchenPageCopy,
  portlandRoofPageCopy,
  raleighDeckPageCopy,
  raleighHvacPageCopy,
  raleighKitchenPageCopy,
  raleighRoofPageCopy,
  tucsonDeckPageCopy,
  tucsonHvacPageCopy,
  tucsonKitchenPageCopy,
  tucsonRoofPageCopy,
  denverDeckPageCopy,
  denverKitchenPageCopy,
  nashvilleRoofPageCopy,
  charlotteKitchenPageCopy,
  seattleRoofPageCopy,
  seattleDeckPageCopy,
  seattleKitchenPageCopy,
} from "@/lib/why-costs-differ";
import type { City, Permit, ProjectCost } from "@/lib/types";

/** Lowercase job name for prose; keepHvac restores HVAC casing. */
export function jobProseName(project: ProjectCost): string {
  return keepHvac(shortProjectName(project.projectSlug).toLowerCase());
}

function sameMoney(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}


/**
 * Short factual permit clause for SERP meta and how-much FAQ.
 * Does not invent fees; $0 / exempt only when the recorded row supports it.
 * Uses shortDeptName when a city is passed (Atlanta Office of Buildings).
 */
export function moneyPagePermitClause(
  permit: Permit | null | undefined,
  city?: City | null,
): {
  fee: number | null;
  /** Trailing sentence or clause about the permit line. */
  sentence: string;
  /** Snappy mid-sentence clause when fee > 0 (for meta). */
  includedMid: string | null;
} {
  const fee = permit?.feeTypicalUsd ?? null;
  const dept = city ? shortDeptName(city) : "local";
  if (fee == null) {
    return {
      fee: null,
      sentence: "Local permit fee not yet recorded.",
      includedMid: null,
    };
  }
  if (fee === 0) {
    const austin = city ? austinRoofPageCopy(city, permit) : null;
    if (austin) {
      return { fee: 0, sentence: austin.metaSentence, includedMid: null };
    }
    if (
      city?.slug === "chicago-il" &&
      permit?.projectSlug === "roof-replacement" &&
      permit.permitRequired === false &&
      permit.feeModel === "none" &&
      sameMoney(permit.feeLowUsd, 0) &&
      sameMoney(permit.feeTypicalUsd, 0) &&
      sameMoney(permit.feeHighUsd, 0)
    ) {
      return {
        fee: 0,
        sentence:
          "The recorded typical path permit fee is $0 (Group R, 4 stories or fewer, pitch at least 2:12, no structural work).",
        includedMid: null,
      };
    }
    if (
      city?.slug === "chicago-il" &&
      permit?.projectSlug === "hvac-replacement" &&
      permit.permitRequired === false &&
      permit.feeModel === "none" &&
      sameMoney(permit.feeLowUsd, 0) &&
      sameMoney(permit.feeTypicalUsd, 0) &&
      sameMoney(permit.feeHighUsd, 0)
    ) {
      return {
        fee: 0,
        sentence:
          "The recorded typical path permit fee is $0 (in-kind furnace, boiler, or AC appliance in Group R, 4 stories or fewer).",
        includedMid: null,
      };
    }
    let sentence = "The recorded typical path permit fee is $0";
    if (mentionsExemption(permit) || permit?.permitRequired === false) {
      sentence += " (exempt)";
    }
    sentence += ".";
    return { fee: 0, sentence, includedMid: null };
  }
  const austinHvac = city ? austinHvacPageCopy(city, permit) : null;
  if (austinHvac) {
    return {
      fee,
      sentence: austinHvac.permitSentence,
      includedMid: austinHvac.includedMid,
    };
  }
  const austinKitchen = city ? austinKitchenPageCopy(city, permit) : null;
  if (austinKitchen) {
    return {
      fee,
      sentence: austinKitchen.permitSentence,
      includedMid: austinKitchen.includedMid,
    };
  }
  const austinDeck = city ? austinDeckPageCopy(city, permit) : null;
  if (austinDeck) {
    return {
      fee,
      sentence: austinDeck.permitSentence,
      includedMid: austinDeck.includedMid,
    };
  }
  const portlandRoof = city ? portlandRoofPageCopy(city, permit) : null;
  if (portlandRoof) {
    return {
      fee,
      sentence: portlandRoof.permitSentence,
      includedMid: portlandRoof.includedMid,
    };
  }
  const portlandKitchen = city ? portlandKitchenPageCopy(city, permit) : null;
  if (portlandKitchen) {
    return {
      fee,
      sentence: portlandKitchen.permitSentence,
      includedMid: portlandKitchen.includedMid,
    };
  }
  const portlandDeck = city ? portlandDeckPageCopy(city, permit) : null;
  if (portlandDeck) {
    return {
      fee,
      sentence: portlandDeck.permitSentence,
      includedMid: portlandDeck.includedMid,
    };
  }
  const phoenixRoof = city ? phoenixRoofPageCopy(city, permit) : null;
  if (phoenixRoof) {
    return {
      fee,
      sentence: phoenixRoof.permitSentence,
      includedMid: phoenixRoof.includedMid,
    };
  }
  const tucsonRoof = city ? tucsonRoofPageCopy(city, permit) : null;
  if (tucsonRoof) {
    return {
      fee,
      sentence: tucsonRoof.permitSentence,
      includedMid: tucsonRoof.includedMid,
    };
  }
  const tucsonHvac = city ? tucsonHvacPageCopy(city, permit) : null;
  if (tucsonHvac) {
    return {
      fee,
      sentence: tucsonHvac.permitSentence,
      includedMid: tucsonHvac.includedMid,
    };
  }
  const tucsonKitchen = city ? tucsonKitchenPageCopy(city, permit) : null;
  if (tucsonKitchen) {
    return {
      fee,
      sentence: tucsonKitchen.permitSentence,
      includedMid: tucsonKitchen.includedMid,
    };
  }
  const tucsonDeck = city ? tucsonDeckPageCopy(city, permit) : null;
  if (tucsonDeck) {
    return {
      fee,
      sentence: tucsonDeck.permitSentence,
      includedMid: tucsonDeck.includedMid,
    };
  }
  const raleighRoof = city ? raleighRoofPageCopy(city, permit) : null;
  if (raleighRoof) {
    return {
      fee,
      sentence: raleighRoof.permitSentence,
      includedMid: raleighRoof.includedMid,
    };
  }
  const raleighHvac = city ? raleighHvacPageCopy(city, permit) : null;
  if (raleighHvac) {
    return {
      fee,
      sentence: raleighHvac.permitSentence,
      includedMid: raleighHvac.includedMid,
    };
  }
  const raleighKitchen = city ? raleighKitchenPageCopy(city, permit) : null;
  if (raleighKitchen) {
    return {
      fee,
      sentence: raleighKitchen.permitSentence,
      includedMid: raleighKitchen.includedMid,
    };
  }
  const raleighDeck = city ? raleighDeckPageCopy(city, permit) : null;
  if (raleighDeck) {
    return {
      fee,
      sentence: raleighDeck.permitSentence,
      includedMid: raleighDeck.includedMid,
    };
  }
  const nashvilleRoof = city ? nashvilleRoofPageCopy(city, permit) : null;
  if (nashvilleRoof) {
    return {
      fee,
      sentence: nashvilleRoof.permitSentence,
      includedMid: nashvilleRoof.includedMid,
    };
  }
  const phoenixHvac = city ? phoenixHvacPageCopy(city, permit) : null;
  if (phoenixHvac) {
    return {
      fee,
      sentence: phoenixHvac.permitSentence,
      includedMid: phoenixHvac.includedMid,
    };
  }
  const phoenixKitchen = city ? phoenixKitchenPageCopy(city, permit) : null;
  if (phoenixKitchen) {
    return {
      fee,
      sentence: phoenixKitchen.permitSentence,
      includedMid: phoenixKitchen.includedMid,
    };
  }
  const phoenixDeck = city ? phoenixDeckPageCopy(city, permit) : null;
  if (phoenixDeck) {
    return {
      fee,
      sentence: phoenixDeck.permitSentence,
      includedMid: phoenixDeck.includedMid,
    };
  }
  const denverDeck = city ? denverDeckPageCopy(city, permit) : null;
  if (denverDeck) {
    return {
      fee,
      sentence: denverDeck.permitSentence,
      includedMid: denverDeck.includedMid,
    };
  }
  const denverKitchen = city ? denverKitchenPageCopy(city, permit) : null;
  if (denverKitchen) {
    return {
      fee,
      sentence: denverKitchen.permitSentence,
      includedMid: denverKitchen.includedMid,
    };
  }
  const charlotteKitchen = city ? charlotteKitchenPageCopy(city, permit) : null;
  if (charlotteKitchen) {
    return {
      fee,
      sentence: charlotteKitchen.permitSentence,
      includedMid: charlotteKitchen.includedMid,
    };
  }
  const seattleRoof = city ? seattleRoofPageCopy(city, permit) : null;
  if (seattleRoof) {
    return {
      fee,
      sentence: seattleRoof.permitSentence,
      includedMid: seattleRoof.includedMid,
    };
  }
  const seattleDeck = city ? seattleDeckPageCopy(city, permit) : null;
  if (seattleDeck) {
    return {
      fee,
      sentence: seattleDeck.permitSentence,
      includedMid: seattleDeck.includedMid,
    };
  }
  const seattleKitchen = city ? seattleKitchenPageCopy(city, permit) : null;
  if (seattleKitchen) {
    return {
      fee,
      sentence: seattleKitchen.permitSentence,
      includedMid: seattleKitchen.includedMid,
    };
  }
  if (
    city?.slug === "houston-tx" &&
    permit?.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 180.56) &&
    sameMoney(permit.feeTypicalUsd, 230.56) &&
    sameMoney(permit.feeHighUsd, 400.56)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence: "The recorded " + dept + " permit fee of " + exact + " is included in the all-in.",
      includedMid: "including the recorded " + dept + " permit fee of " + exact,
    };
  }
  if (
    city?.slug === "houston-tx" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "area" &&
    sameMoney(permit.feeLowUsd, 177.04) &&
    sameMoney(permit.feeTypicalUsd, 257.44) &&
    sameMoney(permit.feeHighUsd, 305.68)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Type VB new-construction at 320 sf plus the administrative fee) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Type VB new-construction at 320 sf plus the administrative fee)",
    };
  }
  if (
    city?.slug === "philadelphia-pa" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 76.5) &&
    sameMoney(permit.feeTypicalUsd, 76.5) &&
    sameMoney(permit.feeHighUsd, 76.5)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (1-2 family roof covering replacement $69 plus city $3 and PA state $4.50) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (1-2 family roof covering replacement $69 plus city $3 and PA state $4.50)",
    };
  }
  if (
    city?.slug === "detroit-mi" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 475.97) &&
    sameMoney(permit.feeTypicalUsd, 612.33) &&
    sameMoney(permit.feeHighUsd, 953.23)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building/residential band at $12,000; 35% plan-review is a deposit, not an add-on) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building/residential band at $12,000; 35% plan-review is a deposit, not an add-on)",
    };
  }
  if (
    city?.slug === "san-antonio-tx" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 25) &&
    sameMoney(permit.feeTypicalUsd, 25) &&
    sameMoney(permit.feeHighUsd, 25)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (FY2026 Residential Re-roof Permit) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (FY2026 Residential Re-roof Permit)",
    };
  }
  if (
    city?.slug === "san-antonio-tx" &&
    permit?.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "tiered" &&
    sameMoney(permit.feeLowUsd, 56.25) &&
    sameMoney(permit.feeTypicalUsd, 65.85) &&
    sameMoney(permit.feeHighUsd, 72.1)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (FY2026 mechanical basic $50 plus furnace $9.60 plus condensing unit $6.25) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (FY2026 mechanical basic $50 plus furnace $9.60 plus condensing unit $6.25)",
    };
  }
  if (
    city?.slug === "tampa-fl" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 181.43) &&
    sameMoney(permit.feeTypicalUsd, 181.43) &&
    sameMoney(permit.feeHighUsd, 181.43)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Trade schedule Roofing 1-2 family $177.00 plus Florida Building Permit Surcharge $4.43) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Trade schedule Roofing 1-2 family $177.00 plus Florida Building Permit Surcharge $4.43)",
    };
  }
  if (
    city?.slug === "dallas-tx" &&
    permit?.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 196) &&
    sameMoney(permit.feeTypicalUsd, 196) &&
    sameMoney(permit.feeHighUsd, 422.42)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II master plus the technology fee) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II master plus the technology fee)",
    };
  }
  if (
    city?.slug === "dallas-tx" &&
    permit?.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 296) &&
    sameMoney(permit.feeTypicalUsd, 396) &&
    sameMoney(permit.feeHighUsd, 1352.79)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II master plus 3 additional trades plus the technology fee) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II master plus 3 additional trades plus the technology fee)",
    };
  }
  if (
    city?.slug === "dallas-tx" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 196) &&
    sameMoney(permit.feeTypicalUsd, 196) &&
    sameMoney(permit.feeHighUsd, 386.47)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II plus the technology fee) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-II plus the technology fee)",
    };
  }
  if (
    city?.slug === "dallas-tx" &&
    permit?.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 315) &&
    sameMoney(permit.feeTypicalUsd, 315) &&
    sameMoney(permit.feeHighUsd, 345.39)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-I minimum plus the additional inspection and the technology fee) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table B-I minimum plus the additional inspection and the technology fee)",
    };
  }
  if (
    city?.slug === "minneapolis-mn" &&
    permit?.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 379.87) &&
    sameMoney(permit.feeTypicalUsd, 517.83) &&
    sameMoney(permit.feeHighUsd, 862.73)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building permit plus 65% plan review plus the Minnesota state surcharge) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building permit plus 65% plan review plus the Minnesota state surcharge)",
    };
  }
  if (
    city?.slug === "minneapolis-mn" &&
    permit?.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "tiered" &&
    sameMoney(permit.feeLowUsd, 133.4) &&
    sameMoney(permit.feeTypicalUsd, 217.6) &&
    sameMoney(permit.feeHighUsd, 217.6)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Level 3 entire-system replacement $216.60 plus the $1.00 Minnesota state surcharge) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Level 3 entire-system replacement $216.60 plus the $1.00 Minnesota state surcharge)",
    };
  }
  if (
    city?.slug === "minneapolis-mn" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 379.87) &&
    sameMoney(permit.feeTypicalUsd, 517.83) &&
    sameMoney(permit.feeHighUsd, 793.35)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building permit $310.20 plus 65% plan review $201.63 plus the Minnesota state surcharge $6.00) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (building permit $310.20 plus 65% plan review $201.63 plus the Minnesota state surcharge $6.00)",
    };
  }
  if (
    city?.slug === "miami-fl" &&
    permit?.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 158.8) &&
    sameMoney(permit.feeTypicalUsd, 161.2) &&
    sameMoney(permit.feeHighUsd, 167.2)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city-permit minimum plus the $40 application fee, $0 solid waste, state minimums, and Miami-Dade §8-12(e)) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city-permit minimum plus the $40 application fee, $0 solid waste, state minimums, and Miami-Dade §8-12(e))",
    };
  }
  if (
    city?.slug === "miami-fl" &&
    permit?.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 183) &&
    sameMoney(permit.feeTypicalUsd, 184.5) &&
    sameMoney(permit.feeHighUsd, 198.8)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city-permit minimum plus the $40 application fee, the solid-waste minimum, state minimums, and Miami-Dade §8-12(e)) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city-permit minimum plus the $40 application fee, the solid-waste minimum, state minimums, and Miami-Dade §8-12(e))",
    };
  }
  if (
    city?.slug === "miami-fl" &&
    permit?.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 196) &&
    sameMoney(permit.feeTypicalUsd, 317.62) &&
    sameMoney(permit.feeHighUsd, 634.38)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city permit $175 + application $40 + solid waste $77 + state $4.62 + county $21) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city permit $175 + application $40 + solid waste $77 + state $4.62 + county $21)",
    };
  }
  if (
    city?.slug === "miami-fl" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 184.8) &&
    sameMoney(permit.feeTypicalUsd, 187.6) &&
    sameMoney(permit.feeHighUsd, 207.76)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city permit minimum $110 + application $40 + solid waste $26.40 + state $4 + county $7.20) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (city permit minimum $110 + application $40 + solid waste $26.40 + state $4 + county $7.20)",
    };
  }
  if (
    city?.slug === "boston-ma" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 100) &&
    sameMoney(permit.feeTypicalUsd, 140) &&
    sameMoney(permit.feeHighUsd, 240)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (short-form $20 plus $10 per $1,000 of estimated cost) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (short-form $20 plus $10 per $1,000 of estimated cost)",
    };
  }
  if (
    city?.slug === "boston-ma" &&
    permit?.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "tiered" &&
    sameMoney(permit.feeLowUsd, 120.4) &&
    sameMoney(permit.feeTypicalUsd, 122.2) &&
    sameMoney(permit.feeHighUsd, 125.8)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (gas furnace/heater line plus sheet metal for the first 200 lin/sq ft) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (gas furnace/heater line plus sheet metal for the first 200 lin/sq ft)",
    };
  }
  if (
    city?.slug === "boston-ma" &&
    permit?.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 170) &&
    sameMoney(permit.feeTypicalUsd, 370) &&
    sameMoney(permit.feeHighUsd, 800)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (short-form building: $20 plus $10 per $1,000 of estimated cost) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (short-form building: $20 plus $10 per $1,000 of estimated cost)",
    };
  }
  if (
    city?.slug === "boston-ma" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    sameMoney(permit.feeLowUsd, 130) &&
    sameMoney(permit.feeTypicalUsd, 170) &&
    sameMoney(permit.feeHighUsd, 250)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (long-form $50 plus $10 per $1,000 of estimated cost) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (long-form $50 plus $10 per $1,000 of estimated cost)",
    };
  }
  if (
    city?.slug === "chicago-il" &&
    permit?.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 0) &&
    sameMoney(permit.feeTypicalUsd, 500) &&
    sameMoney(permit.feeHighUsd, 602)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (stand-alone interior alteration of 2,000 sf or less in one unit) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (stand-alone interior alteration of 2,000 sf or less in one unit)",
    };
  }
  if (
    city?.slug === "chicago-il" &&
    permit?.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 300) &&
    sameMoney(permit.feeTypicalUsd, 602) &&
    sameMoney(permit.feeHighUsd, 602)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (plan-based minimum; Express still sends new structures to plan-based review) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (plan-based minimum; Express still sends new structures to plan-based review)",
    };
  }
  if (
    city?.slug === "las-vegas-nv" &&
    permit?.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 242) &&
    sameMoney(permit.feeTypicalUsd, 242) &&
    sameMoney(permit.feeHighUsd, 281)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table 3-E #94 tear-off/re-roof: plan check $68 + inspection $119 + issuance $55) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table 3-E #94 tear-off/re-roof: plan check $68 + inspection $119 + issuance $55)",
    };
  }
  if (
    city?.slug === "las-vegas-nv" &&
    permit?.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    sameMoney(permit.feeLowUsd, 238) &&
    sameMoney(permit.feeTypicalUsd, 238) &&
    sameMoney(permit.feeHighUsd, 257)
  ) {
    const exact = moneyExact(fee);
    return {
      fee,
      sentence:
        "The recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table 3-D #15 HVAC exact change-out: plan check $83 + inspection $100 + issuance $55) is included in the all-in.",
      includedMid:
        "including the recorded " +
        dept +
        " permit fee of " +
        exact +
        " (Table 3-D #15 HVAC exact change-out: plan check $83 + inspection $100 + issuance $55)",
    };
  }
  const partsNote = permit ? recordedFeePartsNote(permit) : null;
  const pathNote =
    permit && !partsNote ? recordedQuickPermitPathNote(permit) : null;
  const feeNote = partsNote || pathNote;
  const feeBit = usd(fee) + (feeNote ? " " + feeNote : "");
  // Dept label + dollars (+ recorded floor parts / Quick Permit path) for CTR
  // on fee>0 money URLs (Atlanta roof multi-line floor; Denver roof Quick Permit).
  return {
    fee,
    sentence:
      "The recorded " + dept + " permit fee of " + feeBit + " is included in the all-in.",
    includedMid: "including the recorded " + dept + " permit fee of " + feeBit,
  };
}

export type MoneyPageSeo = {
  /** On-page H1 / money-keyword base without the (~$…) cue. */
  h1: string;
  /** SERP <title> base (before site suffix), with typical-price cue when known. */
  title: string;
  /** Meta + on-page desc string (kept in sync). */
  description: string;
  allInTypical: number;
  jobTypical: number;
};

/**
 * Shared money-page SERP title + description for generateMetadata and page desc.
 * Title keeps "{shortName} cost in {cityLabel}" and appends (~$typical) for CTR.
 * Description leads with the how-much query; never claims a $0 fee is "included".
 */
export function moneyPageSeo(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): MoneyPageSeo {
  const shortName = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const h1 = shortName + " cost in " + label;
  const title = h1 + " (~" + usd(est.allInTypical) + ")";
  const permitBit = moneyPagePermitClause(permit, city);

  let description: string;
  if (permitBit.fee == null) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ", " +
      (permitBit.includedMid || "including the recorded local permit fee") +
      ".";
  }

  return {
    h1: keepHvac(h1),
    title: keepHvac(title),
    description: keepHvac(description),
    allInTypical: est.allInTypical,
    jobTypical: est.job.typical,
  };
}

/** First FAQ Q/A: query-aligned how-much, same permit rules as meta. */
export function moneyPageHowMuchFaq(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): { question: string; answer: string } {
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const permitBit = moneyPagePermitClause(permit, city);

  const question = "How much does " + job + " cost in " + label + "?";
  let answer: string;
  if (permitBit.fee == null) {
    answer =
      "Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  }

  return {
    question: keepHvac(question),
    answer: keepHvac(answer),
  };
}
