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
  denverHvacPageCopy,
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
  charlotteHvacPageCopy,
  nashvilleDeckPageCopy,
  nashvilleRoofPageCopy,
  atlantaRoofPageCopy,
  atlantaHvacPageCopy,
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
  const charlotteHvacPath = charlotteHvacPageCopy(city, permit);
  const nashvilleDeckPath = nashvilleDeckPageCopy(city, permit);
  const nashvilleRoofPath = nashvilleRoofPageCopy(city, permit);
  const atlantaRoofPath = atlantaRoofPageCopy(city, permit);
  const atlantaHvacPath = atlantaHvacPageCopy(city, permit);
  const memphisHvacPath = memphisHvacPageCopy(city, permit);
  const memphisKitchenPath = memphisKitchenPageCopy(city, permit);
  const memphisDeckPath = memphisDeckPageCopy(city, permit);
  const rowVal = permit?.assumedValuationUsd;
  const rowHasValuation = permitRowRecordsValuation(permit);
  const typicalVal = rowHasValuation
    ? (rowVal?.typical ?? permit?.typicalProjectValueUsd ?? sourcesVal?.typical ?? null)
    : null;
  const lowVal = rowHasValuation ? (rowVal?.low ?? sourcesVal?.low ?? null) : null;
  const highVal = rowHasValuation ? (rowVal?.high ?? sourcesVal?.high ?? null) : null;

  if (permit && !rowHasValuation && isPublishedMinimumFloor(permit) && !atlantaRoofPath && !atlantaHvacPath) {
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
    !charlotteHvacPath &&
    !nashvilleDeckPath &&
    !nashvilleRoofPath &&
    !atlantaRoofPath &&
    !atlantaHvacPath &&
    !memphisHvacPath &&
    !memphisKitchenPath &&
    !memphisDeckPath
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
  if (charlotteHvacPath) out.push(charlotteHvacPath.assumption);
  if (nashvilleDeckPath) out.push(nashvilleDeckPath.assumption);
  if (nashvilleRoofPath) out.push(nashvilleRoofPath.assumption);
  if (atlantaRoofPath) out.push(atlantaRoofPath.assumption);
  if (atlantaHvacPath) out.push(atlantaHvacPath.assumption);
  if (memphisHvacPath) out.push(memphisHvacPath.assumption);
  if (memphisKitchenPath) out.push(memphisKitchenPath.assumption);
  if (memphisDeckPath) out.push(memphisDeckPath.assumption);

  // Charlotte roof already explains the exemption in Why costs differ.
  // Pasting the full calculation note here repeats the LUESA wall.
  // Austin roof, HVAC, kitchen, and deck, Denver HVAC, Denver roof, Phoenix
  // roof, HVAC, kitchen, and deck, Tucson roof, Tucson HVAC, Tucson kitchen, Tucson deck, Portland roof, Portland kitchen, Portland deck, Raleigh roof, Raleigh HVAC, Raleigh kitchen, Raleigh deck, Seattle HVAC, Charlotte HVAC, Nashville deck, Nashville roof, Atlanta roof, Atlanta HVAC, Memphis HVAC, Memphis kitchen, and Memphis deck keep a short assumption.
  // The full note stays on the permit callout and the fee-model callout.
  // How-calculated summarizes and points at that note so assumptions and
  // why-costs do not repeat the wall.
  // Seattle roof and Denver deck still paste the note.
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
      !charlotteHvacPath &&
      !nashvilleDeckPath &&
      !nashvilleRoofPath &&
      !atlantaRoofPath &&
      !atlantaHvacPath &&
      !memphisHvacPath &&
      !memphisKitchenPath &&
      !memphisDeckPath
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
  return {
    kind: "known",
    typicalUsd: fee,
    lowUsd: low,
    highUsd: high,
    rangeLabel:
      portlandRoof?.rangeExact ??
      portlandKitchen?.rangeExact ??
      portlandDeck?.rangeExact ??
      (showRange
        ? (tucsonRoof?.rangeExact ??
          tucsonHvac?.rangeExact ??
          tucsonKitchen?.rangeExact ??
          tucsonDeck?.rangeExact ??
          raleighKitchen?.rangeExact ??
          usdRange(low, high))
        : null),
    typicalLabel:
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
    if (charlotteRoofStatuteExempt(permit)) {
      requiredAnswer +=
        " A like-for-like single-family reroof at or under $40,000 does not require a building permit under N.C.G.S. 160D-1110(c)(5).";
    } else if (austinRequired) {
      requiredAnswer += " " + austinRequired.requiredClause;
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
    const charlotteHvacRequired = permit ? charlotteHvacPageCopy(city, permit) : null;
    const nashvilleDeckRequired = permit ? nashvilleDeckPageCopy(city, permit) : null;
    const nashvilleRoofRequired = permit ? nashvilleRoofPageCopy(city, permit) : null;
    const atlantaRoofRequired = permit ? atlantaRoofPageCopy(city, permit) : null;
    const atlantaHvacRequired = permit ? atlantaHvacPageCopy(city, permit) : null;
    if (fee != null && fee > 0 && austinKitchenRequired) {
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
    }
    if (denverRequired) requiredAnswer += " " + denverRequired.requiredClause;
    else if (denverRoofRequired) requiredAnswer += " " + denverRoofRequired.requiredClause;
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
    else if (charlotteHvacRequired) requiredAnswer += " " + charlotteHvacRequired.requiredClause;
    else if (nashvilleDeckRequired) requiredAnswer += " " + nashvilleDeckRequired.requiredClause;
    else if (nashvilleRoofRequired) requiredAnswer += " " + nashvilleRoofRequired.requiredClause;
    else if (atlantaRoofRequired) requiredAnswer += " " + atlantaRoofRequired.requiredClause;
    else if (atlantaHvacRequired) requiredAnswer += " " + atlantaHvacRequired.requiredClause;
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
  const charlotteHvacIncluded = permit ? charlotteHvacPageCopy(city, permit) : null;
  const nashvilleDeckIncluded = permit ? nashvilleDeckPageCopy(city, permit) : null;
  const nashvilleRoofIncluded = permit ? nashvilleRoofPageCopy(city, permit) : null;
  const atlantaRoofIncluded = permit ? atlantaRoofPageCopy(city, permit) : null;
  const atlantaHvacIncluded = permit ? atlantaHvacPageCopy(city, permit) : null;
  if (fee != null && fee > 0) {
    const shownFee = austinKitchenIncluded
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
                          : usd(fee);
    included +=
      " The recorded typical permit fee of " +
      shownFee +
      " is included in the all-in typical.";
    if (denverIncluded) included += " " + denverIncluded.includedClause;
    else if (denverRoofIncluded) included += " " + denverRoofIncluded.includedClause;
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
    else if (charlotteHvacIncluded) included += " " + charlotteHvacIncluded.includedClause;
    else if (nashvilleDeckIncluded) included += " " + nashvilleDeckIncluded.includedClause;
    else if (nashvilleRoofIncluded) included += " " + nashvilleRoofIncluded.includedClause;
    else if (atlantaRoofIncluded) included += " " + atlantaRoofIncluded.includedClause;
    else if (atlantaHvacIncluded) included += " " + atlantaHvacIncluded.includedClause;
  } else if (fee === 0) {
    included +=
      " The permit line is $0 on the typical path, so all-in is the job cost.";
    const austinIncluded = permit ? austinRoofPageCopy(city, permit) : null;
    if (austinIncluded) included += " " + austinIncluded.includedClause;
  } else {
    included +=
      " The permit line is blank, so the all-in figure is job cost only — we do not guess a city fee.";
  }

  const denverDiffer = permit ? denverHvacPageCopy(city, permit) : null;
  const denverRoofDiffer = permit ? denverRoofPageCopy(city, permit) : null;
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
  const charlotteHvacDiffer = permit ? charlotteHvacPageCopy(city, permit) : null;
  const nashvilleDeckDiffer = permit ? nashvilleDeckPageCopy(city, permit) : null;
  const nashvilleRoofDiffer = permit ? nashvilleRoofPageCopy(city, permit) : null;
  const atlantaRoofDiffer = permit ? atlantaRoofPageCopy(city, permit) : null;
  const atlantaHvacDiffer = permit ? atlantaHvacPageCopy(city, permit) : null;
  const memphisHvacDiffer = permit ? memphisHvacPageCopy(city, permit) : null;
  const memphisKitchenDiffer = permit ? memphisKitchenPageCopy(city, permit) : null;
  const memphisDeckDiffer = permit ? memphisDeckPageCopy(city, permit) : null;
  let differ: string;
  if (fee != null && fee > 0 && denverDiffer) {
    differ = denverDiffer.differ;
  } else if (fee != null && fee > 0 && denverRoofDiffer) {
    differ = denverRoofDiffer.differ;
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
  } else if (fee != null && fee > 0 && charlotteHvacDiffer) {
    differ = charlotteHvacDiffer.differ;
  } else if (fee != null && fee > 0 && nashvilleDeckDiffer) {
    differ = nashvilleDeckDiffer.differ;
  } else if (fee != null && fee > 0 && nashvilleRoofDiffer) {
    differ = nashvilleRoofDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaRoofDiffer) {
    differ = atlantaRoofDiffer.differ;
  } else if (fee != null && fee > 0 && atlantaHvacDiffer) {
    differ = atlantaHvacDiffer.differ;
  } else if (fee != null && fee > 0 && memphisHvacDiffer) {
    differ = memphisHvacDiffer.differ;
  } else if (fee != null && fee > 0 && memphisKitchenDiffer) {
    differ = memphisKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && memphisDeckDiffer) {
    differ = memphisDeckDiffer.differ;
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
    if (charlotteRoofStatuteExempt(permit)) {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0 because a like-for-like single-family reroof at or under $40,000 is exempt under N.C.G.S. 160D-1110(c)(5). If the exemption does not apply, the recorded alternate is the LUESA Section II.A path in the calculation note on this page, and it is not folded into the typical $0. We do not invent a fee beyond that note, including for a job over $40,000.";
    } else if (austinDiffer) {
      differ = austinDiffer.differ;
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
