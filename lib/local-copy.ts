import { cityLabel } from "@/lib/data-client";
import { usd, usdRange } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { moneyPageHowMuchFaq } from "@/lib/money-page-seo";
import { keepHvac } from "@/lib/seo";
import {
  isPublishedMinimumFloor,
  permitRowRecordsValuation,
  publishedMinimumValuationAnswer,
} from "@/lib/permit-valuation";
import { shortDeptName } from "@/lib/sourcing";
import { assumedValuation, typicalJobSpec } from "@/lib/typical-specs";
import {
  austinDeckPageCopy,
  austinHvacPageCopy,
  austinKitchenPageCopy,
  austinRoofPageCopy,
  denverDeckPageCopy,
  denverHvacPageCopy,
  denverKitchenPageCopy,
  denverRoofPageCopy,
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
  seattleHvacPageCopy,
  seattleRoofPageCopy,
  seattleDeckPageCopy,
  seattleKitchenPageCopy,
  charlotteHvacPageCopy,
  charlotteKitchenPageCopy,
  nashvilleDeckPageCopy,
  nashvilleRoofPageCopy,
  atlantaRoofPageCopy,
  atlantaHvacPageCopy,
  atlantaDeckPageCopy,
  atlantaKitchenPageCopy,
} from "@/lib/why-costs-differ";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type FaqItem = { question: string; answer: string };

export type PermitCalloutModel =
  | {
      kind: "known";
      typicalUsd: number;
      lowUsd: number | null;
      highUsd: number | null;
      rangeLabel: string | null;
      /** Exact recorded typical when usd() would drop cents. Null keeps usd(). */
      typicalLabel: string | null;
      sourceName: string;
      retrievedDate: string | null;
      caveat: string | null;
      dept: string;
      job: string;
      city: string;
    }
  | {
      kind: "unknown";
      sourceName: string | null;
      retrievedDate: string | null;
      caveat: string | null;
      calculationNote: string | null;
      job: string;
      city: string;
    }
  | {
      kind: "zero";
      permitRequired: boolean | null;
      caveat: string | null;
      extraNotes: string[];
      sourceName: string | null;
      retrievedDate: string | null;
      calculationNote: string | null;
      job: string;
      city: string;
    }
  | {
      kind: "missing";
      job: string;
      city: string;
      dept: string;
    };

/** Charlotte roof row: statutory $0 plus a recorded LUESA alternate. Not other cities. */
function charlotteRoofStatuteExempt(permit: Permit | null | undefined): boolean {
  if (!permit || permit.feeTypicalUsd !== 0) return false;
  const blob = (permit.caveat || "") + " " + (permit.calculationNote || "");
  return (
    /160D-1110\(c\)\(5\)/.test(blob) &&
    /\$40,000/.test(blob) &&
    /like-for-like/i.test(blob) &&
    /OSFM/i.test(blob) &&
    /15%/.test(blob) &&
    /10\/19\/2023/.test(blob) &&
    /Alternate LUESA Section II\.A/.test(permit.calculationNote || "")
  );
}

/**
 * Short "what we assumed" clause for the Charlotte roof $0 exemption.
 * The full LUESA calculation note stays on the fee-model callout.
 */
function charlotteRoofAssumption(): string {
  return asSentence(
    "For the permit line we assumed the recorded statutory exemption under N.C.G.S. 160D-1110(c)(5): a like-for-like single-family reroof at or under $40,000, with a typical fee of $0. The LUESA Section II.A alternate is not included in these totals",
  );
}

/** Used only when the Charlotte roof row has no caveat to show instead. */
function charlotteRoofShortPermitNote(): string {
  return asSentence(
    "Typical path is $0 under N.C.G.S. 160D-1110(c)(5) for a like-for-like single-family reroof at or under $40,000. The LUESA Section II.A alternate is not included in that typical",
  );
}

const MEMPHIS_HVAC_SOURCE_NAME =
  "Memphis and Shelby County CCE mechanical permit table (2019 schedule still posted 2026-09-01)";
const MEMPHIS_HVAC_SOURCE_URL =
  "https://www.shelbycountytn.gov/DocumentCenter/View/33930/New-Fee-Schedule-2019";

type MemphisHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
};

/**
 * Memphis HVAC: still-posted 2019 CCE mechanical table.
 * Fees stay $43 / $51 / $67 from the $1,000-per-ton minimum contract valuation.
 * Returns null if those anchors drift, so other Memphis pages keep their own copy.
 */
function memphisHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "memphis-tn" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (permit.feeLowUsd !== 43 || permit.feeTypicalUsd !== 51 || permit.feeHighUsd !== 67) return false;
  if (permit.typicalProjectValueUsd !== 7500 || permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MEMPHIS_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== MEMPHIS_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if ((extras[0]?.name || "") !== "M-3.1 first $1,000" || extras[0]?.feeUsd !== 15) return false;
  if ((extras[1]?.name || "") !== "M-3.1 each additional $1,000" || extras[1]?.feeUsd != null) return false;
  if ((extras[2]?.name || "") !== "M-0 issuance" || extras[2]?.feeUsd !== 20) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MEMPHIS_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/\$1,000 per ton/.test(note)) return false;
  if (!/feeLowUsd \$43/.test(note) || !/feeTypicalUsd \$51/.test(note) || !/feeHighUsd \$67/.test(note)) {
    return false;
  }
  if (!/\$7,500/.test(note)) return false;
  if (!/2-ton/.test(note) || !/3-ton/.test(note) || !/5-ton/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/does not reprint mechanical dollars/.test(caveat)) return false;
  if (!/still-posted 2019 CCE mechanical table/.test(caveat)) return false;
  if (!/\$1,000 per ton/.test(caveat)) return false;
  return true;
}

/**
 * Short Memphis HVAC copy. The full tonnage arithmetic stays on the permit
 * callout calculation note. Null unless the recorded $43 / $51 / $67 anchors match.
 */
function memphisHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MemphisHvacPageCopy | null {
  if (!memphisHvacFacts(city, permit)) return null;
  const low = usd(permit.feeLowUsd);
  const typical = usd(permit.feeTypicalUsd);
  const high = usd(permit.feeHighUsd);
  const projectValue = usd(permit.typicalProjectValueUsd);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded published minimum contract valuation of $1,000 per ton, so the low 2-ton fee is " +
        low +
        ", the typical 3-ton fee is " +
        typical +
        ", and the high 5-ton fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Recorded low, typical, and high use the single-family minimum contract valuation of $1,000 per ton on the still-posted 2019 CCE mechanical table. Full arithmetic is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded minimum contract valuation of $1,000 per ton. The 2-ton, 3-ton, and 5-ton arithmetic is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded published minimum contract valuation of $1,000 per ton. Low, typical, and high tonnage arithmetic are in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
  };
}

const MEMPHIS_KITCHEN_SOURCE_NAME = "Memphis and Shelby County CCE Permit Fees (1-2 family)";
const MEMPHIS_KITCHEN_SOURCE_URL =
  "https://www.shelbycountytn.gov/DocumentCenter/View/35065/6-Permit-fees-letterhead";

type MemphisKitchenPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
};

/**
 * Memphis kitchen: 1-2 family alteration/repair on the CCE permit-fees sheet.
 * Fees stay $75 / $175 / $325 from the recorded $15,000 / $35,000 / $75,000 valuations.
 * Returns null if those anchors drift, so other Memphis pages keep their own copy.
 */
function memphisKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "memphis-tn" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (permit.feeLowUsd !== 75 || permit.feeTypicalUsd !== 175 || permit.feeHighUsd !== 325) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 15000 || valuation.typical !== 35000 || valuation.high !== 75000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MEMPHIS_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== MEMPHIS_KITCHEN_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "1-2 family alteration/repair $5 per $1,000" || extras[0]?.feeUsd !== 175) {
    return false;
  }
  if ((extras[1]?.name || "") !== "1-2 family plan review up to 2,500 sf" || extras[1]?.feeUsd != null) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(MEMPHIS_KITCHEN_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/\$5 per \$1,000/.test(note)) return false;
  if (!/\$5 × 15 = \$75/.test(note) || !/\$5 × 35 = \$175/.test(note) || !/\$5 × 75 = \$375/.test(note)) {
    return false;
  }
  if (!/feeLowUsd is \$75/.test(note) || !/feeTypicalUsd \$175/.test(note) || !/feeHighUsd is \$325/.test(note)) {
    return false;
  }
  if (!/\$15,000/.test(note) || !/\$35,000/.test(note) || !/\$75,000/.test(note)) return false;
  if (!/\$125/.test(note) || !/2,500 sf/.test(note) || !/not added/.test(note)) return false;
  if (!/\$50 minimum/.test(note) || !/\$325 maximum/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/cabinets-only/i.test(caveat)) return false;
  if (!/finish-work exempt/.test(caveat)) return false;
  if (!/alteration\/repair valuation table/.test(caveat)) return false;
  if (!/\$325/.test(caveat)) return false;
  return true;
}

/**
 * Short Memphis kitchen copy. The full valuation arithmetic stays on the permit
 * callout calculation note. Null unless the recorded $75 / $175 / $325 anchors match.
 */
function memphisKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MemphisKitchenPageCopy | null {
  if (!memphisKitchenFacts(city, permit)) return null;
  const low = usd(permit.feeLowUsd);
  const typical = usd(permit.feeTypicalUsd);
  const high = usd(permit.feeHighUsd);
  const projectValue = usd(permit.typicalProjectValueUsd);
  const lowVal = usd(permit.assumedValuationUsd?.low);
  const typicalVal = usd(permit.assumedValuationUsd?.typical);
  const highVal = usd(permit.assumedValuationUsd?.high);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded 1-2 family alteration/repair valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue +
        ". Plan review up to 2,500 sf is recorded and not added",
    ),
    howCalculated: asSentence(
      "Recorded low, typical, and high use the 1-2 family alteration/repair fee of $5 per $1,000, minimum $50 and maximum $325. Full arithmetic is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The low, typical, and high arithmetic is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. Low, typical, and high valuation arithmetic are in the calculation note on this page. Plan review up to 2,500 sf is recorded and not added. Verify the fee with " +
        city.permitDeptName,
    ),
  };
}

const MEMPHIS_DECK_SOURCE_NAME = "Memphis and Shelby County CCE Permit Fees (1-2 family)";
const MEMPHIS_DECK_SOURCE_URL =
  "https://www.shelbycountytn.gov/DocumentCenter/View/35065/6-Permit-fees-letterhead";

type MemphisDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
};

/**
 * Memphis deck: flat construction/repair/alteration line on the CCE 1-2 family sheet.
 * Fees stay $50 / $50 / $50, independent of the 16×20 size.
 * Returns null if those anchors drift, so other Memphis pages keep their own copy.
 */
function memphisDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "memphis-tn" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (permit.feeLowUsd !== 50 || permit.feeTypicalUsd !== 50 || permit.feeHighUsd !== 50) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MEMPHIS_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== MEMPHIS_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !== "Construction/repair/alteration to decks, spas and similar" ||
    extras[0]?.feeUsd !== 50
  ) {
    return false;
  }
  const extraNote = extras[0]?.note || "";
  if (!/Included/.test(extraNote) || !/flat \$50/i.test(extraNote)) return false;
  if (!/16×20/.test(extraNote) || !/Appendix A ¶10\.e/.test(extraNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MEMPHIS_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Construction\/repair\/alteration to decks, spas and similar/.test(note)) return false;
  if (!/flat \$50/.test(note)) return false;
  if (!/feeLowUsd is \$50/.test(note) || !/feeTypicalUsd is \$50/.test(note) || !/feeHighUsd is \$50/.test(note)) {
    return false;
  }
  if (!/16×20/.test(note) || !/Appendix A ¶10\.e/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;
  if (!/typical project value is \$12,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Flat \$50/.test(caveat) || !/decks, spas and similar/.test(caveat)) return false;
  if (!/Low, typical, and high are each \$50/.test(caveat)) return false;
  if (!/16×20/.test(caveat) || !/Appendix A ¶10\.e/.test(caveat)) return false;
  return true;
}

/**
 * Short Memphis deck copy. The full flat-fee walk stays on the permit
 * callout calculation note. Null unless the recorded $50 / $50 / $50 anchors match.
 */
function memphisDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MemphisDeckPageCopy | null {
  if (!memphisDeckFacts(city, permit)) return null;
  const low = usd(permit.feeLowUsd);
  const typical = usd(permit.feeTypicalUsd);
  const high = usd(permit.feeHighUsd);
  const projectValue = usd(permit.typicalProjectValueUsd);
  const lowVal = usd(permit.assumedValuationUsd?.low);
  const typicalVal = usd(permit.assumedValuationUsd?.typical);
  const highVal = usd(permit.assumedValuationUsd?.high);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat fee for construction/repair/alteration to decks, spas and similar, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. The flat fee is independent of the 16×20 size. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Recorded low, typical, and high use the flat fee for construction/repair/alteration to decks, spas and similar. Full arithmetic is in the calculation note on this page",
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
        ". The flat fee does not change with those values or the 16×20 size. The low, typical, and high walk is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        ". Low, typical, and high are the same recorded flat fee, and the walk is in the calculation note on this page. The flat fee is independent of the 16×20 size. Verify the fee with " +
        city.permitDeptName,
    ),
  };
}

const HOUSTON_HVAC_SOURCE_NAME =
  "City of Houston 2026 BCE Permit Fee Schedule p. 3 HVAC; CE-1017 (Jan 2026)";
const HOUSTON_HVAC_SOURCE_URL = "https://www.houstonpermittingcenter.org/media/2636/download";

type HoustonHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round 180.56 / 230.56 / 400.56. */
  typicalExact: string;
  rangeExact: string;
};

function houstonMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function houstonSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Houston HVAC: 2026 BCE p. 3 alteration line (2% of valuation + $47) plus admin.
 * Fees stay $180.56 / $230.56 / $400.56. Returns null if those anchors drift.
 */
function houstonHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "houston-tx" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!houstonSameCents(permit.feeLowUsd, 180.56)) return false;
  if (!houstonSameCents(permit.feeTypicalUsd, 230.56)) return false;
  if (!houstonSameCents(permit.feeHighUsd, 400.56)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== HOUSTON_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== HOUSTON_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Repairs/alterations to existing HVAC (2% of valuation + $47)" ||
    !houstonSameCents(extras[0]?.feeUsd, 197)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Administrative fee" || !houstonSameCents(extras[1]?.feeUsd, 33.56)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Alternate complete-system line" ||
    !houstonSameCents(extras[2]?.feeUsd, 124.62)
  ) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(HOUSTON_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/0\.02×5000\+\$47=\$147/.test(note)) return false;
  if (!/\$197/.test(note) || !/\$367/.test(note)) return false;
  if (!/feeLowUsd \$180\.56/.test(note)) return false;
  if (!/feeTypicalUsd \$230\.56/.test(note)) return false;
  if (!/feeHighUsd \$400\.56/.test(note)) return false;
  if (!/\$33\.56/.test(note) || !/\$91\.06/.test(note) || !/\$124\.62/.test(note)) return false;
  if (!/not used for the published totals/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/2%-of-valuation/.test(caveat)) return false;
  if (!/\$33\.56/.test(caveat) || !/\$91\.06/.test(caveat) || !/\$124\.62/.test(caveat)) return false;
  if (!/not binding/.test(caveat)) return false;
  if (!/per ton/.test(caveat) || !/exempt/.test(caveat)) return false;
  return true;
}

/**
 * Short Houston HVAC copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $180.56 / $230.56 / $400.56 anchors match.
 */
function houstonHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): HoustonHvacPageCopy | null {
  if (!houstonHvacFacts(city, permit)) return null;
  const low = houstonMoneyExact(permit.feeLowUsd as number);
  const typical = houstonMoneyExact(permit.feeTypicalUsd as number);
  const high = houstonMoneyExact(permit.feeHighUsd as number);
  const projectValue = houstonMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = houstonMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = houstonMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = houstonMoneyExact(permit.assumedValuationUsd?.high as number);
  const alternate = houstonMoneyExact((permit.extras || [])[2]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Recorded low, typical, and high use the published 2%-of-valuation alteration line plus the administrative fee. Full arithmetic is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The low, typical, and high arithmetic is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. Low, typical, and high valuation arithmetic are in the calculation note on this page. The alternate complete-system line of " +
        alternate +
        " is recorded and not used for the published totals. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const HOUSTON_DECK_SOURCE_NAME =
  "City of Houston 2026 BCE Permit Fee Schedule Type VB p. 8; HPC Plan Review exemptions; Houston IRC R105.2";
const HOUSTON_DECK_SOURCE_URL = "https://www.houstonpermittingcenter.org/media/2636/download";

type HoustonDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 177.04 / 257.44 / 305.68. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Houston deck: Type VB Tier 2 new-construction by deck sf plus $33.56 admin.
 * No 20% remodel discount. Fees stay $177.04 / $257.44 / $305.68 at 200 / 320 / 400 sf.
 * HPC uncovered <=30 in. and Houston IRC R105.2 are not recorded totals.
 * Returns null if those anchors drift.
 */
function houstonDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "houston-tx" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "area") return false;
  if (!houstonSameCents(permit.feeLowUsd, 177.04)) return false;
  if (!houstonSameCents(permit.feeTypicalUsd, 257.44)) return false;
  if (!houstonSameCents(permit.feeHighUsd, 305.68)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== HOUSTON_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== HOUSTON_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "Administrative fee" || !houstonSameCents(extras[0]?.feeUsd, 33.56)) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Type VB new-construction (typical 320 sf)" ||
    !houstonSameCents(extras[1]?.feeUsd, 223.88)
  ) {
    return false;
  }
  const adminNote = extras[0]?.note || "";
  if (!/Included in the low \$177\.04, typical \$257\.44, and high \$305\.68 totals/.test(adminNote)) {
    return false;
  }
  const vbNote = extras[1]?.note || "";
  if (!/not 20%/.test(vbNote)) return false;
  if (!/Included in the typical total/.test(vbNote)) return false;
  if (!/\$47 \+ \$5\.36 × 33 = \$223\.88/.test(vbNote)) return false;
  if (!/\$33\.56/.test(vbNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(HOUSTON_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is area/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$177\.04, feeTypicalUsd is \$257\.44, and feeHighUsd is \$305\.68/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$19,200 high/.test(note)) return false;
  if (!/area-based, not valuation-driven/.test(note)) return false;
  if (!/do not change the recorded \$177\.04, \$257\.44, and \$305\.68 fees/.test(note)) return false;
  if (!/no 20% remodel discount/.test(note)) return false;
  if (!/\$47 \+ \$5\.36 × ceil\(\(sf-57\.16\)\/8\.17\)/.test(note)) return false;
  if (!/Documented deck sizes are 200 sf low, 320 sf typical, and 400 sf high/.test(note)) return false;
  if (!/Low 200 sf: valuation is unused, so feeLowUsd stays \$177\.04/.test(note)) return false;
  if (!/ceil\(\(200-57\.16\)\/8\.17\)/.test(note) && !/\(200-57\.16\)\/8\.17 ceils to 18/.test(note)) {
    return false;
  }
  if (!/\$5\.36 × 18 = \$96\.48/.test(note)) return false;
  if (!/\$47 \+ \$96\.48 = \$143\.48/.test(note)) return false;
  if (!/\$143\.48 \+ \$33\.56 = \$177\.04, so feeLowUsd is \$177\.04/.test(note)) return false;
  if (!/Typical 320 sf: valuation is unused, so feeTypicalUsd stays \$257\.44/.test(note)) return false;
  if (!/16x20 = 320 sf/.test(note)) return false;
  if (!/ceil\(\(320-57\.16\)\/8\.17\) = 33/.test(note)) return false;
  if (!/\$47 \+ \$5\.36 × 33 = \$223\.88/.test(note)) return false;
  if (!/\$223\.88 \+ \$33\.56 = \$257\.44, so feeTypicalUsd is \$257\.44/.test(note)) return false;
  if (!/included in the typical total/.test(note)) return false;
  if (!/not added again/.test(note)) return false;
  if (!/High 400 sf: valuation is unused, so feeHighUsd stays \$305\.68/.test(note)) return false;
  if (!/ceil\(\(400-57\.16\)\/8\.17\) = 42/.test(note)) return false;
  if (!/\$47 \+ \$5\.36 × 42 = \$272\.12/.test(note)) return false;
  if (!/\$272\.12 \+ \$33\.56 = \$305\.68, so feeHighUsd is \$305\.68/.test(note)) return false;
  if (!/\$305\.68 high is not added on top of the \$257\.44 typical/.test(note)) return false;
  if (!/more than 30 inches above grade needs a permit/.test(note)) return false;
  if (!/HPC Plan Review exemptions/.test(note)) return false;
  if (!/uncovered deck at 30 inches or less/.test(note)) return false;
  if (!/Houston IRC R105\.2/.test(note)) return false;
  if (!/not attached to the dwelling/.test(note)) return false;
  if (!/not serving the required exit/.test(note)) return false;
  if (!/Those exempt paths are not the recorded typical totals/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$177\.04, \$257\.44, and \$305\.68 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Typical attached deck >30 in\. needs a permit/.test(caveat)) return false;
  if (!/HPC list/.test(caveat) || !/R105\.2/.test(caveat)) return false;
  if (!/not 20%/.test(caveat) || !/\$33\.56/.test(caveat)) return false;
  if (!/16×20/.test(caveat) || !/320 sf/.test(caveat)) return false;
  return true;
}

/**
 * Short Houston deck copy. The Type VB area walk stays on the permit
 * callout calculation note. Null unless the recorded $177.04 / $257.44 / $305.68
 * anchors match.
 */
function houstonDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): HoustonDeckPageCopy | null {
  if (!houstonDeckFacts(city, permit)) return null;
  const low = houstonMoneyExact(permit.feeLowUsd as number);
  const typical = houstonMoneyExact(permit.feeTypicalUsd as number);
  const high = houstonMoneyExact(permit.feeHighUsd as number);
  const projectValue = houstonMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = houstonMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = houstonMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = houstonMoneyExact(permit.assumedValuationUsd?.high as number);
  const admin = houstonMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  const vb = houstonMoneyExact((permit.extras || [])[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded Type VB area paths, so the low fee is " +
        low +
        " (200 sf: $143.48 + " +
        admin +
        " admin), the typical fee is " +
        typical +
        " (16x20 = 320 sf: " +
        vb +
        " + " +
        admin +
        "), and the high fee is " +
        high +
        " (400 sf: $272.12 + " +
        admin +
        "). The high is not added on top of the typical. There is no 20% remodel discount. HPC uncovered decks at 30 inches or less, and Houston IRC R105.2, are not the recorded typical path. Full arithmetic is in the calculation note on this page. Recorded valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Those valuations are unused because the fee is area-based. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Type VB new-construction at 320 sf (" +
        vb +
        ") plus the " +
        admin +
        " administrative fee. Low is " +
        low +
        " at 200 sf ($143.48 + " +
        admin +
        "). High is " +
        high +
        " at 400 sf ($272.12 + " +
        admin +
        "). The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Fees are area-based, not valuation-driven, so those amounts are unused. The low fee is " +
        low +
        " at 200 sf, the typical fee is " +
        typical +
        " at 320 sf, and the high fee is " +
        high +
        " at 400 sf",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (area). The typical path is " +
        typical +
        " on the documented 320 sf deck (" +
        vb +
        " + " +
        admin +
        "). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. HPC and Houston IRC R105.2 exempt paths are not the recorded typical totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical attached deck more than 30 inches above grade is the recorded Type VB path, and the typical fee on that path is " +
      typical +
      ". HPC uncovered decks at 30 inches or less, and Houston IRC R105.2, are not the typical path.",
    includedClause:
      "The " +
      vb +
      " Type VB new-construction line and the " +
      admin +
      " administrative fee are included in that " +
      typical +
      ". The " +
      high +
      " path at 400 sf is the recorded high and is not added on top of the typical. The " +
      low +
      " path at 200 sf is the recorded low and is not the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const PHILADELPHIA_ROOF_SOURCE_NAME =
  "L&I Summary of construction permit fees, effective 1/1/2025 (PG_012_INF Rev 2.2026)";
const PHILADELPHIA_ROOF_SOURCE_URL =
  "https://www.phila.gov/media/20260209092722/PG_012_INF_Summary-of-construction-permit-fees-Eff-1.1.2025-Rev-2.2026.pdf";

type PhiladelphiaRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 76.5 to $77. */
  typicalExact: string;
  rangeExact: string;
};

function philadelphiaMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function philadelphiaSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Philadelphia roof: 1-2 family roof covering replacement $69 plus city $3
 * and PA state $4.50. The $25 filing fee is credited. Fees stay
 * $76.50 / $76.50 / $76.50. Valuation is unused. Alterations ($76 first 500 sf)
 * is structural roof work and is not the recorded typical path.
 * Returns null if those anchors drift.
 */
function philadelphiaRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "philadelphia-pa" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!philadelphiaSameCents(permit.feeLowUsd, 76.5)) return false;
  if (!philadelphiaSameCents(permit.feeTypicalUsd, 76.5)) return false;
  if (!philadelphiaSameCents(permit.feeHighUsd, 76.5)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== PHILADELPHIA_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== PHILADELPHIA_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "Roof covering replacement (1-2 family)" ||
    !philadelphiaSameCents(extras[0]?.feeUsd, 69)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "City $3 + PA state $4.50" ||
    !philadelphiaSameCents(extras[1]?.feeUsd, 7.5)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included in the $76.50 total.") return false;
  if ((extras[1]?.note || "") !== "On every permit. Included. $25 filing fee is credited.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(PHILADELPHIA_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$76\.50, feeTypicalUsd is \$76\.50, and feeHighUsd is \$76\.50/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not an input on this flat path/.test(note)) return false;
  if (!/unused and do not change the \$76\.50 \/ \$76\.50 \/ \$76\.50/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$76\.50/.test(note)) return false;
  if (!/Roof covering replacement \(1-2 family\) \$69/.test(note)) return false;
  if (!/City \$3/.test(note) || !/PA state \$4\.50/.test(note) || !/\$7\.50/.test(note)) return false;
  if (!/\$25 filing fee is credited/.test(note)) return false;
  if (!/so feeLowUsd is \$76\.50/.test(note)) return false;
  if (!/same replacement path as the typical/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$76\.50/.test(note)) return false;
  if (!/so feeTypicalUsd is \$76\.50/.test(note)) return false;
  if (!/included in the \$76\.50 and are not added again/.test(note)) return false;
  if (!/High \$22,000: valuation is unused, so feeHighUsd stays \$76\.50/.test(note)) return false;
  if (!/so feeHighUsd is \$76\.50/.test(note)) return false;
  if (!/not added on top/.test(note)) return false;
  if (!/replacement-only/.test(note)) return false;
  if (!/Alterations \(\$76 first 500 sf\)/.test(note)) return false;
  if (!/not the recorded typical path/.test(note)) return false;
  if (!/does not add it/.test(note)) return false;
  if (!/Oct 1, 2026 PDF is published but not in force/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$76\.50/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/\$69 is replacement-only/.test(caveat)) return false;
  if (!/Alterations \(\$76 first 500 sf\)/.test(caveat)) return false;
  if (!/Oct 1, 2026 PDF is published but not in force/.test(caveat)) return false;
  if (!/2026-09-01/.test(caveat)) return false;
  return true;
}

/**
 * Short Philadelphia roof copy. The $69 plus $7.50 flat walk stays on the
 * permit callout calculation note. Null unless the recorded $76.50 / $76.50 / $76.50
 * anchors match.
 */
function philadelphiaRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): PhiladelphiaRoofPageCopy | null {
  if (!philadelphiaRoofFacts(city, permit)) return null;
  const low = philadelphiaMoneyExact(permit.feeLowUsd as number);
  const typical = philadelphiaMoneyExact(permit.feeTypicalUsd as number);
  const high = philadelphiaMoneyExact(permit.feeHighUsd as number);
  const projectValue = philadelphiaMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = philadelphiaMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = philadelphiaMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = philadelphiaMoneyExact(permit.assumedValuationUsd?.high as number);
  const covering = philadelphiaMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  const surcharge = philadelphiaMoneyExact((permit.extras || [])[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat roof covering replacement path, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". That total is the " +
        covering +
        " roof covering replacement (1-2 family) line plus city $3 and PA state $4.50 (" +
        surcharge +
        "). The $25 filing fee is credited and is not added on top. Structural roof work billed as Alterations ($76 first 500 sf) is not the recorded typical path. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": roof covering replacement (1-2 family) " +
        covering +
        " plus city $3 and PA state $4.50 (" +
        surcharge +
        "). Low and high are the same " +
        low +
        " replacement path. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on this flat path, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on the roof covering replacement (1-2 family) line (" +
        covering +
        " plus city $3 and PA state $4.50). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is the same total and is not added on top of the typical. Valuation is unused. Structural roof work billed as Alterations ($76 first 500 sf) is not the recorded typical path. The Oct 1, 2026 PDF is published but not in force on the 2026-09-01 retrieval date. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical 1-2 family roof covering replacement is the recorded path, and the typical fee on that path is " +
      typical +
      ". Structural roof work billed as Alterations ($76 first 500 sf) is not the typical path.",
    includedClause:
      "The " +
      covering +
      " roof covering replacement and the " +
      surcharge +
      " city and state surcharges are included in that " +
      typical +
      ". The $25 filing fee is credited and is not added on top. The " +
      high +
      " high is the same replacement total and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const DETROIT_ROOF_SOURCE_NAME =
  "City of Detroit BSEED Fee Schedule, effective Jan 1, 2024, modified July 18, 2025 — Building and Residential Permits";
const DETROIT_ROOF_SOURCE_URL =
  "https://detroitmi.gov/sites/detroitmi.localhost/files/2026-08/Fee%20Schedule.Effective_January_1_2024_Modified%20July%2018%2C%202025.pdf";

type DetroitRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 475.97 / 612.33 / 953.23. */
  typicalExact: string;
  rangeExact: string;
};

function detroitMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function detroitSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Detroit roof: building/residential band $2,001-$25,000 is $271.43 plus
 * $34.09 per additional $1,000 or fraction above $2,000. Fees stay
 * $475.97 / $612.33 / $953.23 at $8,000 / $12,000 / $22,000. The 35%
 * plan-review is a deposit credited to the permit, not an add-on.
 * Returns null if those anchors drift.
 */
function detroitRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "detroit-mi" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!detroitSameCents(permit.feeLowUsd, 475.97)) return false;
  if (!detroitSameCents(permit.feeTypicalUsd, 612.33)) return false;
  if (!detroitSameCents(permit.feeHighUsd, 953.23)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== DETROIT_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== DETROIT_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !== "Building/residential permit $2,001\u2013$25,000" ||
    !detroitSameCents(extras[0]?.feeUsd, 612.33)
  ) {
    return false;
  }
  const extraNote = extras[0]?.note || "";
  if (!/Included in the typical \$612\.33 total/.test(extraNote)) return false;
  if (!/\$271\.43 \+ \$34\.09 × 10 at \$12,000 = \$612\.33/.test(extraNote)) return false;
  if (!/35% plan-review is a deposit credited to the permit, not an add-on/.test(extraNote)) return false;
  if (!/Low and high lines are in the calculation note/.test(extraNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(DETROIT_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$475\.97, feeTypicalUsd is \$612\.33, and feeHighUsd is \$953\.23/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/\$2,001\u2013\$25,000/.test(note)) return false;
  if (!/\$271\.43/.test(note) || !/\$34\.09/.test(note) || !/or fraction above \$2,000/.test(note)) {
    return false;
  }
  if (!/exact thousand above \$2,000/.test(note) || !/no fractional thousand is added/.test(note)) {
    return false;
  }
  if (!/35% plan-review is a deposit credited to the permit, not an add-on/.test(note)) return false;
  if (!/does not add that 35% on top of the recorded totals/.test(note)) return false;
  if (!/Low \$8,000: 6 additional thousands above \$2,000/.test(note)) return false;
  if (!/\$271\.43 \+ \$34\.09 × 6 = \$475\.97/.test(note)) return false;
  if (!/which is feeLowUsd \$475\.97/.test(note)) return false;
  if (!/Typical \$12,000: 10 additional thousands above \$2,000/.test(note)) return false;
  if (!/\$271\.43 \+ \$34\.09 × 10 = \$612\.33/.test(note)) return false;
  if (!/which is feeTypicalUsd \$612\.33/.test(note)) return false;
  if (!/included in the typical total/.test(note) || !/not added again/.test(note)) return false;
  if (!/High \$22,000: 20 additional thousands above \$2,000/.test(note)) return false;
  if (!/\$271\.43 \+ \$34\.09 × 20 = \$953\.23/.test(note)) return false;
  if (!/which is feeHighUsd \$953\.23/.test(note)) return false;
  if (!/\$953\.23 high is not added on top of the \$612\.33 typical/.test(note)) return false;
  if (!/No like-kind reroof exemption was found in this schedule/.test(note)) return false;
  if (!/does not add a \$0 exemption line/.test(note)) return false;
  if (!/square-foot cost table or the contract/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$475\.97, \$612\.33, and \$953\.23 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/No like-kind reroof exemption found in this schedule/.test(caveat)) return false;
  if (!/square-foot cost table or contract/.test(caveat)) return false;
  return true;
}

/**
 * Short Detroit roof copy. The $271.43 + $34.09 band walk stays on the permit
 * callout calculation note. Null unless the recorded $475.97 / $612.33 / $953.23
 * anchors match.
 */
function detroitRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DetroitRoofPageCopy | null {
  if (!detroitRoofFacts(city, permit)) return null;
  const low = detroitMoneyExact(permit.feeLowUsd as number);
  const typical = detroitMoneyExact(permit.feeTypicalUsd as number);
  const high = detroitMoneyExact(permit.feeHighUsd as number);
  const projectValue = detroitMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = detroitMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = detroitMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = detroitMoneyExact(permit.assumedValuationUsd?.high as number);
  const band = detroitMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is the building/residential band for $2,001-$25,000: $271.43 plus $34.09 per additional $1,000 or fraction above $2,000. The 35% plan-review is a deposit credited to the permit, not an add-on. No like-kind reroof exemption was found in this schedule. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The $2,001-$25,000 building/residential band is $271.43 plus $34.09 each additional $1,000 or fraction above $2,000. The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ". The 35% plan-review is a deposit credited to the permit, not an add-on. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". Low is " +
        low +
        " and high is " +
        high +
        ". Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. The 35% plan-review is a deposit credited to the permit, not an add-on. No like-kind reroof exemption was found in this schedule. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical roof replacement is the recorded building/residential valuation path, and the typical fee on that path is " +
      typical +
      ". No like-kind reroof exemption was found in this schedule.",
    includedClause:
      "The " +
      band +
      " building/residential permit line is that typical total and is not a separate add-on. The 35% plan-review is a deposit credited to the permit and is not added on top. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const DALLAS_ROOF_SOURCE_NAME =
  "City of Dallas Permit Fee Schedule effective July 1, 2025 (Tables B-II / B-I) and Chapter 52";
const DALLAS_ROOF_SOURCE_URL =
  "https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/DSDFees%20%281%29.pdf";

type DallasRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round the high bound 422.42 to $422. */
  typicalExact: string;
  rangeExact: string;
};

function dallasMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function dallasSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Dallas roof: Table B-II master $181 + technology $15 at every recorded valuation.
 * High bound is Table B-I standalone at $22,000 only. Fees stay $196 / $196 / $422.42.
 * Returns null if those anchors drift.
 */
function dallasRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "dallas-tx" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!dallasSameCents(permit.feeLowUsd, 196)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 196)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 422.42)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== DALLAS_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== DALLAS_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Table B-II master (SF/duplex)" ||
    !dallasSameCents(extras[0]?.feeUsd, 181)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Technology fee §303.5.29" || !dallasSameCents(extras[1]?.feeUsd, 15)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Table B-I standalone at $22,000" ||
    !dallasSameCents(extras[2]?.feeUsd, 422.42)
  ) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(DALLAS_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Table B-II/.test(note) || !/Table B-I/.test(note)) return false;
  if (!/\$181/.test(note) || !/\$15/.test(note) || !/\$196/.test(note)) return false;
  if (!/feeLowUsd \$196/.test(note) || !/feeTypicalUsd \$196/.test(note)) return false;
  if (!/feeHighUsd \$422\.42/.test(note)) return false;
  if (!/0\.009652 × 1\.33 = \$282\.42/.test(note)) return false;
  if (!/\$125/.test(note) || !/\$422\.42/.test(note)) return false;
  if (!/\$100/.test(note) || !/\$175/.test(note)) return false;
  if (!/not used for the published low or typical/.test(note)) return false;
  if (!/not recorded/.test(note)) return false;
  if (!/Exempt only if the reroof is 2 roofing squares or less/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Table B-II \$181/.test(caveat) || !/\$15/.test(caveat)) return false;
  if (!/Table B-I is the high bound/.test(caveat)) return false;
  if (!/standalone trade permit/.test(caveat)) return false;
  if (!/2 roofing squares or less/.test(caveat)) return false;
  return true;
}

/**
 * Short Dallas roof copy. The full B-II vs B-I walk stays on the permit
 * callout calculation note. Null unless the recorded $196 / $196 / $422.42 anchors match.
 */
function dallasRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DallasRoofPageCopy | null {
  if (!dallasRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Table B-II plus the technology fee is the same at all three valuations. The high fee applies only on the Table B-I standalone path. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The typical path is Table B-II $181 plus the $15 technology fee. The Table B-I high bound is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". Table B-II is " +
        typical +
        " at each of those valuations. The high-bound arithmetic is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        ". The high bound of " +
        high +
        " applies only if the job is processed as a standalone Table B-I trade permit. Full arithmetic is in the calculation note on this page. A reroof of 2 roofing squares or less is exempt. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const DALLAS_HVAC_SOURCE_NAME =
  "Dallas Table B-I (standalone trade permits) and Chapter 52 §301.2.3 / §303.5.29";
const DALLAS_HVAC_SOURCE_URL =
  "https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/DSDFees%20%281%29.pdf";

type DallasHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round the high fee 345.39 to $345. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Dallas HVAC: Table B-I max($175, value × 0.009652 × 1.33) + $125 + $15.
 * Fees stay $315 / $315 / $345.39. Returns null if those anchors drift.
 */
function dallasHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "dallas-tx" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 315)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 315)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 345.39)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== DALLAS_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== DALLAS_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Table B-I minimum permit" ||
    !dallasSameCents(extras[0]?.feeUsd, 175)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Additional inspection per trade" ||
    !dallasSameCents(extras[1]?.feeUsd, 125)
  ) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Technology fee" || !dallasSameCents(extras[2]?.feeUsd, 15)) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(DALLAS_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Table B-I/.test(note)) return false;
  if (!/§301\.2\.3/.test(note) || !/§303\.5\.29/.test(note)) return false;
  if (!/max\(\$175, value × 0\.009652 × 1\.33\)/.test(note)) return false;
  if (!/feeLowUsd \$315/.test(note) || !/feeTypicalUsd \$315/.test(note)) return false;
  if (!/feeHighUsd \$345\.39/.test(note)) return false;
  if (!/\$205\.39/.test(note) || !/\$345\.39/.test(note)) return false;
  if (!/\$175/.test(note) || !/\$125/.test(note) || !/\$15/.test(note)) return false;
  if (!/not binding/.test(note) || !/not recorded/.test(note)) return false;
  if (!/like-for-like permanent electric HVAC/.test(note)) return false;
  if (!/no rough-in change/.test(note) || !/not that exemption/.test(note)) return false;
  if (!/gas furnace/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/§301\.2\.3\(8\)/.test(caveat)) return false;
  if (!/like-for-like permanent electric HVAC/.test(caveat)) return false;
  if (!/no rough-in change/.test(caveat)) return false;
  if (!/gas furnace/.test(caveat) || !/not that exemption/.test(caveat)) return false;
  return true;
}

/**
 * Short Dallas HVAC copy. The full Table B-I walk stays on the permit
 * callout calculation note. Null unless the recorded $315 / $315 / $345.39 anchors match.
 */
function dallasHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DallasHvacPageCopy | null {
  if (!dallasHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". The Table B-I minimum binds at the low and typical valuations. The high fee uses the valuation line above that minimum. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Table B-I is max($175, value × 0.009652 × 1.33) plus the $125 additional inspection and the $15 technology fee. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". Low and typical are " +
        typical +
        ". The high fee of " +
        high +
        " is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Chapter 52 §301.2.3(8) exempts like-for-like permanent electric HVAC with no rough-in change. A typical gas furnace plus air conditioner is not that exemption. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const DALLAS_KITCHEN_SOURCE_NAME =
  "Dallas Tables B-II and B-I; Chapter 52 §301.2.1(1)(8), §303.2.1.1";
const DALLAS_KITCHEN_SOURCE_URL =
  "https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/DSDFees%20%281%29.pdf";

type DallasKitchenPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round the high fee 1352.79 to $1,353. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Dallas kitchen: Table B-II master + 2 additional trades + tech is the recorded
 * $296 low. Table B-II master + 3 additional trades + tech is the recorded $396
 * typical. Table B-I at $75,000 with 3 trades is the recorded $1,352.79 high.
 * The cosmetic-only path is not a recorded total. Returns null if those anchors drift.
 */
function dallasKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "dallas-tx" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!dallasSameCents(permit.feeLowUsd, 296)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 396)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 1352.79)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 15000 || valuation.typical !== 35000 || valuation.high !== 75000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== DALLAS_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== DALLAS_KITCHEN_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "Table B-II master + 3 additional trades + tech" ||
    !dallasSameCents(extras[0]?.feeUsd, 396)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Table B-I at $75,000 with 3 trades" ||
    !dallasSameCents(extras[1]?.feeUsd, 1352.79)
  ) {
    return false;
  }
  const typicalNote = extras[0]?.note || "";
  if (!/Included as typical/.test(typicalNote)) return false;
  if (!/\$181 \+ 3 additional trades \$200 \+ technology fee \$15 = \$396/.test(typicalNote)) return false;
  if (!/2-additional-trade path of \$296 is feeLowUsd/.test(typicalNote)) return false;
  const highNote = extras[1]?.note || "";
  if (!/Not included in the typical Table B-II total/.test(highNote)) return false;
  if (!/\$962\.79 \+ \$375 \+ \$15 = \$1,352\.79/.test(highNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(DALLAS_KITCHEN_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$296, feeTypicalUsd is \$396, and feeHighUsd is \$1,352\.79/.test(note)) return false;
  if (!/recorded typical project value is \$35,000/.test(note)) return false;
  if (!/\$15,000 low, \$35,000 typical, and \$75,000 high/.test(note)) return false;
  if (!/Table B-II does not scale with the \$15,000 or \$35,000 valuations/.test(note)) return false;
  if (!/not used for the published low or typical fees/.test(note)) return false;
  if (!/Low \$15,000: valuation is not an input on Table B-II, so feeLowUsd stays \$296/.test(note)) {
    return false;
  }
  if (!/Table B-II master \$181 \+ 2 additional trades \$100/.test(note)) return false;
  if (!/\$181 \+ \$100 \+ \$15 = \$296, so feeLowUsd is \$296/.test(note)) return false;
  if (!/§303\.5\.29/.test(note)) return false;
  if (!/Typical \$35,000: valuation is not an input on Table B-II, so feeTypicalUsd stays \$396/.test(note)) {
    return false;
  }
  if (!/Table B-II master \$181 \+ 3 additional trades \$200/.test(note)) return false;
  if (!/\$181 \+ \$200 \+ \$15 = \$396, so feeTypicalUsd is \$396/.test(note)) return false;
  if (!/included as the typical and is not added again/.test(note)) return false;
  if (!/2-additional-trade path of \$296 is feeLowUsd and is not the typical total/.test(note)) return false;
  if (!/value × 0\.009652 × 1\.33 = \$962\.79/.test(note)) return false;
  if (!/not binding because \$962\.79 is higher/.test(note)) return false;
  if (!/3 × \$125 = \$375/.test(note)) return false;
  if (!/\$962\.79 \+ \$375 \+ \$15 = \$1,352\.79, so feeHighUsd is \$1,352\.79/.test(note)) return false;
  if (!/not added on top of the \$396 typical/.test(note)) return false;
  if (!/A separate Table B-I total at \$15,000 or \$35,000 is not recorded/.test(note)) return false;
  if (!/§301\.2\.1\(1\)/.test(note) || !/§301\.2\.1\(8\)/.test(note)) return false;
  if (!/painting, papering, paneling, floor coverings, cabinets, moldings, countertops/.test(note)) {
    return false;
  }
  if (!/nonload-bearing/.test(note)) return false;
  if (!/cosmetic-only path is not the recorded typical totals/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/Table B-II master with extra trades/.test(note)) return false;
  if (!/Table B-I valuation with 3 trades/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$296, \$396, and \$1,352\.79 totals/.test(note)) {
    return false;
  }
  if (!/\$15,000/.test(note) || !/\$35,000/.test(note) || !/\$75,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Cabinets\/countertops\/paint\/flooring only/.test(caveat)) return false;
  if (!/building permit not required/.test(caveat)) return false;
  if (!/Typical path is B-II master with extra trades/.test(caveat)) return false;
  if (!/High is B-I valuation with 3 trades/.test(caveat)) return false;
  return true;
}

/**
 * Short Dallas kitchen copy. The Table B-II and Table B-I walk stays on the
 * permit callout calculation note. Null unless the recorded $296 / $396 / $1,352.79
 * anchors match.
 */
function dallasKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DallasKitchenPageCopy | null {
  if (!dallasKitchenFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded Table B-II and Table B-I paths, so the low fee is " +
        low +
        " (Table B-II master $181 + 2 additional trades $100 + technology fee $15), the typical fee is " +
        typical +
        " (Table B-II master $181 + 3 additional trades $200 + technology fee $15), and the high fee is " +
        high +
        " (Table B-I at $75,000 with 3 trades: $962.79 + $375 + $15). The high is not added on top of the typical. Cabinets, countertops, paint, or flooring only do not require a building permit and are not the recorded typical path. Full arithmetic is in the calculation note on this page. Recorded valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Table B-II does not scale with the low or typical valuation. The high fee uses the recorded " +
        highVal +
        " valuation. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Table B-II master $181 + 3 additional trades $200 + technology fee $15. Low is " +
        low +
        " on the 2-additional-trade Table B-II path. High is " +
        high +
        " on Table B-I at $75,000 with 3 trades. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Table B-II does not scale with the " +
        lowVal +
        " or " +
        typicalVal +
        " valuations, so the low fee stays " +
        low +
        " and the typical fee stays " +
        typical +
        ". The high fee of " +
        high +
        " is Table B-I at the recorded " +
        highVal +
        " valuation",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on Table B-II master plus 3 additional trades plus the technology fee. The low fee is " +
        low +
        " and the high fee is " +
        high +
        " on Table B-I at $75,000 with 3 trades. The high is not added on top of the typical. Cabinets, countertops, paint, or flooring only do not require a building permit and are not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical kitchen remodel with extra trades is the recorded Table B-II master path, and the typical fee on that path is " +
      typical +
      ". Cabinets, countertops, paint, or flooring only do not require a building permit and are not the typical path.",
    includedClause:
      "The $181 master, the $200 additional-trade component, and the $15 technology fee are included in that " +
      typical +
      ". The " +
      high +
      " Table B-I path at $75,000 with 3 trades is the recorded high and is not added on top of the typical. The " +
      low +
      " two-additional-trade path is the recorded low and is not the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const DALLAS_DECK_SOURCE_NAME =
  "Dallas Chapter 52 §301.2.1(13), Table B-II / B-I, technology $15";
const DALLAS_DECK_SOURCE_URL =
  "https://dallascityhall.com/departments/sustainabledevelopment/buildinginspection/DCH%20documents/DSDFees%20%281%29.pdf";

type DallasDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round the high fee 386.47 to $386. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Dallas deck: Table B-II $181 + technology $15 is the recorded $196 low and
 * typical for an attached deck. Table B-I at $19,200 is the recorded $386.47
 * high. The §301.2.1(13) exemption is not a recorded total. Returns null if
 * those anchors drift.
 */
function dallasDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "dallas-tx" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!dallasSameCents(permit.feeLowUsd, 196)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 196)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 386.47)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== DALLAS_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== DALLAS_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "Table B-II + technology" ||
    !dallasSameCents(extras[0]?.feeUsd, 196)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Table B-I at $19,200" ||
    !dallasSameCents(extras[1]?.feeUsd, 386.47)
  ) {
    return false;
  }
  const typicalNote = extras[0]?.note || "";
  if (!/Included as typical/.test(typicalNote)) return false;
  if (!/\$181 plus the technology permit fee of \$15 = \$196/.test(typicalNote)) return false;
  if (!/feeLowUsd and feeTypicalUsd/.test(typicalNote)) return false;
  const highNote = extras[1]?.note || "";
  if (!/Not included in the typical Table B-II total/.test(highNote)) return false;
  if (!/\$246\.47 \+ \$125 \+ \$15 = \$386\.47/.test(highNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(DALLAS_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$196, feeTypicalUsd is \$196, and feeHighUsd is \$386\.47/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$19,200 high/.test(note)) return false;
  if (!/Table B-II does not scale with the \$8,000 or \$12,000 valuations/.test(note)) return false;
  if (!/not used for the published low or typical fees/.test(note)) return false;
  if (!/Low \$8,000: valuation is not an input on Table B-II, so feeLowUsd stays \$196/.test(note)) {
    return false;
  }
  if (!/Table B-II \$181 plus the technology permit fee of \$15/.test(note)) return false;
  if (!/\$181 \+ \$15 = \$196, so feeLowUsd is \$196/.test(note)) return false;
  if (!/§303\.5\.29/.test(note)) return false;
  if (!/Typical \$12,000: valuation is not an input on Table B-II, so feeTypicalUsd stays \$196/.test(note)) {
    return false;
  }
  if (!/\$181 \+ \$15 = \$196, so feeTypicalUsd is \$196/.test(note)) return false;
  if (!/included as the typical and is not added again/.test(note)) return false;
  if (!/typical attached deck uses Table B-II \$196/.test(note)) return false;
  if (!/value × 0\.009652 × 1\.33 = \$246\.47/.test(note)) return false;
  if (!/not binding because \$246\.47 is higher/.test(note)) return false;
  if (!/\$246\.47 \+ \$125 \+ \$15 = \$386\.47, so feeHighUsd is \$386\.47/.test(note)) return false;
  if (!/not added on top of the \$196 typical/.test(note)) return false;
  if (!/A separate Table B-I total at \$8,000 or \$12,000 is not recorded/.test(note)) return false;
  if (!/§301\.2\.1\(13\)/.test(note)) return false;
  if (!/200 square feet or less, 30 inches or less/.test(note)) return false;
  if (!/not attached to the dwelling/.test(note)) return false;
  if (!/not under a service drop/.test(note)) return false;
  if (!/does not serve the required exit/.test(note)) return false;
  if (!/exemption is not the recorded typical path/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/Table B-II attached-deck total of \$196/.test(note)) return false;
  if (!/recorded high stays Table B-I at \$19,200/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$196, \$196, and \$386\.47 totals/.test(note)) {
    return false;
  }
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Exemption 301\.2\.1\(13\)/.test(caveat)) return false;
  if (!/≤200 sf/.test(caveat) || !/≤30 in\./.test(caveat)) return false;
  if (!/not attached to the dwelling/.test(caveat)) return false;
  if (!/not under a service drop/.test(caveat)) return false;
  if (!/does not serve the required exit/.test(caveat)) return false;
  if (!/Typical attached deck uses B-II \$196/.test(caveat)) return false;
  return true;
}

/**
 * Short Dallas deck copy. The Table B-II and Table B-I walk stays on the
 * permit callout calculation note. Null unless the recorded $196 / $196 / $386.47
 * anchors match.
 */
function dallasDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): DallasDeckPageCopy | null {
  if (!dallasDeckFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded Table B-II and Table B-I paths, so the low fee is " +
        low +
        " (Table B-II $181 + technology fee $15), the typical fee is " +
        typical +
        " (the same attached-deck Table B-II path), and the high fee is " +
        high +
        " (Table B-I at $19,200: $246.47 + $125 + $15). The high is not added on top of the typical. Chapter 52 §301.2.1(13) applies only if all of: 200 square feet or less, 30 inches or less, not attached to the dwelling, not under a service drop, and it does not serve the required exit. That exemption is not the recorded typical path. Full arithmetic is in the calculation note on this page. Recorded valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Table B-II does not scale with the low or typical valuation. The high fee uses the recorded " +
        highVal +
        " valuation. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Table B-II $181 plus the technology fee of $15. Low is the same " +
        low +
        ". High is " +
        high +
        " on Table B-I at $19,200 ($246.47 + $125 + $15). The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Table B-II does not scale with the " +
        lowVal +
        " or " +
        typicalVal +
        " valuations, so the low fee stays " +
        low +
        " and the typical fee stays " +
        typical +
        ". The high fee of " +
        high +
        " is Table B-I at the recorded " +
        highVal +
        " valuation",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on Table B-II plus the technology fee. The low fee is " +
        low +
        " and the high fee is " +
        high +
        " on Table B-I at $19,200. The high is not added on top of the typical. Chapter 52 §301.2.1(13) is not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical attached deck is the recorded Table B-II path, and the typical fee on that path is " +
      typical +
      ". Chapter 52 §301.2.1(13) exempts a deck only when every listed condition is met, and that exemption is not the typical path.",
    includedClause:
      "The $181 Table B-II base and the $15 technology fee are included in that " +
      typical +
      ". The " +
      high +
      " Table B-I path at $19,200 is the recorded high and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MINNEAPOLIS_ROOF_SOURCE_NAME =
  "City of Minneapolis Building Permit Fee Schedule (Smartsheet published on the official building-fees page; city page last updated Feb 27, 2026)";
const MINNEAPOLIS_ROOF_SOURCE_URL =
  "https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/building/";

type MinneapolisRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round 379.87 / 517.83 / 862.73. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Minneapolis roof: $2,001–$25,000 band ($104.20 + $20.60 per additional $1,000)
 * plus 65% plan review plus value × 0.0005. Fees stay $379.87 / $517.83 / $862.73.
 * Returns null if those anchors drift.
 */
function minneapolisRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "minneapolis-mn" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 379.87)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 517.83)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 862.73)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-08-29") return false;
  if (permit.sourceUrl !== MINNEAPOLIS_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== MINNEAPOLIS_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Building permit fee (valuation table)" ||
    !dallasSameCents(extras[0]?.feeUsd, 310.2)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Plan review (65% of building permit fee)" ||
    !dallasSameCents(extras[1]?.feeUsd, 201.63)
  ) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Minnesota state surcharge" ||
    !dallasSameCents(extras[2]?.feeUsd, 6)
  ) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(MINNEAPOLIS_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-08-29/.test(note)) return false;
  if (!/\$2,001\u2013\$25,000/.test(note)) return false;
  if (!/\$104\.20/.test(note) || !/\$20\.60/.test(note) || !/or fraction/.test(note)) return false;
  if (!/65%/.test(note) || !/0\.0005/.test(note)) return false;
  if (!/\$20\.60 × 6 = \$227\.80/.test(note)) return false;
  if (!/65% × \$227\.80 = \$148\.07/.test(note)) return false;
  if (!/\$8,000 × 0\.0005 = \$4\.00/.test(note)) return false;
  if (!/\$227\.80 \+ \$148\.07 \+ \$4\.00 = \$379\.87/.test(note)) return false;
  if (!/feeLowUsd \$379\.87/.test(note)) return false;
  if (!/\$20\.60 × 10 = \$310\.20/.test(note)) return false;
  if (!/65% × \$310\.20 = \$201\.63/.test(note)) return false;
  if (!/\$12,000 × 0\.0005 = \$6\.00/.test(note)) return false;
  if (!/\$310\.20 \+ \$201\.63 \+ \$6\.00 = \$517\.83/.test(note)) return false;
  if (!/feeTypicalUsd \$517\.83/.test(note)) return false;
  if (!/\$20\.60 × 20 = \$516\.20/.test(note)) return false;
  if (!/65% × \$516\.20 = \$335\.53/.test(note)) return false;
  if (!/\$22,000 × 0\.0005 = \$11\.00/.test(note)) return false;
  if (!/\$516\.20 \+ \$335\.53 \+ \$11\.00 = \$862\.73/.test(note)) return false;
  if (!/feeHighUsd \$862\.73/.test(note)) return false;
  if (!/\$84\.20/.test(note) || !/not binding/.test(note)) return false;
  if (!/exact thousand above \$2,000/.test(note)) return false;
  if (!/Like-for-like shingle reroofs/.test(note) || !/older worksheets/.test(note)) return false;
  if (!/Feb 2026/.test(note) || !/does not list that exception/.test(note)) return false;
  if (!/65% plan review is included/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/65% plan review/.test(caveat) || !/0\.0005/.test(caveat)) return false;
  if (!/\$84\.20/.test(caveat) || !/excluding the surcharge/.test(caveat)) return false;
  if (!/Like-for-like shingle reroofs/.test(caveat) || !/older worksheets/.test(caveat)) return false;
  if (!/Feb 2026/.test(caveat) || !/does not list that exception/.test(caveat)) return false;
  if (!/65% plan review is included/.test(caveat)) return false;
  if (!/Minneapolis Development Review/.test(caveat)) return false;
  return true;
}

/**
 * Short Minneapolis roof copy. The full band walk stays on the permit
 * callout calculation note. Null unless the recorded $379.87 / $517.83 / $862.73 anchors match.
 */
function minneapolisRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MinneapolisRoofPageCopy | null {
  if (!minneapolisRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is the $2,001–$25,000 building-permit line plus 65% plan review plus the 0.0005 Minnesota state surcharge. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The $2,001–$25,000 band is $104.20 for the first $2,000 plus $20.60 each additional $1,000 or fraction, plus 65% plan review and the 0.0005 Minnesota state surcharge. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Like-for-like shingle reroofs historically skipped city plan review on older worksheets. The Feb 2026 published formula does not list that exception, so 65% plan review is included. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MINNEAPOLIS_HVAC_SOURCE_NAME =
  "City of Minneapolis existing residential mechanical permit fee schedule (Smartsheet on the official page; last updated Feb 27, 2026)";
const MINNEAPOLIS_HVAC_SOURCE_URL =
  "https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/existing-mechanical/";

type MinneapolisHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 133.40 / 217.60. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Minneapolis HVAC: existing-residential mechanical Level 2 furnace/boiler
 * plus the $1 Minnesota surcharge is the recorded $133.40 low. Level 3
 * entire-system replacement plus the same $1 surcharge is the recorded
 * $217.60 typical and high. Valuation is unused. Level 1 miscellaneous HVAC
 * with no burner ($84.20) is not a recorded total. Electrical (Minnesota DLI)
 * is not in the locked totals.
 * Returns null if those anchors drift.
 */
function minneapolisHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "minneapolis-mn" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!dallasSameCents(permit.feeLowUsd, 133.4)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 217.6)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 217.6)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-08-29") return false;
  if (permit.sourceUrl !== MINNEAPOLIS_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== MINNEAPOLIS_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if (
    (extras[0]?.name || "") !==
      "Existing residential mechanical \u2014 Level 3 (entire system replacement)" ||
    !dallasSameCents(extras[0]?.feeUsd, 216.6)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Existing residential mechanical \u2014 Level 2 (replace boiler/furnace)" ||
    !dallasSameCents(extras[1]?.feeUsd, 132.4)
  ) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Minnesota state surcharge" || !dallasSameCents(extras[2]?.feeUsd, 1)) {
    return false;
  }
  if ((extras[3]?.name || "") !== "Electrical permit (Minnesota DLI)" || extras[3]?.feeUsd != null) {
    return false;
  }
  const level3Note = extras[0]?.note || "";
  if (!/Level 3 includes Level 1 and 2 work/.test(level3Note)) return false;
  if (!/Included in typical\/high/.test(level3Note)) return false;
  const level2Note = extras[1]?.note || "";
  if (!/Used as the low path/.test(level2Note)) return false;
  if (!/Not added on top of typical/.test(level2Note)) return false;
  const surchargeNote = extras[2]?.note || "";
  if (!/\$1\.00 per mechanical permit application/.test(surchargeNote)) return false;
  if (!/Included/.test(surchargeNote)) return false;
  const electricalNote = extras[3]?.note || "";
  if (!/Minnesota Department of Labor and Industry/.test(electricalNote)) return false;
  if (!/Not computed/.test(electricalNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MINNEAPOLIS_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-08-29/.test(note)) return false;
  if (!/like-for-like change-out in an existing dwelling/.test(note)) return false;
  if (!/existing-residential mechanical table, not the building-valuation table/.test(note)) return false;
  if (!/feeModel is tiered/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$133\.40, feeTypicalUsd is \$217\.60, and feeHighUsd is \$217\.60/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/Valuation is not an input on this mechanical table/.test(note)) return false;
  if (!/unused and do not change the \$133\.40 \/ \$217\.60 \/ \$217\.60/.test(note)) return false;
  if (!/Low \$5,000: valuation is unused, so feeLowUsd stays \$133\.40/.test(note)) return false;
  if (!/Level 2 furnace\/boiler \$132\.40 plus the Minnesota state surcharge of \$1\.00/.test(note)) return false;
  if (!/Level 2 \$132\.40 \+ surcharge \$1\.00 = \$133\.40, so feeLowUsd is \$133\.40/.test(note)) return false;
  if (!/not added on top of the typical/.test(note)) return false;
  if (!/Typical \$7,500: valuation is unused, so feeTypicalUsd stays \$217\.60/.test(note)) return false;
  if (!/Level 3 entire-system replacement \$216\.60 plus the Minnesota state surcharge of \$1\.00/.test(note)) {
    return false;
  }
  if (!/Level 3 includes Level 1 and Level 2 work plus entire system replacement/.test(note)) return false;
  if (!/Level 2 line is not added again/.test(note)) return false;
  if (!/Level 3 \$216\.60 \+ surcharge \$1\.00 = \$217\.60, so feeTypicalUsd is \$217\.60/.test(note)) return false;
  if (!/included in the \$217\.60 and are not added again/.test(note)) return false;
  if (!/High \$16,000: valuation is unused, so feeHighUsd stays \$217\.60/.test(note)) return false;
  if (!/same Level 3 entire-system replacement path as the typical/.test(note)) return false;
  if (!/Level 3 \$216\.60 \+ surcharge \$1\.00 = \$217\.60, so feeHighUsd is \$217\.60/.test(note)) return false;
  if (!/\$217\.60 high is the same recorded total as the typical/.test(note)) return false;
  if (!/not a second fee stacked on top of it/.test(note)) return false;
  if (!/Level 1 miscellaneous HVAC with no burner is \$84\.20 and is not a recorded total/.test(note)) {
    return false;
  }
  if (!/does not add an \$84\.20 line/.test(note)) return false;
  if (!/Electrical \(Minnesota DLI\) is extra if new circuits are needed/.test(note)) return false;
  if (!/not invented into the locked totals/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$133\.40 and \$217\.60 totals/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/existing-residential mechanical table, not the building-valuation table/.test(caveat)) return false;
  if (!/Level 3 entire-system replacement \$216\.60 \+ \$1 surcharge/.test(caveat)) return false;
  if (!/Level 2 furnace\/boiler \$132\.40 \+ \$1/.test(caveat)) return false;
  if (!/Level 1 miscellaneous HVAC with no burner is \$84\.20/.test(caveat)) return false;
  if (!/Electrical is extra if new circuits are needed/.test(caveat)) return false;
  return true;
}

/**
 * Short Minneapolis HVAC copy. The Level 2 versus Level 3 walk stays on the
 * permit callout calculation note. Null unless the recorded $133.40 / $217.60 / $217.60
 * anchors match.
 */
function minneapolisHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MinneapolisHvacPageCopy | null {
  if (!minneapolisHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded existing-residential mechanical table, so the low fee is " +
        low +
        " (Level 2 furnace/boiler $132.40 plus the $1.00 Minnesota state surcharge), the typical fee is " +
        typical +
        " (Level 3 entire-system replacement $216.60 plus the $1.00 surcharge), and the high fee is " +
        high +
        " on the same Level 3 path. The high is not a second fee stacked on top of the typical. Level 1 miscellaneous HVAC with no burner is $84.20 and is not a recorded total. Electrical (Minnesota DLI) is extra if new circuits are needed and is not in these totals. Full arithmetic is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Level 3 entire-system replacement $216.60 plus the $1.00 Minnesota state surcharge. Low is " +
        low +
        " on Level 2 furnace/boiler ($132.40 + $1.00). High is the same " +
        high +
        " Level 3 path. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on the existing-residential mechanical table, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (tiered). The typical path is " +
        typical +
        " on Level 3 entire-system replacement ($216.60 plus the $1.00 Minnesota state surcharge). The low fee is " +
        low +
        " on Level 2 furnace/boiler ($132.40 plus $1.00) and is not added on top of the typical. The high fee is " +
        high +
        " on the same Level 3 path. Valuation is unused. Level 1 miscellaneous HVAC with no burner is $84.20 and is not a recorded total. Electrical (Minnesota DLI) is extra if new circuits are needed and is not in these totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical like-for-like change-out is the recorded Level 3 path, and the typical fee on that path is " +
      typical +
      ". Level 1 miscellaneous HVAC with no burner is $84.20 and is not the typical path.",
    includedClause:
      "The $216.60 Level 3 line and the $1.00 Minnesota state surcharge are included in that " +
      typical +
      ". The " +
      low +
      " Level 2 path is the recorded low and is not added on top of the typical. The " +
      high +
      " high is the same Level 3 total and is not a second fee. Electrical (Minnesota DLI) is not in that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MINNEAPOLIS_DECK_SOURCE_NAME =
  "City of Minneapolis Building Permit Fee Schedule (Smartsheet published on the official building-fees page; city page last updated Feb 27, 2026)";
const MINNEAPOLIS_DECK_SOURCE_URL =
  "https://www.minneapolismn.gov/business-services/licenses-permits-inspections/construction-permits/permits-overview/fees/building/";

type MinneapolisDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 379.87 / 517.83 / 793.35. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Minneapolis deck: $2,001–$25,000 band ($104.20 + $20.60 per additional $1,000
 * or fraction) plus 65% plan review plus value × 0.0005. Fees stay
 * $379.87 / $517.83 / $793.35 at $8,000 / $12,000 / $19,200. The detached-garage
 * table does not apply. Ground-level platforms may differ and are not a
 * recorded total. Returns null if those anchors drift.
 */
function minneapolisDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "minneapolis-mn" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 379.87)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 517.83)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 793.35)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-08-29") return false;
  if (permit.sourceUrl !== MINNEAPOLIS_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== MINNEAPOLIS_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Building permit fee (valuation table)" ||
    !dallasSameCents(extras[0]?.feeUsd, 310.2)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Plan review (65% of building permit fee)" ||
    !dallasSameCents(extras[1]?.feeUsd, 201.63)
  ) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Minnesota state surcharge" ||
    !dallasSameCents(extras[2]?.feeUsd, 6)
  ) {
    return false;
  }
  const buildingNote = extras[0]?.note || "";
  if (!/Included in the typical total as the building-permit line/.test(buildingNote)) return false;
  if (!/\$2,001\u2013\$25,000/.test(buildingNote)) return false;
  if (!/\$104\.20 \+ \$20\.60 × 10 = \$310\.20/.test(buildingNote)) return false;
  if (!/Low and high building-permit lines use the same band/.test(buildingNote)) return false;
  const planNote = extras[1]?.note || "";
  if (!/65% of the building permit fee/.test(planNote)) return false;
  if (!/\$310\.20 × 65% = \$201\.63/.test(planNote)) return false;
  if (!/New decks generally need plan review/.test(planNote)) return false;
  if (!/Low and high plan-review lines are in the calculation note/.test(planNote)) return false;
  const surchargeNote = extras[2]?.note || "";
  if (!/Value of work × 0\.0005/.test(surchargeNote)) return false;
  if (!/\$12,000 × 0\.0005 = \$6\.00/.test(surchargeNote)) return false;
  if (!/Low and high surcharge lines are in the calculation note/.test(surchargeNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MINNEAPOLIS_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-08-29/.test(note)) return false;
  if (!/new deck on the building valuation fee schedule, not the detached-garage table/.test(note)) {
    return false;
  }
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$379\.87, feeTypicalUsd is \$517\.83, and feeHighUsd is \$793\.35/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$19,200 high/.test(note)) return false;
  if (!/\$2,001\u2013\$25,000/.test(note)) return false;
  if (!/\$104\.20/.test(note) || !/\$20\.60/.test(note) || !/or fraction/.test(note)) return false;
  if (!/65%/.test(note) || !/0\.0005/.test(note)) return false;
  if (!/exact thousands above \$2,000/.test(note)) return false;
  if (!/no fractional thousand is added on those two paths/.test(note)) return false;
  if (!/\$17,200 above \$2,000/.test(note)) return false;
  if (!/17 thousands plus a fraction, so the additional count is 18/.test(note)) return false;
  if (!/\$84\.20/.test(note) || !/not binding/.test(note)) return false;
  if (!/Low \$8,000: 6 additional thousands/.test(note)) return false;
  if (!/\$20\.60 × 6 = \$227\.80/.test(note)) return false;
  if (!/65% × \$227\.80 = \$148\.07/.test(note)) return false;
  if (!/\$8,000 × 0\.0005 = \$4\.00/.test(note)) return false;
  if (!/\$227\.80 \+ \$148\.07 \+ \$4\.00 = \$379\.87/.test(note)) return false;
  if (!/so feeLowUsd is \$379\.87/.test(note)) return false;
  if (!/recorded low stack/.test(note)) return false;
  if (!/Typical \$12,000: 10 additional thousands/.test(note)) return false;
  if (!/\$20\.60 × 10 = \$310\.20/.test(note)) return false;
  if (!/65% × \$310\.20 = \$201\.63/.test(note)) return false;
  if (!/\$12,000 × 0\.0005 = \$6\.00/.test(note)) return false;
  if (!/\$310\.20 \+ \$201\.63 \+ \$6\.00 = \$517\.83/.test(note)) return false;
  if (!/so feeTypicalUsd is \$517\.83/.test(note)) return false;
  if (!/included in the \$517\.83 and are not added again/.test(note)) return false;
  if (!/High \$19,200: 18 additional thousands/.test(note)) return false;
  if (!/\$20\.60 × 18 = \$475\.00/.test(note)) return false;
  if (!/65% × \$475\.00 = \$308\.75/.test(note)) return false;
  if (!/\$19,200 × 0\.0005 = \$9\.60/.test(note)) return false;
  if (!/\$475\.00 \+ \$308\.75 \+ \$9\.60 = \$793\.35/.test(note)) return false;
  if (!/so feeHighUsd is \$793\.35/.test(note)) return false;
  if (!/\$793\.35 high is not added on top of the \$517\.83 typical/.test(note)) return false;
  if (!/detached-garage table does not apply and is not a recorded total/.test(note)) return false;
  if (!/Ground-level platforms may differ/.test(note)) return false;
  if (!/does not invent an alternate recorded total/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$379\.87, \$517\.83, and \$793\.35 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/Most new decks need a building permit/.test(caveat)) return false;
  if (!/valuation permit \+ 65% plan review \+ 0\.0005 surcharge/.test(caveat)) return false;
  if (!/Detached-garage table does not apply/.test(caveat)) return false;
  if (!/Ground-level platforms may have a different path/.test(caveat)) return false;
  if (!/Development Review/.test(caveat)) return false;
  return true;
}

/**
 * Short Minneapolis deck copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $379.87 / $517.83 / $793.35
 * anchors match.
 */
function minneapolisDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MinneapolisDeckPageCopy | null {
  if (!minneapolisDeckFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        " ($227.80 building permit + $148.07 plan review + $4.00 surcharge), the typical fee is " +
        typical +
        " ($310.20 + $201.63 + $6.00), and the high fee is " +
        high +
        " ($475.00 + $308.75 + $9.60). The high is not added on top of the typical. The detached-garage table does not apply. Ground-level platforms may differ and are not a recorded total. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": building permit $310.20 plus 65% plan review $201.63 plus the Minnesota state surcharge $6.00. Low is " +
        low +
        " on the $8,000 valuation ($227.80 + $148.07 + $4.00). High is " +
        high +
        " at $19,200 ($475.00 + $308.75 + $9.60). The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Each total is the $2,001–$25,000 building-permit line plus 65% plan review plus the 0.0005 Minnesota state surcharge. The low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation ($310.20 + $201.63 + $6.00). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. The detached-garage table does not apply. Ground-level platforms may differ and are not a recorded total. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical new deck is the recorded valuation path, and the typical fee on that path is " +
      typical +
      ". Most new decks need a building permit. Ground-level platforms may differ and are not the typical path.",
    includedClause:
      "The $310.20 building-permit line, the $201.63 plan-review line, and the $6.00 Minnesota state surcharge are included in that " +
      typical +
      ". The " +
      high +
      " path at $19,200 is the recorded high and is not added on top of the typical. The " +
      low +
      " path at $8,000 is the recorded low and is not the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MIAMI_ROOF_SOURCE_NAME =
  "City of Miami Exhibit C (R-26-0200, Apr 23, 2026) plus F.S. 553.721 / 468.631 and Miami-Dade 8-12(e)";
const MIAMI_ROOF_SOURCE_URL =
  "https://www.miami.gov/Permits-Construction/Permitting-Resources/City-of-Miami-Building-Permit-Fee-Schedule";

type MiamiRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round 158.80 / 161.20 / 167.20. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Miami roof: max($110, 0.50% of valuation) plus $40 application plus $0 solid
 * waste (roofing exempt) plus F.S. 553.721 / 468.631 minimums plus Miami-Dade
 * §8-12(e) at $0.60 per $1,000. Fees stay $158.80 / $161.20 / $167.20.
 * Returns null if those anchors drift.
 */
function miamiRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "miami-fl" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 158.8)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 161.2)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 167.2)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MIAMI_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== MIAMI_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 5) return false;
  if (
    (extras[0]?.name || "") !== "City permit (0.50%, min $110)" ||
    !dallasSameCents(extras[0]?.feeUsd, 110)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Application fee" || !dallasSameCents(extras[1]?.feeUsd, 40)) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Solid waste surcharge" || !dallasSameCents(extras[2]?.feeUsd, 0)) {
    return false;
  }
  if (
    (extras[3]?.name || "") !== "F.S. 553.721 1% + F.S. 468.631 1.5% (each min $2)" ||
    !dallasSameCents(extras[3]?.feeUsd, 4)
  ) {
    return false;
  }
  if (
    (extras[4]?.name || "") !== "Miami-Dade §8-12(e) $0.60/$1,000" ||
    !dallasSameCents(extras[4]?.feeUsd, 7.2)
  ) {
    return false;
  }

  const cityNote = extras[0]?.note || "";
  if (!/max\(\$110, 0\.50% of valuation\)/.test(cityNote)) return false;
  if (!/0\.50% × \$12,000 = \$60/.test(cityNote) || !/\$110 minimum applies/.test(cityNote)) return false;
  const appNote = extras[1]?.note || "";
  if (!/application fee is \$40 at each recorded valuation/.test(appNote)) return false;
  const wasteNote = extras[2]?.note || "";
  if (!/Included as \$0/.test(wasteNote) || !/Sec\. 10-18\(b\)\(2\)\(c\)\(3\)/.test(wasteNote)) return false;
  if (!/categorically exempt/.test(wasteNote)) return false;
  const stateNote = extras[3]?.note || "";
  if (!/1% is \$1\.10/.test(stateNote) || !/1\.5% is \$1\.65/.test(stateNote)) return false;
  if (!/state line is \$4/.test(stateNote)) return false;
  const countyNote = extras[4]?.note || "";
  if (!/\$0\.60 per \$1,000/.test(countyNote) || !/not printed as a dollar rate in Exhibit C/.test(countyNote)) {
    return false;
  }
  if (!/\$12,000 \/ \$1,000 × \$0\.60 = \$7\.20/.test(countyNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MIAMI_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/max\(\$110, 0\.50% of valuation\)/.test(note)) return false;
  if (!/application fee is \$40/.test(note)) return false;
  if (!/Solid waste is \$0 because roofing is categorically exempt/.test(note)) return false;
  if (!/Sec\. 10-18\(b\)\(2\)\(c\)\(3\)/.test(note)) return false;
  if (!/F\.S\. 553\.721 is 1% of the city permit fee/.test(note)) return false;
  if (!/F\.S\. 468\.631 is 1\.5% of the city permit fee/.test(note)) return false;
  if (!/\$2 minimum/.test(note)) return false;
  if (!/1% is \$1\.10 and 1\.5% is \$1\.65/.test(note)) return false;
  if (!/\$2 \+ \$2 = \$4/.test(note)) return false;
  if (!/Miami-Dade §8-12\(e\) is \$0\.60 per \$1,000/.test(note)) return false;
  if (!/not printed as a dollar rate in Exhibit C/.test(note)) return false;
  if (!/state minimums stay \$4 at each band/.test(note)) return false;
  if (!/0\.50% × \$8,000 = \$40/.test(note) || !/max\(\$110, \$40\) = \$110/.test(note)) return false;
  if (!/\$8,000 \/ \$1,000 × \$0\.60 = \$4\.80/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$0 \+ \$4 \+ \$4\.80 = \$158\.80/.test(note)) return false;
  if (!/feeLowUsd \$158\.80/.test(note)) return false;
  if (!/0\.50% × \$12,000 = \$60/.test(note) || !/max\(\$110, \$60\) = \$110/.test(note)) return false;
  if (!/\$12,000 \/ \$1,000 × \$0\.60 = \$7\.20/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$0 \+ \$4 \+ \$7\.20 = \$161\.20/.test(note)) return false;
  if (!/feeTypicalUsd \$161\.20/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/0\.50% × \$22,000 = \$110/.test(note) || !/max\(\$110, \$110\) = \$110/.test(note)) return false;
  if (!/\$22,000 \/ \$1,000 × \$0\.60 = \$13\.20/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$0 \+ \$4 \+ \$13\.20 = \$167\.20/.test(note)) return false;
  if (!/feeHighUsd \$167\.20/.test(note)) return false;
  if (!/folio prefix 01/.test(note) || !/not Miami-Dade RER/.test(note)) return false;
  if (!/not downloadable from this host \(403\)/.test(note)) return false;
  if (!/published Exhibit C as extracted/.test(note)) return false;
  if (!/SAVE 50% city-fee cut is not assumed/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/folio prefix 01/.test(caveat) || !/not Miami-Dade RER/.test(caveat)) return false;
  if (!/not downloadable from this host \(403\)/.test(caveat)) return false;
  if (!/0\.50% rate/.test(caveat) || !/\$110 minimum/.test(caveat) || !/\$40 application fee/.test(caveat)) {
    return false;
  }
  if (!/published Exhibit C as extracted/.test(caveat)) return false;
  if (!/SAVE 50% city-fee cut is not assumed/.test(caveat)) return false;
  return true;
}

/**
 * Short Miami roof copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $158.80 / $161.20 / $167.20 anchors match.
 */
function miamiRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MiamiRoofPageCopy | null {
  if (!miamiRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is max($110, 0.50% of valuation) plus the $40 application fee plus $0 solid waste (roofing exempt) plus the state minimums plus Miami-Dade §8-12(e) at $0.60 per $1,000. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The city permit is max($110, 0.50% of valuation), plus the $40 application fee, $0 solid waste because roofing is exempt, the F.S. 553.721 and F.S. 468.631 $2 minimums, and Miami-Dade §8-12(e) at $0.60 per $1,000. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. This row is the City of Miami (folio prefix 01), not Miami-Dade RER. The SAVE 50% city-fee cut is not assumed. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MIAMI_HVAC_SOURCE_NAME =
  "City of Miami Exhibit C + F.S. surcharges + Miami-Dade 8-12(e)";
const MIAMI_HVAC_SOURCE_URL =
  "https://www.miami.gov/Permits-Construction/Permitting-Resources/City-of-Miami-Building-Permit-Fee-Schedule";

type MiamiHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  /** Exact recorded dollars; usd() would round 184.50 to $185 and 198.80 to $199. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Miami HVAC: max($110, 0.50% of valuation) plus $40 application plus solid
 * waste ($0.22 per $100, minimum $26) plus F.S. 553.721 / 468.631 minimums
 * plus Miami-Dade §8-12(e) at $0.60 per $1,000. Fees stay $183.00 / $184.50 / $198.80.
 * Returns null if those anchors drift.
 */
function miamiHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "miami-fl" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 183)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 184.5)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 198.8)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MIAMI_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== MIAMI_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if ((extras[0]?.name || "") !== "City permit minimum" || !dallasSameCents(extras[0]?.feeUsd, 110)) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Application fee" || !dallasSameCents(extras[1]?.feeUsd, 40)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Solid waste ($0.22/$100, min $26)" ||
    !dallasSameCents(extras[2]?.feeUsd, 26)
  ) {
    return false;
  }

  const cityNote = extras[0]?.note || "";
  if (!/max\(\$110, 0\.50% of valuation\)/.test(cityNote)) return false;
  if (!/0\.50% × \$7,500 = \$37\.50/.test(cityNote) || !/\$110 minimum applies/.test(cityNote)) return false;
  const appNote = extras[1]?.note || "";
  if (!/application fee is \$40 at each recorded valuation/.test(appNote)) return false;
  const wasteNote = extras[2]?.note || "";
  if (!/\$0\.22 per \$100/.test(wasteNote) || !/\$26 minimum/.test(wasteNote)) return false;
  if (!/\$7,500 \/ \$100 × \$0\.22 = \$16\.50/.test(wasteNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MIAMI_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/max\(\$110, 0\.50% of valuation\)/.test(note)) return false;
  if (!/application fee is \$40/.test(note)) return false;
  if (!/Solid waste is \$0\.22 per \$100 of valuation, with a \$26 minimum/.test(note)) return false;
  if (!/F\.S\. surcharges are F\.S\. 553\.721 at 1% of the city permit fee/.test(note)) return false;
  if (!/F\.S\. 468\.631 at 1\.5% of the city permit fee/.test(note)) return false;
  if (!/\$2 minimum/.test(note)) return false;
  if (!/1% is \$1\.10 and 1\.5% is \$1\.65/.test(note)) return false;
  if (!/\$2 \+ \$2 = \$4/.test(note)) return false;
  if (!/Miami-Dade §8-12\(e\) is \$0\.60 per \$1,000/.test(note)) return false;
  if (!/not printed as a dollar rate in Exhibit C/.test(note)) return false;
  if (!/state line stays \$4 at each band/.test(note)) return false;
  if (!/0\.50% × \$5,000 = \$25/.test(note) || !/max\(\$110, \$25\) = \$110/.test(note)) return false;
  if (!/\$5,000 \/ \$100 × \$0\.22 = \$11\.00/.test(note)) return false;
  if (!/\$5,000 \/ \$1,000 × \$0\.60 = \$3\.00/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$26 \+ \$4 \+ \$3\.00 = \$183\.00/.test(note)) return false;
  if (!/feeLowUsd \$183\.00/.test(note)) return false;
  if (!/0\.50% × \$7,500 = \$37\.50/.test(note) || !/max\(\$110, \$37\.50\) = \$110/.test(note)) return false;
  if (!/\$7,500 \/ \$100 × \$0\.22 = \$16\.50/.test(note)) return false;
  if (!/\$7,500 \/ \$1,000 × \$0\.60 = \$4\.50/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$26 \+ \$4 \+ \$4\.50 = \$184\.50/.test(note)) return false;
  if (!/feeTypicalUsd \$184\.50/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/0\.50% × \$16,000 = \$80/.test(note) || !/max\(\$110, \$80\) = \$110/.test(note)) return false;
  if (!/\$16,000 \/ \$100 × \$0\.22 = \$35\.20/.test(note)) return false;
  if (!/above the \$26 minimum/.test(note)) return false;
  if (!/\$16,000 \/ \$1,000 × \$0\.60 = \$9\.60/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$35\.20 \+ \$4 \+ \$9\.60 = \$198\.80/.test(note)) return false;
  if (!/feeHighUsd \$198\.80/.test(note)) return false;
  if (!/\$2,500 mechanical-repair exemption/.test(note)) return false;
  if (!/Easy Permit like-for-like still pays the same percentage/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/All three assumed values exceed the \$2,500 mechanical-repair exemption/.test(caveat)) return false;
  if (!/Easy Permit like-for-like still pays the same percentage/.test(caveat)) return false;
  return true;
}

/**
 * Short Miami HVAC copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $183.00 / $184.50 / $198.80 anchors match.
 */
function miamiHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MiamiHvacPageCopy | null {
  if (!miamiHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is max($110, 0.50% of valuation) plus the $40 application fee plus solid waste ($0.22 per $100, minimum $26) plus the F.S. surcharge minimums plus Miami-Dade §8-12(e) at $0.60 per $1,000. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The city permit is max($110, 0.50% of valuation), plus the $40 application fee, solid waste at $0.22 per $100 with a $26 minimum, the F.S. 553.721 and F.S. 468.631 $2 minimums, and Miami-Dade §8-12(e) at $0.60 per $1,000. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. All three assumed values exceed the $2,500 mechanical-repair exemption. Easy Permit like-for-like still pays the same percentage. Verify the fee with " +
        city.permitDeptName,
    ),
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MIAMI_KITCHEN_SOURCE_NAME = "City of Miami Exhibit C and Work Exempt from Permit";
const MIAMI_KITCHEN_SOURCE_URL =
  "https://www.miami.gov/Permits-Construction/Permitting-Resources/City-of-Miami-Building-Permit-Fee-Schedule";

type MiamiKitchenPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 317.62 to $318 and 634.38 to $634. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Miami kitchen: max($110, 0.50% of valuation) plus $40 application plus solid
 * waste ($0.22 per $100, minimum $26) plus F.S. 553.721 / 468.631 plus
 * Miami-Dade §8-12(e) at $0.60 per $1,000. Fees stay $196.00 / $317.62 / $634.38.
 * The cosmetic-only path is not a recorded total. Returns null if those anchors drift.
 */
function miamiKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "miami-fl" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 196)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 317.62)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 634.38)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 15000 || valuation.typical !== 35000 || valuation.high !== 75000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MIAMI_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== MIAMI_KITCHEN_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if ((extras[0]?.name || "") !== "0.50% city permit" || !dallasSameCents(extras[0]?.feeUsd, 175)) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Application fee" || !dallasSameCents(extras[1]?.feeUsd, 40)) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Solid waste $0.22/$100" || !dallasSameCents(extras[2]?.feeUsd, 77)) {
    return false;
  }

  const cityNote = extras[0]?.note || "";
  if (!/max\(\$110, 0\.50% of valuation\)/.test(cityNote)) return false;
  if (!/0\.50% × \$35,000 = \$175/.test(cityNote) || !/above the \$110 minimum/.test(cityNote)) return false;
  const appNote = extras[1]?.note || "";
  if (!/application fee is \$40 at each recorded valuation/.test(appNote)) return false;
  const wasteNote = extras[2]?.note || "";
  if (!/\$0\.22 per \$100/.test(wasteNote) || !/\$26 minimum/.test(wasteNote)) return false;
  if (!/\$35,000 \/ \$100 × \$0\.22 = \$77/.test(wasteNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MIAMI_KITCHEN_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/full kitchen remodel with MEP/.test(note)) return false;
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$196\.00, feeTypicalUsd is \$317\.62, and feeHighUsd is \$634\.38/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$35,000/.test(note)) return false;
  if (!/\$15,000 low, \$35,000 typical, and \$75,000 high/.test(note)) return false;
  if (!/max\(\$110, 0\.50% of valuation\)/.test(note)) return false;
  if (!/application fee is \$40/.test(note)) return false;
  if (!/Solid waste is \$0\.22 per \$100 of valuation, with a \$26 minimum/.test(note)) return false;
  if (!/F\.S\. 553\.721 is 1% of the city permit fee/.test(note)) return false;
  if (!/F\.S\. 468\.631 is 1\.5% of the city permit fee/.test(note)) return false;
  if (!/\$2 minimum/.test(note)) return false;
  if (!/1% is \$1\.10 and 1\.5% is \$1\.65/.test(note)) return false;
  if (!/\$2 \+ \$2 = \$4/.test(note)) return false;
  if (!/Miami-Dade §8-12\(e\) is \$0\.60 per \$1,000/.test(note)) return false;
  if (!/not printed as a dollar rate in Exhibit C/.test(note)) return false;
  if (!/0\.50% × \$15,000 = \$75/.test(note) || !/max\(\$110, \$75\) = \$110/.test(note)) return false;
  if (!/\$15,000 \/ \$100 × \$0\.22 = \$33\.00/.test(note)) return false;
  if (!/\$15,000 \/ \$1,000 × \$0\.60 = \$9\.00/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$33\.00 \+ \$4 \+ \$9\.00 = \$196\.00/.test(note)) return false;
  if (!/feeLowUsd is \$196\.00/.test(note)) return false;
  if (!/minimum city-permit stack/.test(note)) return false;
  if (!/0\.50% × \$35,000 = \$175/.test(note) || !/max\(\$110, \$175\) = \$175/.test(note)) return false;
  if (!/\$35,000 \/ \$100 × \$0\.22 = \$77/.test(note)) return false;
  if (!/recorded state line is \$4\.62/.test(note)) return false;
  if (!/\$35,000 \/ \$1,000 × \$0\.60 = \$21/.test(note)) return false;
  if (!/\$175 \+ \$40 \+ \$77 \+ \$4\.62 \+ \$21 = \$317\.62/.test(note)) return false;
  if (!/feeTypicalUsd is \$317\.62/.test(note)) return false;
  if (!/included in the \$317\.62 and are not added again/.test(note)) return false;
  if (!/not separate extras/.test(note)) return false;
  if (!/0\.50% × \$75,000 = \$375/.test(note) || !/max\(\$110, \$375\) = \$375/.test(note)) return false;
  if (!/\$75,000 \/ \$100 × \$0\.22 = \$165/.test(note)) return false;
  if (!/1% of \$375 is \$3\.75 and 1\.5% of \$375 is \$5\.625/.test(note)) return false;
  if (!/sum to \$9\.375, and the recorded state line is \$9\.38/.test(note)) return false;
  if (!/\$75,000 \/ \$1,000 × \$0\.60 = \$45/.test(note)) return false;
  if (!/\$375 \+ \$40 \+ \$165 \+ \$9\.38 \+ \$45 = \$634\.38/.test(note)) return false;
  if (!/feeHighUsd is \$634\.38/.test(note)) return false;
  if (!/not added on top of the \$317\.62 typical/.test(note)) return false;
  if (!/Work Exempt from Permit/.test(note)) return false;
  if (!/no plumbing, electrical, or load-bearing changes is exempt/.test(note)) return false;
  if (!/cosmetic-only path is not the recorded typical totals/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/recorded totals assume a full remodel with MEP/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$196\.00, \$317\.62, and \$634\.38 totals/.test(note)) {
    return false;
  }
  if (!/\$15,000/.test(note) || !/\$35,000/.test(note) || !/\$75,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Cabinets\/countertops-only in 1-2 family/.test(caveat)) return false;
  if (!/no plumbing, electrical, or load-bearing changes is exempt/.test(caveat)) return false;
  if (!/Totals assume a full remodel with MEP/.test(caveat)) return false;
  return true;
}

/**
 * Short Miami kitchen copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $196.00 / $317.62 / $634.38 anchors match.
 */
function miamiKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MiamiKitchenPageCopy | null {
  if (!miamiKitchenFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        " (minimum city-permit stack: $110 + $40 + $33 + $4 + $9), the typical fee is " +
        typical +
        " ($175 + $40 + $77 + $4.62 + $21), and the high fee is " +
        high +
        " ($375 + $40 + $165 + $9.38 + $45). The high is not added on top of the typical. Cabinets or countertops only in a 1-2 family dwelling with no plumbing, electrical, or load-bearing changes are exempt and are not the recorded typical path. Totals assume a full remodel with MEP. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": city permit $175 + application $40 + solid waste $77 + state $4.62 + county $21. Low is " +
        low +
        " on the $15,000 minimum city-permit stack. High is " +
        high +
        " at $75,000. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. The city permit is max($110, 0.50% of valuation). The low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation ($175 + $40 + $77 + $4.62 + $21). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. Cabinets or countertops only in a 1-2 family dwelling with no plumbing, electrical, or load-bearing changes are exempt and are not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical full kitchen remodel with MEP is the recorded valuation path, and the typical fee on that path is " +
      typical +
      ". Cabinets or countertops only in a 1-2 family dwelling with no plumbing, electrical, or load-bearing changes are exempt and are not the typical path.",
    includedClause:
      "The $175 city permit, the $40 application fee, and the $77 solid-waste line are included in that " +
      typical +
      ". The $4.62 state line and the $21 county line are also in that total. The " +
      high +
      " path at $75,000 is the recorded high and is not added on top of the typical. The " +
      low +
      " minimum city-permit stack is the recorded low and is not the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const MIAMI_DECK_SOURCE_NAME =
  "City of Miami Exhibit C and Work Exempt from Permit (Sec. 10-5)";
const MIAMI_DECK_SOURCE_URL =
  "https://www.miami.gov/Permits-Construction/Permitting-Resources/City-of-Miami-Building-Permit-Fee-Schedule";

type MiamiDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 184.80 to $185, 187.60 to $188, and 207.76 to $208. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Miami deck: max($110, 0.50% of valuation) plus $40 application plus solid
 * waste ($0.22 per $100, minimum $26) plus F.S. 553.721 / 468.631 minimums
 * plus Miami-Dade §8-12(e) at $0.60 per $1,000. Fees stay $184.80 / $187.60 / $207.76.
 * Decks are not on the Sec. 10-5 exempt list. Playground equipment is.
 * Energy $0.11/sf is new construction/addition only and is not a recorded total.
 * Returns null if those anchors drift.
 */
function miamiDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "miami-fl" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 184.8)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 187.6)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 207.76)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== MIAMI_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== MIAMI_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "City permit minimum" || !dallasSameCents(extras[0]?.feeUsd, 110)) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Application fee" || !dallasSameCents(extras[1]?.feeUsd, 40)) {
    return false;
  }

  const cityNote = extras[0]?.note || "";
  if (!/max\(\$110, 0\.50% of valuation\)/.test(cityNote)) return false;
  if (!/0\.50% × \$12,000 = \$60/.test(cityNote) || !/\$110 minimum applies/.test(cityNote)) return false;
  const appNote = extras[1]?.note || "";
  if (!/application fee is \$40 at each recorded valuation/.test(appNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(MIAMI_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/deck on the Exhibit C valuation schedule/.test(note)) return false;
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$184\.80, feeTypicalUsd is \$187\.60, and feeHighUsd is \$207\.76/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$19,200 high/.test(note)) return false;
  if (!/max\(\$110, 0\.50% of valuation\)/.test(note)) return false;
  if (!/application fee is \$40/.test(note)) return false;
  if (!/Solid waste is \$0\.22 per \$100 of valuation, with a \$26 minimum/.test(note)) return false;
  if (!/F\.S\. 553\.721 is 1% of the city permit fee/.test(note)) return false;
  if (!/F\.S\. 468\.631 is 1\.5% of the city permit fee/.test(note)) return false;
  if (!/\$2 minimum/.test(note)) return false;
  if (!/1% is \$1\.10 and 1\.5% is \$1\.65/.test(note)) return false;
  if (!/\$2 \+ \$2 = \$4/.test(note)) return false;
  if (!/Miami-Dade §8-12\(e\) is \$0\.60 per \$1,000/.test(note)) return false;
  if (!/not printed as a dollar rate in Exhibit C/.test(note)) return false;
  if (!/state line stays \$4 at each band/.test(note)) return false;
  if (!/0\.50% × \$8,000 = \$40/.test(note) || !/max\(\$110, \$40\) = \$110/.test(note)) return false;
  if (!/\$8,000 \/ \$100 × \$0\.22 = \$17\.60/.test(note)) return false;
  if (!/\$26 minimum applies/.test(note)) return false;
  if (!/\$8,000 \/ \$1,000 × \$0\.60 = \$4\.80/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$26 \+ \$4 \+ \$4\.80 = \$184\.80/.test(note)) return false;
  if (!/feeLowUsd is \$184\.80/.test(note)) return false;
  if (!/minimum city-permit stack/.test(note)) return false;
  if (!/0\.50% × \$12,000 = \$60/.test(note) || !/max\(\$110, \$60\) = \$110/.test(note)) return false;
  if (!/\$12,000 \/ \$100 × \$0\.22 = \$26\.40/.test(note)) return false;
  if (!/above the \$26 minimum/.test(note)) return false;
  if (!/\$12,000 \/ \$1,000 × \$0\.60 = \$7\.20/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$26\.40 \+ \$4 \+ \$7\.20 = \$187\.60/.test(note)) return false;
  if (!/feeTypicalUsd is \$187\.60/.test(note)) return false;
  if (!/included in the \$187\.60 and are not added again/.test(note)) return false;
  if (!/not separate extras/.test(note)) return false;
  if (!/0\.50% × \$19,200 = \$96/.test(note) || !/max\(\$110, \$96\) = \$110/.test(note)) return false;
  if (!/\$19,200 \/ \$100 × \$0\.22 = \$42\.24/.test(note)) return false;
  if (!/\$19,200 \/ \$1,000 × \$0\.60 = \$11\.52/.test(note)) return false;
  if (!/\$110 \+ \$40 \+ \$42\.24 \+ \$4 \+ \$11\.52 = \$207\.76/.test(note)) return false;
  if (!/feeHighUsd is \$207\.76/.test(note)) return false;
  if (!/stacks solid waste \$42\.24 and county \$11\.52/.test(note)) return false;
  if (!/same city minimum \$110, application fee \$40, and state line \$4/.test(note)) return false;
  if (!/not added on top of the \$187\.60 typical/.test(note)) return false;
  if (!/Sec\. 10-5/.test(note)) return false;
  if (!/Work Exempt from Permit/.test(note)) return false;
  if (!/not on the city exempt list/.test(note)) return false;
  if (!/Playground equipment is on that exempt list/.test(note)) return false;
  if (!/playground-equipment path is not feeLowUsd/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/Energy \$0\.11\/sf is new construction\/addition only/.test(note)) return false;
  if (!/not in feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$184\.80, \$187\.60, and \$207\.76 totals/.test(note)) {
    return false;
  }
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Decks are not on the city exempt list/.test(caveat)) return false;
  if (!/Playground equipment is/.test(caveat)) return false;
  if (!/Energy \$0\.11\/sf is new construction\/addition only/.test(caveat)) return false;
  return true;
}

/**
 * Short Miami deck copy. The full valuation walk stays on the permit
 * callout calculation note. Null unless the recorded $184.80 / $187.60 / $207.76 anchors match.
 */
function miamiDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): MiamiDeckPageCopy | null {
  if (!miamiDeckFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        " (minimum city-permit stack: $110 + $40 + $26 + $4 + $4.80), the typical fee is " +
        typical +
        " ($110 + $40 + $26.40 + $4 + $7.20), and the high fee is " +
        high +
        " ($110 + $40 + $42.24 + $4 + $11.52). The high is not added on top of the typical. Decks are not on the city exempt list under Sec. 10-5. Playground equipment is. Energy $0.11/sf is new construction/addition only and is not in these totals. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": city permit minimum $110 + application $40 + solid waste $26.40 + state $4 + county $7.20. Low is " +
        low +
        " on the $8,000 minimum city-permit stack. High is " +
        high +
        " at $19,200 (solid waste $42.24 and county $11.52 with the same city minimum, application fee, and state line). The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. The city permit is max($110, 0.50% of valuation). The low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation ($110 + $40 + $26.40 + $4 + $7.20). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. Decks are not on the city exempt list. Playground equipment is. Energy $0.11/sf is new construction/addition only and is not in these totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical deck is the recorded valuation path, and the typical fee on that path is " +
      typical +
      ". Decks are not on the city exempt list under Sec. 10-5. Playground equipment is exempt and is not the typical path.",
    includedClause:
      "The $110 city permit minimum and the $40 application fee are included in that " +
      typical +
      ". The $26.40 solid-waste line, the $4 state line, and the $7.20 county line are also in that total. The " +
      high +
      " path at $19,200 is the recorded high and is not added on top of the typical. The " +
      low +
      " minimum city-permit stack is the recorded low and is not the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const LAS_VEGAS_DECK_SOURCE_NAME =
  "City of Las Vegas Building and Safety, Table 3-E (eff. July 1, 2021)";
const LAS_VEGAS_DECK_SOURCE_URL =
  "https://files.lasvegasnevada.gov/building-safety/Building-Safety-Fee-Tables.pdf";

type LasVegasDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
};

function lasVegasMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function lasVegasSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Las Vegas deck: Table 3-E #20 plan check + inspection + Table 3-E #2 issuance.
 * Fees stay $521 / $521 / $521. Returns null if those anchors drift.
 */
function lasVegasDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "las-vegas-nv" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!lasVegasSameCents(permit.feeLowUsd, 521)) return false;
  if (!lasVegasSameCents(permit.feeTypicalUsd, 521)) return false;
  if (!lasVegasSameCents(permit.feeHighUsd, 521)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== LAS_VEGAS_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== LAS_VEGAS_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Table 3-E #20 Deck/Balcony plan check" ||
    !lasVegasSameCents(extras[0]?.feeUsd, 176)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Table 3-E #20 inspection" || !lasVegasSameCents(extras[1]?.feeUsd, 290)) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Table 3-E #2 issuance" || !lasVegasSameCents(extras[2]?.feeUsd, 55)) {
    return false;
  }
  if (!/Included/.test(extras[0]?.note || "") || !/\$176/.test(extras[0]?.note || "")) return false;
  if (!/Included/.test(extras[1]?.note || "") || !/\$290/.test(extras[1]?.note || "")) return false;
  if (!/Included/.test(extras[2]?.note || "") || !/\$55/.test(extras[2]?.note || "")) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(LAS_VEGAS_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Table 3-E #20 Deck\/Balcony is a flat per-deck fee/.test(note)) return false;
  if (!/not a valuation formula/.test(note)) return false;
  if (!/Plan check \$176 \+ inspection \$290 \+ issuance \$55 = \$521/.test(note)) return false;
  if (!/feeLowUsd \$521/.test(note)) return false;
  if (!/feeTypicalUsd \$521/.test(note)) return false;
  if (!/feeHighUsd \$521/.test(note)) return false;
  if (!/Low, typical, and high are each \$521/.test(note)) return false;
  if (!/context only and do not change the fee/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;
  if (!/typical project value is \$12,000/.test(note)) return false;
  if (!/more than 30 inches above grade/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/more than 30 inches above grade/.test(caveat)) return false;
  if (!/per deck, not by valuation/.test(caveat)) return false;
  if (!/low, typical, and high are each \$521/.test(caveat)) return false;
  if (!/\$8,000/.test(caveat) || !/\$12,000/.test(caveat) || !/\$19,200/.test(caveat)) return false;
  return true;
}

/**
 * Short Las Vegas deck copy. The full flat-fee walk stays on the permit
 * callout calculation note. Null unless the recorded $521 / $521 / $521 anchors match.
 */
function lasVegasDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): LasVegasDeckPageCopy | null {
  if (!lasVegasDeckFacts(city, permit)) return null;
  const low = lasVegasMoneyExact(permit.feeLowUsd as number);
  const typical = lasVegasMoneyExact(permit.feeTypicalUsd as number);
  const high = lasVegasMoneyExact(permit.feeHighUsd as number);
  const projectValue = lasVegasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = lasVegasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = lasVegasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = lasVegasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat Table 3-E #20 Deck/Balcony fee, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. The flat fee is per deck and does not change with the recorded valuations. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Recorded low, typical, and high are each the flat Table 3-E #20 Deck/Balcony fee of " +
        typical +
        ". Full arithmetic is in the calculation note on this page",
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
        ". Those valuations are context only and do not change the flat per-deck fee of " +
        typical +
        ". The low, typical, and high walk is in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        ". Low, typical, and high are the same recorded flat fee, and the walk is in the calculation note on this page. The flat fee is per deck, not by valuation. A permit is required if the deck is more than 30 inches above grade. Verify the fee with " +
        city.permitDeptName,
    ),
  };
}

const LAS_VEGAS_ROOF_SOURCE_NAME =
  "City of Las Vegas Building and Safety, 2020 Building User Fees (eff. July 1, 2021)";
const LAS_VEGAS_ROOF_SOURCE_URL =
  "https://files.lasvegasnevada.gov/building-safety/Building-Safety-Fee-Tables.pdf";

type LasVegasRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked flat walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Las Vegas roof: Table 3-E #94 plan check + inspection + Table 3-E #2 issuance
 * is the recorded $242 low and typical tear-off/re-roof path. Table 3-E #95
 * roof structure/sheathing replacement ($226) plus the same $55 issuance is
 * the recorded $281 high. Valuation is unused. The non-tile covering exemption
 * is not a recorded total.
 * Returns null if those anchors drift.
 */
function lasVegasRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "las-vegas-nv" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!lasVegasSameCents(permit.feeLowUsd, 242)) return false;
  if (!lasVegasSameCents(permit.feeTypicalUsd, 242)) return false;
  if (!lasVegasSameCents(permit.feeHighUsd, 281)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== LAS_VEGAS_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== LAS_VEGAS_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if (
    (extras[0]?.name || "") !== "Table 3-E #94 Re-roofing Residential plan check" ||
    !lasVegasSameCents(extras[0]?.feeUsd, 68)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Table 3-E #94 inspection" || !lasVegasSameCents(extras[1]?.feeUsd, 119)) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Table 3-E #2 permit issuance" || !lasVegasSameCents(extras[2]?.feeUsd, 55)) {
    return false;
  }
  if (
    (extras[3]?.name || "") !== "Table 3-E #95 roof structure replacement PC+insp" ||
    !lasVegasSameCents(extras[3]?.feeUsd, 226)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included.") return false;
  if ((extras[1]?.note || "") !== "Included.") return false;
  if ((extras[2]?.note || "") !== "Included.") return false;
  if ((extras[3]?.note || "") !== "High path + $55 issuance = $281.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(LAS_VEGAS_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/tear-off\/re-roof that requires a permit/.test(note)) return false;
  if (!/including a tile tear-off/.test(note)) return false;
  if (!/City of Las Vegas, not Clark County/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$242, feeTypicalUsd is \$242, and feeHighUsd is \$281/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not an input on these flat paths/.test(note)) return false;
  if (!/unused and do not change the \$242 \/ \$242 \/ \$281/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$242/.test(note)) return false;
  if (!/Table 3-E #94 Re-roofing Residential plan check \$68/.test(note)) return false;
  if (!/Table 3-E #94 inspection \$119/.test(note)) return false;
  if (!/Table 3-E #2 permit issuance \$55/.test(note)) return false;
  if (!/Plan check \$68 \+ inspection \$119 \+ issuance \$55 = \$242, so feeLowUsd is \$242/.test(note)) return false;
  if (!/same tear-off\/re-roof path as the typical/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$242/.test(note)) return false;
  if (!/so feeTypicalUsd is \$242/.test(note)) return false;
  if (!/included in the \$242 and are not added again/.test(note)) return false;
  if (!/High \$22,000: valuation is unused, so feeHighUsd stays \$281/.test(note)) return false;
  if (!/Table 3-E #95 roof structure\/sheathing replacement/.test(note)) return false;
  if (!/not the #94 tear-off path/.test(note)) return false;
  if (!/plan check and inspection together are \$226/.test(note)) return false;
  if (!/plan check \$125 \+ inspection \$101/.test(note)) return false;
  if (!/\$226 combined line plus Table 3-E #2 issuance \$55 is \$281/.test(note)) return false;
  if (!/Plan check \$125 \+ inspection \$101 \+ issuance \$55 = \$281, so feeHighUsd is \$281/.test(note)) return false;
  if (!/\$281 high is not added on top of the \$242 typical/.test(note)) return false;
  if (!/64 sf or less of sheathing/.test(note)) return false;
  if (!/exempt path is not the recorded typical totals/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/Posted tables remain effective July 1, 2021/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$242 and \$281 totals/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/City of Las Vegas, not Clark County/.test(caveat)) return false;
  if (!/Typical tear-off\/tile requires a permit/.test(caveat)) return false;
  if (!/Non-tile covering replacement with no structural work/.test(caveat)) return false;
  if (!/officially exempt/.test(caveat)) return false;
  if (!/64 sf sheathing/.test(caveat)) return false;
  if (!/Fees do not vary with \$8k\/\$12k\/\$22k/.test(caveat)) return false;
  if (!/effective July 1, 2021/.test(caveat)) return false;
  return true;
}

/**
 * Short Las Vegas roof copy. The Table 3-E #94 versus #95 walk stays on the
 * permit callout calculation note. Null unless the recorded $242 / $242 / $281
 * anchors match.
 */
function lasVegasRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): LasVegasRoofPageCopy | null {
  if (!lasVegasRoofFacts(city, permit)) return null;
  const low = lasVegasMoneyExact(permit.feeLowUsd as number);
  const typical = lasVegasMoneyExact(permit.feeTypicalUsd as number);
  const high = lasVegasMoneyExact(permit.feeHighUsd as number);
  const projectValue = lasVegasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = lasVegasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = lasVegasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = lasVegasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat Table 3-E paths, so the low fee is " +
        low +
        " (Table 3-E #94 tear-off/re-roof), the typical fee is " +
        typical +
        " (plan check $68 + inspection $119 + Table 3-E #2 issuance $55), and the high fee is " +
        high +
        " (Table 3-E #95 roof structure/sheathing replacement: $226 plan check and inspection plus $55 issuance). The " +
        high +
        " high is not added on top of the " +
        typical +
        " typical. A non-tile covering replacement with no structural work and 64 sf or less of sheathing is officially exempt and is not the recorded typical path. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Table 3-E #94 plan check $68 + inspection $119 + Table 3-E #2 issuance $55. Low is the same " +
        low +
        " tear-off/re-roof path. High is " +
        high +
        ": Table 3-E #95 plan check and inspection $226 ($125 + $101) plus $55 issuance. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on these flat paths, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on Table 3-E #94 tear-off/re-roof (plan check $68 + inspection $119 + issuance $55). The low fee is " +
        low +
        " and the high fee is " +
        high +
        " on Table 3-E #95 roof structure/sheathing replacement ($226 plus $55 issuance, or $125 + $101 + $55). The high is not added on top of the typical. Valuation is unused. A non-tile covering replacement with no structural work and 64 sf or less of sheathing is officially exempt and is not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical tear-off/re-roof is the recorded Table 3-E #94 path, and the typical fee on that path is " +
      typical +
      ". A non-tile covering replacement with no structural work and 64 sf or less of sheathing is exempt and is not the typical path.",
    includedClause:
      "The $68 plan check, the $119 inspection, and the $55 issuance are included in that " +
      typical +
      ". The " +
      high +
      " Table 3-E #95 structure/sheathing path is the recorded high and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const LAS_VEGAS_HVAC_SOURCE_NAME =
  "City of Las Vegas Building and Safety, Table 3-D MPE Fees (eff. July 1, 2021)";
const LAS_VEGAS_HVAC_SOURCE_URL =
  "https://files.lasvegasnevada.gov/building-safety/Building-Safety-Fee-Tables.pdf";

type LasVegasHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked flat walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Las Vegas HVAC: Table 3-D #15 plan check + inspection + Table 3-D MPE issuance
 * is the recorded $238 low and typical exact change-out path. Table 3-D #14
 * misc appliance/AHU plan check and inspection ($202) plus the same $55
 * issuance is the recorded $257 non-exact high. Valuation is unused. The
 * minor-part / filter / portable-unit exemption is not a recorded total.
 * Returns null if those anchors drift.
 */
function lasVegasHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "las-vegas-nv" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!lasVegasSameCents(permit.feeLowUsd, 238)) return false;
  if (!lasVegasSameCents(permit.feeTypicalUsd, 238)) return false;
  if (!lasVegasSameCents(permit.feeHighUsd, 257)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== LAS_VEGAS_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== LAS_VEGAS_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if (
    (extras[0]?.name || "") !== "Table 3-D #15 HVAC Exact change out plan check" ||
    !lasVegasSameCents(extras[0]?.feeUsd, 83)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Table 3-D #15 inspection" || !lasVegasSameCents(extras[1]?.feeUsd, 100)) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Table 3-D MPE issuance" || !lasVegasSameCents(extras[2]?.feeUsd, 55)) {
    return false;
  }
  if (
    (extras[3]?.name || "") !== "Table 3-D #14 misc appliance/AHU PC+insp" ||
    !lasVegasSameCents(extras[3]?.feeUsd, 202)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included.") return false;
  if ((extras[1]?.note || "") !== "Included.") return false;
  if ((extras[2]?.note || "") !== "Included.") return false;
  if ((extras[3]?.note || "") !== "High path + $55 = $257.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(LAS_VEGAS_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/recorded typical path is an HVAC exact change-out/.test(note)) return false;
  if (!/permit is required to install or change any part of a heating\/cooling system/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$238, feeTypicalUsd is \$238, and feeHighUsd is \$257/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/Valuation is not an input on these flat paths/.test(note)) return false;
  if (!/unused and do not change the \$238 \/ \$238 \/ \$257/.test(note)) return false;
  if (!/Low \$5,000: valuation is unused, so feeLowUsd stays \$238/.test(note)) return false;
  if (!/Table 3-D #15 HVAC Exact change out plan check \$83/.test(note)) return false;
  if (!/Table 3-D #15 inspection \$100/.test(note)) return false;
  if (!/Table 3-D MPE issuance \$55/.test(note)) return false;
  if (!/Plan check \$83 \+ inspection \$100 \+ issuance \$55 = \$238, so feeLowUsd is \$238/.test(note)) return false;
  if (!/same exact change-out path as the typical/.test(note)) return false;
  if (!/Typical \$7,500: valuation is unused, so feeTypicalUsd stays \$238/.test(note)) return false;
  if (!/so feeTypicalUsd is \$238/.test(note)) return false;
  if (!/included in the \$238 and are not added again/.test(note)) return false;
  if (!/High \$16,000: valuation is unused, so feeHighUsd stays \$257/.test(note)) return false;
  if (!/non-exact change-out, Table 3-D #14 misc appliance\/AHU PC\+insp/.test(note)) return false;
  if (!/not the #15 exact change-out path/.test(note)) return false;
  if (!/plan check and inspection together are \$202/.test(note)) return false;
  if (!/plan check \$102 \+ inspection \$100/.test(note)) return false;
  if (!/\$202 combined line plus Table 3-D MPE issuance \$55 is \$257/.test(note)) return false;
  if (!/Non-exact change-out plan check \$102 \+ inspection \$100 \+ issuance \$55 = \$257, so feeHighUsd is \$257/.test(note)) return false;
  if (!/\$257 high is not added on top of the \$238 typical/.test(note)) return false;
  if (!/minor part, filter, or portable unit/.test(note)) return false;
  if (!/exempt path is not the recorded typical totals/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/Posted tables remain effective July 1, 2021/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$238 and \$257 totals/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Permit required to install or change any part of a heating\/cooling system/.test(caveat)) return false;
  if (!/Minor part \/ filter \/ portable units exempt/.test(caveat)) return false;
  if (!/Not valuation-based/.test(caveat)) return false;
  return true;
}

/**
 * Short Las Vegas HVAC copy. The Table 3-D #15 versus #14 walk stays on the
 * permit callout calculation note. Null unless the recorded $238 / $238 / $257
 * anchors match.
 */
function lasVegasHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): LasVegasHvacPageCopy | null {
  if (!lasVegasHvacFacts(city, permit)) return null;
  const low = lasVegasMoneyExact(permit.feeLowUsd as number);
  const typical = lasVegasMoneyExact(permit.feeTypicalUsd as number);
  const high = lasVegasMoneyExact(permit.feeHighUsd as number);
  const projectValue = lasVegasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = lasVegasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = lasVegasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = lasVegasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat Table 3-D paths, so the low fee is " +
        low +
        " (Table 3-D #15 HVAC exact change-out), the typical fee is " +
        typical +
        " (plan check $83 + inspection $100 + Table 3-D MPE issuance $55), and the high fee is " +
        high +
        " (Table 3-D #14 misc appliance/AHU: $202 plan check and inspection plus $55 issuance, or non-exact change-out $102 + $100 + $55). The " +
        high +
        " high is not added on top of the " +
        typical +
        " typical. A minor part, filter, or portable unit is exempt and is not the recorded typical path. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": Table 3-D #15 plan check $83 + inspection $100 + Table 3-D MPE issuance $55. Low is the same " +
        low +
        " exact change-out path. High is " +
        high +
        ": Table 3-D #14 plan check and inspection $202 ($102 + $100) plus $55 issuance. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on these flat paths, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on Table 3-D #15 HVAC exact change-out (plan check $83 + inspection $100 + issuance $55). The low fee is " +
        low +
        " and the high fee is " +
        high +
        " on Table 3-D #14 misc appliance/AHU ($202 plus $55 issuance, or $102 + $100 + $55). The high is not added on top of the typical. Valuation is unused. A minor part, filter, or portable unit is exempt and is not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical HVAC exact change-out is the recorded Table 3-D #15 path, and the typical fee on that path is " +
      typical +
      ". A minor part, filter, or portable unit is exempt and is not the typical path.",
    includedClause:
      "The $83 plan check, the $100 inspection, and the $55 issuance are included in that " +
      typical +
      ". The " +
      high +
      " Table 3-D #14 misc appliance/AHU path is the recorded high and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}


const CHICAGO_ROOF_SOURCE_NAME =
  "City of Chicago DOB — work not requiring a permit; Table 14A-12-1204.2";
const CHICAGO_ROOF_SOURCE_URL =
  "https://www.chicago.gov/city/en/sites/guide-to-building-permits/home/help/faq/DOB/bldg-permit-not-required/all.html";

type ChicagoRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  exemptionFaq: string;
};

/**
 * Chicago roof: Group R, 4 stories or fewer, pitch at least 2:12, no structural
 * work is the recorded $0 path. The $450, $175, and $900 lines stay extras.
 * Returns null if those anchors drift.
 */
function chicagoRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "chicago-il" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== false || permit.feeModel !== "none") return false;
  if (!dallasSameCents(permit.feeLowUsd, 0)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 0)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 0)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== CHICAGO_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== CHICAGO_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Stand-alone roof replacement (Table 14A-12-1204.2)" ||
    !dallasSameCents(extras[0]?.feeUsd, 450)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Roof recover / roof repair" || !dallasSameCents(extras[1]?.feeUsd, 175)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Plan-based structural reroof minimum" ||
    !dallasSameCents(extras[2]?.feeUsd, 900)
  ) {
    return false;
  }
  for (const extra of extras) {
    if (!/Not included in the recorded \$0 totals/.test(extra.note || "")) return false;
  }
  const standNote = extras[0]?.note || "";
  if (!/\$450 per area up to 5,000 sf/.test(standNote)) return false;
  if (!/Group R exemption does not apply/.test(standNote)) return false;
  const recoverNote = extras[1]?.note || "";
  if (!/\$175 is the no-tear-off roof recover or repair line/.test(recoverNote)) return false;
  const structuralNote = extras[2]?.note || "";
  if (!/\$900 is the Table 14A-12-1204\.3\(4\) RF 0\.25 structural minimum/.test(structuralNote)) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(CHICAGO_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Group R building of 4 stories or fewer/.test(note)) return false;
  if (!/roof pitch at least 2:12/.test(note)) return false;
  if (!/no structural work/.test(note)) return false;
  if (!/does not require a permit/.test(note)) return false;
  if (!/feeModel is none/.test(note)) return false;
  if (!/feeLowUsd, feeTypicalUsd, and feeHighUsd are each \$0/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not an input/.test(note)) return false;
  if (!/unused/.test(note)) return false;
  if (!/\$0 \/ \$0 \/ \$0/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$0/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$0/.test(note)) return false;
  if (!/High \$22,000: valuation is unused, so feeHighUsd stays \$0/.test(note)) return false;
  if (!/not rolled into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$450 per area up to 5,000 sf/.test(note)) return false;
  if (!/no-tear-off path is \$175/.test(note)) return false;
  if (!/Table 14A-12-1204\.3\(4\) RF 0\.25 is \$900/.test(note)) return false;
  if (!/Low-slope or flat roofs/.test(note)) return false;
  if (!/does not invent one/.test(note)) return false;
  if (!/25% of a roof surface/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Group R ≤4 stories/.test(caveat)) return false;
  if (!/pitch ≥2:12/.test(caveat)) return false;
  if (!/no structural work/.test(caveat)) return false;
  if (!/\$450 stand-alone per 5,000 sf/.test(caveat)) return false;
  if (!/\$900 plan-based minimum if structural/.test(caveat)) return false;
  if (!/Valuation is not an input/.test(caveat)) return false;
  return true;
}

/**
 * Short Chicago roof copy. The exemption walk stays on the permit callout
 * calculation note. Null unless the recorded $0 / $0 / $0 anchors match.
 */
function chicagoRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): ChicagoRoofPageCopy | null {
  if (!chicagoRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded Group R exemption (4 stories or fewer, pitch at least 2:12, no structural work), so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". The $450 stand-alone line, the $175 no-tear-off line, and the $900 structural minimum are extras and are not rolled into those totals. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        " because a Group R building of 4 stories or fewer with pitch at least 2:12 and no structural work does not require a permit. The $450, $175, and $900 extras are not rolled into the recorded low, typical, or high fees. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (fee model none). The typical path is " +
        typical +
        " on the Group R steep-slope exemption. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The $450 stand-alone, $175 recover, and $900 structural lines are extras and are not in those totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical steep-slope reroof on a Group R building of 4 stories or fewer, with pitch at least 2:12 and no structural work, does not require a permit, and the recorded fee on that path is " +
      typical +
      ".",
    includedClause:
      "The $450 stand-alone roof replacement, the $175 roof recover or repair, and the $900 plan-based structural minimum are recorded extras and are not part of that " +
      typical +
      ".",
    exemptionFaq: asSentence(
      "The recorded typical path is " +
        typical +
        " for a Group R building of 4 stories or fewer when the roof pitch is at least 2:12 and the work is not structural. The cited page also treats roof repair limited to 25% of a roof surface, without cutting away part of a wall or roof, as not requiring a permit. Low-slope or flat roofs and structural reroofs are outside the Group R steep-slope exemption. Their recorded extras stay in the calculation note and are not part of the typical " +
        typical,
    ),
  };
}

const CHICAGO_HVAC_SOURCE_NAME =
  "City of Chicago DOB — HVAC exemptions; Table 14A-12-1204.2";
const CHICAGO_HVAC_SOURCE_URL =
  "https://www.chicago.gov/city/en/sites/guide-to-building-permits/home/help/faq/DOB/bldg-permit-not-required/all.html";

type ChicagoHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  exemptionFaq: string;
};

/**
 * Chicago HVAC: in-kind furnace, boiler, or AC appliance in Group R, 4 stories
 * or fewer, is the recorded $0 path. The $75 and $150 lines stay extras.
 * Returns null if those anchors drift.
 */
function chicagoHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "chicago-il" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== false || permit.feeModel !== "none") return false;
  if (!dallasSameCents(permit.feeLowUsd, 0)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 0)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 0)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== CHICAGO_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== CHICAGO_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "In-kind equipment stand-alone fee" ||
    !dallasSameCents(extras[0]?.feeUsd, 75)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "New AC serving one unit" || !dallasSameCents(extras[1]?.feeUsd, 150)) {
    return false;
  }
  for (const extra of extras) {
    if (!/Not included in the recorded \$0 totals/.test(extra.note || "")) return false;
  }
  const inKindNote = extras[0]?.note || "";
  if (!/\$75 per equipment type per dwelling unit/.test(inKindNote)) return false;
  if (!/Group R in-kind exemption does not apply/.test(inKindNote)) return false;
  const newAcNote = extras[1]?.note || "";
  if (!/\$150 is the Table 14A-12-1204\.2 new AC serving one unit line/.test(newAcNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(CHICAGO_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/in-kind furnace, boiler, or air conditioning appliance swap/.test(note)) return false;
  if (!/Group R building of 4 stories or fewer/.test(note)) return false;
  if (!/residential building up to 4 stories above grade/.test(note)) return false;
  if (!/same type, size, and shape/.test(note)) return false;
  if (!/does not require a permit/.test(note)) return false;
  if (!/feeModel is none/.test(note)) return false;
  if (!/feeLowUsd, feeTypicalUsd, and feeHighUsd are each \$0/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/Valuation is not an input/.test(note)) return false;
  if (!/unused/.test(note)) return false;
  if (!/\$0 \/ \$0 \/ \$0/.test(note)) return false;
  if (!/Low \$5,000: valuation is unused, so feeLowUsd stays \$0/.test(note)) return false;
  if (!/Typical \$7,500: valuation is unused, so feeTypicalUsd stays \$0/.test(note)) return false;
  if (!/High \$16,000: valuation is unused, so feeHighUsd stays \$0/.test(note)) return false;
  if (!/not rolled into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$75 per equipment type per dwelling unit/.test(note)) return false;
  if (!/New AC serving one unit on Table 14A-12-1204\.2 is \$150/.test(note)) return false;
  if (!/does not invent a fee/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/in-kind furnace, boiler, or AC appliance/.test(caveat)) return false;
  if (!/Group R ≤4 stories/.test(caveat)) return false;
  if (!/rooftop units/.test(caveat)) return false;
  if (!/\$75/.test(caveat) || !/\$150/.test(caveat)) return false;
  return true;
}

/**
 * Short Chicago HVAC copy. The exemption walk stays on the permit callout
 * calculation note. Null unless the recorded $0 / $0 / $0 anchors match.
 */
function chicagoHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): ChicagoHvacPageCopy | null {
  if (!chicagoHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded Group R in-kind exemption (furnace, boiler, or AC appliance, 4 stories or fewer), so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". The $75 in-kind stand-alone line and the $150 new AC line are extras and are not rolled into those totals. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        " because an in-kind furnace, boiler, or AC appliance swap in a Group R building of 4 stories or fewer does not require a permit. The $75 and $150 extras are not rolled into the recorded low, typical, or high fees. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (fee model none). The typical path is " +
        typical +
        " on the Group R in-kind HVAC exemption. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The $75 in-kind stand-alone and $150 new AC lines are extras and are not in those totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical in-kind furnace, boiler, or AC appliance swap in a Group R building of 4 stories or fewer does not require a permit, and the recorded fee on that path is " +
      typical +
      ".",
    includedClause:
      "The $75 in-kind equipment stand-alone fee and the $150 new AC serving one unit are recorded extras and are not part of that " +
      typical +
      ".",
    exemptionFaq: asSentence(
      "The recorded typical path is " +
        typical +
        " for an in-kind furnace, boiler, or air conditioning appliance in a Group R building of 4 stories or fewer. New AC, not-in-kind equipment, rooftop units, and buildings over 4 stories are outside that exemption. Their recorded extras stay in the calculation note and are not part of the typical " +
        typical,
    ),
  };
}

const CHICAGO_KITCHEN_SOURCE_NAME =
  "Chicago Table 14A-12-1204.2 stand-alone fees; 2026 Amended Fee Tables";
const CHICAGO_KITCHEN_SOURCE_URL =
  "https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2703439";

type ChicagoKitchenPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked flat walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Chicago kitchen: cosmetic finish work is the recorded $0 low. Stand-alone
 * interior alteration of 2,000 sf or less in one unit is the recorded $500
 * typical. Plan-based Level 2 (gutting walls) is the recorded $602 high.
 * The $250 caveat line and the $75 plumbing and electrical extras stay off
 * the recorded totals. Returns null if those anchors drift.
 */
function chicagoKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "chicago-il" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!dallasSameCents(permit.feeLowUsd, 0)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 500)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 602)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 15000 || valuation.typical !== 35000 || valuation.high !== 75000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== CHICAGO_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== CHICAGO_KITCHEN_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if (
    (extras[0]?.name || "") !== "Stand-alone interior alteration \u22642,000 sf in one unit" ||
    !dallasSameCents(extras[0]?.feeUsd, 500)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Plan-based Level 2 minimum" || !dallasSameCents(extras[1]?.feeUsd, 602)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Plumbing fixture replacement (no in-wall piping)" ||
    !dallasSameCents(extras[2]?.feeUsd, 75)
  ) {
    return false;
  }
  if ((extras[3]?.name || "") !== "Electrical on existing circuits" || !dallasSameCents(extras[3]?.feeUsd, 75)) {
    return false;
  }
  const standNote = extras[0]?.note || "";
  if (!/Table 14A-12-1204\.2; included as typical/.test(standNote)) return false;
  if (!/Zoning fee extra, not in DOB tables/.test(standNote)) return false;
  if ((extras[1]?.note || "") !== "Included as high.") return false;
  const plumbingNote = extras[2]?.note || "";
  if (!/Extra if plumbing is in scope/.test(plumbingNote)) return false;
  if (!/not in totals/.test(plumbingNote)) return false;
  const electricalNote = extras[3]?.note || "";
  if (!/Extra/.test(electricalNote) || !/not in totals/.test(electricalNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(CHICAGO_KITCHEN_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/stand-alone interior alteration of 2,000 square feet or less in one unit/.test(note)) return false;
  if (!/no change of occupancy and no change to load-bearing elements or means of egress/.test(note)) {
    return false;
  }
  if (!/Table 14A-12-1204\.2 prices that stand-alone scope at \$500/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$0, feeTypicalUsd is \$500, and feeHighUsd is \$602/.test(note)) return false;
  if (!/recorded typical project value is \$35,000/.test(note)) return false;
  if (!/\$15,000 low, \$35,000 typical, and \$75,000 high/.test(note)) return false;
  if (!/Valuation is not an input on these flat paths/.test(note)) return false;
  if (!/unused/.test(note)) return false;
  if (!/\$0 \/ \$500 \/ \$602/.test(note)) return false;
  if (!/Low \$15,000: valuation is unused, so feeLowUsd stays \$0/.test(note)) return false;
  if (!/cosmetic exemption for cabinets, counters, or paint with no plumbing or electrical connections/.test(note)) {
    return false;
  }
  if (!/recorded feeLowUsd of \$0/.test(note)) return false;
  if (!/without plumbing or electrical connections, as work that does not require a building permit/.test(note)) {
    return false;
  }
  if (!/Typical \$35,000: valuation is unused, so feeTypicalUsd stays \$500/.test(note)) return false;
  if (!/included as the typical/.test(note)) return false;
  if (!/\$250 stand-alone line for an interior alteration of 500 square feet or less/.test(note)) return false;
  if (!/That \$250 line is not feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/does not add the \$250 line/.test(note)) return false;
  if (!/High \$75,000: valuation is unused, so feeHighUsd stays \$602/.test(note)) return false;
  if (!/Gutting walls is the plan-based Level 2 path/.test(note)) return false;
  if (!/2026 Amended Fee Tables set a plan-based minimum of \$602/.test(note)) return false;
  if (!/included as the high and is not added on top of the typical/.test(note)) return false;
  if (!/does not compute a CF x RF x A product/.test(note)) return false;
  if (!/Plumbing fixture replacement with no in-wall piping is a recorded extra of \$75/.test(note)) {
    return false;
  }
  if (!/Electrical work on existing circuits is a recorded extra of \$75/.test(note)) return false;
  if (!/Those \$75 extras are not rolled into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) {
    return false;
  }
  if (!/not in the DOB tables/.test(note)) return false;
  if (!/does not invent a zoning dollar/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$0, \$500, and \$602 totals/.test(note)) return false;
  if (!/\$15,000/.test(note) || !/\$35,000/.test(note) || !/\$75,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Cabinets\/counters\/paint with no plumbing or electrical connections are exempt/.test(caveat)) {
    return false;
  }
  if (!/\$250/.test(caveat) || !/\$500/.test(caveat) || !/\$602/.test(caveat)) return false;
  if (!/Gutting walls is plan-based/.test(caveat)) return false;
  return true;
}

/**
 * Short Chicago kitchen copy. The cosmetic, stand-alone, and plan-based walk
 * stays on the permit callout calculation note. Null unless the recorded
 * $0 / $500 / $602 anchors match.
 */
function chicagoKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): ChicagoKitchenPageCopy | null {
  if (!chicagoKitchenFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat paths, so the low fee is " +
        low +
        " (cosmetic exemption: cabinets, counters, or paint with no plumbing or electrical connections), the typical fee is " +
        typical +
        " (stand-alone interior alteration of 2,000 sf or less in one unit), and the high fee is " +
        high +
        " (plan-based Level 2 minimum for gutting walls). The $75 plumbing fixture line and the $75 electrical-on-existing-circuits line are extras and are not rolled into those totals. The $250 stand-alone line for 500 sf or less stays in the caveat and is not a recorded total. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        " on Table 14A-12-1204.2 for a stand-alone interior alteration of 2,000 sf or less in one unit. Low is the " +
        low +
        " cosmetic exemption. High is the " +
        high +
        " plan-based Level 2 minimum. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on these flat paths, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on the stand-alone interior alteration of 2,000 sf or less in one unit. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The $75 plumbing and $75 electrical lines are extras and are not in those totals. A zoning fee is extra and is not in the DOB tables. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical kitchen with plumbing or electrical work is the recorded stand-alone path, and the typical fee on that path is " +
      typical +
      ". Cabinets, counters, or paint with no plumbing or electrical connections are the recorded " +
      low +
      " cosmetic exemption and are not the typical path.",
    includedClause:
      "The " +
      typical +
      " stand-alone interior alteration line is included in that " +
      typical +
      ". The " +
      high +
      " plan-based Level 2 minimum is the recorded high and is not added on top of the typical. The $75 plumbing fixture replacement and the $75 electrical work on existing circuits are recorded extras and are not part of that " +
      typical +
      ". A zoning fee is not part of that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const CHICAGO_DECK_SOURCE_NAME =
  "Chicago 2026 Amended Building Permit Fee Tables; Table 14A-12-1204.2; EPP porch instructions";
const CHICAGO_DECK_SOURCE_URL =
  "https://www.chicago.gov/content/dam/city/depts/bldgs/general/Permitfees/2026%20Amended%20Permit%20Fee%20Tables.pdf";

type ChicagoDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked flat walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Chicago deck: Table 14A-12-1204.2 stand-alone new deck no more than 6 feet
 * above the ground is the recorded $300 low. Plan-based review is the recorded
 * $602 typical and high, because Express still sends new structures there.
 * The $66 area product stays below that floor. Zoning is not a recorded dollar.
 * Cosmetic board replacement is not the recorded typical path.
 * Returns null if those anchors drift.
 */
function chicagoDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "chicago-il" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!dallasSameCents(permit.feeLowUsd, 300)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 602)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 602)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== CHICAGO_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== CHICAGO_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "Stand-alone new deck \u22646 ft (Table 14A-12-1204.2)" ||
    !dallasSameCents(extras[0]?.feeUsd, 300)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Plan-based minimum (2026 Amended Tables)" ||
    !dallasSameCents(extras[1]?.feeUsd, 602)
  ) {
    return false;
  }
  const standNote = extras[0]?.note || "";
  if (!/Zoning fee also required/.test(standNote)) return false;
  if (!/amount not in DOB tables/.test(standNote)) return false;
  if (!/Live Express still excludes new structures/.test(standNote)) return false;
  const planNote = extras[1]?.note || "";
  if (!/Included as typical/.test(planNote)) return false;
  if (!/CF\u00d7RF\u00d7A for a 300 sf Type V deck is \$66/.test(planNote)) return false;
  if (!/\$602 floor applies/.test(planNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(CHICAGO_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/recorded typical path is a new deck/.test(note)) return false;
  if (!/EPP porch instructions/.test(note)) return false;
  if (!/cannot be used for an entirely new structure/.test(note)) return false;
  if (!/requires a plan-based building permit/.test(note)) return false;
  if (!/Express still sends new structures to plan-based review/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$300, feeTypicalUsd is \$602, and feeHighUsd is \$602/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$19,200 high/.test(note)) return false;
  if (!/Valuation is not an input on these flat paths/.test(note)) return false;
  if (!/unused/.test(note)) return false;
  if (!/\$300 \/ \$602 \/ \$602/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$300/.test(note)) return false;
  if (!/Table 14A-12-1204\.2 stand-alone line for a new deck no more than 6 feet above the ground/.test(note)) {
    return false;
  }
  if (!/recorded low, not the typical/.test(note)) return false;
  if (!/not in the DOB tables/.test(note)) return false;
  if (!/does not invent a zoning dollar/.test(note)) return false;
  if (!/does not add one to feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$602/.test(note)) return false;
  if (!/2026 Amended Fee Tables set a plan-based minimum of \$602/.test(note)) return false;
  if (!/CF x RF x A for a 300 sf Type V deck is \$66/.test(note)) return false;
  if (!/\$602 floor applies/.test(note)) return false;
  if (!/included as the typical and is not added on top of the \$300 low/.test(note)) return false;
  if (!/High \$19,200: valuation is unused, so feeHighUsd stays \$602/.test(note)) return false;
  if (!/same plan-based minimum/.test(note)) return false;
  if (!/not added again on top of the typical/.test(note)) return false;
  if (!/cosmetic exemption/.test(note)) return false;
  if (!/deck board, stair tread, or railing picket/.test(note)) return false;
  if (!/does not require a building permit/.test(note)) return false;
  if (!/not the recorded typical path/.test(note)) return false;
  if (!/does not add a \$0 line/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$300 and \$602 totals/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Typical new attached deck needs a permit/.test(caveat)) return false;
  if (!/\$300 stand-alone/.test(caveat)) return false;
  if (!/Express still sends new structures to plan-based review/.test(caveat)) return false;
  if (!/\$602 minimum/.test(caveat)) return false;
  if (!/Cosmetic board replacement with no violation is exempt/.test(caveat)) return false;
  return true;
}

/**
 * Short Chicago deck copy. The stand-alone versus plan-based walk stays on
 * the permit callout calculation note. Null unless the recorded
 * $300 / $602 / $602 anchors match.
 */
function chicagoDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): ChicagoDeckPageCopy | null {
  if (!chicagoDeckFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat paths, so the low fee is " +
        low +
        " (Table 14A-12-1204.2 stand-alone new deck no more than 6 feet above the ground), the typical fee is " +
        typical +
        " (plan-based minimum; Express still sends new structures to plan-based review), and the high fee is " +
        high +
        " (the same plan-based minimum). The CF x RF x A product for a 300 sf Type V deck is $66, so the " +
        typical +
        " floor applies, and that " +
        typical +
        " is not added on top of the " +
        low +
        ". A zoning fee is extra and is not in the DOB tables. Cosmetic board replacement with no violation is a cosmetic exemption and is not the recorded typical path. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ", the plan-based minimum, because Express still sends a new deck to plan-based review. Low is the " +
        low +
        " Table 14A-12-1204.2 stand-alone line. High is the same " +
        high +
        " plan-based minimum. The 300 sf Type V product is $66, so the " +
        typical +
        " floor applies. Valuation is unused. The walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". Assumed valuations are " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high. Valuation is not an input on these flat paths, so those amounts are unused and the recorded fees stay " +
        low +
        ", " +
        typical +
        ", and " +
        high,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on the plan-based minimum, because Express still sends new structures to plan-based review. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The $66 area product is below the floor and is not a separate total. A zoning fee is extra and is not in the DOB tables. Cosmetic board replacement with no violation is not the recorded typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical new deck is the recorded plan-based path, and the typical fee on that path is " +
      typical +
      ". Cosmetic board replacement with no violation is exempt and is not the typical path.",
    includedClause:
      "The " +
      typical +
      " plan-based minimum is included in that " +
      typical +
      ". The " +
      low +
      " stand-alone line is the recorded low and is not added on top of the typical. A zoning fee is not part of that total. The $66 area product is the reason the " +
      typical +
      " floor applies and is not a separate charge.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const BOSTON_ROOF_SOURCE_NAME =
  "City of Boston ISD Building Fees (5/15/2023) + Repair A Roof";
const BOSTON_ROOF_SOURCE_URL =
  "https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf";

type BostonRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked short-form walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Boston roof: covering-only reroof is short-form ($20 + $10 per $1,000, ceil
 * when the estimated cost is not a round thousand). Fees stay $100 / $140 / $240.
 * Structural sheathing/framing is long-form and is not a recorded total.
 * Returns null if those anchors drift.
 */
function bostonRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "boston-ma" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 100)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 140)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 240)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== BOSTON_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== BOSTON_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "Short-form primary" || !dallasSameCents(extras[0]?.feeUsd, 20)) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "$10 per $1,000 of estimated cost" ||
    !dallasSameCents(extras[1]?.feeUsd, 120)
  ) {
    return false;
  }
  const primaryNote = extras[0]?.note || "";
  if (!/Included in the typical total/.test(primaryNote)) return false;
  if (!/short-form primary is \$20/.test(primaryNote)) return false;
  const perThousandNote = extras[1]?.note || "";
  if (!/Included in the typical total/.test(perThousandNote)) return false;
  if (!/\$12,000 \/ \$1,000 × \$10 = \$120/.test(perThousandNote)) return false;
  if (!/Ceil is used when the estimated cost is not a round thousand/.test(perThousandNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(BOSTON_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Covering-only reroof is the recorded short-form path/.test(note)) return false;
  if (!/\$20 primary plus \$10 per \$1,000 of estimated cost/.test(note)) return false;
  if (!/uses ceil when the estimated cost is not a round thousand/.test(note)) return false;
  if (!/each a round thousand, so ceil does not change the count/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/Structural sheathing\/framing is long-form \(\$50 \+ \$10\/\$1,000\)/.test(note)) return false;
  if (!/not the recorded total on this row/.test(note)) return false;
  if (!/does not add a long-form dollar to feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$8,000 \/ \$1,000 = 8, and 8 × \$10 = \$80/.test(note)) return false;
  if (!/\$20 \+ \$80 = \$100, so feeLowUsd is \$100/.test(note)) return false;
  if (!/\$12,000 \/ \$1,000 = 12, and 12 × \$10 = \$120/.test(note)) return false;
  if (!/\$20 \+ \$120 = \$140, so feeTypicalUsd is \$140/.test(note)) return false;
  if (!/both are included in the \$140/.test(note)) return false;
  if (!/\$22,000 \/ \$1,000 = 22, and 22 × \$10 = \$220/.test(note)) return false;
  if (!/\$20 \+ \$220 = \$240, so feeHighUsd is \$240/.test(note)) return false;
  if (!/dated May 15, 2023 and was still posted on 2026-09-01/.test(note)) return false;
  if (!/does not add one/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$22,000/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Covering-only reroof is short-form/.test(caveat)) return false;
  if (!/Structural sheathing\/framing is long-form \(\$50 \+ \$10\/\$1,000\)/.test(caveat)) return false;
  if (!/May 15, 2023/.test(caveat) || !/2026-09-01/.test(caveat)) return false;
  return true;
}

/**
 * Short Boston roof copy. The full short-form walk stays on the permit
 * callout calculation note. Null unless the recorded $100 / $140 / $240 anchors match.
 */
function bostonRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): BostonRoofPageCopy | null {
  if (!bostonRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed a covering-only reroof on the recorded short-form schedule, with valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is the $20 short-form primary plus $10 per $1,000 of estimated cost. Structural sheathing/framing is long-form ($50 + $10 per $1,000) and is not the recorded total. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Short-form is a $20 primary plus $10 per $1,000 of estimated cost, and the $1,000 count uses ceil when the estimated cost is not a round thousand. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation for a covering-only reroof. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Structural sheathing/framing is long-form ($50 + $10 per $1,000) and is not the recorded total. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A covering-only reroof is the recorded short-form path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The $20 short-form primary and the $120 per-$1,000 line at the recorded " +
      typicalVal +
      " valuation are included in that " +
      typical +
      ". Structural sheathing/framing is long-form ($50 + $10 per $1,000) and is not part of that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const BOSTON_HVAC_SOURCE_NAME =
  "Boston ISD Building Fees 5/15/2023; Gas Permits; Sheet Metal Permits";
const BOSTON_HVAC_SOURCE_URL =
  "https://www.boston.gov/sites/default/files/file/2023/05/Building%20Fees%205%2015%2023.pdf";

type BostonHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 120.40 / 122.20 / 125.80. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Boston HVAC: gas furnace/heater ($20 + $50 each + $0.09 per 1,000 BTU) plus
 * sheet metal ($20 + $25 first 200 lin/sq ft). Fees stay $120.40 / $122.20 / $125.80.
 * Electrical stays an unpublished amp/outlet extra and is not a recorded total.
 * Returns null if those anchors drift.
 */
function bostonHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "boston-ma" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!dallasSameCents(permit.feeLowUsd, 120.4)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 122.2)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 125.8)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== BOSTON_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== BOSTON_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Gas furnace/heater (typical 80 kBTU)" ||
    !dallasSameCents(extras[0]?.feeUsd, 77.2)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Sheet metal (first 200 lin/sq ft)" ||
    !dallasSameCents(extras[1]?.feeUsd, 45)
  ) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Electrical" || extras[2]?.feeUsd != null) return false;
  const furnaceNote = extras[0]?.note || "";
  if (!/\$20 \+ \$50 each \+ \$0\.09 per 1,000 BTU/.test(furnaceNote)) return false;
  if (!/Included in typical/.test(furnaceNote)) return false;
  const sheetNote = extras[1]?.note || "";
  if (!/\$20 primary \+ \$25/.test(sheetNote)) return false;
  if (!/Included/.test(sheetNote)) return false;
  if (!/Extra 200-ft blocks not added/.test(sheetNote)) return false;
  const electricalNote = extras[2]?.note || "";
  if (!/\$20 \+ \$1\/outlet or \$0\.25\/amp if new circuit/.test(electricalNote)) return false;
  if (!/Amp\/outlet unknown/.test(electricalNote)) return false;
  if (!/Not dollarized/.test(electricalNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(BOSTON_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/like-for-like 3-ton \(36,000 BTU\)/.test(note)) return false;
  if (!/80,000 BTU mid-efficiency gas furnace/.test(note)) return false;
  if (!/sheet-metal first 200 lin\/sq ft only/.test(note)) return false;
  if (!/no separate published AC\/ton line/.test(note)) return false;
  if (!/3-ton cooling is covered by the sheet-metal permit/.test(note)) return false;
  if (!/Gas furnace\/heater is \$20 \+ \$50 each \+ \$0\.09 per 1,000 BTU/.test(note)) return false;
  if (!/Sheet metal is \$20 \+ \$25 for the first 200 lin\/sq ft/.test(note)) return false;
  if (!/does not add a valuation percent to feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/electrical stays an extra and is not dollarized into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) {
    return false;
  }
  if (!/furnace-only 60 kBTU/.test(note)) return false;
  if (!/\$20 \+ \$50 \+ \$0\.09 × 60 = \$75\.40/.test(note)) return false;
  if (!/\$75\.40 \+ \$45 = \$120\.40, so feeLowUsd is \$120\.40/.test(note)) return false;
  if (!/Typical 80 kBTU/.test(note)) return false;
  if (!/\$20 \+ \$50 \+ \$0\.09 × 80 = \$77\.20/.test(note)) return false;
  if (!/\$77\.20 \+ \$45 = \$122\.20, so feeTypicalUsd is \$122\.20/.test(note)) return false;
  if (!/both are included in the \$122\.20/.test(note)) return false;
  if (!/120 kBTU/.test(note)) return false;
  if (!/\$20 \+ \$50 \+ \$0\.09 × 120 = \$80\.80/.test(note)) return false;
  if (!/\$80\.80 \+ \$45 = \$125\.80, so feeHighUsd is \$125\.80/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000/.test(note) || !/\$7,500/.test(note) || !/\$16,000/.test(note)) return false;
  if (!/dated May 15, 2023 and was still posted on 2026-09-01/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/ISD has no dedicated HVAC replacement page/.test(caveat)) return false;
  if (!/amp\/outlet counts are unpublished/.test(caveat)) return false;
  if (!/May 15, 2023/.test(caveat) || !/2026-09-01/.test(caveat)) return false;
  return true;
}

/**
 * Short Boston HVAC copy. The full gas and sheet-metal walk stays on the permit
 * callout calculation note. Null unless the recorded $120.40 / $122.20 / $125.80 anchors match.
 */
function bostonHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): BostonHvacPageCopy | null {
  if (!bostonHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  const furnace = dallasMoneyExact(permit.extras?.[0]?.feeUsd as number);
  const sheet = dallasMoneyExact(permit.extras?.[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed a like-for-like 3-ton (36,000 BTU) AC/heat pump plus an 80,000 BTU mid-efficiency gas furnace, with sheet metal for the first 200 lin/sq ft only, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Low is a furnace-only 60,000 BTU path plus the sheet-metal minimum. High is a 120,000 BTU furnace plus the same first 200 lin/sq ft. Each total is the gas furnace/heater line ($20 + $50 each + $0.09 per 1,000 BTU) plus sheet metal ($20 + $25). Electrical stays an unpublished amp/outlet extra and is not in those totals. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The gas furnace/heater line is $20 + $50 each + $0.09 per 1,000 BTU, plus sheet metal at $20 + $25 for the first 200 lin/sq ft. The 60,000 BTU, 80,000 BTU, and 120,000 BTU walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are job-value context. The typical fee is " +
        typical +
        " from the 80,000 BTU gas line plus sheet metal, not from a percent of that valuation. Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (tiered). The typical path is " +
        typical +
        " for a like-for-like 3-ton AC/heat pump plus an 80,000 BTU gas furnace and sheet metal for the first 200 lin/sq ft. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Electrical ($20 + $1 per outlet or $0.25 per amp) is not dollarized. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A like-for-like 3-ton (36,000 BTU) AC/heat pump plus an 80,000 BTU gas furnace, with sheet metal for the first 200 lin/sq ft only, is the recorded path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      furnace +
      " gas furnace/heater at 80,000 BTU and the " +
      sheet +
      " sheet-metal first 200 lin/sq ft are included in that " +
      typical +
      ". Electrical ($20 + $1 per outlet or $0.25 per amp if a new circuit is required) is not dollarized and is not part of that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const BOSTON_KITCHEN_SOURCE_NAME =
  "Boston ISD Kitchen/Bath remodel + Building Fees 5/15/2023";
const BOSTON_KITCHEN_SOURCE_URL =
  "https://www.boston.gov/boston-permitting/gut-or-renovate/renovate-bathroom-or-kitchen";

type BostonKitchenPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked building-permit walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Boston kitchen: short-form building at $15,000 and $35,000; long-form building
 * at $75,000. Fees stay $170 / $370 / $800. Plumbing, electrical, gas, and sheet
 * metal stay unpublished unit counts and are not recorded totals.
 * Returns null if those anchors drift.
 */
function bostonKitchenFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "boston-ma" || permit.projectSlug !== "kitchen-remodel") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 170)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 370)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 800)) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 15000 || valuation.typical !== 35000 || valuation.high !== 75000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== BOSTON_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== BOSTON_KITCHEN_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Short-form building at $35,000" ||
    !dallasSameCents(extras[0]?.feeUsd, 370)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Long-form building at $75,000" ||
    !dallasSameCents(extras[1]?.feeUsd, 800)
  ) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Plumbing / electrical / gas / sheet metal" || extras[2]?.feeUsd != null) {
    return false;
  }
  const shortNote = extras[0]?.note || "";
  if (!/Included as typical/.test(shortNote)) return false;
  if (!/\$20\+\$10×35/.test(shortNote)) return false;
  const longNote = extras[1]?.note || "";
  if (!/Included as high/.test(longNote)) return false;
  if (!/\$50\+\$10×75/.test(longNote)) return false;
  const tradeNote = extras[2]?.note || "";
  if (!/Unit counts unpublished/.test(tradeNote)) return false;
  if (!/Not in totals/.test(tradeNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(BOSTON_KITCHEN_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/Totals are the building permit only/.test(note)) return false;
  if (!/short-form or long-form permit/.test(note)) return false;
  if (!/no other structural changes need to be made/.test(note)) return false;
  if (!/moving structural walls or egresses/.test(note)) return false;
  if (!/Short-form building is a \$20 primary plus \$10 per \$1,000 of estimated cost/.test(note)) return false;
  if (!/uses ceil when the estimated cost is not a round thousand/.test(note)) return false;
  if (!/Long-form building is a \$50 primary plus \$10 per \$1,000 of estimated cost/.test(note)) return false;
  if (!/each a round thousand, so ceil does not change the count/.test(note)) return false;
  if (!/recorded typical project value is \$35,000/.test(note)) return false;
  if (!/Low and typical use the short-form path/.test(note)) return false;
  if (!/High uses the long-form path, and that long-form total is the recorded high/.test(note)) return false;
  if (!/not dollarized into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$15,000 \/ \$1,000 = 15, and 15 × \$10 = \$150/.test(note)) return false;
  if (!/\$20 \+ \$150 = \$170, so feeLowUsd is \$170/.test(note)) return false;
  if (!/\$35,000 \/ \$1,000 = 35, and 35 × \$10 = \$350/.test(note)) return false;
  if (!/\$20 \+ \$350 = \$370, so feeTypicalUsd is \$370/.test(note)) return false;
  if (!/included as the typical/.test(note)) return false;
  if (!/\$75,000 \/ \$1,000 = 75, and 75 × \$10 = \$750/.test(note)) return false;
  if (!/\$50 \+ \$750 = \$800, so feeHighUsd is \$800/.test(note)) return false;
  if (!/included as the high/.test(note)) return false;
  if (!/\$15,000/.test(note) || !/\$35,000/.test(note) || !/\$75,000/.test(note)) return false;
  if (!/dated May 15, 2023 and was still posted on 2026-09-01/.test(note)) return false;
  if (!/does not add one/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/building permit only/.test(caveat)) return false;
  if (!/fixture\/outlet counts/.test(caveat)) return false;
  return true;
}

/**
 * Short Boston kitchen copy. The full short-form and long-form walk stays on
 * the permit callout calculation note. Null unless the recorded $170 / $370 / $800 anchors match.
 */
function bostonKitchenPageCopy(
  city: City,
  permit: Permit | null | undefined,
): BostonKitchenPageCopy | null {
  if (!bostonKitchenFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed building-permit valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Low and typical are short-form building ($20 plus $10 per $1,000). High is long-form building ($50 plus $10 per $1,000) and is the recorded high. Plumbing, electrical, gas, and sheet metal stay unpublished unit counts and are not in those totals. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Short-form building is a $20 primary plus $10 per $1,000 of estimated cost. Long-form building is a $50 primary plus $10 per $1,000. The low, typical, and high walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        " on the short-form path. High is the long-form path. Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " short-form building valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Plumbing, electrical, gas, and sheet metal are not dollarized. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A short-form building permit is the recorded typical path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      typical +
      " short-form building line at the recorded " +
      typicalVal +
      " valuation is included in that " +
      typical +
      ". The " +
      high +
      " long-form building line at " +
      highVal +
      " is the recorded high and is not added on top of the typical. Plumbing, electrical, gas, and sheet metal are not part of that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const BOSTON_DECK_SOURCE_NAME =
  "Boston ISD Long-Form Permits + Building Fees 5/15/2023";
const BOSTON_DECK_SOURCE_URL =
  "https://www.boston.gov/boston-permitting/permits/long-form-permits";

type BostonDeckPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars from the locked long-form walk. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Boston deck: long-form $50 plus $10 per $1,000, with ceil when the estimated
 * cost is not a round thousand. Fees stay $130 / $170 / $250. Repair with
 * original stamped plans can be short-form and is not a recorded total.
 * Microfilming stays $3 per sheet and is not a recorded total.
 * Returns null if those anchors drift.
 */
function bostonDeckFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "boston-ma" || permit.projectSlug !== "deck") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 130)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 170)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 250)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 19200) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== BOSTON_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== BOSTON_DECK_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "Long-form primary" || !dallasSameCents(extras[0]?.feeUsd, 50)) {
    return false;
  }
  if ((extras[1]?.name || "") !== "$10 per $1,000" || !dallasSameCents(extras[1]?.feeUsd, 120)) {
    return false;
  }
  const primaryNote = extras[0]?.note || "";
  if (!/Included/.test(primaryNote)) return false;
  if (!/New \/ expanded decks/.test(primaryNote)) return false;
  const perThousandNote = extras[1]?.note || "";
  if (!/At \$12,000/.test(perThousandNote)) return false;
  if (!/Included/.test(perThousandNote)) return false;
  if (!/uses ceil/.test(perThousandNote)) return false;
  if (!/20 × \$10/.test(perThousandNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(BOSTON_DECK_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/recorded path for a new or expanded deck is long-form/.test(note)) return false;
  if (!/\$50 primary plus \$10 per \$1,000 of estimated cost/.test(note)) return false;
  if (!/uses ceil when the estimated cost is not a round thousand/.test(note)) return false;
  if (!/Repair with original stamped plans can be short-form/.test(note)) return false;
  if (!/does not add a short-form dollar to feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/Microfilming is \$3 per sheet extra if plans are filed/.test(note)) return false;
  if (!/does not add a microfilming dollar to feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/each a round thousand, so ceil does not change those counts/.test(note)) return false;
  if (!/\$19,200 is not a round thousand/.test(note)) return false;
  if (!/\$8,000 \/ \$1,000 = 8, and 8 × \$10 = \$80/.test(note)) return false;
  if (!/\$50 \+ \$80 = \$130, so feeLowUsd is \$130/.test(note)) return false;
  if (!/\$12,000 \/ \$1,000 = 12, and 12 × \$10 = \$120/.test(note)) return false;
  if (!/\$50 \+ \$120 = \$170, so feeTypicalUsd is \$170/.test(note)) return false;
  if (!/both are included in the \$170/.test(note)) return false;
  if (!/\$19,200 \/ \$1,000 = 19\.2/.test(note)) return false;
  if (!/ceil takes that count to 20/.test(note)) return false;
  if (!/20 × \$10 \+ \$50 = \$250, so feeHighUsd is \$250/.test(note)) return false;
  if (!/\$8,000/.test(note) || !/\$12,000/.test(note) || !/\$19,200/.test(note)) return false;
  if (!/dated May 15, 2023 and was still posted on 2026-09-01/.test(note)) return false;
  if (!/does not add one/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/New structural work is long-form/.test(caveat)) return false;
  if (!/Repair with original stamped plans can be short-form/.test(caveat)) return false;
  if (!/Microfilming \$3\/sheet extra if plans filed/.test(caveat)) return false;
  return true;
}

/**
 * Short Boston deck copy. The full long-form walk stays on the permit
 * callout calculation note. Null unless the recorded $130 / $170 / $250 anchors match.
 */
function bostonDeckPageCopy(
  city: City,
  permit: Permit | null | undefined,
): BostonDeckPageCopy | null {
  if (!bostonDeckFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  const primary = dallasMoneyExact(permit.extras?.[0]?.feeUsd as number);
  const perThousand = dallasMoneyExact(permit.extras?.[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed a new or expanded deck on the recorded long-form schedule, with valuations of " +
        lowVal +
        " low, " +
        typicalVal +
        " typical, and " +
        highVal +
        " high, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Each total is the $50 long-form primary plus $10 per $1,000 of estimated cost. The " +
        highVal +
        " valuation is not a round thousand, so that count uses ceil. Repair with original stamped plans can be short-form and is not the recorded total. Microfilming is $3 per sheet extra if plans are filed and is not in those totals. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "Long-form is a $50 primary plus $10 per $1,000 of estimated cost, and the $1,000 count uses ceil when the estimated cost is not a round thousand. The three-valuation walk, including the " +
        highVal +
        " ceil, is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee bands use the recorded assumed valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        ". The typical fee is " +
        typical +
        ". The " +
        highVal +
        " band ceils to 20 × $10 plus the $50 primary. Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation for a new or expanded deck. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". Full arithmetic is in the calculation note on this page. Repair with original stamped plans can be short-form and is not the recorded total. Microfilming at $3 per sheet is not dollarized. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A new or expanded deck is the recorded long-form path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      primary +
      " long-form primary and the " +
      perThousand +
      " per-$1,000 line at the recorded " +
      typicalVal +
      " valuation are included in that " +
      typical +
      ". Microfilming at $3 per sheet if plans are filed is not part of that total. Repair with original stamped plans can be short-form and is not part of that total.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

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

/** Short visible paragraphs for the "What we assumed" block. */
export function assumptionParagraphs(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string[] {
  const out: string[] = [];
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  const sourcesVal = assumedValuation(project.projectSlug);

  if (spec) {
    out.push(
      asSentence(
        job +
          " in " +
          label +
          " is priced as a documented typical job of " +
          spec.typical +
          " (scope " +
          spec.low +
          " to " +
          spec.high +
          "). " +
          spec.why,
      ),
    );
  } else {
    out.push(asSentence(job + " in " + label + " uses the recorded typical-job scope on this page"));
  }

  const scope = (project.scopeNote || "").trim();
  const unit = (project.unitNote || "").trim();
  if (scope) out.push(asSentence(firstSentence(scope)));
  if (unit && unit !== scope) out.push(asSentence(firstSentence(unit)));

  const austinPath = austinRoofPageCopy(city, permit);
  const austinHvacPath = austinHvacPageCopy(city, permit);
  const austinKitchenPath = austinKitchenPageCopy(city, permit);
  const austinDeckPath = austinDeckPageCopy(city, permit);
  const phoenixRoofPath = phoenixRoofPageCopy(city, permit);
  const phoenixHvacPath = phoenixHvacPageCopy(city, permit);
  const phoenixKitchenPath = phoenixKitchenPageCopy(city, permit);
  const phoenixDeckPath = phoenixDeckPageCopy(city, permit);
  const portlandRoofPath = portlandRoofPageCopy(city, permit);
  const portlandKitchenPath = portlandKitchenPageCopy(city, permit);
  const portlandDeckPath = portlandDeckPageCopy(city, permit);
  const tucsonRoofPath = tucsonRoofPageCopy(city, permit);
  const tucsonHvacPath = tucsonHvacPageCopy(city, permit);
  const tucsonKitchenPath = tucsonKitchenPageCopy(city, permit);
  const tucsonDeckPath = tucsonDeckPageCopy(city, permit);
  const raleighRoofPath = raleighRoofPageCopy(city, permit);
  const raleighHvacPath = raleighHvacPageCopy(city, permit);
  const raleighKitchenPath = raleighKitchenPageCopy(city, permit);
  const raleighDeckPath = raleighDeckPageCopy(city, permit);
  const seattleHvacPath = seattleHvacPageCopy(city, permit);
  const seattleRoofPath = seattleRoofPageCopy(city, permit);
  const seattleDeckPath = seattleDeckPageCopy(city, permit);
  const seattleKitchenPath = seattleKitchenPageCopy(city, permit);
  const charlotteHvacPath = charlotteHvacPageCopy(city, permit);
  const charlotteKitchenPath = charlotteKitchenPageCopy(city, permit);
  const nashvilleDeckPath = nashvilleDeckPageCopy(city, permit);
  const nashvilleRoofPath = nashvilleRoofPageCopy(city, permit);
  const atlantaRoofPath = atlantaRoofPageCopy(city, permit);
  const atlantaHvacPath = atlantaHvacPageCopy(city, permit);
  const atlantaDeckPath = atlantaDeckPageCopy(city, permit);
  const atlantaKitchenPath = atlantaKitchenPageCopy(city, permit);
  const memphisHvacPath = memphisHvacPageCopy(city, permit);
  const memphisKitchenPath = memphisKitchenPageCopy(city, permit);
  const memphisDeckPath = memphisDeckPageCopy(city, permit);
  const denverDeckPath = denverDeckPageCopy(city, permit);
  const denverKitchenPath = denverKitchenPageCopy(city, permit);
  const houstonHvacPath = houstonHvacPageCopy(city, permit);
  const houstonDeckPath = houstonDeckPageCopy(city, permit);
  const philadelphiaRoofPath = philadelphiaRoofPageCopy(city, permit);
  const detroitRoofPath = detroitRoofPageCopy(city, permit);
  const dallasRoofPath = dallasRoofPageCopy(city, permit);
  const dallasHvacPath = dallasHvacPageCopy(city, permit);
  const dallasKitchenPath = dallasKitchenPageCopy(city, permit);
  const dallasDeckPath = dallasDeckPageCopy(city, permit);
  const minneapolisRoofPath = minneapolisRoofPageCopy(city, permit);
  const minneapolisHvacPath = minneapolisHvacPageCopy(city, permit);
  const minneapolisDeckPath = minneapolisDeckPageCopy(city, permit);
  const miamiRoofPath = miamiRoofPageCopy(city, permit);
  const miamiHvacPath = miamiHvacPageCopy(city, permit);
  const miamiKitchenPath = miamiKitchenPageCopy(city, permit);
  const miamiDeckPath = miamiDeckPageCopy(city, permit);
  const lasVegasDeckPath = lasVegasDeckPageCopy(city, permit);
  const lasVegasRoofPath = lasVegasRoofPageCopy(city, permit);
  const lasVegasHvacPath = lasVegasHvacPageCopy(city, permit);
  const chicagoRoofPath = chicagoRoofPageCopy(city, permit);
  const chicagoHvacPath = chicagoHvacPageCopy(city, permit);
  const chicagoKitchenPath = chicagoKitchenPageCopy(city, permit);
  const chicagoDeckPath = chicagoDeckPageCopy(city, permit);
  const bostonRoofPath = bostonRoofPageCopy(city, permit);
  const bostonHvacPath = bostonHvacPageCopy(city, permit);
  const bostonKitchenPath = bostonKitchenPageCopy(city, permit);
  const bostonDeckPath = bostonDeckPageCopy(city, permit);
  const rowVal = permit?.assumedValuationUsd;
  const rowHasValuation = permitRowRecordsValuation(permit);
  const typicalVal = rowHasValuation
    ? (rowVal?.typical ?? permit?.typicalProjectValueUsd ?? sourcesVal?.typical ?? null)
    : null;
  const lowVal = rowHasValuation ? (rowVal?.low ?? sourcesVal?.low ?? null) : null;
  const highVal = rowHasValuation ? (rowVal?.high ?? sourcesVal?.high ?? null) : null;

  if (
    permit &&
    !rowHasValuation &&
    isPublishedMinimumFloor(permit) &&
    !atlantaRoofPath &&
    !atlantaHvacPath &&
    !atlantaDeckPath &&
    !atlantaKitchenPath
  ) {
    out.push(asSentence(publishedMinimumValuationAnswer(permit, shortDeptName(city))));
  } else if (
    typicalVal != null &&
    !austinPath &&
    !austinHvacPath &&
    !austinKitchenPath &&
    !austinDeckPath &&
    !phoenixRoofPath &&
    !phoenixHvacPath &&
    !phoenixKitchenPath &&
    !phoenixDeckPath &&
    !portlandRoofPath &&
    !portlandKitchenPath &&
    !portlandDeckPath &&
    !tucsonRoofPath &&
    !tucsonHvacPath &&
    !tucsonKitchenPath &&
    !tucsonDeckPath &&
    !raleighRoofPath &&
    !raleighHvacPath &&
    !raleighKitchenPath &&
    !raleighDeckPath &&
    !seattleHvacPath &&
    !seattleRoofPath &&
    !seattleDeckPath &&
    !seattleKitchenPath &&
    !charlotteHvacPath &&
    !charlotteKitchenPath &&
    !nashvilleDeckPath &&
    !nashvilleRoofPath &&
    !atlantaRoofPath &&
    !atlantaHvacPath &&
    !atlantaDeckPath &&
    !atlantaKitchenPath &&
    !memphisHvacPath &&
    !memphisKitchenPath &&
    !memphisDeckPath &&
    !denverDeckPath &&
    !denverKitchenPath &&
    !houstonHvacPath &&
    !houstonDeckPath &&
    !philadelphiaRoofPath &&
    !detroitRoofPath &&
    !dallasRoofPath &&
    !dallasHvacPath &&
    !dallasKitchenPath &&
    !dallasDeckPath &&
    !minneapolisRoofPath &&
    !minneapolisHvacPath &&
    !minneapolisDeckPath &&
    !miamiRoofPath &&
    !miamiHvacPath &&
    !miamiKitchenPath &&
    !miamiDeckPath &&
    !lasVegasDeckPath &&
    !lasVegasRoofPath &&
    !lasVegasHvacPath &&
    !chicagoRoofPath &&
    !chicagoHvacPath &&
    !chicagoKitchenPath &&
    !chicagoDeckPath &&
    !bostonRoofPath &&
    !bostonHvacPath &&
    !bostonKitchenPath &&
    !bostonDeckPath
  ) {
    let v =
      "When a published schedule is a valuation formula, the documented assumed valuation is " +
      usd(typicalVal);
    if (lowVal != null && highVal != null) {
      v += " typical (" + usd(lowVal) + " low, " + usd(highVal) + " high)";
    }
    v += " — not a city-assessed value";
    if (sourcesVal?.why) v += ". " + sourcesVal.why;
    if (
      permit?.typicalProjectValueUsd != null &&
      permit.typicalProjectValueUsd !== typicalVal
    ) {
      v +=
        ". This city's permit row records typical project value " +
        usd(permit.typicalProjectValueUsd);
    }
    out.push(asSentence(v));
  }

  const denverPath = denverHvacPageCopy(city, permit);
  if (denverPath) out.push(denverPath.assumption);
  const denverRoofPath = denverRoofPageCopy(city, permit);
  if (denverRoofPath) out.push(denverRoofPath.assumption);

  if (austinPath) out.push(austinPath.assumption);
  if (austinHvacPath) out.push(austinHvacPath.assumption);
  if (austinKitchenPath) out.push(austinKitchenPath.assumption);
  if (austinDeckPath) out.push(austinDeckPath.assumption);
  if (phoenixRoofPath) out.push(phoenixRoofPath.assumption);
  if (phoenixHvacPath) out.push(phoenixHvacPath.assumption);
  if (phoenixKitchenPath) out.push(phoenixKitchenPath.assumption);
  if (phoenixDeckPath) out.push(phoenixDeckPath.assumption);
  if (portlandRoofPath) out.push(portlandRoofPath.assumption);
  if (portlandKitchenPath) out.push(portlandKitchenPath.assumption);
  if (portlandDeckPath) out.push(portlandDeckPath.assumption);
  if (tucsonRoofPath) out.push(tucsonRoofPath.assumption);
  if (tucsonHvacPath) out.push(tucsonHvacPath.assumption);
  if (tucsonKitchenPath) out.push(tucsonKitchenPath.assumption);
  if (tucsonDeckPath) out.push(tucsonDeckPath.assumption);
  if (raleighRoofPath) out.push(raleighRoofPath.assumption);
  if (raleighHvacPath) out.push(raleighHvacPath.assumption);
  if (raleighKitchenPath) out.push(raleighKitchenPath.assumption);
  if (raleighDeckPath) out.push(raleighDeckPath.assumption);
  if (seattleHvacPath) out.push(seattleHvacPath.assumption);
  if (seattleRoofPath) out.push(seattleRoofPath.assumption);
  if (seattleDeckPath) out.push(seattleDeckPath.assumption);
  if (seattleKitchenPath) out.push(seattleKitchenPath.assumption);
  if (charlotteHvacPath) out.push(charlotteHvacPath.assumption);
  if (charlotteKitchenPath) out.push(charlotteKitchenPath.assumption);
  if (nashvilleDeckPath) out.push(nashvilleDeckPath.assumption);
  if (nashvilleRoofPath) out.push(nashvilleRoofPath.assumption);
  if (atlantaRoofPath) out.push(atlantaRoofPath.assumption);
  if (atlantaHvacPath) out.push(atlantaHvacPath.assumption);
  if (atlantaDeckPath) out.push(atlantaDeckPath.assumption);
  if (atlantaKitchenPath) out.push(atlantaKitchenPath.assumption);
  if (memphisHvacPath) out.push(memphisHvacPath.assumption);
  if (memphisKitchenPath) out.push(memphisKitchenPath.assumption);
  if (memphisDeckPath) out.push(memphisDeckPath.assumption);
  if (denverDeckPath) out.push(denverDeckPath.assumption);
  if (denverKitchenPath) out.push(denverKitchenPath.assumption);
  if (houstonHvacPath) out.push(houstonHvacPath.assumption);
  if (houstonDeckPath) out.push(houstonDeckPath.assumption);
  if (philadelphiaRoofPath) out.push(philadelphiaRoofPath.assumption);
  if (detroitRoofPath) out.push(detroitRoofPath.assumption);
  if (dallasRoofPath) out.push(dallasRoofPath.assumption);
  if (dallasHvacPath) out.push(dallasHvacPath.assumption);
  if (dallasKitchenPath) out.push(dallasKitchenPath.assumption);
  if (dallasDeckPath) out.push(dallasDeckPath.assumption);
  if (minneapolisRoofPath) out.push(minneapolisRoofPath.assumption);
  if (minneapolisHvacPath) out.push(minneapolisHvacPath.assumption);
  if (minneapolisDeckPath) out.push(minneapolisDeckPath.assumption);
  if (miamiRoofPath) out.push(miamiRoofPath.assumption);
  if (miamiHvacPath) out.push(miamiHvacPath.assumption);
  if (miamiKitchenPath) out.push(miamiKitchenPath.assumption);
  if (miamiDeckPath) out.push(miamiDeckPath.assumption);
  if (lasVegasDeckPath) out.push(lasVegasDeckPath.assumption);
  if (lasVegasRoofPath) out.push(lasVegasRoofPath.assumption);
  if (lasVegasHvacPath) out.push(lasVegasHvacPath.assumption);
  if (chicagoRoofPath) out.push(chicagoRoofPath.assumption);
  if (chicagoHvacPath) out.push(chicagoHvacPath.assumption);
  if (chicagoKitchenPath) out.push(chicagoKitchenPath.assumption);
  if (chicagoDeckPath) out.push(chicagoDeckPath.assumption);
  if (bostonRoofPath) out.push(bostonRoofPath.assumption);
  if (bostonHvacPath) out.push(bostonHvacPath.assumption);
  if (bostonKitchenPath) out.push(bostonKitchenPath.assumption);
  if (bostonDeckPath) out.push(bostonDeckPath.assumption);

  // Charlotte roof already explains the exemption in Why costs differ.
  // Pasting the full calculation note here repeats the LUESA wall.
  // Austin roof, HVAC, kitchen, and deck, Denver HVAC, Denver roof, Denver deck, Denver kitchen, Phoenix
  // roof, HVAC, kitchen, and deck, Tucson roof, Tucson HVAC, Tucson kitchen, Tucson deck, Portland roof, Portland kitchen, Portland deck, Raleigh roof, Raleigh HVAC, Raleigh kitchen, Raleigh deck, Seattle HVAC, Seattle roof, Seattle deck, Seattle kitchen, Charlotte HVAC, Charlotte kitchen, Nashville deck, Nashville roof, Atlanta roof, Atlanta HVAC, Atlanta deck, Atlanta kitchen, Memphis HVAC, Memphis kitchen, Memphis deck, Houston HVAC, Houston deck, Philadelphia roof, Detroit roof, Dallas roof, Dallas HVAC, Dallas kitchen, Dallas deck, Minneapolis roof, Minneapolis HVAC, Minneapolis deck, Miami roof, Miami HVAC, Miami kitchen, Miami deck, Las Vegas deck, Las Vegas roof, Las Vegas HVAC, Chicago roof, Chicago HVAC, Chicago kitchen, Chicago deck, Boston roof, Boston HVAC, Boston kitchen, and Boston deck keep a short assumption.
  // The full note stays on the permit callout and the fee-model callout.
  // How-calculated summarizes and points at that note so assumptions and
  // why-costs do not repeat the wall.
  if (permit && charlotteRoofStatuteExempt(permit)) {
    out.push(charlotteRoofAssumption());
  } else {
    const calc = (permit?.calculationNote || "").trim();
    if (
      calc &&
      !austinPath &&
      !austinHvacPath &&
      !austinKitchenPath &&
      !austinDeckPath &&
      !denverPath &&
      !denverRoofPath &&
      !phoenixRoofPath &&
      !phoenixHvacPath &&
      !phoenixKitchenPath &&
      !phoenixDeckPath &&
      !portlandRoofPath &&
      !portlandKitchenPath &&
      !portlandDeckPath &&
      !tucsonRoofPath &&
      !tucsonHvacPath &&
      !tucsonKitchenPath &&
      !tucsonDeckPath &&
      !raleighRoofPath &&
      !raleighHvacPath &&
      !raleighKitchenPath &&
      !raleighDeckPath &&
      !seattleHvacPath &&
      !seattleRoofPath &&
      !seattleDeckPath &&
      !seattleKitchenPath &&
      !charlotteHvacPath &&
      !charlotteKitchenPath &&
      !nashvilleDeckPath &&
      !nashvilleRoofPath &&
      !atlantaRoofPath &&
      !atlantaHvacPath &&
      !atlantaDeckPath &&
      !atlantaKitchenPath &&
      !memphisHvacPath &&
      !memphisKitchenPath &&
      !memphisDeckPath &&
      !denverDeckPath &&
      !denverKitchenPath &&
      !houstonHvacPath &&
      !houstonDeckPath &&
      !philadelphiaRoofPath &&
      !detroitRoofPath &&
      !dallasRoofPath &&
      !dallasHvacPath &&
      !dallasKitchenPath &&
      !dallasDeckPath &&
      !minneapolisRoofPath &&
      !minneapolisHvacPath &&
      !minneapolisDeckPath &&
      !miamiRoofPath &&
      !miamiHvacPath &&
      !miamiKitchenPath &&
      !miamiDeckPath &&
      !lasVegasDeckPath &&
      !lasVegasRoofPath &&
      !lasVegasHvacPath &&
      !chicagoRoofPath &&
      !chicagoHvacPath &&
      !chicagoKitchenPath &&
      !chicagoDeckPath &&
      !bostonRoofPath &&
      !bostonHvacPath &&
      !bostonKitchenPath &&
      !bostonDeckPath
    ) {
      out.push(asSentence(calc));
    }
  }

  return out.filter(Boolean).map(keepHvac);
}

export function permitCalloutModel(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): PermitCalloutModel {
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);

  if (!permit) {
    return { kind: "missing", job, city: label, dept: city.permitDeptName };
  }

  const fee = permit.feeTypicalUsd;
  if (fee == null) {
    return {
      kind: "unknown",
      sourceName: permit.sourceName || null,
      retrievedDate: permit.retrievedDate || null,
      caveat: permit.caveat?.trim() || null,
      calculationNote: permit.calculationNote?.trim() || null,
      job,
      city: label,
    };
  }

  if (fee === 0) {
    const extraNotes = (permit.extras || [])
      .map((e) => {
        const note = (e.note || "").trim();
        const name = (e.name || "").trim();
        if (note && name) return asSentence(name + ": " + note);
        if (note) return asSentence(note);
        if (name) return asSentence(name);
        return "";
      })
      .filter(Boolean)
      .slice(0, 3);
    const caveat = permit.caveat?.trim() || null;
    const statuteExempt = charlotteRoofStatuteExempt(permit);
    // Caveat and the full calculation note are the same exemption wall.
    // Show the caveat, or a short note when the caveat is missing.
    const calculationNote = statuteExempt
      ? caveat
        ? null
        : charlotteRoofShortPermitNote()
      : permit.calculationNote?.trim() || null;
    return {
      kind: "zero",
      permitRequired: permit.permitRequired,
      caveat,
      extraNotes,
      sourceName: permit.sourceName || null,
      retrievedDate: permit.retrievedDate || null,
      calculationNote,
      job,
      city: label,
    };
  }

  const low = permit.feeLowUsd;
  const high = permit.feeHighUsd;
  const showRange =
    (low != null || high != null) && !(low === fee && high === fee);
  const austinKitchen = austinKitchenPageCopy(city, permit);
  const austinDeck = austinDeckPageCopy(city, permit);
  const portlandRoof = portlandRoofPageCopy(city, permit);
  const portlandKitchen = portlandKitchenPageCopy(city, permit);
  const portlandDeck = portlandDeckPageCopy(city, permit);
  const tucsonRoof = tucsonRoofPageCopy(city, permit);
  const tucsonHvac = tucsonHvacPageCopy(city, permit);
  const tucsonKitchen = tucsonKitchenPageCopy(city, permit);
  const tucsonDeck = tucsonDeckPageCopy(city, permit);
  const raleighKitchen = raleighKitchenPageCopy(city, permit);
  const denverDeck = denverDeckPageCopy(city, permit);
  const denverKitchen = denverKitchenPageCopy(city, permit);
  const houstonHvac = houstonHvacPageCopy(city, permit);
  const houstonDeck = houstonDeckPageCopy(city, permit);
  const philadelphiaRoof = philadelphiaRoofPageCopy(city, permit);
  const detroitRoof = detroitRoofPageCopy(city, permit);
  const dallasRoof = dallasRoofPageCopy(city, permit);
  const dallasHvac = dallasHvacPageCopy(city, permit);
  const dallasKitchen = dallasKitchenPageCopy(city, permit);
  const dallasDeck = dallasDeckPageCopy(city, permit);
  const minneapolisRoof = minneapolisRoofPageCopy(city, permit);
  const minneapolisHvac = minneapolisHvacPageCopy(city, permit);
  const minneapolisDeck = minneapolisDeckPageCopy(city, permit);
  const miamiRoof = miamiRoofPageCopy(city, permit);
  const miamiHvac = miamiHvacPageCopy(city, permit);
  const miamiKitchen = miamiKitchenPageCopy(city, permit);
  const miamiDeck = miamiDeckPageCopy(city, permit);
  const bostonRoof = bostonRoofPageCopy(city, permit);
  const bostonHvac = bostonHvacPageCopy(city, permit);
  const bostonKitchen = bostonKitchenPageCopy(city, permit);
  const bostonDeck = bostonDeckPageCopy(city, permit);
  const chicagoKitchen = chicagoKitchenPageCopy(city, permit);
  const chicagoDeck = chicagoDeckPageCopy(city, permit);
  const lasVegasRoof = lasVegasRoofPageCopy(city, permit);
  const lasVegasHvac = lasVegasHvacPageCopy(city, permit);
  return {
    kind: "known",
    typicalUsd: fee,
    lowUsd: low,
    highUsd: high,
    rangeLabel:
      denverDeck?.rangeExact ??
      denverKitchen?.rangeExact ??
      portlandRoof?.rangeExact ??
      portlandKitchen?.rangeExact ??
      portlandDeck?.rangeExact ??
      houstonHvac?.rangeExact ??
      houstonDeck?.rangeExact ??
      detroitRoof?.rangeExact ??
      dallasRoof?.rangeExact ??
      dallasHvac?.rangeExact ??
      dallasKitchen?.rangeExact ??
      dallasDeck?.rangeExact ??
      minneapolisRoof?.rangeExact ??
      minneapolisHvac?.rangeExact ??
      minneapolisDeck?.rangeExact ??
      miamiRoof?.rangeExact ??
      miamiHvac?.rangeExact ??
      miamiKitchen?.rangeExact ??
      miamiDeck?.rangeExact ??
      bostonRoof?.rangeExact ??
      bostonHvac?.rangeExact ??
      bostonKitchen?.rangeExact ??
      bostonDeck?.rangeExact ??
      chicagoKitchen?.rangeExact ??
      chicagoDeck?.rangeExact ??
      lasVegasRoof?.rangeExact ??
      lasVegasHvac?.rangeExact ??
      (showRange
        ? (tucsonRoof?.rangeExact ??
          tucsonHvac?.rangeExact ??
          tucsonKitchen?.rangeExact ??
          tucsonDeck?.rangeExact ??
          raleighKitchen?.rangeExact ??
          usdRange(low, high))
        : null),
    typicalLabel:
      denverDeck?.typicalExact ??
      denverKitchen?.typicalExact ??
      portlandRoof?.typicalExact ??
      portlandKitchen?.typicalExact ??
      portlandDeck?.typicalExact ??
      austinKitchen?.typicalExact ??
      austinDeck?.typicalExact ??
      tucsonRoof?.typicalExact ??
      tucsonHvac?.typicalExact ??
      tucsonKitchen?.typicalExact ??
      tucsonDeck?.typicalExact ??
      raleighKitchen?.typicalExact ??
      houstonHvac?.typicalExact ??
      houstonDeck?.typicalExact ??
      philadelphiaRoof?.typicalExact ??
      detroitRoof?.typicalExact ??
      dallasRoof?.typicalExact ??
      dallasHvac?.typicalExact ??
      dallasKitchen?.typicalExact ??
      dallasDeck?.typicalExact ??
      minneapolisRoof?.typicalExact ??
      minneapolisHvac?.typicalExact ??
      minneapolisDeck?.typicalExact ??
      miamiRoof?.typicalExact ??
      miamiHvac?.typicalExact ??
      miamiKitchen?.typicalExact ??
      miamiDeck?.typicalExact ??
      bostonRoof?.typicalExact ??
      bostonHvac?.typicalExact ??
      bostonKitchen?.typicalExact ??
      bostonDeck?.typicalExact ??
      chicagoKitchen?.typicalExact ??
      chicagoDeck?.typicalExact ??
      lasVegasRoof?.typicalExact ??
      lasVegasHvac?.typicalExact ??
      null,
    sourceName: permit.sourceName,
    retrievedDate: permit.retrievedDate || null,
    caveat: permit.caveat?.trim() || null,
    dept: city.permitDeptName,
    job,
    city: label,
  };
}

export function moneyFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  const fee = permit?.feeTypicalUsd ?? null;
  const required = permit?.permitRequired ?? null;
  const caveatFirst = permit?.caveat ? firstSentence(permit.caveat) : "";
  const calcFirst = permit?.calculationNote ? firstSentence(permit.calculationNote) : "";
  const dept = city.permitDeptName;

  let requiredAnswer: string;
  if (!permit) {
    requiredAnswer =
      "Whether a permit is required for " +
      job +
      " in " +
      label +
      " is not recorded on this page. Confirm with " +
      dept +
      " before you apply.";
  } else if (required === false) {
    requiredAnswer =
      "The typical path is recorded as not requiring a permit for " +
      job +
      " in " +
      label +
      ".";
    if (fee === 0) requiredAnswer += " The recorded typical fee is $0.";
    const austinRequired = austinRoofPageCopy(city, permit);
    const chicagoRoofRequired = chicagoRoofPageCopy(city, permit);
    const chicagoHvacRequired = chicagoHvacPageCopy(city, permit);
    if (charlotteRoofStatuteExempt(permit)) {
      requiredAnswer +=
        " A like-for-like single-family reroof at or under $40,000 does not require a building permit under N.C.G.S. 160D-1110(c)(5).";
    } else if (austinRequired) {
      requiredAnswer += " " + austinRequired.requiredClause;
    } else if (chicagoRoofRequired) {
      requiredAnswer += " " + chicagoRoofRequired.requiredClause;
    } else if (chicagoHvacRequired) {
      requiredAnswer += " " + chicagoHvacRequired.requiredClause;
    } else if (caveatFirst) requiredAnswer += " " + caveatFirst;
  } else if (required === true) {
    requiredAnswer =
      "Yes. " + dept + " requires a permit for a typical " + job + " in " + label + ".";
    if (fee != null && fee > 0) {
      requiredAnswer += " The typical recorded fee is " + usd(fee) + ".";
    } else if (fee === 0) {
      requiredAnswer += " The recorded typical fee is still $0 — see the caveat on this page.";
    } else {
      requiredAnswer +=
        " The fee itself is not yet recorded from the official schedule, so that line stays blank.";
    }
    const denverRequired = permit ? denverHvacPageCopy(city, permit) : null;
    const denverRoofRequired = permit ? denverRoofPageCopy(city, permit) : null;
    const denverDeckRequired = permit ? denverDeckPageCopy(city, permit) : null;
    const denverKitchenRequired = permit ? denverKitchenPageCopy(city, permit) : null;
    const austinHvacRequired = permit ? austinHvacPageCopy(city, permit) : null;
    const austinKitchenRequired = permit ? austinKitchenPageCopy(city, permit) : null;
    const austinDeckRequired = permit ? austinDeckPageCopy(city, permit) : null;
    const phoenixRoofRequired = permit ? phoenixRoofPageCopy(city, permit) : null;
    const phoenixHvacRequired = permit ? phoenixHvacPageCopy(city, permit) : null;
    const phoenixKitchenRequired = permit ? phoenixKitchenPageCopy(city, permit) : null;
    const phoenixDeckRequired = permit ? phoenixDeckPageCopy(city, permit) : null;
    const portlandRoofRequired = permit ? portlandRoofPageCopy(city, permit) : null;
    const portlandKitchenRequired = permit ? portlandKitchenPageCopy(city, permit) : null;
    const portlandDeckRequired = permit ? portlandDeckPageCopy(city, permit) : null;
    const tucsonRoofRequired = permit ? tucsonRoofPageCopy(city, permit) : null;
    const tucsonHvacRequired = permit ? tucsonHvacPageCopy(city, permit) : null;
    const tucsonKitchenRequired = permit ? tucsonKitchenPageCopy(city, permit) : null;
    const tucsonDeckRequired = permit ? tucsonDeckPageCopy(city, permit) : null;
    const raleighRoofRequired = permit ? raleighRoofPageCopy(city, permit) : null;
    const raleighHvacRequired = permit ? raleighHvacPageCopy(city, permit) : null;
    const raleighKitchenRequired = permit ? raleighKitchenPageCopy(city, permit) : null;
    const raleighDeckRequired = permit ? raleighDeckPageCopy(city, permit) : null;
    const seattleHvacRequired = permit ? seattleHvacPageCopy(city, permit) : null;
    const seattleRoofRequired = permit ? seattleRoofPageCopy(city, permit) : null;
    const seattleDeckRequired = permit ? seattleDeckPageCopy(city, permit) : null;
    const seattleKitchenRequired = permit ? seattleKitchenPageCopy(city, permit) : null;
    const charlotteHvacRequired = permit ? charlotteHvacPageCopy(city, permit) : null;
    const charlotteKitchenRequired = permit ? charlotteKitchenPageCopy(city, permit) : null;
    const nashvilleDeckRequired = permit ? nashvilleDeckPageCopy(city, permit) : null;
    const nashvilleRoofRequired = permit ? nashvilleRoofPageCopy(city, permit) : null;
    const atlantaRoofRequired = permit ? atlantaRoofPageCopy(city, permit) : null;
    const atlantaHvacRequired = permit ? atlantaHvacPageCopy(city, permit) : null;
    const houstonHvacRequired = permit ? houstonHvacPageCopy(city, permit) : null;
    const houstonDeckRequired = permit ? houstonDeckPageCopy(city, permit) : null;
    const philadelphiaRoofRequired = permit ? philadelphiaRoofPageCopy(city, permit) : null;
    const detroitRoofRequired = permit ? detroitRoofPageCopy(city, permit) : null;
    const dallasRoofRequired = permit ? dallasRoofPageCopy(city, permit) : null;
    const dallasHvacRequired = permit ? dallasHvacPageCopy(city, permit) : null;
    const dallasKitchenRequired = permit ? dallasKitchenPageCopy(city, permit) : null;
    const dallasDeckRequired = permit ? dallasDeckPageCopy(city, permit) : null;
    const minneapolisRoofRequired = permit ? minneapolisRoofPageCopy(city, permit) : null;
    const minneapolisHvacRequired = permit ? minneapolisHvacPageCopy(city, permit) : null;
    const minneapolisDeckRequired = permit ? minneapolisDeckPageCopy(city, permit) : null;
    const miamiRoofRequired = permit ? miamiRoofPageCopy(city, permit) : null;
    const miamiHvacRequired = permit ? miamiHvacPageCopy(city, permit) : null;
    const miamiKitchenRequired = permit ? miamiKitchenPageCopy(city, permit) : null;
    const miamiDeckRequired = permit ? miamiDeckPageCopy(city, permit) : null;
    const bostonRoofRequired = permit ? bostonRoofPageCopy(city, permit) : null;
    const bostonHvacRequired = permit ? bostonHvacPageCopy(city, permit) : null;
    const bostonKitchenRequired = permit ? bostonKitchenPageCopy(city, permit) : null;
    const bostonDeckRequired = permit ? bostonDeckPageCopy(city, permit) : null;
    const chicagoKitchenRequired = permit ? chicagoKitchenPageCopy(city, permit) : null;
    const chicagoDeckRequired = permit ? chicagoDeckPageCopy(city, permit) : null;
    const lasVegasRoofRequired = permit ? lasVegasRoofPageCopy(city, permit) : null;
    const lasVegasHvacRequired = permit ? lasVegasHvacPageCopy(city, permit) : null;
    const atlantaDeckRequired = permit ? atlantaDeckPageCopy(city, permit) : null;
    const atlantaKitchenRequired = permit ? atlantaKitchenPageCopy(city, permit) : null;
    if (fee != null && fee > 0 && seattleRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + seattleRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && seattleDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + seattleDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && seattleKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + seattleKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && denverDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + denverDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && denverKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + denverKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && austinKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + austinKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && austinDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + austinDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && portlandRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + portlandRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && portlandKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + portlandKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && portlandDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + portlandDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && tucsonRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + tucsonRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && tucsonHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + tucsonHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && tucsonKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + tucsonKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && tucsonDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + tucsonDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && raleighRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + raleighRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && raleighKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + raleighKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && raleighDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + raleighDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && houstonHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + houstonHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && houstonDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + houstonDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && philadelphiaRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + philadelphiaRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && detroitRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + detroitRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && dallasRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + dallasRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && dallasHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + dallasHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && dallasKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + dallasKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && dallasDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + dallasDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && minneapolisRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + minneapolisRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && minneapolisHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + minneapolisHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && minneapolisDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + minneapolisDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && miamiRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + miamiRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && miamiHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + miamiHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && miamiKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + miamiKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && miamiDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + miamiDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && bostonRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + bostonRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && bostonHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + bostonHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && bostonKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + bostonKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && chicagoKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + chicagoKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && chicagoDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + chicagoDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && lasVegasRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + lasVegasRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && lasVegasHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + lasVegasHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && bostonDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + bostonDeckRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && charlotteKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + charlotteKitchenRequired.typicalExact + ".",
      );
    }
    if (denverRequired) requiredAnswer += " " + denverRequired.requiredClause;
    else if (denverRoofRequired) requiredAnswer += " " + denverRoofRequired.requiredClause;
    else if (denverDeckRequired) requiredAnswer += " " + denverDeckRequired.requiredClause;
    else if (denverKitchenRequired) requiredAnswer += " " + denverKitchenRequired.requiredClause;
    else if (austinHvacRequired) requiredAnswer += " " + austinHvacRequired.requiredClause;
    else if (austinKitchenRequired) requiredAnswer += " " + austinKitchenRequired.requiredClause;
    else if (austinDeckRequired) requiredAnswer += " " + austinDeckRequired.requiredClause;
    else if (phoenixRoofRequired) requiredAnswer += " " + phoenixRoofRequired.requiredClause;
    else if (portlandRoofRequired) requiredAnswer += " " + portlandRoofRequired.requiredClause;
    else if (portlandKitchenRequired) requiredAnswer += " " + portlandKitchenRequired.requiredClause;
    else if (portlandDeckRequired) requiredAnswer += " " + portlandDeckRequired.requiredClause;
    else if (tucsonRoofRequired) requiredAnswer += " " + tucsonRoofRequired.requiredClause;
    else if (tucsonHvacRequired) requiredAnswer += " " + tucsonHvacRequired.requiredClause;
    else if (tucsonKitchenRequired) requiredAnswer += " " + tucsonKitchenRequired.requiredClause;
    else if (tucsonDeckRequired) requiredAnswer += " " + tucsonDeckRequired.requiredClause;
    else if (raleighRoofRequired) requiredAnswer += " " + raleighRoofRequired.requiredClause;
    else if (raleighHvacRequired) requiredAnswer += " " + raleighHvacRequired.requiredClause;
    else if (raleighKitchenRequired) requiredAnswer += " " + raleighKitchenRequired.requiredClause;
    else if (raleighDeckRequired) requiredAnswer += " " + raleighDeckRequired.requiredClause;
    else if (phoenixHvacRequired) requiredAnswer += " " + phoenixHvacRequired.requiredClause;
    else if (phoenixKitchenRequired) requiredAnswer += " " + phoenixKitchenRequired.requiredClause;
    else if (phoenixDeckRequired) requiredAnswer += " " + phoenixDeckRequired.requiredClause;
    else if (seattleHvacRequired) requiredAnswer += " " + seattleHvacRequired.requiredClause;
    else if (seattleRoofRequired) requiredAnswer += " " + seattleRoofRequired.requiredClause;
    else if (seattleDeckRequired) requiredAnswer += " " + seattleDeckRequired.requiredClause;
    else if (seattleKitchenRequired) requiredAnswer += " " + seattleKitchenRequired.requiredClause;
    else if (charlotteHvacRequired) requiredAnswer += " " + charlotteHvacRequired.requiredClause;
    else if (charlotteKitchenRequired) requiredAnswer += " " + charlotteKitchenRequired.requiredClause;
    else if (nashvilleDeckRequired) requiredAnswer += " " + nashvilleDeckRequired.requiredClause;
    else if (nashvilleRoofRequired) requiredAnswer += " " + nashvilleRoofRequired.requiredClause;
    else if (atlantaRoofRequired) requiredAnswer += " " + atlantaRoofRequired.requiredClause;
    else if (atlantaHvacRequired) requiredAnswer += " " + atlantaHvacRequired.requiredClause;
    else if (atlantaDeckRequired) requiredAnswer += " " + atlantaDeckRequired.requiredClause;
    else if (atlantaKitchenRequired) requiredAnswer += " " + atlantaKitchenRequired.requiredClause;
    else if (bostonRoofRequired) requiredAnswer += " " + bostonRoofRequired.requiredClause;
    else if (bostonHvacRequired) requiredAnswer += " " + bostonHvacRequired.requiredClause;
    else if (bostonKitchenRequired) requiredAnswer += " " + bostonKitchenRequired.requiredClause;
    else if (chicagoKitchenRequired) requiredAnswer += " " + chicagoKitchenRequired.requiredClause;
    else if (dallasKitchenRequired) requiredAnswer += " " + dallasKitchenRequired.requiredClause;
    else if (dallasDeckRequired) requiredAnswer += " " + dallasDeckRequired.requiredClause;
    else if (houstonDeckRequired) requiredAnswer += " " + houstonDeckRequired.requiredClause;
    else if (philadelphiaRoofRequired) requiredAnswer += " " + philadelphiaRoofRequired.requiredClause;
    else if (detroitRoofRequired) requiredAnswer += " " + detroitRoofRequired.requiredClause;
    else if (miamiKitchenRequired) requiredAnswer += " " + miamiKitchenRequired.requiredClause;
    else if (miamiDeckRequired) requiredAnswer += " " + miamiDeckRequired.requiredClause;
    else if (chicagoDeckRequired) requiredAnswer += " " + chicagoDeckRequired.requiredClause;
    else if (lasVegasRoofRequired) requiredAnswer += " " + lasVegasRoofRequired.requiredClause;
    else if (lasVegasHvacRequired) requiredAnswer += " " + lasVegasHvacRequired.requiredClause;
    else if (minneapolisHvacRequired) requiredAnswer += " " + minneapolisHvacRequired.requiredClause;
    else if (minneapolisDeckRequired) requiredAnswer += " " + minneapolisDeckRequired.requiredClause;
    else if (bostonDeckRequired) requiredAnswer += " " + bostonDeckRequired.requiredClause;
    else if (caveatFirst) requiredAnswer += " " + caveatFirst;
  } else {
    requiredAnswer =
      "Whether a permit is required for " +
      job +
      " in " +
      label +
      " is not marked on the permit row. Confirm with " +
      dept +
      ".";
    if (caveatFirst) requiredAnswer += " " + caveatFirst;
  }

  let included =
    "The estimate is labor (wage-indexed for " +
    label +
    ") plus materials at the national figure";
  if (spec) included += " for a " + spec.typical + " " + job;
  else included += " for this " + job;
  included += ".";
  const denverIncluded = permit ? denverHvacPageCopy(city, permit) : null;
  const denverRoofIncluded = permit ? denverRoofPageCopy(city, permit) : null;
  const denverDeckIncluded = permit ? denverDeckPageCopy(city, permit) : null;
  const denverKitchenIncluded = permit ? denverKitchenPageCopy(city, permit) : null;
  const austinHvacIncluded = permit ? austinHvacPageCopy(city, permit) : null;
  const austinKitchenIncluded = permit ? austinKitchenPageCopy(city, permit) : null;
  const austinDeckIncluded = permit ? austinDeckPageCopy(city, permit) : null;
  const phoenixRoofIncluded = permit ? phoenixRoofPageCopy(city, permit) : null;
  const phoenixHvacIncluded = permit ? phoenixHvacPageCopy(city, permit) : null;
  const phoenixKitchenIncluded = permit ? phoenixKitchenPageCopy(city, permit) : null;
  const phoenixDeckIncluded = permit ? phoenixDeckPageCopy(city, permit) : null;
  const portlandRoofIncluded = permit ? portlandRoofPageCopy(city, permit) : null;
  const portlandKitchenIncluded = permit ? portlandKitchenPageCopy(city, permit) : null;
  const portlandDeckIncluded = permit ? portlandDeckPageCopy(city, permit) : null;
  const tucsonRoofIncluded = permit ? tucsonRoofPageCopy(city, permit) : null;
  const tucsonHvacIncluded = permit ? tucsonHvacPageCopy(city, permit) : null;
  const tucsonKitchenIncluded = permit ? tucsonKitchenPageCopy(city, permit) : null;
  const tucsonDeckIncluded = permit ? tucsonDeckPageCopy(city, permit) : null;
  const raleighRoofIncluded = permit ? raleighRoofPageCopy(city, permit) : null;
  const raleighHvacIncluded = permit ? raleighHvacPageCopy(city, permit) : null;
  const raleighKitchenIncluded = permit ? raleighKitchenPageCopy(city, permit) : null;
  const raleighDeckIncluded = permit ? raleighDeckPageCopy(city, permit) : null;
  const seattleHvacIncluded = permit ? seattleHvacPageCopy(city, permit) : null;
  const seattleRoofIncluded = permit ? seattleRoofPageCopy(city, permit) : null;
  const seattleDeckIncluded = permit ? seattleDeckPageCopy(city, permit) : null;
  const seattleKitchenIncluded = permit ? seattleKitchenPageCopy(city, permit) : null;
  const charlotteHvacIncluded = permit ? charlotteHvacPageCopy(city, permit) : null;
  const charlotteKitchenIncluded = permit ? charlotteKitchenPageCopy(city, permit) : null;
  const nashvilleDeckIncluded = permit ? nashvilleDeckPageCopy(city, permit) : null;
  const nashvilleRoofIncluded = permit ? nashvilleRoofPageCopy(city, permit) : null;
  const atlantaRoofIncluded = permit ? atlantaRoofPageCopy(city, permit) : null;
  const atlantaHvacIncluded = permit ? atlantaHvacPageCopy(city, permit) : null;
  const houstonHvacIncluded = permit ? houstonHvacPageCopy(city, permit) : null;
  const houstonDeckIncluded = permit ? houstonDeckPageCopy(city, permit) : null;
  const philadelphiaRoofIncluded = permit ? philadelphiaRoofPageCopy(city, permit) : null;
  const detroitRoofIncluded = permit ? detroitRoofPageCopy(city, permit) : null;
  const dallasRoofIncluded = permit ? dallasRoofPageCopy(city, permit) : null;
  const dallasHvacIncluded = permit ? dallasHvacPageCopy(city, permit) : null;
  const dallasKitchenIncluded = permit ? dallasKitchenPageCopy(city, permit) : null;
  const dallasDeckIncluded = permit ? dallasDeckPageCopy(city, permit) : null;
  const minneapolisRoofIncluded = permit ? minneapolisRoofPageCopy(city, permit) : null;
  const minneapolisHvacIncluded = permit ? minneapolisHvacPageCopy(city, permit) : null;
  const minneapolisDeckIncluded = permit ? minneapolisDeckPageCopy(city, permit) : null;
  const miamiRoofIncluded = permit ? miamiRoofPageCopy(city, permit) : null;
  const miamiHvacIncluded = permit ? miamiHvacPageCopy(city, permit) : null;
  const miamiKitchenIncluded = permit ? miamiKitchenPageCopy(city, permit) : null;
  const miamiDeckIncluded = permit ? miamiDeckPageCopy(city, permit) : null;
  const bostonRoofIncluded = permit ? bostonRoofPageCopy(city, permit) : null;
  const bostonHvacIncluded = permit ? bostonHvacPageCopy(city, permit) : null;
  const bostonKitchenIncluded = permit ? bostonKitchenPageCopy(city, permit) : null;
  const bostonDeckIncluded = permit ? bostonDeckPageCopy(city, permit) : null;
  const chicagoKitchenIncluded = permit ? chicagoKitchenPageCopy(city, permit) : null;
  const chicagoDeckIncluded = permit ? chicagoDeckPageCopy(city, permit) : null;
  const lasVegasRoofIncluded = permit ? lasVegasRoofPageCopy(city, permit) : null;
  const lasVegasHvacIncluded = permit ? lasVegasHvacPageCopy(city, permit) : null;
  const atlantaDeckIncluded = permit ? atlantaDeckPageCopy(city, permit) : null;
  const atlantaKitchenIncluded = permit ? atlantaKitchenPageCopy(city, permit) : null;
  if (fee != null && fee > 0) {
    const shownFee = seattleRoofIncluded
      ? seattleRoofIncluded.typicalExact
      : seattleDeckIncluded
        ? seattleDeckIncluded.typicalExact
        : seattleKitchenIncluded
          ? seattleKitchenIncluded.typicalExact
          : denverDeckIncluded
      ? denverDeckIncluded.typicalExact
      : denverKitchenIncluded
        ? denverKitchenIncluded.typicalExact
        : houstonHvacIncluded
      ? houstonHvacIncluded.typicalExact
      : houstonDeckIncluded
      ? houstonDeckIncluded.typicalExact
      : philadelphiaRoofIncluded
      ? philadelphiaRoofIncluded.typicalExact
      : detroitRoofIncluded
      ? detroitRoofIncluded.typicalExact
      : dallasRoofIncluded
      ? dallasRoofIncluded.typicalExact
      : dallasHvacIncluded
      ? dallasHvacIncluded.typicalExact
      : dallasKitchenIncluded
      ? dallasKitchenIncluded.typicalExact
      : dallasDeckIncluded
      ? dallasDeckIncluded.typicalExact
      : minneapolisRoofIncluded
      ? minneapolisRoofIncluded.typicalExact
      : minneapolisHvacIncluded
      ? minneapolisHvacIncluded.typicalExact
      : minneapolisDeckIncluded
      ? minneapolisDeckIncluded.typicalExact
      : miamiRoofIncluded
      ? miamiRoofIncluded.typicalExact
      : miamiHvacIncluded
      ? miamiHvacIncluded.typicalExact
      : miamiKitchenIncluded
      ? miamiKitchenIncluded.typicalExact
      : miamiDeckIncluded
      ? miamiDeckIncluded.typicalExact
      : bostonRoofIncluded
      ? bostonRoofIncluded.typicalExact
      : bostonHvacIncluded
        ? bostonHvacIncluded.typicalExact
      : bostonKitchenIncluded
        ? bostonKitchenIncluded.typicalExact
      : chicagoKitchenIncluded
        ? chicagoKitchenIncluded.typicalExact
      : chicagoDeckIncluded
        ? chicagoDeckIncluded.typicalExact
      : lasVegasRoofIncluded
        ? lasVegasRoofIncluded.typicalExact
      : lasVegasHvacIncluded
        ? lasVegasHvacIncluded.typicalExact
      : bostonDeckIncluded
        ? bostonDeckIncluded.typicalExact
      : austinKitchenIncluded
      ? austinKitchenIncluded.typicalExact
      : austinDeckIncluded
        ? austinDeckIncluded.typicalExact
        : portlandRoofIncluded
          ? portlandRoofIncluded.typicalExact
          : portlandKitchenIncluded
            ? portlandKitchenIncluded.typicalExact
            : portlandDeckIncluded
              ? portlandDeckIncluded.typicalExact
              : tucsonRoofIncluded
              ? tucsonRoofIncluded.typicalExact
              : tucsonHvacIncluded
                ? tucsonHvacIncluded.typicalExact
                : tucsonKitchenIncluded
                  ? tucsonKitchenIncluded.typicalExact
                  : tucsonDeckIncluded
                    ? tucsonDeckIncluded.typicalExact
                    : raleighRoofIncluded
                      ? raleighRoofIncluded.typicalExact
                      : raleighKitchenIncluded
                        ? raleighKitchenIncluded.typicalExact
                        : raleighDeckIncluded
                          ? raleighDeckIncluded.typicalExact
                          : charlotteKitchenIncluded
                            ? charlotteKitchenIncluded.typicalExact
                            : usd(fee);
    included +=
      " The recorded typical permit fee of " +
      shownFee +
      " is included in the all-in typical.";
    if (denverIncluded) included += " " + denverIncluded.includedClause;
    else if (denverRoofIncluded) included += " " + denverRoofIncluded.includedClause;
    else if (denverDeckIncluded) included += " " + denverDeckIncluded.includedClause;
    else if (denverKitchenIncluded) included += " " + denverKitchenIncluded.includedClause;
    else if (austinHvacIncluded) included += " " + austinHvacIncluded.includedClause;
    else if (austinKitchenIncluded) included += " " + austinKitchenIncluded.includedClause;
    else if (austinDeckIncluded) included += " " + austinDeckIncluded.includedClause;
    else if (phoenixRoofIncluded) included += " " + phoenixRoofIncluded.includedClause;
    else if (portlandRoofIncluded) included += " " + portlandRoofIncluded.includedClause;
    else if (portlandKitchenIncluded) included += " " + portlandKitchenIncluded.includedClause;
    else if (portlandDeckIncluded) included += " " + portlandDeckIncluded.includedClause;
    else if (tucsonRoofIncluded) included += " " + tucsonRoofIncluded.includedClause;
    else if (tucsonHvacIncluded) included += " " + tucsonHvacIncluded.includedClause;
    else if (tucsonKitchenIncluded) included += " " + tucsonKitchenIncluded.includedClause;
    else if (tucsonDeckIncluded) included += " " + tucsonDeckIncluded.includedClause;
    else if (raleighRoofIncluded) included += " " + raleighRoofIncluded.includedClause;
    else if (raleighHvacIncluded) included += " " + raleighHvacIncluded.includedClause;
    else if (raleighKitchenIncluded) included += " " + raleighKitchenIncluded.includedClause;
    else if (raleighDeckIncluded) included += " " + raleighDeckIncluded.includedClause;
    else if (phoenixHvacIncluded) included += " " + phoenixHvacIncluded.includedClause;
    else if (phoenixKitchenIncluded) included += " " + phoenixKitchenIncluded.includedClause;
    else if (phoenixDeckIncluded) included += " " + phoenixDeckIncluded.includedClause;
    else if (seattleHvacIncluded) included += " " + seattleHvacIncluded.includedClause;
    else if (seattleRoofIncluded) included += " " + seattleRoofIncluded.includedClause;
    else if (seattleDeckIncluded) included += " " + seattleDeckIncluded.includedClause;
    else if (seattleKitchenIncluded) included += " " + seattleKitchenIncluded.includedClause;
    else if (charlotteHvacIncluded) included += " " + charlotteHvacIncluded.includedClause;
    else if (charlotteKitchenIncluded) included += " " + charlotteKitchenIncluded.includedClause;
    else if (nashvilleDeckIncluded) included += " " + nashvilleDeckIncluded.includedClause;
    else if (nashvilleRoofIncluded) included += " " + nashvilleRoofIncluded.includedClause;
    else if (atlantaRoofIncluded) included += " " + atlantaRoofIncluded.includedClause;
    else if (atlantaHvacIncluded) included += " " + atlantaHvacIncluded.includedClause;
    else if (atlantaDeckIncluded) included += " " + atlantaDeckIncluded.includedClause;
    else if (atlantaKitchenIncluded) included += " " + atlantaKitchenIncluded.includedClause;
    else if (bostonRoofIncluded) included += " " + bostonRoofIncluded.includedClause;
    else if (bostonHvacIncluded) included += " " + bostonHvacIncluded.includedClause;
    else if (bostonKitchenIncluded) included += " " + bostonKitchenIncluded.includedClause;
    else if (chicagoKitchenIncluded) included += " " + chicagoKitchenIncluded.includedClause;
    else if (dallasKitchenIncluded) included += " " + dallasKitchenIncluded.includedClause;
    else if (dallasDeckIncluded) included += " " + dallasDeckIncluded.includedClause;
    else if (houstonDeckIncluded) included += " " + houstonDeckIncluded.includedClause;
    else if (philadelphiaRoofIncluded) included += " " + philadelphiaRoofIncluded.includedClause;
    else if (detroitRoofIncluded) included += " " + detroitRoofIncluded.includedClause;
    else if (miamiKitchenIncluded) included += " " + miamiKitchenIncluded.includedClause;
    else if (miamiDeckIncluded) included += " " + miamiDeckIncluded.includedClause;
    else if (chicagoDeckIncluded) included += " " + chicagoDeckIncluded.includedClause;
    else if (lasVegasRoofIncluded) included += " " + lasVegasRoofIncluded.includedClause;
    else if (lasVegasHvacIncluded) included += " " + lasVegasHvacIncluded.includedClause;
    else if (minneapolisHvacIncluded) included += " " + minneapolisHvacIncluded.includedClause;
    else if (minneapolisDeckIncluded) included += " " + minneapolisDeckIncluded.includedClause;
    else if (bostonDeckIncluded) included += " " + bostonDeckIncluded.includedClause;
  } else if (fee === 0) {
    included +=
      " The permit line is $0 on the typical path, so all-in is the job cost.";
    const austinIncluded = permit ? austinRoofPageCopy(city, permit) : null;
    const chicagoRoofIncluded = permit ? chicagoRoofPageCopy(city, permit) : null;
    const chicagoHvacIncluded = permit ? chicagoHvacPageCopy(city, permit) : null;
    if (austinIncluded) included += " " + austinIncluded.includedClause;
    else if (chicagoRoofIncluded) included += " " + chicagoRoofIncluded.includedClause;
    else if (chicagoHvacIncluded) included += " " + chicagoHvacIncluded.includedClause;
  } else {
    included +=
      " The permit line is blank, so the all-in figure is job cost only — we do not guess a city fee.";
  }

  const denverDiffer = permit ? denverHvacPageCopy(city, permit) : null;
  const denverRoofDiffer = permit ? denverRoofPageCopy(city, permit) : null;
  const denverDeckDiffer = permit ? denverDeckPageCopy(city, permit) : null;
  const denverKitchenDiffer = permit ? denverKitchenPageCopy(city, permit) : null;
  const austinHvacDiffer = permit ? austinHvacPageCopy(city, permit) : null;
  const austinKitchenDiffer = permit ? austinKitchenPageCopy(city, permit) : null;
  const austinDeckDiffer = permit ? austinDeckPageCopy(city, permit) : null;
  const phoenixRoofDiffer = permit ? phoenixRoofPageCopy(city, permit) : null;
  const phoenixHvacDiffer = permit ? phoenixHvacPageCopy(city, permit) : null;
  const phoenixKitchenDiffer = permit ? phoenixKitchenPageCopy(city, permit) : null;
  const phoenixDeckDiffer = permit ? phoenixDeckPageCopy(city, permit) : null;
  const portlandRoofDiffer = permit ? portlandRoofPageCopy(city, permit) : null;
  const portlandKitchenDiffer = permit ? portlandKitchenPageCopy(city, permit) : null;
  const portlandDeckDiffer = permit ? portlandDeckPageCopy(city, permit) : null;
  const tucsonRoofDiffer = permit ? tucsonRoofPageCopy(city, permit) : null;
  const tucsonHvacDiffer = permit ? tucsonHvacPageCopy(city, permit) : null;
  const tucsonKitchenDiffer = permit ? tucsonKitchenPageCopy(city, permit) : null;
  const tucsonDeckDiffer = permit ? tucsonDeckPageCopy(city, permit) : null;
  const raleighRoofDiffer = permit ? raleighRoofPageCopy(city, permit) : null;
  const raleighHvacDiffer = permit ? raleighHvacPageCopy(city, permit) : null;
  const raleighKitchenDiffer = permit ? raleighKitchenPageCopy(city, permit) : null;
  const raleighDeckDiffer = permit ? raleighDeckPageCopy(city, permit) : null;
  const seattleHvacDiffer = permit ? seattleHvacPageCopy(city, permit) : null;
  const seattleRoofDiffer = permit ? seattleRoofPageCopy(city, permit) : null;
  const seattleDeckDiffer = permit ? seattleDeckPageCopy(city, permit) : null;
  const seattleKitchenDiffer = permit ? seattleKitchenPageCopy(city, permit) : null;
  const charlotteHvacDiffer = permit ? charlotteHvacPageCopy(city, permit) : null;
  const charlotteKitchenDiffer = permit ? charlotteKitchenPageCopy(city, permit) : null;
  const nashvilleDeckDiffer = permit ? nashvilleDeckPageCopy(city, permit) : null;
  const nashvilleRoofDiffer = permit ? nashvilleRoofPageCopy(city, permit) : null;
  const atlantaRoofDiffer = permit ? atlantaRoofPageCopy(city, permit) : null;
  const atlantaHvacDiffer = permit ? atlantaHvacPageCopy(city, permit) : null;
  const atlantaDeckDiffer = permit ? atlantaDeckPageCopy(city, permit) : null;
  const atlantaKitchenDiffer = permit ? atlantaKitchenPageCopy(city, permit) : null;
  const memphisHvacDiffer = permit ? memphisHvacPageCopy(city, permit) : null;
  const memphisKitchenDiffer = permit ? memphisKitchenPageCopy(city, permit) : null;
  const memphisDeckDiffer = permit ? memphisDeckPageCopy(city, permit) : null;
  const houstonHvacDiffer = permit ? houstonHvacPageCopy(city, permit) : null;
  const houstonDeckDiffer = permit ? houstonDeckPageCopy(city, permit) : null;
  const philadelphiaRoofDiffer = permit ? philadelphiaRoofPageCopy(city, permit) : null;
  const detroitRoofDiffer = permit ? detroitRoofPageCopy(city, permit) : null;
  const dallasRoofDiffer = permit ? dallasRoofPageCopy(city, permit) : null;
  const dallasHvacDiffer = permit ? dallasHvacPageCopy(city, permit) : null;
  const dallasKitchenDiffer = permit ? dallasKitchenPageCopy(city, permit) : null;
  const dallasDeckDiffer = permit ? dallasDeckPageCopy(city, permit) : null;
  const minneapolisRoofDiffer = permit ? minneapolisRoofPageCopy(city, permit) : null;
  const minneapolisHvacDiffer = permit ? minneapolisHvacPageCopy(city, permit) : null;
  const minneapolisDeckDiffer = permit ? minneapolisDeckPageCopy(city, permit) : null;
  const miamiRoofDiffer = permit ? miamiRoofPageCopy(city, permit) : null;
  const miamiHvacDiffer = permit ? miamiHvacPageCopy(city, permit) : null;
  const miamiKitchenDiffer = permit ? miamiKitchenPageCopy(city, permit) : null;
  const miamiDeckDiffer = permit ? miamiDeckPageCopy(city, permit) : null;
  const lasVegasDeckDiffer = permit ? lasVegasDeckPageCopy(city, permit) : null;
  const lasVegasRoofDiffer = permit ? lasVegasRoofPageCopy(city, permit) : null;
  const lasVegasHvacDiffer = permit ? lasVegasHvacPageCopy(city, permit) : null;
  const bostonRoofDiffer = permit ? bostonRoofPageCopy(city, permit) : null;
  const bostonHvacDiffer = permit ? bostonHvacPageCopy(city, permit) : null;
  const bostonKitchenDiffer = permit ? bostonKitchenPageCopy(city, permit) : null;
  const bostonDeckDiffer = permit ? bostonDeckPageCopy(city, permit) : null;
  const chicagoKitchenDiffer = permit ? chicagoKitchenPageCopy(city, permit) : null;
  const chicagoDeckDiffer = permit ? chicagoDeckPageCopy(city, permit) : null;
  let differ: string;
  if (fee != null && fee > 0 && denverDiffer) {
    differ = denverDiffer.differ;
  } else if (fee != null && fee > 0 && denverRoofDiffer) {
    differ = denverRoofDiffer.differ;
  } else if (fee != null && fee > 0 && denverDeckDiffer) {
    differ = denverDeckDiffer.differ;
  } else if (fee != null && fee > 0 && denverKitchenDiffer) {
    differ = denverKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && austinHvacDiffer) {
    differ = austinHvacDiffer.differ;
  } else if (fee != null && fee > 0 && austinKitchenDiffer) {
    differ = austinKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && austinDeckDiffer) {
    differ = austinDeckDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixRoofDiffer) {
    differ = phoenixRoofDiffer.differ;
  } else if (fee != null && fee > 0 && portlandRoofDiffer) {
    differ = portlandRoofDiffer.differ;
  } else if (fee != null && fee > 0 && portlandKitchenDiffer) {
    differ = portlandKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && portlandDeckDiffer) {
    differ = portlandDeckDiffer.differ;
  } else if (fee != null && fee > 0 && tucsonRoofDiffer) {
    differ = tucsonRoofDiffer.differ;
  } else if (fee != null && fee > 0 && tucsonHvacDiffer) {
    differ = tucsonHvacDiffer.differ;
  } else if (fee != null && fee > 0 && tucsonKitchenDiffer) {
    differ = tucsonKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && tucsonDeckDiffer) {
    differ = tucsonDeckDiffer.differ;
  } else if (fee != null && fee > 0 && raleighRoofDiffer) {
    differ = raleighRoofDiffer.differ;
  } else if (fee != null && fee > 0 && raleighHvacDiffer) {
    differ = raleighHvacDiffer.differ;
  } else if (fee != null && fee > 0 && raleighKitchenDiffer) {
    differ = raleighKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && raleighDeckDiffer) {
    differ = raleighDeckDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixHvacDiffer) {
    differ = phoenixHvacDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixKitchenDiffer) {
    differ = phoenixKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixDeckDiffer) {
    differ = phoenixDeckDiffer.differ;
  } else if (fee != null && fee > 0 && seattleHvacDiffer) {
    differ = seattleHvacDiffer.differ;
  } else if (fee != null && fee > 0 && seattleRoofDiffer) {
    differ = seattleRoofDiffer.differ;
  } else if (fee != null && fee > 0 && seattleDeckDiffer) {
    differ = seattleDeckDiffer.differ;
  } else if (fee != null && fee > 0 && seattleKitchenDiffer) {
    differ = seattleKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && charlotteHvacDiffer) {
    differ = charlotteHvacDiffer.differ;
  } else if (fee != null && fee > 0 && charlotteKitchenDiffer) {
    differ = charlotteKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && nashvilleDeckDiffer) {
    differ = nashvilleDeckDiffer.differ;
  } else if (fee != null && fee > 0 && nashvilleRoofDiffer) {
    differ = nashvilleRoofDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaRoofDiffer) {
    differ = atlantaRoofDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaHvacDiffer) {
    differ = atlantaHvacDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaDeckDiffer) {
    differ = atlantaDeckDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaKitchenDiffer) {
    differ = atlantaKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && memphisHvacDiffer) {
    differ = memphisHvacDiffer.differ;
  } else if (fee != null && fee > 0 && memphisKitchenDiffer) {
    differ = memphisKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && memphisDeckDiffer) {
    differ = memphisDeckDiffer.differ;
  } else if (fee != null && fee > 0 && houstonHvacDiffer) {
    differ = houstonHvacDiffer.differ;
  } else if (fee != null && fee > 0 && houstonDeckDiffer) {
    differ = houstonDeckDiffer.differ;
  } else if (fee != null && fee > 0 && philadelphiaRoofDiffer) {
    differ = philadelphiaRoofDiffer.differ;
  } else if (fee != null && fee > 0 && detroitRoofDiffer) {
    differ = detroitRoofDiffer.differ;
  } else if (fee != null && fee > 0 && dallasRoofDiffer) {
    differ = dallasRoofDiffer.differ;
  } else if (fee != null && fee > 0 && dallasHvacDiffer) {
    differ = dallasHvacDiffer.differ;
  } else if (fee != null && fee > 0 && dallasKitchenDiffer) {
    differ = dallasKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && dallasDeckDiffer) {
    differ = dallasDeckDiffer.differ;
  } else if (fee != null && fee > 0 && minneapolisRoofDiffer) {
    differ = minneapolisRoofDiffer.differ;
  } else if (fee != null && fee > 0 && minneapolisHvacDiffer) {
    differ = minneapolisHvacDiffer.differ;
  } else if (fee != null && fee > 0 && minneapolisDeckDiffer) {
    differ = minneapolisDeckDiffer.differ;
  } else if (fee != null && fee > 0 && miamiRoofDiffer) {
    differ = miamiRoofDiffer.differ;
  } else if (fee != null && fee > 0 && miamiHvacDiffer) {
    differ = miamiHvacDiffer.differ;
  } else if (fee != null && fee > 0 && miamiKitchenDiffer) {
    differ = miamiKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && miamiDeckDiffer) {
    differ = miamiDeckDiffer.differ;
  } else if (fee != null && fee > 0 && lasVegasDeckDiffer) {
    differ = lasVegasDeckDiffer.differ;
  } else if (fee != null && fee > 0 && lasVegasRoofDiffer) {
    differ = lasVegasRoofDiffer.differ;
  } else if (fee != null && fee > 0 && lasVegasHvacDiffer) {
    differ = lasVegasHvacDiffer.differ;
  } else if (fee != null && fee > 0 && bostonRoofDiffer) {
    differ = bostonRoofDiffer.differ;
  } else if (fee != null && fee > 0 && bostonHvacDiffer) {
    differ = bostonHvacDiffer.differ;
  } else if (fee != null && fee > 0 && bostonKitchenDiffer) {
    differ = bostonKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && chicagoKitchenDiffer) {
    differ = chicagoKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && chicagoDeckDiffer) {
    differ = chicagoDeckDiffer.differ;
  } else if (fee != null && fee > 0 && bostonDeckDiffer) {
    differ = bostonDeckDiffer.differ;
  } else if (fee != null && fee > 0) {
    differ =
      "The recorded " +
      label +
      " fee comes from " +
      (permit?.sourceName || "the official schedule on file");
    if (permit?.feeModel) differ += " (" + permit.feeModel.replace(/_/g, " ") + ")";
    differ += ".";
    if (calcFirst) differ += " " + calcFirst;
    else if (caveatFirst) differ += " " + caveatFirst;
    differ +=
      " Site conditions, extras not in the typical row, and schedule updates can change what you actually pay. Verify with " +
      dept +
      ".";
  } else if (fee === 0) {
    const austinDiffer = permit ? austinRoofPageCopy(city, permit) : null;
    const chicagoRoofDiffer = permit ? chicagoRoofPageCopy(city, permit) : null;
    const chicagoHvacDiffer = permit ? chicagoHvacPageCopy(city, permit) : null;
    if (charlotteRoofStatuteExempt(permit)) {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0 because a like-for-like single-family reroof at or under $40,000 is exempt under N.C.G.S. 160D-1110(c)(5). If the exemption does not apply, the recorded alternate is the LUESA Section II.A path in the calculation note on this page, and it is not folded into the typical $0. We do not invent a fee beyond that note, including for a job over $40,000.";
    } else if (austinDiffer) {
      differ = austinDiffer.differ;
    } else if (chicagoRoofDiffer) {
      differ = chicagoRoofDiffer.differ;
    } else if (chicagoHvacDiffer) {
      differ = chicagoHvacDiffer.differ;
    } else {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0.";
      if (caveatFirst) differ += " " + caveatFirst;
      differ +=
        " If your job is outside that exemption, the city may charge a different published line — we do not invent that dollar here.";
    }
  } else {
    differ =
      "We have not extracted a typical dollar from the official " +
      label +
      " schedule, so we do not show a fee.";
    if (caveatFirst) differ += " " + caveatFirst;
    else if (calcFirst) differ += " " + calcFirst;
    differ += " Confirm the current line with " + dept + ".";
  }

  const howMuch = moneyPageHowMuchFaq(city, project, permit);

  const items: FaqItem[] = [
    {
      question: howMuch.question,
      answer: asSentence(howMuch.answer),
    },
    {
      question: "Is a permit required for " + job + " in " + label + "?",
      answer: asSentence(requiredAnswer),
    },
    {
      question: "What is included in this " + job + " estimate for " + label + "?",
      answer: asSentence(included),
    },
    {
      question: "Why might the " + city.name + " permit fee differ from this typical figure?",
      answer: asSentence(differ),
    },
    ...extraPermitFaqItems(city, project, permit),
  ];

  return items.map((item) => ({
    question: keepHvac(item.question),
    answer: keepHvac(item.answer),
  }));
}

function extraNotes(permit: Permit): string[] {
  return (permit.extras || [])
    .map((e) => (e.note || "").trim())
    .filter(Boolean);
}

function extraBlob(permit: Permit): string {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(" ")),
  ].join(" ");
}

function matchingSentence(text: string, re: RegExp, which: "first" | "last" = "first"): string {
  const parts = text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const hits = parts.filter((p) => re.test(p));
  const hit = which === "last" ? hits[hits.length - 1] : hits[0];
  return hit ? asSentence(hit) : "";
}

function snippetFrom(text: string | null | undefined, re: RegExp, which: "first" | "last" = "first"): string {
  const t = (text || "").trim();
  if (!t || !re.test(t)) return "";
  return matchingSentence(t, re, which) || firstSentence(t);
}

/** Prefer extra notes, then calculation note, then caveat. Names are not used as copy. */
function firstMatchingSnippet(
  permit: Permit,
  re: RegExp,
  order: Array<"extras" | "calc" | "caveat"> = ["extras", "calc", "caveat"],
  which: "first" | "last" = "first",
): string {
  for (const key of order) {
    if (key === "extras") {
      for (const note of extraNotes(permit)) {
        const hit = snippetFrom(note, re, which);
        if (hit) return hit;
      }
    } else if (key === "calc") {
      const hit = snippetFrom(permit.calculationNote, re, which);
      if (hit) return hit;
    } else {
      const hit = snippetFrom(permit.caveat, re, which);
      if (hit) return hit;
    }
  }
  return "";
}

function matchingExtraNotes(permit: Permit, re: RegExp, max = 2): string {
  const out: string[] = [];
  for (const extra of permit.extras || []) {
    const name = (extra.name || "").trim();
    const note = (extra.note || "").trim();
    const text = [name, note].filter(Boolean).join(" ");
    if (!re.test(text)) continue;
    const bit = snippetFrom(note, re) || firstSentence(note || name);
    if (!bit) continue;
    if (name && !bit.toLowerCase().includes(name.toLowerCase().slice(0, 18))) {
      out.push(asSentence(name + ": " + bit.replace(/[.!?]$/, "")));
    } else {
      out.push(bit);
    }
    if (out.length >= max) break;
  }
  return out.join(" ");
}

function recordedValuationAnswer(permit: Permit): string {
  const assumed = permit.assumedValuationUsd;
  const bits: string[] = [];
  if (assumed) {
    if (typeof assumed.low === "number") bits.push("low " + usd(assumed.low));
    if (typeof assumed.typical === "number") bits.push("typical " + usd(assumed.typical));
    if (typeof assumed.high === "number") bits.push("high " + usd(assumed.high));
  }
  if (bits.length) return "Recorded assumed values: " + bits.join(", ") + ".";
  if (typeof permit.typicalProjectValueUsd === "number") {
    return "Recorded typical project value " + usd(permit.typicalProjectValueUsd) + ".";
  }
  return "";
}

/**
 * Extra FAQ items from recorded permit fields only. Calc note and assumed
 * valuation come first so they win the cap; then same-layout/cabinet-only
 * alternate paths, then exemption / STFI / Quick Permit / trades / plan
 * review / minimum-fee-only. Cap 3. Never invents fees.
 */
function extraPermitFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!permit) return [];

  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const extra: FaqItem[] = [];
  const push = (question: string, snippet: string, suffix?: string) => {
    if (!snippet && !suffix) return;
    extra.push({
      question: keepHvac(question),
      answer: asSentence([snippet, suffix].filter(Boolean).join(" ")),
    });
  };

  const denverSplit = denverHvacPageCopy(city, permit);
  if (denverSplit) {
    push(
      "How does the recorded Denver HVAC permit fee split between the mechanical permit, plan review, and a technology fee?",
      denverSplit.splitFaq,
    );
  }

  const austinKitchen = austinKitchenPageCopy(city, permit);
  if (austinKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "Why are low and high permit fees blank for " + job + " in " + label + "?",
      austinKitchen.omittedBandsFaq,
    );
    push(
      "Is the Express kitchen-remodel inspection included in the typical permit fee in " + label + "?",
      austinKitchen.expressFaq,
    );
    return extra.slice(0, 3);
  }

  const austinDeck = austinDeckPageCopy(city, permit);
  if (austinDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "Is the electric fee included in the typical permit fee for " + job + " in " + label + "?",
      austinDeck.electricFaq,
    );
    push(
      "Why does the work-exempt path not apply to a typical " + job + " in " + label + "?",
      austinDeck.exemptFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixRoof = phoenixRoofPageCopy(city, permit);
  if (phoenixRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const portlandRoof = portlandRoofPageCopy(city, permit);
  if (portlandRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      portlandRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      portlandRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const portlandKitchen = portlandKitchenPageCopy(city, permit);
  if (portlandKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      portlandKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      portlandKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const portlandDeck = portlandDeckPageCopy(city, permit);
  if (portlandDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      portlandDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      portlandDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const tucsonRoof = tucsonRoofPageCopy(city, permit);
  if (tucsonRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tucsonRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tucsonRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const tucsonHvac = tucsonHvacPageCopy(city, permit);
  if (tucsonHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tucsonHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tucsonHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const tucsonKitchen = tucsonKitchenPageCopy(city, permit);
  if (tucsonKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tucsonKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tucsonKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const tucsonDeck = tucsonDeckPageCopy(city, permit);
  if (tucsonDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tucsonDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tucsonDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const raleighRoof = raleighRoofPageCopy(city, permit);
  if (raleighRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      raleighRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      raleighRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const raleighKitchen = raleighKitchenPageCopy(city, permit);
  if (raleighKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      raleighKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      raleighKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const raleighDeck = raleighDeckPageCopy(city, permit);
  if (raleighDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      raleighDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      raleighDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const raleighHvac = raleighHvacPageCopy(city, permit);
  if (raleighHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      raleighHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      raleighHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixHvac = phoenixHvacPageCopy(city, permit);
  if (phoenixHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixKitchen = phoenixKitchenPageCopy(city, permit);
  if (phoenixKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixDeck = phoenixDeckPageCopy(city, permit);
  if (phoenixDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const seattleHvac = seattleHvacPageCopy(city, permit);
  if (seattleHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      seattleHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      seattleHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const seattleRoof = seattleRoofPageCopy(city, permit);
  if (seattleRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      seattleRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      seattleRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const seattleDeck = seattleDeckPageCopy(city, permit);
  if (seattleDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      seattleDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      seattleDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const seattleKitchen = seattleKitchenPageCopy(city, permit);
  if (seattleKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      seattleKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      seattleKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const charlotteHvac = charlotteHvacPageCopy(city, permit);
  if (charlotteHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      charlotteHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      charlotteHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const charlotteKitchen = charlotteKitchenPageCopy(city, permit);
  if (charlotteKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      charlotteKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      charlotteKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const nashvilleDeck = nashvilleDeckPageCopy(city, permit);
  if (nashvilleDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      nashvilleDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      nashvilleDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const nashvilleRoof = nashvilleRoofPageCopy(city, permit);
  if (nashvilleRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      nashvilleRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      nashvilleRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const memphisHvac = memphisHvacPageCopy(city, permit);
  if (memphisHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      memphisHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      memphisHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const memphisKitchen = memphisKitchenPageCopy(city, permit);
  if (memphisKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      memphisKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      memphisKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const denverDeck = denverDeckPageCopy(city, permit);
  if (denverDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      denverDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      denverDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const denverKitchen = denverKitchenPageCopy(city, permit);
  if (denverKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      denverKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      denverKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const houstonHvac = houstonHvacPageCopy(city, permit);
  if (houstonHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      houstonHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      houstonHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const houstonDeck = houstonDeckPageCopy(city, permit);
  if (houstonDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      houstonDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      houstonDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const philadelphiaRoof = philadelphiaRoofPageCopy(city, permit);
  if (philadelphiaRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      philadelphiaRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      philadelphiaRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const detroitRoof = detroitRoofPageCopy(city, permit);
  if (detroitRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      detroitRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      detroitRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const dallasRoof = dallasRoofPageCopy(city, permit);
  if (dallasRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      dallasRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      dallasRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const dallasHvac = dallasHvacPageCopy(city, permit);
  if (dallasHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      dallasHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      dallasHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const dallasKitchen = dallasKitchenPageCopy(city, permit);
  if (dallasKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      dallasKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      dallasKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const dallasDeck = dallasDeckPageCopy(city, permit);
  if (dallasDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      dallasDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      dallasDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const minneapolisRoof = minneapolisRoofPageCopy(city, permit);
  if (minneapolisRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      minneapolisRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      minneapolisRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const minneapolisHvac = minneapolisHvacPageCopy(city, permit);
  if (minneapolisHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      minneapolisHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      minneapolisHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const minneapolisDeck = minneapolisDeckPageCopy(city, permit);
  if (minneapolisDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      minneapolisDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      minneapolisDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const miamiRoof = miamiRoofPageCopy(city, permit);
  if (miamiRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      miamiRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      miamiRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const miamiHvac = miamiHvacPageCopy(city, permit);
  if (miamiHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      miamiHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      miamiHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const miamiKitchen = miamiKitchenPageCopy(city, permit);
  if (miamiKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      miamiKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      miamiKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const miamiDeck = miamiDeckPageCopy(city, permit);
  if (miamiDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      miamiDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      miamiDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const lasVegasDeck = lasVegasDeckPageCopy(city, permit);
  if (lasVegasDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      lasVegasDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      lasVegasDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const lasVegasRoof = lasVegasRoofPageCopy(city, permit);
  if (lasVegasRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      lasVegasRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      lasVegasRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const lasVegasHvac = lasVegasHvacPageCopy(city, permit);
  if (lasVegasHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      lasVegasHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      lasVegasHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const chicagoRoof = chicagoRoofPageCopy(city, permit);
  if (chicagoRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      chicagoRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      chicagoRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      chicagoRoof.exemptionFaq,
      "The $450, $175, and $900 lines stay extras and are not part of the typical $0.",
    );
    return extra.slice(0, 3);
  }
  const chicagoHvac = chicagoHvacPageCopy(city, permit);
  if (chicagoHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      chicagoHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      chicagoHvac.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      chicagoHvac.exemptionFaq,
      "The $75 and $150 lines stay extras and are not part of the typical $0.",
    );
    return extra.slice(0, 3);
  }
  const chicagoKitchen = chicagoKitchenPageCopy(city, permit);
  if (chicagoKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      chicagoKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      chicagoKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const chicagoDeck = chicagoDeckPageCopy(city, permit);
  if (chicagoDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      chicagoDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      chicagoDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const bostonRoof = bostonRoofPageCopy(city, permit);
  if (bostonRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      bostonRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      bostonRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const bostonHvac = bostonHvacPageCopy(city, permit);
  if (bostonHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      bostonHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      bostonHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const bostonKitchen = bostonKitchenPageCopy(city, permit);
  if (bostonKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      bostonKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      bostonKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }
  const bostonDeck = bostonDeckPageCopy(city, permit);
  if (bostonDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      bostonDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      bostonDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const memphisDeck = memphisDeckPageCopy(city, permit);
  if (memphisDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      memphisDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      memphisDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const atlantaRoof = atlantaRoofPageCopy(city, permit);
  if (atlantaRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      atlantaRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      atlantaRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const atlantaHvac = atlantaHvacPageCopy(city, permit);
  if (atlantaHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      atlantaHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      atlantaHvac.valuationFaq,
    );
    push(
      "Are electrical, plumbing, or other trade permits included in this " +
        job +
        " typical for " +
        label +
        "?",
      atlantaHvac.tradeFaq,
    );
    return extra.slice(0, 3);
  }

  const atlantaDeck = atlantaDeckPageCopy(city, permit);
  if (atlantaDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      atlantaDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      atlantaDeck.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const atlantaKitchen = atlantaKitchenPageCopy(city, permit);
  if (atlantaKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      atlantaKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      atlantaKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const austinRoof = austinRoofPageCopy(city, permit);
  if (austinRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      austinRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      austinRoof.exemptionFaq,
      "We do not invent an alternate fee beyond the recorded Express and Fire lines.",
    );
    return extra.slice(0, 3);
  }

  const calcNote = (permit.calculationNote || "").trim();
  if (calcNote) {
    // Full recorded note (incl. low/high bands) — not only the first sentence.
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      calcNote,
      "We do not invent fees beyond the recorded note.",
    );
  }

  const valuation = recordedValuationAnswer(permit);
  if (valuation) {
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      valuation,
    );
  } else if (project.projectSlug === "roof-replacement" && isPublishedMinimumFloor(permit)) {
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      publishedMinimumValuationAnswer(permit, shortDeptName(city)),
    );
  }

  const earlyBlob = extraBlob(permit);
  if (/same-layout|cabinet-only|cosmetic/i.test(earlyBlob)) {
    push(
      "Does every " + job + " in " + label + " need a building permit?",
      firstMatchingSnippet(
        permit,
        /same-layout|cabinet-only|cosmetic|may not need/i,
        ["caveat", "extras", "calc"],
      ) || firstSentence(permit.caveat || ""),
      "Confirm the live path with " + city.permitDeptName + ".",
    );
  }

  const blob = extraBlob(permit);
  if (!blob.trim()) return extra.slice(0, 3);

  const exemption =
    (permit.feeTypicalUsd === 0 || permit.permitRequired === false) && /\bexempt/i.test(blob);
  const stfi = /\bstfi\b/i.test(blob);
  const quickPermit = /quick permit/i.test(blob);
  const trades = /\btrades?\b/i.test(blob) || (/electrical/i.test(blob) && /plumbing/i.test(blob));
  const planReview = /plan review/i.test(blob);
  const minimumOnly =
    /minimum/i.test(blob) &&
    (/\bonly\b/i.test(blob) || /not extracted/i.test(blob) || /published (city )?minimum/i.test(blob));

  if (exemption) {
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      charlotteRoofStatuteExempt(permit)
        ? "The recorded typical path is $0 under N.C.G.S. 160D-1110(c)(5) for a like-for-like single-family reroof at or under $40,000. NC OSFM guidance (10/19/2023) reads that exemption as roofing replacement plus up to 15% of the existing roof deck."
        : firstMatchingSnippet(permit, /\bexempt/i, ["calc", "caveat", "extras"]) ||
            firstSentence(permit.caveat || ""),
      charlotteRoofStatuteExempt(permit)
        ? "The recorded alternate if the exemption does not apply is the LUESA Section II.A path in the calculation note, and it is not part of the typical $0."
        : "We do not invent an alternate fee if the exemption does not apply.",
    );
  }

  if (stfi) {
    push(
      "What is the STFI path for " + job + " in " + label + "?",
      firstMatchingSnippet(permit, /\bstfi\b/i, ["extras", "caveat", "calc"], "last"),
    );
  }

  if (quickPermit) {
    push(
      "Does a typical " + job + " in " + label + " use a Quick Permit?",
      firstMatchingSnippet(permit, /quick permit/i, ["caveat", "extras", "calc"]),
    );
  }

  if (trades) {
    const tradeNameRe = /\btrades?\b|electrical|plumbing|mechanical/i;
    const unpriced = (permit.extras || []).filter((e) => {
      const name = (e.name || "").trim();
      if (!tradeNameRe.test(name)) return false;
      return e.feeUsd == null && e.amountUsd == null;
    });
    const suffix = unpriced.length
      ? unpriced.map((e) => e.name).filter(Boolean).join("; ") +
        " amounts are not recorded on this row, so they are not added into the typical."
      : "";
    const namedTradeNotes = (permit.extras || [])
      .filter((e) => tradeNameRe.test((e.name || "").trim()))
      .map((e) => {
        const name = (e.name || "").trim();
        const note = (e.note || "").trim();
        if (note) return asSentence(name ? name + ": " + note.replace(/[.!?]$/, "") : note);
        return name ? asSentence(name) : "";
      })
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    push(
      "Are electrical, plumbing, or other trade permits included in this " +
        job +
        " typical for " +
        label +
        "?",
      namedTradeNotes ||
        matchingExtraNotes(permit, /\btrades?\b/i) ||
        firstMatchingSnippet(permit, /\btrades?\b/i, ["caveat", "extras", "calc"]) ||
        firstMatchingSnippet(permit, /electrical|plumbing/i, ["caveat", "extras", "calc"]),
      suffix,
    );
  }

  if (planReview) {
    const planSnippet =
      firstMatchingSnippet(permit, /if plans are required/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /plan review exempt/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /full plan review/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /no plan review/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /plan review/i, ["caveat", "extras", "calc"], "last");
    push(
      "Is plan review included in the typical " + job + " permit for " + label + "?",
      planSnippet,
    );
  }

  if (minimumOnly) {
    push(
      "Is the recorded " +
        label +
        " " +
        job +
        " fee the full schedule or only the published minimum?",
      firstMatchingSnippet(permit, /minimum/i, ["caveat", "extras", "calc"]),
    );
  }

  return extra.slice(0, denverSplit ? 4 : 3);
}
