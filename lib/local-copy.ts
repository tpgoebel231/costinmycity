import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd, usdRange } from "@/lib/format";
import { projectMeta, shortProjectName } from "@/lib/projects";
import { ROOF_SQUARES, roofSquaresPhrase } from "@/lib/roof-size";
import { moneyPageHowMuchFaq } from "@/lib/money-page-seo";
import { keepHvac } from "@/lib/seo";
import {
  isPublishedMinimumFloor,
  permitRowRecordsValuation,
  publishedMinimumValuationAnswer,
} from "@/lib/permit-valuation";
import { shortCalcNoteForProse } from "@/lib/short-calc-note";
import { moneyExact, shortDeptName } from "@/lib/sourcing";
import { assumedValuation, typicalJobSpec } from "@/lib/typical-specs";
import {
  austinDeckPageCopy,
  austinHvacPageCopy,
  austinKitchenPageCopy,
  austinRoofCalculationNoteOk,
  austinRoofPageCopy,
  tacomaRoofCalculationNoteOk,
  tacomaRoofPageCopy,
  stLouisRoofCalculationNoteOk,
  stLouisRoofPageCopy,
  stLouisRoofWageOk,
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
import type { City, CostSource, Permit, ProjectCost } from "@/lib/types";

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

/**
 * People-Also-Ask entries for the Charlotte roof page only.
 * Dollars come from buildEstimate and the recorded permit row.
 * Returns [] if those anchors drift, so the page does not invent a figure.
 */
function charlotteRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (city.slug !== "charlotte-nc" || project.projectSlug !== "roof-replacement" || !permit) return [];
  if (!charlotteRoofStatuteExempt(permit)) return [];
  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return [];
  if (permit.feeLowUsd !== 0 || permit.feeTypicalUsd !== 0 || permit.feeHighUsd !== 0) return [];

  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return [];
  if (permit.typicalProjectValueUsd !== 12000) return [];

  const building = (permit.extras || []).find((e) => /valuation building permit/i.test(e.name || ""));
  const tech = (permit.extras || []).find((e) => /technology charge/i.test(e.name || ""));
  if (building?.feeUsd !== 169.41 || tech?.feeUsd !== 3) return [];

  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return [];
  if (!/steep or premium materials/i.test(scope)) return [];

  const label = cityLabel(city);
  const typicalSquares = meta.defaultQuantity;
  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(typicalSquares);
  const atLow = at(ROOF_SQUARES.low);
  const nearestHigh = at(ROOF_SQUARES.high);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(typicalSquares) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    typicalSquares +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. The recorded permit on the typical path is $0, so those figures are the job cost. The nearest table rows are " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(nearestHigh.allInTypical) +
    " typical and " +
    roofSquaresPhrase(typicalSquares) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(typicalSquares) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. $30,000 is above that typical of " +
    usd(atTypical.allInTypical) +
    ". Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials; wage-indexed for " +
    city.name +
    " that is " +
    usd(atTypical.allInHigh) +
    " at " +
    typicalSquares +
    " squares, and $30,000 sits inside it.";
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      " On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is far larger than a typical 13 to 18 square house roof.";
  }
  tooMuch +=
    " A like-for-like single-family reroof at $30,000 is still at or under $40,000, so N.C.G.S. 160D-1110(c)(5) still applies and the recorded typical permit fee stays $0. Above $40,000 that exemption no longer applies.";

  const permitAnswer =
    "On the typical path, no. N.C.G.S. 160D-1110(c)(5) does not require a building permit for a like-for-like single-family reroof costing $40,000 or less, and the recorded typical fee is $0. NC OSFM guidance (10/19/2023) reads that exemption as roofing replacement plus up to 15% of the existing roof deck. A permit is required when the cost is over $40,000, when load-bearing work goes beyond that deck allowance, or when new roofing is added. If a permit is issued, LUESA Section II.A for projects not requiring plan review is $59.70 plus $12.19 per $1,000 or part over $3,000, plus a $3 technology charge. At the recorded $12,000 valuation that is $59.70 + $12.19 x 9 = $169.41, then $169.41 + $3 = $172.41. Low $8,000 is $123.65 and high $22,000 is $294.31. Those alternate dollars are not included in the typical $0.";

  // atLow is computed so a drift in the low band fails closed if the table qty changes.
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
  ];
}

const DENVER_ROOF_HAIL_RETRIEVED = "2026-10-06";

const DENVER_ROOF_HAIL_SOURCES: CostSource[] = [
  {
    name: "IBHS Roof 101 (UL 2218 impact-resistance classes)",
    url: "https://ibhs.org/roof-101/",
    retrievedDate: DENVER_ROOF_HAIL_RETRIEVED,
    what:
      "UL 2218 Class 4 is the 2.00 in. steel-ball class. A product passes a class when two impacts in the same spot leave no crack on the back of the shingle. The labels cover new products and do not account for weathering, temperature, or aging.",
  },
  {
    name: "NOAA National Severe Storms Laboratory, Severe Weather 101: Hail Basics",
    url: "https://www.nssl.noaa.gov/education/svrwx101/hail/",
    retrievedDate: DENVER_ROOF_HAIL_RETRIEVED,
    what:
      "Colorado, Nebraska, and Wyoming usually have the most hailstorms. The area where those three states meet, which NSSL calls hail alley, averages seven to nine hail days per year.",
  },
  {
    name: "Colorado Division of Insurance consumer advisory (May 31, 2024)",
    url: "https://doi.colorado.gov/news-releases-consumer-advisories/consumer-advisory-division-of-insurance-shares-tips-after",
    retrievedDate: DENVER_ROOF_HAIL_RETRIEVED,
    what:
      "Hail is a common threat in Colorado in the warmer months. After a hailstorm across the Denver metro area, the Insurance Commissioner said to ask whether premium discounts or future deductible savings may be available for hail-resistant roof material. The advisory does not set a discount amount.",
  },
  {
    name: "Denver CPD roofing guidelines and checklist",
    url: "https://www.denvergov.org/files/assets/public/v/4/community-planning-and-development/documents/ds/inspections/roofing_guidelines_and_checklist.pdf",
    retrievedDate: DENVER_ROOF_HAIL_RETRIEVED,
    what:
      "Existing roofs must be removed to the deck where two or more layers of any roof covering exist. A roof covering is removed down to the deck unless the work is re-covering a single layer (IRC R908.1). The guide's repair-permit thresholds are 10% or 5% of roof area.",
  },
];

function usdCents(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Denver roof People-Also-Ask entries.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded row.
 * Returns [] if those anchors drift.
 * Lifespan is omitted: no public source states a Colorado service life we can cite.
 * A "25% rule" FAQ is omitted: Denver's roofing guide and IRC R908.1 do not state one.
 */
function denverRoofAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "denver-co" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 83 || permit.feeTypicalUsd !== 115 || permit.feeHighUsd !== 195) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  const building = extras.find((e) => /building permit/i.test(e.name || ""));
  const plan = extras.find((e) => /plan review/i.test(e.name || ""));
  if (!building || building.feeUsd !== 115) return false;
  if (!plan || plan.feeUsd != null) return false;
  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;
  const note = permit.calculationNote || "";
  if (!/building permit only on the Quick Permit path/i.test(note)) return false;
  if (!/Alternate non[\u2013-]Quick Permit path/.test(note)) return false;
  if (!note.includes("$57.50") || !note.includes("$172.50")) return false;
  if (!/not used in the recorded typical\/low\/high/.test(note)) return false;
  return true;
}

function denverRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!denverRoofAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atLow.permitTypical !== permit.feeTypicalUsd) return [];
  if (atTypical.permitTypical !== permit.feeTypicalUsd) return [];
  if (atHigh.permitTypical !== permit.feeTypicalUsd) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);
  const planLow = permit.feeLowUsd * 0.5;
  const planTypical = permit.feeTypicalUsd * 0.5;
  const planHigh = permit.feeHighUsd * 0.5;
  if (planTypical !== 57.5 || planLow !== 41.5 || planHigh !== 97.5) return [];

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const hailAnswer =
    "Class 4 is the highest class IBHS lists for UL 2218, the steel-ball impact test from Underwriters Laboratories. IBHS says the test drops steel balls from a fixed height to replicate the kinetic energy of hailstones, and that a product passes a class when two impacts in the same spot leave no crack on the back of the shingle. IBHS lists Class 4 as the 2.00 inch classification. IBHS also says these labels cover new products and do not account for weathering, temperature, or aging, and that impact-resistant labeled shingles are expected to perform better in hailstorms. NOAA's National Severe Storms Laboratory says Colorado, Nebraska, and Wyoming usually have the most hailstorms. The laboratory calls the area where those three states meet hail alley, and says that area averages seven to nine hail days a year. The Colorado Division of Insurance calls hail a common threat in the warmer months. Its May 31, 2024 advisory followed a hailstorm that rolled across the Denver metro area. In that advisory, the Insurance Commissioner said to ask your insurance company or agent what premium discounts or future deductible savings may be available if you replace a roof with hail-resistant material. The advisory does not set a discount percentage, and this page does not either. Sources: IBHS Roof 101 (https://ibhs.org/roof-101/); NOAA National Severe Storms Laboratory, Severe Weather 101: Hail Basics (https://www.nssl.noaa.gov/education/svrwx101/hail/); Colorado Division of Insurance consumer advisory, May 31, 2024 (https://doi.colorado.gov/news-releases-consumer-advisories/consumer-advisory-division-of-insurance-shares-tips-after).";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee stays " +
    usd(permit.feeTypicalUsd) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the roof size changes. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is outside the about 13 to 18 squares this page uses for a typical house. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    usd(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    usd(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    usd(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $30,000 is above that recorded high valuation, so this row does not list a permit fee for a $30,000 project value. The all-in figures add the recorded typical permit of " +
    usd(permit.feeTypicalUsd) +
    ". They do not look up a new ADMIN 138 fee at $30,000.";

  const permitAnswer =
    "Yes. " +
    city.permitDeptName +
    " requires a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    usd(permit.feeTypicalUsd) +
    ". The typical path is the Quick Permit / roof covering path: the ADMIN 138 building permit only, with no plan review. The recorded typical project value is " +
    usd(assumed.typical) +
    ", and the building fee at that valuation is " +
    usd(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a building fee of " +
    usd(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a building fee of " +
    usd(permit.feeHighUsd) +
    ". Those three totals are the building permit only on the Quick Permit path. CPD lists roofing as a Quick Permit type, so plan review is left off even when the valuation is over $2,000. If plans are required, the alternate non\u2013Quick Permit path adds 50% of the permit fee. At the typical valuation that is " +
    usd(permit.feeTypicalUsd) +
    " + " +
    usdCents(planTypical) +
    " = " +
    usdCents(permit.feeTypicalUsd + planTypical) +
    ". Low would be " +
    usd(permit.feeLowUsd) +
    " + " +
    usdCents(planLow) +
    " = " +
    usdCents(permit.feeLowUsd + planLow) +
    ", and high would be " +
    usd(permit.feeHighUsd) +
    " + " +
    usdCents(planHigh) +
    " = " +
    usdCents(permit.feeHighUsd + planHigh) +
    ". Those alternate figures are not used in the recorded typical, low, or high. The recorded typical stays " +
    usd(permit.feeTypicalUsd) +
    ".";

  const tearOffAnswer =
    "Where two or more layers are already on the roof, Denver's published roofing guide says yes. Denver Community Planning and Development's roofing guidelines and checklist says existing roofs must be removed to the deck and replaced where two or more layers of any roof covering exist. The same guide says a roof covering must be removed down to the deck unless the work is re-covering a single layer, and it cites IRC R908.1. A repair is a smaller scope than a full replacement. The guide says a repair needs a permit when it is more than 10% of the roof square footage or two roof squares (200 sq ft of roof surface), whichever is smaller, on a building under 25,000 square feet. On a building of 25,000 square feet or more, the guide's repair threshold is more than 5% of the roof square footage or two roof squares, whichever is smaller. The 25,000 square foot figure in that guide is the square footage of the entire building, not roof surface. Source: Denver CPD roofing guidelines and checklist (https://www.denvergov.org/files/assets/public/v/4/community-planning-and-development/documents/ds/inspections/roofing_guidelines_and_checklist.pdf).";

  return [
    {
      question: "What is a Class 4 impact-resistant roof, and how does hail figure in " + city.name + "?",
      answer: asSentence(hailAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "Does a roof replacement in " + city.name + " have to be torn off to the deck?",
      answer: asSentence(tearOffAnswer),
    },
  ];
}

/** Citations for the Denver roof hail / Class 4 FAQ. Empty on every other page. */
export function denverRoofHailSources(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): CostSource[] {
  if (!denverRoofAnchors(city, project, permit)) return [];
  return DENVER_ROOF_HAIL_SOURCES;
}

const PHOENIX_ROOF_PERMIT_RETRIEVED = "2026-10-06";

const PHOENIX_ROOF_PERMIT_SOURCES: CostSource[] = [
  {
    name: "City of Phoenix Planning & Development, Work Exempt from Permit (TRT/DOC/00618, Rev. 07/14)",
    url: "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00618.pdf",
    retrievedDate: PHOENIX_ROOF_PERMIT_RETRIEVED,
    what:
      "Phoenix Building Construction Code Section 105.2.1 item 16: re-roofing with the same type of material as the original roofing, provided not more than two layers of asphalt shingles are applied over an existing asphalt shingle roof. The commentary says item 16 is exempt only for certain occupancies and does not name them.",
  },
  {
    name: "City of Phoenix Planning & Development, How to Obtain a Residential Building Permit (Rev. 2/20)",
    url: "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00823.pdf",
    retrievedDate: PHOENIX_ROOF_PERMIT_RETRIEVED,
    what:
      "A residential permit is needed for roofline extensions and for replacing wood or asphalt shingles with a tile roof. A permit is not needed to re-shingle or re-tile with the same material, if not more than two layers of asphalt shingles are placed over an existing asphalt shingle roof.",
  },
];

/**
 * Table A building-permit portion from Ordinance G-7465.
 * $1,001 to $10,000: $195 on the first $1,000 plus $12 per additional $1,000 or fraction.
 * $10,001 to $50,000: $303 on the first $10,000 plus $10 per additional $1,000 or fraction.
 * Returns null outside those two bands.
 */
function phoenixTableABuildingFee(valuation: number): number | null {
  if (valuation >= 1001 && valuation <= 10000) {
    const steps = Math.ceil((valuation - 1000) / 1000);
    return 195 + steps * 12;
  }
  if (valuation >= 10001 && valuation <= 50000) {
    const steps = Math.ceil((valuation - 10000) / 1000);
    return 303 + steps * 10;
  }
  return null;
}

/**
 * Phoenix roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded row
 * and from Table A only when that table reproduces the recorded totals.
 * Returns false if those anchors drift.
 */
function phoenixRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 558 || permit.feeTypicalUsd !== 646 || permit.feeHighUsd !== 846) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan?.name || "") || plan?.feeUsd !== 323) return false;
  const planNote = plan?.note || "";
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;
  if (!/bundles trades into one building permit/.test(permit.caveat || "")) return false;

  const buildingLow = phoenixTableABuildingFee(assumed.low);
  const buildingTypical = phoenixTableABuildingFee(assumed.typical);
  const buildingHigh = phoenixTableABuildingFee(assumed.high);
  const buildingJustOver = phoenixTableABuildingFee(5001);
  const buildingSix = phoenixTableABuildingFee(6000);
  if (buildingLow !== 279 || buildingTypical !== 323 || buildingHigh !== 423) return false;
  if (buildingJustOver !== 255 || buildingSix !== 255) return false;
  if (buildingLow * 2 !== permit.feeLowUsd) return false;
  if (buildingTypical * 2 !== permit.feeTypicalUsd) return false;
  if (buildingHigh * 2 !== permit.feeHighUsd) return false;
  if (buildingTypical !== plan.feeUsd) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("building permit portion $323 + plan review $323 (100% of the permit fee) = $646")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $558 total") || !note.includes("high $22,000 = $846 total")) return false;
  if (!note.includes("$279") || !note.includes("$423") || !note.includes("$255")) return false;
  if (!/minimum \$195/.test(note) || !/valuation > \$5,000/.test(note)) return false;
  if (!/bundles trades into one building permit/.test(note)) return false;
  return true;
}

/**
 * Phoenix roof People-Also-Ask entries.
 * A service-life FAQ is omitted: no City of Phoenix or Arizona source fetched for this page states how long a roof lasts.
 * A 25% damage rule is omitted: the fetched Phoenix sheets do not state one.
 */
function phoenixRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!phoenixRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];

  const buildingLow = phoenixTableABuildingFee(assumed.low);
  const buildingTypical = phoenixTableABuildingFee(assumed.typical);
  const buildingHigh = phoenixTableABuildingFee(assumed.high);
  if (buildingLow == null || buildingTypical == null || buildingHigh == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];
  const atRoof = at(squaresForRoof);

  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atLow.permitTypical !== permit.feeTypicalUsd) return [];
  if (atTypical.permitTypical !== permit.feeTypicalUsd) return [];
  if (atHigh.permitTypical !== permit.feeTypicalUsd) return [];
  if (atRoof.permitLow !== permit.feeLowUsd) return [];
  if (atRoof.permitTypical !== permit.feeTypicalUsd) return [];
  if (atRoof.permitHigh !== permit.feeHighUsd) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. Those all-in figures add the recorded permit for the valuation bands on this row: " +
    usd(permit.feeLowUsd) +
    " on the low, " +
    usd(permit.feeTypicalUsd) +
    " on the typical, and " +
    usd(permit.feeHighUsd) +
    " on the high. The permit is based on project value, so it is not rescaled when the roof size changes, and it is not a new Table A fee for 20 squares. The nearest table rows are " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical and " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee stays " +
    usd(permit.feeTypicalUsd) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the roof size changes. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is outside the about 13 to 18 squares this page uses for a typical house. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    usd(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    usd(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    usd(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $30,000 is above that recorded high valuation, so this row does not list a permit fee for a $30,000 project value. The all-in figures add the recorded typical permit of " +
    usd(permit.feeTypicalUsd) +
    ". They do not look up a new Table A fee at $30,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    usd(permit.feeTypicalUsd) +
    ". Ordinance G-7465 Table A sets the building permit from the project valuation. For a residential valuation of $50,000 or less, plan review is 100% of that permit fee, minimum $195, when valuation > $5,000, and that review is included in the recorded totals. At the recorded " +
    usd(assumed.typical) +
    " valuation the building permit portion is " +
    usd(buildingTypical) +
    " and plan review is " +
    usd(buildingTypical) +
    ", so " +
    usd(buildingTypical) +
    " + " +
    usd(buildingTypical) +
    " = " +
    usd(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a building permit portion of " +
    usd(buildingLow) +
    " plus plan review of " +
    usd(buildingLow) +
    ", which is " +
    usd(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a building permit portion of " +
    usd(buildingHigh) +
    " plus plan review of " +
    usd(buildingHigh) +
    ", which is " +
    usd(permit.feeHighUsd) +
    ". The $195 minimum would apply only when 100% of the building permit fee is under $195. From $5,001 through $6,000, Table A is $255, which is already above $195, so that floor does not raise the recorded totals. Phoenix bundles trades into one building permit. The recorded typical stays " +
    usd(permit.feeTypicalUsd) +
    ".";

  const exemptAnswer =
    "City of Phoenix Planning & Development's Work Exempt from Permit sheet (TRT/DOC/00618, printed Rev. 07/14) quotes Phoenix Building Construction Code Section 105.2.1 item 16: re-roofing with the same type of material as the original roofing, provided not more than two layers of asphalt shingles are applied over an existing asphalt shingle roof. The sheet's commentary says item 16 is exempt only for certain occupancies, and that sentence does not name the occupancies. The department's residential permit brochure (printed Rev. 2/20) lists, under when a permit is not needed, re-shingle or re-tile with the same material, with that same two-layer asphalt limit. The same brochure lists, under when a residential permit is needed, roofline extensions and replacing wood or asphalt shingles with a tile roof. This page's cost model is an asphalt-shingle job, not a tile price. The recorded permit row still prices a permit on Table A when a permit is issued: " +
    usd(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    usd(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    usd(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". The published exempt list is not a $0 line on this row. Sources: City of Phoenix Planning & Development, Work Exempt from Permit (https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00618.pdf); How to Obtain a Residential Building Permit (https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/trt/external/dsd_trt_pdf_00823.pdf).";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "Does Phoenix require a permit to reroof with the same material, or to switch to tile?",
      answer: asSentence(exemptAnswer),
    },
  ];
}

/** Citations for the Phoenix roof same-material / tile FAQ. Empty on every other page. */
export function phoenixRoofPermitSources(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): CostSource[] {
  if (!phoenixRoofPaaAnchors(city, project, permit)) return [];
  return PHOENIX_ROOF_PERMIT_SOURCES;
}

/**
 * One building line whose 12% surcharge, rounded to the cent, plus that line
 * equals the recorded total. Returns null if that split is missing or not unique.
 */
function portlandTwelvePercentSplit(
  totalUsd: number,
): { buildingCents: number; surchargeCents: number } | null {
  const target = Math.round(totalUsd * 100);
  let found: { buildingCents: number; surchargeCents: number } | null = null;
  for (let buildingCents = 0; buildingCents <= target; buildingCents++) {
    const surchargeCents = Math.round((buildingCents * 12) / 100);
    if (buildingCents + surchargeCents !== target) continue;
    if (found) return null;
    found = { buildingCents, surchargeCents };
  }
  return found;
}

/**
 * Portland roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded row.
 * Returns false if those anchors drift.
 */
function portlandRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "portland-or" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 340.83 || permit.feeTypicalUsd !== 403.14 || permit.feeHighUsd !== 558.94) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const buildingFee = building?.feeUsd;
  const surchargeFee = surcharge?.feeUsd;
  if (!/^Building permit \(Building Permit Fee table\)$/.test(building?.name || "") || buildingFee !== 359.95) return false;
  if (!/^Oregon 12% state surcharge$/.test(surcharge?.name || "") || surchargeFee !== 43.19) return false;
  if (Math.round(buildingFee * 100) + Math.round(surchargeFee * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }

  const lowSplit = portlandTwelvePercentSplit(permit.feeLowUsd);
  const typicalSplit = portlandTwelvePercentSplit(permit.feeTypicalUsd);
  const highSplit = portlandTwelvePercentSplit(permit.feeHighUsd);
  if (!lowSplit || !typicalSplit || !highSplit) return false;
  if (lowSplit.buildingCents !== 30431 || lowSplit.surchargeCents !== 3652) return false;
  if (typicalSplit.buildingCents !== 35995 || typicalSplit.surchargeCents !== 4319) return false;
  if (highSplit.buildingCents !== 49905 || highSplit.surchargeCents !== 5989) return false;
  if (typicalSplit.buildingCents - lowSplit.buildingCents !== 1391 * 4) return false;
  if (highSplit.buildingCents - typicalSplit.buildingCents !== 1391 * 10) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026/.test(note)) {
    return false;
  }
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes("building permit $359.95 + Oregon 12% state surcharge $43.19 = $403.14")) return false;
  if (!note.includes("Low $8,000 = $340.83 total") || !note.includes("high $22,000 = $558.94 total")) return false;
  if (!note.includes("$304.31") || !note.includes("$36.52") || !note.includes("$499.05") || !note.includes("$59.89")) {
    return false;
  }
  if (!note.includes("$220.85") || !note.includes("$13.91")) return false;
  if (!/Commercial Development Services Fee/.test(note) || !/not a building-permit line/.test(note)) return false;
  if (!note.includes("$4.69")) return false;
  if (!/building-permit line plus the 12% Oregon surcharge only/i.test(note)) return false;
  if (!/Residential Development Services Fee/.test(note) || !/65% plan review \/ process fee/.test(note)) return false;
  if (!/omitted/i.test(note) || !/real issued totals can be higher/i.test(note)) return false;
  if (permit.sourceUrl !==
    "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download"
  ) {
    return false;
  }
  return true;
}

/**
 * Portland roof People-Also-Ask entries.
 * A material or climate FAQ is omitted: the cost model and the recorded permit
 * row do not state a Portland roof material or climate rule.
 */
function portlandRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!portlandRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const building = (permit.extras || [])[0];
  const surcharge = (permit.extras || [])[1];
  if (building?.feeUsd == null || surcharge?.feeUsd == null) return [];

  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atRoof.job.quantity !== squaresForRoof) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atRoof.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atRoof.allInLow !== atRoof.job.low + atRoof.permitLow) return [];
  if (atRoof.allInTypical !== atRoof.job.typical + atRoof.permitTypical) return [];
  if (atRoof.allInHigh !== atRoof.job.high + atRoof.permitHigh) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atRoof.permitLow) +
    " on the low, " +
    usd(atRoof.permitTypical) +
    " on the typical, and " +
    usd(atRoof.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the roof size changes, and it is not a new fee for 20 squares. The nearest table rows are " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical and " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the roof size changes, and the model rounds the permit to the nearest dollar. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is outside the about 13 to 18 squares this page uses for a typical house. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $30,000 is above that recorded high valuation, so this row does not list a permit fee for a $30,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new fee at $30,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026, retrieved " +
    (permit.retrievedDate || "") +
    ". Recorded bands are the Building Permit Fee plus the 12% Oregon surcharge only. The Commercial Development Services Fee is not the building-permit line. At the recorded " +
    usd(assumed.typical) +
    " valuation the building permit is " +
    moneyExact(building.feeUsd) +
    " and the Oregon 12% state surcharge is " +
    moneyExact(surcharge.feeUsd) +
    ", so " +
    moneyExact(building.feeUsd) +
    " + " +
    moneyExact(surcharge.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". The building-permit portion of each of those totals, plus 12% of that portion rounded to the cent, is in the calculation note on this page. The Residential Development Services Fee and the 65% plan review / process fee are still omitted, so real issued totals can be higher. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026") +
    " (" +
    permit.sourceUrl +
    ").";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
  ];
}

const PORTLAND_DECK_SF = { low: 200, typical: 320, high: 400 };

/**
 * Portland deck People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded row.
 * Returns false if those anchors drift.
 */
function portlandDeckPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "portland-or" || project.projectSlug !== "deck" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 81.68 || permit.feeTypicalUsd !== 102.69 || permit.feeHighUsd !== 144.72) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const building = extras[0];
  const surcharge = extras[1];
  const plan = extras[2];
  const buildingFee = building?.feeUsd;
  const surchargeFee = surcharge?.feeUsd;
  if (!/^Building permit \(PP&D table\)$/.test(building?.name || "") || buildingFee !== 91.69) return false;
  if (!/^Oregon 12% state surcharge$/.test(surcharge?.name || "") || surchargeFee !== 11) return false;
  if (!/^Plan review \/ development services$/.test(plan?.name || "") || plan?.feeUsd != null) return false;
  if (!/not extracted/i.test(plan?.note || "")) return false;
  if (Math.round(buildingFee * 100) + Math.round(surchargeFee * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }

  const lowSplit = portlandTwelvePercentSplit(permit.feeLowUsd);
  const typicalSplit = portlandTwelvePercentSplit(permit.feeTypicalUsd);
  const highSplit = portlandTwelvePercentSplit(permit.feeHighUsd);
  if (!lowSplit || !typicalSplit || !highSplit) return false;
  if (lowSplit.buildingCents !== 7293 || lowSplit.surchargeCents !== 875) return false;
  if (typicalSplit.buildingCents !== 9169 || typicalSplit.surchargeCents !== 1100) return false;
  if (highSplit.buildingCents !== 12921 || highSplit.surchargeCents !== 1551) return false;
  if (typicalSplit.buildingCents - lowSplit.buildingCents !== 469 * 4) return false;
  if (highSplit.buildingCents - typicalSplit.buildingCents !== 469 * 8) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== PORTLAND_DECK_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 1200 || meta.quantityStep !== 10) return false;
  if (16 * 20 !== PORTLAND_DECK_SF.typical) return false;
  const scope = project.scopeNote || "";
  if (!/\$30/.test(scope) || !/\$60/.test(scope) || !/\$8,316/.test(scope)) return false;
  if (!/\$4,340/.test(scope) || !/\$12,652/.test(scope)) return false;
  if (!/\$12,800/.test(scope) || !/\$19,200/.test(scope)) return false;
  if (!/Pressure-treated/.test(scope) || !/second-story/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026/.test(note)) {
    return false;
  }
  if (!note.includes("2026-08-13")) return false;
  if (!note.includes("building permit $91.69 + Oregon 12% state surcharge $11.00 = $102.69")) return false;
  if (!note.includes("Low $8,000 = $81.68 total") || !note.includes("high $19,200 = $144.72 total")) return false;
  if (!note.includes("$72.93") || !note.includes("$8.75") || !note.includes("$129.21") || !note.includes("$15.51")) {
    return false;
  }
  if (!note.includes("$4.69") || !note.includes("$18.76") || !note.includes("$37.52")) return false;
  if (!/building-permit line plus the 12% Oregon surcharge only/i.test(note)) return false;
  if (!/not fully extracted/i.test(note) || !/real totals are higher/i.test(note)) return false;
  if (!/issued totals can be higher/i.test(note)) return false;
  if (
    permit.sourceUrl !==
    "https://www.portland.gov/ppd/documents/building-and-other-permits-fee-schedule-city-portland-effective-july-10-2026/download"
  ) {
    return false;
  }
  return true;
}

/**
 * Portland deck People-Also-Ask entries.
 * A height or setback rule is omitted: the cost model and the recorded permit
 * row do not state a Portland deck height or setback exemption.
 */
function portlandDeckPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!portlandDeckPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const building = (permit.extras || [])[0];
  const surcharge = (permit.extras || [])[1];
  if (building?.feeUsd == null || surcharge?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(PORTLAND_DECK_SF.low);
  const atTypical = at(PORTLAND_DECK_SF.typical);
  const atHigh = at(PORTLAND_DECK_SF.high);
  if (atLow.job.quantity !== PORTLAND_DECK_SF.low) return [];
  if (atTypical.job.quantity !== PORTLAND_DECK_SF.typical) return [];
  if (atHigh.job.quantity !== PORTLAND_DECK_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 20000) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is deck walking surface. A 16 by 20 deck is " +
    PORTLAND_DECK_SF.typical +
    " sq ft, and that is the typical job. The cost-by-size rows are " +
    PORTLAND_DECK_SF.low +
    " sq ft, " +
    PORTLAND_DECK_SF.typical +
    " sq ft, and " +
    PORTLAND_DECK_SF.high +
    " sq ft. The calculator prices the installed deck per square foot, and " +
    PORTLAND_DECK_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    PORTLAND_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the deck size changes, and it is not a new fee for " +
    PORTLAND_DECK_SF.typical +
    " sq ft. The other table rows are " +
    PORTLAND_DECK_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    PORTLAND_DECK_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the deck square feet on that row. The square feet are walking surface. The cost-by-size rows are " +
    PORTLAND_DECK_SF.low +
    " sq ft, " +
    PORTLAND_DECK_SF.typical +
    " sq ft (a 16 by 20 deck), and " +
    PORTLAND_DECK_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the deck size changes, and the model rounds the permit to the nearest dollar. At " +
    PORTLAND_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, PORTLAND_DECK_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    PORTLAND_DECK_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, PORTLAND_DECK_SF.low) +
    " per sq ft. At " +
    PORTLAND_DECK_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, PORTLAND_DECK_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical 16 by 20 deck (" +
    PORTLAND_DECK_SF.typical +
    " sq ft) in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (20000 > atTypical.allInTypical) {
    tooMuch += "$20,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an installed range of $30 to $60 per sq ft, an average job of $8,316 (range $4,340 to $12,652), and a 16 by 20 (320 sq ft) table of $12,800 to $19,200. $20,000 is above that table high. The same scope calls pressure-treated the low end and second-story, high-end wood, or custom the high end. Wage-indexed, that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    PORTLAND_DECK_SF.typical +
    " sq ft in " +
    label +
    ". ";
  if (20000 < atTypical.allInHigh && 20000 > atTypical.allInTypical) {
    tooMuch += "$20,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $20,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $20,000 is above that recorded high valuation, so this row does not list a permit fee for a $20,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new fee at $20,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical deck in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026, retrieved " +
    (permit.retrievedDate || "") +
    ". Recorded bands are the building-permit line plus the 12% Oregon surcharge only. At the recorded " +
    usd(assumed.typical) +
    " valuation the building permit is " +
    moneyExact(building.feeUsd) +
    " and the Oregon 12% state surcharge is " +
    moneyExact(surcharge.feeUsd) +
    ", so " +
    moneyExact(building.feeUsd) +
    " + " +
    moneyExact(surcharge.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". The building-permit portion of each of those totals, plus 12% of that portion rounded to the cent, is in the calculation note on this page. Plan review and other development-services fees on the same schedule were not fully extracted, so issued totals can be higher. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Portland Building and Other Permits Fee Schedule, effective July 10, 2026") +
    " (" +
    permit.sourceUrl +
    ").";

  return [
    {
      question: "How much does a 16 by 20 deck cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a deck cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $20,000 too much for a deck in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to build a deck in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
  ];
}

const RALEIGH_DECK_SF = { low: 200, typical: 320, high: 400 };

/**
 * Raleigh deck People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * FY27 Level 2 row. Returns false if those anchors drift.
 * A height or setback rule is omitted: this row does not record one.
 */
function raleighDeckPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "deck" || !permit) return false;
  if (permit.feeModel !== "tiered" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 248 || permit.feeTypicalUsd !== 248 || permit.feeHighUsd !== 248) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level2 = extras[0];
  const plan = extras[1];
  if (
    level2?.name !== "Level 2 alteration / new accessory structure path (50% of 0.38% value, min $124)" ||
    level2.feeUsd !== 124
  ) {
    return false;
  }
  if (plan?.name !== "Plan review (55%, min $124)" || plan.feeUsd !== 124) return false;
  if (Math.round(level2.feeUsd * 100) + Math.round(plan.feeUsd * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== RALEIGH_DECK_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 1200 || meta.quantityStep !== 10) return false;
  if (16 * 20 !== RALEIGH_DECK_SF.typical) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "200 sf" || spec.typical !== "16\u00d720 = 320 sf" || spec.high !== "400 sf") {
    return false;
  }
  const scope = project.scopeNote || "";
  if (!/\$30/.test(scope) || !/\$60/.test(scope) || !/\$8,316/.test(scope)) return false;
  if (!/\$4,340/.test(scope) || !/\$12,652/.test(scope)) return false;
  if (!/\$12,800/.test(scope) || !/\$19,200/.test(scope)) return false;
  if (!/Pressure-treated/.test(scope) || !/second-story/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Raleigh FY27 Development Fee Guide/.test(note) || !note.includes("2026-08-13")) return false;
  if (!/Level 2 is 50% of 0\.38% of value, minimum \$124/.test(note)) return false;
  if (!/Plan review is 55%, minimum \$124, and is included/.test(note)) return false;
  if (!note.includes("Typical $12,000: Level 2 alteration / new accessory structure path $124 + plan review $124 = $248")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $248 total") || !note.includes("high $19,200 = $248 total")) return false;
  if (!note.includes("0.38% \u00d7 $8,000 = $30.40") || !note.includes("50% \u00d7 $30.40 = $15.20")) return false;
  if (!note.includes("55% \u00d7 $30.40 = $16.72")) return false;
  if (!note.includes("0.38% \u00d7 $12,000 = $45.60") || !note.includes("50% \u00d7 $45.60 = $22.80")) return false;
  if (!note.includes("55% \u00d7 $45.60 = $25.08")) return false;
  if (!note.includes("0.38% \u00d7 $19,200 = $72.96") || !note.includes("50% \u00d7 $72.96 = $36.48")) return false;
  if (!note.includes("55% \u00d7 $72.96 = $40.128")) return false;
  if (!/not a separate recorded fee/.test(note)) return false;
  if (!/still usually the \$124 floor at these sizes/.test(note)) return false;
  if (!/Use the city's fee calculator/.test(note)) return false;
  if (/\u2014/.test(note)) return false;
  if ((8000 * 38) / 100 !== 3040 || (3040 * 50) / 100 !== 1520 || (3040 * 55) / 100 !== 1672) return false;
  if ((12000 * 38) / 100 !== 4560 || (4560 * 50) / 100 !== 2280 || (4560 * 55) / 100 !== 2508) return false;
  if ((19200 * 38) / 100 !== 7296 || (7296 * 50) / 100 !== 3648) return false;
  if (1520 >= 12400 || 1672 >= 12400 || 2280 >= 12400 || 2508 >= 12400 || 3648 >= 12400) return false;
  if ((7296 * 55) / 100 >= 12400) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide") return false;
  if (
    permit.sourceUrl !==
    "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf"
  ) {
    return false;
  }
  return true;
}

/**
 * Raleigh deck People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. Permit dollars stay the
 * recorded $248 floor at $8,000, $12,000, and $19,200.
 */
function raleighDeckPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!raleighDeckPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const level2 = (permit.extras || [])[0];
  const plan = (permit.extras || [])[1];
  if (level2?.feeUsd == null || plan?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(RALEIGH_DECK_SF.low);
  const atTypical = at(RALEIGH_DECK_SF.typical);
  const atHigh = at(RALEIGH_DECK_SF.high);
  if (atLow.job.quantity !== RALEIGH_DECK_SF.low) return [];
  if (atTypical.job.quantity !== RALEIGH_DECK_SF.typical) return [];
  if (atHigh.job.quantity !== RALEIGH_DECK_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 20000) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is deck walking surface. A 16 by 20 deck is " +
    RALEIGH_DECK_SF.typical +
    " sq ft, and that is the typical job. The cost-by-size rows are " +
    RALEIGH_DECK_SF.low +
    " sq ft, " +
    RALEIGH_DECK_SF.typical +
    " sq ft, and " +
    RALEIGH_DECK_SF.high +
    " sq ft. The calculator prices the installed deck per square foot, and " +
    RALEIGH_DECK_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    RALEIGH_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". Each recorded total is the $124 Level 2 minimum plus the $124 plan-review minimum. The model rounds each fee to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitTypical) +
    " on the low, the typical, and the high. The permit is the recorded floor at those valuations, so it is not rescaled when the deck size changes, and it is not a new fee for " +
    RALEIGH_DECK_SF.typical +
    " sq ft. The other table rows are " +
    RALEIGH_DECK_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    RALEIGH_DECK_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the deck square feet on that row. The square feet are walking surface. The cost-by-size rows are " +
    RALEIGH_DECK_SF.low +
    " sq ft, " +
    RALEIGH_DECK_SF.typical +
    " sq ft (a 16 by 20 deck), and " +
    RALEIGH_DECK_SF.high +
    " sq ft. The recorded permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    " at each recorded valuation of " +
    usd(assumed.low) +
    ", " +
    usd(assumed.typical) +
    ", and " +
    usd(assumed.high) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is the Level 2 floor at those valuations and is not rescaled when the deck size changes, and the model rounds the permit to the nearest dollar. At " +
    RALEIGH_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, RALEIGH_DECK_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    RALEIGH_DECK_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, RALEIGH_DECK_SF.low) +
    " per sq ft. At " +
    RALEIGH_DECK_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, RALEIGH_DECK_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical 16 by 20 deck (" +
    RALEIGH_DECK_SF.typical +
    " sq ft) in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (20000 > atTypical.allInTypical) {
    tooMuch += "$20,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an installed range of $30 to $60 per sq ft, an average job of $8,316 (range $4,340 to $12,652), and a 16 by 20 (320 sq ft) table of $12,800 to $19,200. $20,000 is above that table high. The same scope calls pressure-treated the low end and second-story, high-end wood, or custom the high end. Wage-indexed, that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    RALEIGH_DECK_SF.typical +
    " sq ft in " +
    label +
    ". ";
  if (20000 > atTypical.allInHigh) {
    tooMuch += "$20,000 is above that wage-indexed high. ";
  } else if (20000 < atTypical.allInHigh && 20000 > atTypical.allInTypical) {
    tooMuch += "$20,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $20,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $20,000 is above that recorded high valuation, so this row does not list a permit fee for a $20,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new fee at $20,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical deck in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Raleigh FY27 Development Fee Guide, retrieved " +
    (permit.retrievedDate || "") +
    ". Level 2 alteration / new accessory structure path is 50% of 0.38% of value, minimum $124. Plan review is 55% of that 0.38% building-permit base, minimum $124, and is included. At the recorded " +
    usd(assumed.low) +
    ", " +
    usd(assumed.typical) +
    ", and " +
    usd(assumed.high) +
    " valuations both products are under $124, so each total is " +
    moneyExact(level2.feeUsd) +
    " + " +
    moneyExact(plan.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". New decks may instead be assessed as new residential construction at 0.38% of value (still usually the $124 floor at these sizes). This row does not record a separate new-construction total. This row does not record a height or setback exemption. Use the city's fee calculator for the billed amount. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Raleigh FY27 Development Fee Guide") +
    " (" +
    permit.sourceUrl +
    ").";

  const valuationAnswer =
    "Recorded assumed valuations for a deck in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". The building-permit base is 0.38% of each valuation. Level 2 is 50% of that base, minimum $124. Plan review is 55% of that base, minimum $124. Low $8,000: 0.38% \u00d7 $8,000 = $30.40. Level 2 is 50% \u00d7 $30.40 = $15.20, and plan review is 55% \u00d7 $30.40 = $16.72. Both are under $124, so the recorded total is " +
    moneyExact(level2.feeUsd) +
    " + " +
    moneyExact(plan.feeUsd) +
    " = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical $12,000: 0.38% \u00d7 $12,000 = $45.60. Level 2 is 50% \u00d7 $45.60 = $22.80, and plan review is 55% \u00d7 $45.60 = $25.08. Both are under $124, so the recorded total is " +
    moneyExact(permit.feeTypicalUsd) +
    ". High $19,200: 0.38% \u00d7 $19,200 = $72.96. Level 2 is 50% \u00d7 $72.96 = $36.48, and plan review is 55% \u00d7 $72.96 = $40.128. Both are under $124, so the recorded total is " +
    moneyExact(permit.feeHighUsd) +
    ". Those products are the formula before the minimum. They are not a separate recorded fee and are not added on top of the $124 lines. The high is not added on top of the typical. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ".";

  return [
    {
      question: "How much does a 16 by 20 deck cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a deck cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $20,000 too much for a deck in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to build a deck in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a deck permit cost at $8,000, $12,000, and $19,200 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const RALEIGH_KITCHEN_SF = { low: 150, typical: 200, high: 400 };

/**
 * Raleigh kitchen People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * FY27 Level 2 row. Returns false if those anchors drift.
 * A cabinet-only dollar is omitted: the row says same-layout cabinet-only may
 * need fewer trades and does not record a separate fee for that path.
 */
function raleighKitchenPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "kitchen-remodel" || !permit) return false;
  if (permit.feeModel !== "tiered" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 496 || permit.feeTypicalUsd !== 496 || permit.feeHighUsd !== 547.25) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const level2 = extras[0];
  const plan = extras[1];
  const elec = extras[2];
  const plumb = extras[3];
  if (
    level2?.name !== "Level 2 alteration building (50% of 0.38% value, min $124)" ||
    level2.feeUsd !== 124
  ) {
    return false;
  }
  if ((level2.note || "") !== "Layout change / added equipment is Level 2.") return false;
  if (plan?.name !== "Plan review (55%, min $124)" || plan.feeUsd !== 124) return false;
  if ((plan.note || "") !== "Included.") return false;
  if (elec?.name !== "Electrical trade (minimum)" || elec.feeUsd !== 124) return false;
  if ((elec.note || "") !== "Included in totals (3 trades: building + E + P).") return false;
  if (plumb?.name !== "Plumbing trade (minimum)" || plumb.feeUsd !== 124) return false;
  if ((plumb.note || "") !== "Included in totals.") return false;
  const floorCents =
    Math.round(level2.feeUsd * 100) +
    Math.round(plan.feeUsd * 100) +
    Math.round(elec.feeUsd * 100) +
    Math.round(plumb.feeUsd * 100);
  if (floorCents !== Math.round(permit.feeTypicalUsd * 100)) return false;
  if (floorCents !== Math.round(permit.feeLowUsd * 100)) return false;
  if (14250 + 15675 + 12400 + 12400 !== Math.round(permit.feeHighUsd * 100)) return false;

  if ((15000 * 38) / 100 !== 5700 || (5700 * 50) / 100 !== 2850 || (5700 * 55) / 100 !== 3135) return false;
  if ((35000 * 38) / 100 !== 13300 || (13300 * 50) / 100 !== 6650 || (13300 * 55) / 100 !== 7315) return false;
  if ((75000 * 38) / 100 !== 28500 || (28500 * 50) / 100 !== 14250 || (28500 * 55) / 100 !== 15675) return false;
  if (2850 >= 12400 || 3135 >= 12400 || 6650 >= 12400 || 7315 >= 12400) return false;
  if (14250 < 12400 || 15675 < 12400) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== RALEIGH_KITCHEN_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 500 || meta.quantityStep !== 10) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "150 sf" || spec.typical !== "200 sf affected area" || spec.high !== "400 sf") {
    return false;
  }
  const scope = project.scopeNote || "";
  if (!/\$75/.test(scope) || !/\$250/.test(scope)) return false;
  if (!/\$14,600/.test(scope) || !/\$41,300/.test(scope) || !/\$65,000/.test(scope)) return false;
  if (!/not this typical/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/City of Raleigh FY27 Development Fee Guide/.test(note) || !note.includes("2026-08-13")) return false;
  if (!/Layout change \/ added equipment is Level 2/.test(note)) return false;
  if (!/Level 2 alteration building is 50% of 0\.38% of value/.test(note)) return false;
  if (!/Plan review is 55% of the full 0\.38% value/.test(note)) return false;
  if (!/Electrical trade minimum is \$124/.test(note) || !/plumbing trade minimum is \$124/.test(note)) return false;
  if (!note.includes("0.38% \u00d7 $15,000 = $57") || !note.includes("50% \u00d7 $57 = $28.50")) return false;
  if (!note.includes("55% \u00d7 $57 = $31.35")) return false;
  if (!note.includes("0.38% \u00d7 $35,000 = $133") || !note.includes("50% \u00d7 $133 = $66.50")) return false;
  if (!note.includes("55% \u00d7 $133 = $73.15")) return false;
  if (!note.includes("$124 + $124 + $124 + $124 = $496")) return false;
  if (!note.includes("0.38% \u00d7 $75,000 = $285") || !note.includes("50% \u00d7 $285 = $142.50")) return false;
  if (!note.includes("55% of the full 0.38% value (= $156.75)")) return false;
  if (!note.includes("$142.50 + $156.75 + $124 + $124 = $547.25")) return false;
  if (!/not a separate recorded fee/.test(note)) return false;
  if (!/Same-layout cabinet-only may need fewer trades/.test(note)) return false;
  if (!/official calculator/.test(note)) return false;
  if (!/Do not invent amounts not recorded as feeUsd/.test(note)) return false;
  if (/\u2014/.test(note)) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide") return false;
  if (
    permit.sourceUrl !==
    "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf"
  ) {
    return false;
  }
  if (
    (permit.caveat || "") !==
    "Typical = Level 2 building min + plan-review min + two additional trade mins ($124\u00d74). Same-layout cabinet-only may need fewer trades. Confirm with the official calculator."
  ) {
    return false;
  }
  return true;
}

/**
 * Raleigh kitchen People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. Permit dollars stay the
 * recorded Level 2 floor at $15,000 and $35,000, and the recorded $547.25
 * at $75,000. A cabinet-only dollar is omitted.
 */
function raleighKitchenPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!raleighKitchenPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const level2 = (permit.extras || [])[0];
  const plan = (permit.extras || [])[1];
  const elec = (permit.extras || [])[2];
  const plumb = (permit.extras || [])[3];
  if (level2?.feeUsd == null || plan?.feeUsd == null || elec?.feeUsd == null || plumb?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(RALEIGH_KITCHEN_SF.low);
  const atTypical = at(RALEIGH_KITCHEN_SF.typical);
  const atHigh = at(RALEIGH_KITCHEN_SF.high);
  if (atLow.job.quantity !== RALEIGH_KITCHEN_SF.low) return [];
  if (atTypical.job.quantity !== RALEIGH_KITCHEN_SF.typical) return [];
  if (atHigh.job.quantity !== RALEIGH_KITCHEN_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 50000) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is kitchen room area. The typical job is " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    RALEIGH_KITCHEN_SF.low +
    " sq ft, " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft, and " +
    RALEIGH_KITCHEN_SF.high +
    " sq ft. The calculator prices the remodel per square foot, and " +
    RALEIGH_KITCHEN_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". Low and typical are four $124 lines: Level 2 building, plan review, electrical, and plumbing. The high uses the percent above that floor on Level 2 and plan review, plus the two $124 trades. The model rounds each fee to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is based on the recorded project value, so it is not rescaled when the kitchen size changes, and it is not a new fee for " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft. The other table rows are " +
    RALEIGH_KITCHEN_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    RALEIGH_KITCHEN_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the kitchen square feet on that row. The square feet are room area, and the typical row is " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    RALEIGH_KITCHEN_SF.low +
    " sq ft, " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft, and " +
    RALEIGH_KITCHEN_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the kitchen size changes, and the model rounds the permit to the nearest dollar. At " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, RALEIGH_KITCHEN_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    RALEIGH_KITCHEN_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, RALEIGH_KITCHEN_SF.low) +
    " per sq ft. At " +
    RALEIGH_KITCHEN_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, RALEIGH_KITCHEN_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft kitchen in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (50000 > atTypical.allInTypical) {
    tooMuch += "$50,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites a remodeled kitchen at $75 to $250 per sq ft, an average remodel of $14,600 to $41,300, and a new-from-scratch kitchen around $65,000 as a different scope. $50,000 is above that $41,300 remodel high and below that $65,000 scratch-kitchen figure. Wage-indexed, the high at " +
    RALEIGH_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " is " +
    usd(atTypical.allInHigh) +
    ". ";
  if (50000 > atTypical.allInHigh) {
    tooMuch += "$50,000 is above that wage-indexed high. ";
  } else if (50000 < atTypical.allInHigh && 50000 > atTypical.allInTypical) {
    tooMuch += "$50,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $50,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $50,000 sits between the recorded typical valuation and the recorded high valuation, so this row does not list a separate permit fee for a $50,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new fee at $50,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical kitchen remodel in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Raleigh FY27 Development Fee Guide, retrieved " +
    (permit.retrievedDate || "") +
    ". Layout change / added equipment is Level 2. Level 2 alteration building is 50% of 0.38% of value, minimum $124. Plan review is 55% of the full 0.38% value, minimum $124, and is included. Electrical trade minimum is $124 and plumbing trade minimum is $124. At the recorded " +
    usd(assumed.low) +
    " and " +
    usd(assumed.typical) +
    " valuations each percent is under $124, so the total is " +
    moneyExact(level2.feeUsd) +
    " + " +
    moneyExact(plan.feeUsd) +
    " + " +
    moneyExact(elec.feeUsd) +
    " + " +
    moneyExact(plumb.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". High " +
    usd(assumed.high) +
    " is 0.38% \u00d7 $75,000 = $285; Level 2 building = 50% \u00d7 $285 = $142.50; plan review is 55% of the full 0.38% value (= $156.75); so $142.50 + $156.75 + $124 + $124 = " +
    moneyExact(permit.feeHighUsd) +
    ". The high is not added on top of the typical. Same-layout cabinet-only may need fewer trades. Confirm with the official calculator. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Raleigh FY27 Development Fee Guide") +
    " (" +
    permit.sourceUrl +
    ").";

  const cabinetAnswer =
    "The recorded path is a layout change or added equipment, and that path is Level 2. The recorded caveat says same-layout cabinet-only may need fewer trades. This row does not record a separate cabinet-only fee, and it does not record a $0 cosmetic total. When the four recorded lines apply, the totals stay " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". Confirm with the official calculator.";

  const valuationAnswer =
    "Recorded assumed valuations for a kitchen remodel in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". The building-permit base is 0.38% of each valuation. Level 2 is 50% of that base, minimum $124. Plan review is 55% of that full 0.38% value, minimum $124. Electrical and plumbing each stay at the $124 trade minimum. Low $15,000: 0.38% \u00d7 $15,000 = $57. Level 2 is 50% \u00d7 $57 = $28.50, and plan review is 55% \u00d7 $57 = $31.35. Both are under $124, so the recorded total is " +
    moneyExact(level2.feeUsd) +
    " + " +
    moneyExact(plan.feeUsd) +
    " + " +
    moneyExact(elec.feeUsd) +
    " + " +
    moneyExact(plumb.feeUsd) +
    " = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical $35,000: 0.38% \u00d7 $35,000 = $133. Level 2 is 50% \u00d7 $133 = $66.50, and plan review is 55% \u00d7 $133 = $73.15. Both are under $124, so the recorded total is " +
    moneyExact(permit.feeTypicalUsd) +
    ". High $75,000: 0.38% \u00d7 $75,000 = $285. Level 2 is 50% \u00d7 $285 = $142.50, and plan review is 55% of the full 0.38% value (= $156.75). Those two lines are above $124, and the trades stay at $124, so $142.50 + $156.75 + $124 + $124 = " +
    moneyExact(permit.feeHighUsd) +
    ". At $15,000 and $35,000 those products are the formula before the minimum. They are not a separate recorded fee and are not added on top of the $124 lines. The high is not added on top of the typical. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ".";

  return [
    {
      question: "How much does a 200 sq ft kitchen remodel cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a kitchen remodel cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $50,000 too much for a kitchen remodel in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to remodel a kitchen in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "Does a same-layout cabinet-only kitchen remodel use the Level 2 permit fee in " + city.name + "?",
      answer: asSentence(cabinetAnswer),
    },
    {
      question: "What does a kitchen remodel permit cost at $15,000, $35,000, and $75,000 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const PHOENIX_KITCHEN_SF = { low: 150, typical: 200, high: 400 };

/**
 * Table A building-permit portion for the Phoenix kitchen valuation bands.
 * $10,001 to $50,000: $303 on the first $10,000 plus $10 per additional $1,000 or fraction.
 * $50,001 to $200,000: $703 on the first $50,000 plus $9 per additional $1,000 or fraction.
 * Returns null outside those bands. Does not change the roof helper.
 */
function phoenixKitchenBuildingFee(valuation: number): number | null {
  if (valuation >= 10001 && valuation <= 50000) {
    const steps = Math.ceil((valuation - 10000) / 1000);
    return 303 + steps * 10;
  }
  if (valuation >= 50001 && valuation <= 200000) {
    const steps = Math.ceil((valuation - 50000) / 1000);
    return 703 + steps * 9;
  }
  return null;
}

/** Plan review in cents. 100% at or under $50,000; 80% over $50,000. Null at or under $5,000. */
function phoenixKitchenPlanReviewCents(valuation: number, building: number): number | null {
  if (valuation <= 5000) return null;
  const buildingCents = Math.round(building * 100);
  if (valuation <= 50000) return buildingCents;
  return Math.round((buildingCents * 80) / 100);
}

/**
 * Phoenix kitchen People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded row
 * and from Table A only when that table reproduces the recorded totals.
 * Returns false if those anchors drift.
 */
function phoenixKitchenPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "phoenix-az" || project.projectSlug !== "kitchen-remodel" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (Math.round((permit.feeLowUsd ?? NaN) * 100) !== 70600) return false;
  if (Math.round((permit.feeTypicalUsd ?? NaN) * 100) !== 110600) return false;
  if (Math.round((permit.feeHighUsd ?? NaN) * 100) !== 167040) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  const plan = extras[0];
  if (!/^Plan review$/i.test(plan?.name || "") || plan?.feeUsd !== 553) return false;
  const planNote = plan?.note || "";
  if (!/100% of permit fee/.test(planNote) || !/minimum \$195/.test(planNote)) return false;
  if (!/valuation > \$5,000/.test(planNote) || !/Included in totals/i.test(planNote)) return false;
  if (!/Residential ≤\$50k/.test(planNote)) return false;
  if (!/Remodel existing building uses Table A/.test(permit.caveat || "")) return false;
  if (!/Same-layout cosmetic work may not need a permit/.test(permit.caveat || "")) return false;
  if (!/moving walls\/MEP does/.test(permit.caveat || "")) return false;

  const buildingLow = phoenixKitchenBuildingFee(assumed.low);
  const buildingTypical = phoenixKitchenBuildingFee(assumed.typical);
  const buildingHigh = phoenixKitchenBuildingFee(assumed.high);
  if (buildingLow !== 353 || buildingTypical !== 553 || buildingHigh !== 928) return false;
  const planLow = phoenixKitchenPlanReviewCents(assumed.low, buildingLow);
  const planTypical = phoenixKitchenPlanReviewCents(assumed.typical, buildingTypical);
  const planHigh = phoenixKitchenPlanReviewCents(assumed.high, buildingHigh);
  if (planLow !== 35300 || planTypical !== 55300 || planHigh !== 74240) return false;
  if (planLow + planLow !== 70600) return false;
  if (planTypical + planTypical !== 110600) return false;
  if (Math.round(buildingHigh * 100) + planHigh !== 167040) return false;
  if (buildingTypical !== plan.feeUsd) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== PHOENIX_KITCHEN_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 500 || meta.quantityStep !== 10) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "150 sf" || spec.typical !== "200 sf affected area" || spec.high !== "400 sf") {
    return false;
  }
  const scope = project.scopeNote || "";
  if (!/\$75/.test(scope) || !/\$250/.test(scope)) return false;
  if (!/\$14,600/.test(scope) || !/\$41,300/.test(scope) || !/\$65,000/.test(scope)) return false;
  if (!/not this typical/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/Ordinance G-7465/.test(note) || !/Table A/.test(note)) return false;
  if (!note.includes("building permit portion $553 + plan review $553 (100% of the permit fee) = $1,106")) {
    return false;
  }
  if (!note.includes("Low $15,000 = $706 total") || !note.includes("high $75,000 = $1,670.40 total")) return false;
  if (!note.includes("$353") || !note.includes("$928") || !note.includes("$742.40")) return false;
  if (!/80% of \$928/.test(note)) return false;
  if (!/\$703 on the first \$50,000/.test(note)) return false;
  if (!/Same-layout cosmetic work may not need a permit/.test(note)) return false;
  if (!/moving walls\/MEP does/.test(note)) return false;
  if (
    permit.sourceUrl !==
    "https://www.phoenix.gov/content/dam/phoenix/pddsite/documents/impact-fees/fee-schedule.pdf"
  ) {
    return false;
  }
  return true;
}

/**
 * Phoenix kitchen People-Also-Ask entries.
 * A cabinet-only dollar is omitted: the row says same-layout cosmetic work may not need a permit and does not record a $0 fee.
 */
function phoenixKitchenPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!phoenixKitchenPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const plan = (permit.extras || [])[0];
  if (plan?.feeUsd == null) return [];

  const buildingLow = phoenixKitchenBuildingFee(assumed.low);
  const buildingTypical = phoenixKitchenBuildingFee(assumed.typical);
  const buildingHigh = phoenixKitchenBuildingFee(assumed.high);
  if (buildingLow == null || buildingTypical == null || buildingHigh == null) return [];
  const planHighCents = phoenixKitchenPlanReviewCents(assumed.high, buildingHigh);
  if (planHighCents == null) return [];
  const planHighUsd = planHighCents / 100;

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(PHOENIX_KITCHEN_SF.low);
  const atTypical = at(PHOENIX_KITCHEN_SF.typical);
  const atHigh = at(PHOENIX_KITCHEN_SF.high);
  if (atLow.job.quantity !== PHOENIX_KITCHEN_SF.low) return [];
  if (atTypical.job.quantity !== PHOENIX_KITCHEN_SF.typical) return [];
  if (atHigh.job.quantity !== PHOENIX_KITCHEN_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 50000) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is kitchen room area. The typical job is " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    PHOENIX_KITCHEN_SF.low +
    " sq ft, " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft, and " +
    PHOENIX_KITCHEN_SF.high +
    " sq ft. The calculator prices the remodel per square foot, and " +
    PHOENIX_KITCHEN_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the kitchen size changes, and it is not a new Table A fee for " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft. The other table rows are " +
    PHOENIX_KITCHEN_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    PHOENIX_KITCHEN_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the kitchen square feet on that row. The square feet are room area, and the typical row is " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    PHOENIX_KITCHEN_SF.low +
    " sq ft, " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft, and " +
    PHOENIX_KITCHEN_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the kitchen size changes, and the model rounds the permit to the nearest dollar. At " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, PHOENIX_KITCHEN_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    PHOENIX_KITCHEN_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, PHOENIX_KITCHEN_SF.low) +
    " per sq ft. At " +
    PHOENIX_KITCHEN_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, PHOENIX_KITCHEN_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft kitchen in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (50000 > atTypical.allInTypical) {
    tooMuch += "$50,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites a remodeled kitchen at $75 to $250 per sq ft, an average remodel of $14,600 to $41,300, and a new-from-scratch kitchen around $65,000 as a different scope. $50,000 is above that $41,300 remodel high and below that $65,000 scratch-kitchen figure. Wage-indexed, the high at " +
    PHOENIX_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " is " +
    usd(atTypical.allInHigh) +
    ". ";
  if (50000 < atTypical.allInHigh && 50000 > atTypical.allInTypical) {
    tooMuch += "$50,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $50,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $50,000 sits between the recorded typical valuation and the recorded high valuation, so this row does not list a separate permit fee for a $50,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new Table A fee at $50,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical kitchen remodel in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Phoenix PDD Fee Schedule, Ordinance G-7465, Table A, retrieved " +
    (permit.retrievedDate || "") +
    ". Table A sets the building permit from the project valuation. For a residential valuation of $50,000 or less, plan review is 100% of that permit fee, minimum $195, when valuation > $5,000, and that review is included in the recorded totals. At the recorded " +
    usd(assumed.typical) +
    " valuation the building permit portion is " +
    usd(buildingTypical) +
    " and plan review is " +
    usd(plan.feeUsd) +
    ", so " +
    usd(buildingTypical) +
    " + " +
    usd(plan.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a building permit portion of " +
    usd(buildingLow) +
    " plus plan review of " +
    usd(buildingLow) +
    ", which is " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is over $50,000, so plan review is 80% of the building permit fee. The building permit portion is " +
    usd(buildingHigh) +
    " and plan review is " +
    moneyExact(planHighUsd) +
    ", so " +
    usd(buildingHigh) +
    " + " +
    moneyExact(planHighUsd) +
    " = " +
    moneyExact(permit.feeHighUsd) +
    ". The $195 minimum would apply only when that plan-review share is under $195. At these bands the plan-review dollars are above $195, so the floor does not raise the recorded totals. Remodel existing building uses Table A. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Phoenix PDD Fee Schedule, Ordinance G-7465, Table A") +
    " (" +
    permit.sourceUrl +
    ").";

  const cosmeticAnswer =
    "The recorded caveat says same-layout cosmetic work may not need a permit; moving walls/MEP does. Remodel existing building uses Table A when a permit is issued. That caveat is not a $0 line on this row. When a permit is issued, the recorded totals stay " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ".";

  return [
    {
      question: "How much does a 200 sq ft kitchen remodel cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a kitchen remodel cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $50,000 too much for a kitchen remodel in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to remodel a kitchen in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "Does a same-layout cosmetic kitchen remodel need a permit in " + city.name + "?",
      answer: asSentence(cosmeticAnswer),
    },
  ];
}

/**
 * Tucson roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * Table 4-02.4 row. Returns false if those anchors drift.
 */
function tucsonRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "tucson-az" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 245.69 || permit.feeTypicalUsd !== 337.49 || permit.feeHighUsd !== 566.99) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras[0];
  const digital = extras[1];
  const tableFee = table?.feeUsd;
  const digitalFee = digital?.feeUsd;
  if (!/^4-02\.4 Construction Valuation Table$/.test(table?.name || "") || tableFee !== 318.95) {
    return false;
  }
  if ((table?.note || "") !== "Included.") return false;
  if (!/^Digital filing 1%, min \$18\.54$/.test(digital?.name || "") || digitalFee !== 18.54) return false;
  if ((digital?.note || "") !== "Included.") return false;
  if (Math.round(tableFee * 100) + Math.round(digitalFee * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }
  if (
    permit.sourceUrl !==
    "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf"
  ) {
    return false;
  }
  if (!/FY27/.test(permit.sourceName || "") || !/effective July 1, 2026/.test(permit.sourceName || "")) {
    return false;
  }
  if (!/Level-1 5%-of-building-valuation path is not used/.test(permit.caveat || "")) return false;
  if (!/contract valuation on Table 4-02\.4/.test(permit.caveat || "")) return false;

  const lowTable = 8945 + 2295 * 6;
  const typicalTable = 8945 + 2295 * 10;
  const highTable = 8945 + 2295 * 20;
  if (lowTable !== 22715 || lowTable + 1854 !== 24569) return false;
  if (typicalTable !== 31895 || typicalTable + 1854 !== 33749) return false;
  if (highTable !== 54845 || highTable + 1854 !== 56699) return false;
  if (2295 * 4 !== 9180 || 22715 + 9180 !== 31895 || 24569 + 9180 !== 33749) return false;
  if (2295 * 10 !== 22950 || 31895 + 22950 !== 54845 || 33749 + 22950 !== 56699) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 8 || meta.quantityMax !== 60 || meta.quantityStep !== 1) return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes("valuation-table portion $318.95 + digital filing $18.54 = $337.49")) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $22,000 = $566.99 total")) return false;
  if (!note.includes("$89.45 + $22.95 x 6 = $227.15") || !note.includes("$227.15 + $18.54 = $245.69")) {
    return false;
  }
  if (!note.includes("$89.45 + $22.95 x 10 = $318.95")) return false;
  if (!note.includes("$89.45 + $22.95 x 20 = $548.45") || !note.includes("$548.45 + $18.54 = $566.99")) {
    return false;
  }
  if (!/rounded up to the nearest fee threshold/.test(note)) return false;
  if (!/1% of the total fee is below/.test(note)) return false;
  if (!/contract valuation on Table 4-02\.4/.test(note)) return false;
  if (!/Level-1 5%-of-building-valuation path is not used/.test(note)) return false;
  if (!/not unincorporated Pima County/.test(note)) return false;
  if (!note.includes("$91.80") || !note.includes("$229.50")) return false;
  return true;
}

/**
 * Tucson roof People-Also-Ask entries.
 * A same-material exemption is omitted: the recorded row and the cited FY27
 * schedule text used here do not state one. Dollars stay on Table 4-02.4.
 */
function tucsonRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!tucsonRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const tableFee = (permit.extras || [])[0]?.feeUsd;
  const digitalFee = (permit.extras || [])[1]?.feeUsd;
  if (tableFee == null || digitalFee == null) return [];

  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atRoof.job.quantity !== squaresForRoof) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atRoof.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atRoof.allInLow !== atRoof.job.low + atRoof.permitLow) return [];
  if (atRoof.allInTypical !== atRoof.job.typical + atRoof.permitTypical) return [];
  if (atRoof.allInHigh !== atRoof.job.high + atRoof.permitHigh) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atRoof.permitLow) +
    " on the low, " +
    usd(atRoof.permitTypical) +
    " on the typical, and " +
    usd(atRoof.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the roof size changes, and it is not a new Table 4-02.4 fee for 20 squares. The nearest table rows are " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical and " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the roof size changes, and the model rounds the permit to the nearest dollar. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is outside the about 13 to 18 squares this page uses for a typical house. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $30,000 is above that recorded high valuation, so this row does not list a permit fee for a $30,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new Table 4-02.4 fee at $30,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, Table 4-02.4 Construction Valuation, retrieved " +
    (permit.retrievedDate || "") +
    ". Alterations use contract valuation on Table 4-02.4. The Level-1 5%-of-building-valuation path is not used because a contract value is assumed. This is City of Tucson PDSD, not unincorporated Pima County. At the recorded " +
    usd(assumed.typical) +
    " valuation the valuation-table portion is " +
    moneyExact(tableFee) +
    " and digital filing is " +
    moneyExact(digitalFee) +
    ", so " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". Digital filing is 1% of the total fee, and on each recorded band that 1% is below the " +
    moneyExact(digitalFee) +
    " minimum, so the minimum is the digital filing line. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026") +
    " (" +
    permit.sourceUrl +
    ").";

  const valuationAnswer =
    "Recorded assumed valuations for a roof replacement in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". All three are inside Table 4-02.4 band $2,000.01 to $25,000: base $89.45 plus $22.95 per extra $1,000 above $2,000, plus digital filing at the $18.54 minimum. Each of those valuations is already on a $1,000 threshold, so the schedule's round-up to the nearest fee threshold does not add another thousand. Low is 6 extra thousands: $89.45 + $22.95 x 6 = $227.15, then $227.15 + $18.54 = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical is 10 extra thousands: $89.45 + $22.95 x 10 = " +
    moneyExact(tableFee) +
    ", then " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". High is 20 extra thousands: $89.45 + $22.95 x 20 = $548.45, then $548.45 + $18.54 = " +
    moneyExact(permit.feeHighUsd) +
    ". The $227.15 and $548.45 figures are the valuation-table portions of those recorded totals, not separate extras. The recorded extra on this row is the typical valuation-table portion of " +
    moneyExact(tableFee) +
    ". Alterations use contract valuation on Table 4-02.4. The Level-1 5%-of-building-valuation path is not used because a contract value is assumed. This is City of Tucson PDSD, not unincorporated Pima County.";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a roof permit cost at $8,000, $12,000, and $22,000 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const TUCSON_HVAC_SYSTEMS = { one: 1, two: 2, three: 3 };
const TUCSON_HVAC_TOO_MUCH_USD = 15000;

/**
 * Tucson HVAC People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * 4-02.9 trade row. Returns false if those anchors drift.
 */
function tucsonHvacPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "tucson-az" || project.projectSlug !== "hvac-replacement" || !permit) return false;
  if (permit.feeModel !== "flat" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 168.54 || permit.feeTypicalUsd !== 218.54 || permit.feeHighUsd !== 218.54) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const first = extras[0];
  const additional = extras[1];
  const digital = extras[2];
  if (!/^Trade permit first item \(AC\/heater replace, max 2\)$/.test(first?.name || "") || first?.feeUsd !== 150) {
    return false;
  }
  if ((first?.note || "") !== "Included.") return false;
  if (!/^Each additional trade item$/.test(additional?.name || "") || additional?.feeUsd !== 50) return false;
  if ((additional?.note || "") !== "Second unit in typical. Included.") return false;
  if (!/^Digital filing 1%, min \$18\.54$/.test(digital?.name || "") || digital?.feeUsd !== 18.54) return false;
  if ((digital?.note || "") !== "Included.") return false;
  if (Math.round(first.feeUsd * 100) + Math.round(digital.feeUsd * 100) !== Math.round(permit.feeLowUsd * 100)) {
    return false;
  }
  if (
    Math.round(first.feeUsd * 100) +
      Math.round(additional.feeUsd * 100) +
      Math.round(digital.feeUsd * 100) !==
    Math.round(permit.feeTypicalUsd * 100)
  ) {
    return false;
  }
  if (Math.round(permit.feeHighUsd * 100) !== Math.round(permit.feeTypicalUsd * 100)) return false;
  if (!/4-02\.9 Trade Permits/.test(permit.sourceName || "")) return false;
  if (
    permit.sourceUrl !==
    "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf"
  ) {
    return false;
  }

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== TUCSON_HVAC_SYSTEMS.one || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 1 || meta.quantityMax !== 4 || meta.quantityStep !== 1) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || !/3-ton \(36,000 BTU\)/.test(spec.typical)) return false;
  const scope = project.scopeNote || "";
  if (!/\$7,500/.test(scope) || !/\$5,000/.test(scope) || !/\$12,500/.test(scope) || !/\$22,000/.test(scope)) {
    return false;
  }
  if (!/new ductwork/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/4-02\.9 Trade Permits/.test(note) || !note.includes("2026-09-01")) return false;
  if (!/F\. Air Conditioner\/Heater Repair\/Replace \(max 2\)/.test(note)) return false;
  if (!/not the valuation table/.test(note)) return false;
  if (!note.includes("Low (1 item): first trade item $150 + digital filing min $18.54 = $168.54.")) return false;
  if (
    !note.includes(
      "Typical furnace + 3-ton (2 items): first trade item $150 + each additional trade item $50 + digital filing $18.54 = $218.54.",
    )
  ) {
    return false;
  }
  if (!note.includes("High equals typical on this row ($218.54) because max 2 items is already the typical band.")) {
    return false;
  }
  if (!/\$150 \+ \$50 = \$200/.test(note) || !/\$200 \+ \$18\.54 = \$218\.54/.test(note)) return false;
  if (!/1% is below that minimum/.test(note)) return false;
  if (!/Tonnage does not move the fee/.test(note)) return false;
  if (!/no assumed valuation is recorded/.test(note)) return false;
  if (!/trade table not valuation/.test(note)) return false;
  return true;
}

/**
 * Tucson HVAC People-Also-Ask entries.
 * A code exemption is omitted: the recorded row requires a permit and does not
 * list a $0 like-for-like path. Tonnage is not a separate published rate.
 */
function tucsonHvacPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!tucsonHvacPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const first = (permit.extras || [])[0];
  const additional = (permit.extras || [])[1];
  const digital = (permit.extras || [])[2];
  if (first?.feeUsd == null || additional?.feeUsd == null || digital?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atOne = at(TUCSON_HVAC_SYSTEMS.one);
  const atTwo = at(TUCSON_HVAC_SYSTEMS.two);
  const atThree = at(TUCSON_HVAC_SYSTEMS.three);
  if (atOne.job.quantity !== TUCSON_HVAC_SYSTEMS.one) return [];
  if (atTwo.job.quantity !== TUCSON_HVAC_SYSTEMS.two) return [];
  if (atThree.job.quantity !== TUCSON_HVAC_SYSTEMS.three) return [];
  if (atOne.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atOne.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atOne.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atOne.permitTypical !== atTwo.permitTypical || atTwo.permitTypical !== atThree.permitTypical) return [];
  if (atOne.allInLow !== atOne.job.low + atOne.permitLow) return [];
  if (atOne.allInTypical !== atOne.job.typical + atOne.permitTypical) return [];
  if (atOne.allInHigh !== atOne.job.high + atOne.permitHigh) return [];
  if (atTwo.allInTypical !== atTwo.job.typical + atTwo.permitTypical) return [];
  if (atThree.allInTypical !== atThree.job.typical + atThree.permitTypical) return [];

  const perSystem = (allIn: number, systems: number) => usd(allIn / systems);

  let crossSystems: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= TUCSON_HVAC_TOO_MUCH_USD) {
      crossSystems = qty;
      break;
    }
  }

  const sizeAnswer =
    "The documented typical job is a " +
    spec.typical +
    ". This cost model prices that job as one system. It does not price tons as a separate rate. The cost-by-size rows are " +
    TUCSON_HVAC_SYSTEMS.one +
    " system, " +
    TUCSON_HVAC_SYSTEMS.two +
    " systems, and " +
    TUCSON_HVAC_SYSTEMS.three +
    " systems. The calculator scales the installed job by the system count divided by " +
    meta.defaultQuantity +
    ", and " +
    TUCSON_HVAC_SYSTEMS.one +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale. At " +
    TUCSON_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the recorded trade bands. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atOne.permitLow) +
    " on the low, " +
    usd(atOne.permitTypical) +
    " on the typical, and " +
    usd(atOne.permitHigh) +
    " on the high. The typical recorded fee is the 2-item trade path (a furnace plus a 3-ton air conditioner), not a per-ton permit. The permit is a flat trade fee, so it is not rescaled when the system count changes. The other table rows are " +
    TUCSON_HVAC_SYSTEMS.two +
    " systems at " +
    usd(atTwo.allInTypical) +
    " typical and " +
    TUCSON_HVAC_SYSTEMS.three +
    " systems at " +
    usd(atThree.allInTypical) +
    " typical.";

  const perSystemAnswer =
    "Cost per system on this page is the all-in typical divided by the system count on that row. One system is a complete heating-and-cooling change-out, not a single trade item and not a ton of capacity. The cost-by-size rows are " +
    TUCSON_HVAC_SYSTEMS.one +
    " system, " +
    TUCSON_HVAC_SYSTEMS.two +
    " systems, and " +
    TUCSON_HVAC_SYSTEMS.three +
    " systems. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atOne.permitTypical) +
    " on each of those rows, because this permit is a flat trade fee and is not rescaled when the system count changes, and the model rounds the permit to the nearest dollar. At " +
    TUCSON_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in typical is " +
    usd(atOne.allInTypical) +
    ", which is " +
    perSystem(atOne.allInTypical, TUCSON_HVAC_SYSTEMS.one) +
    " per system after rounding to the nearest dollar. At " +
    TUCSON_HVAC_SYSTEMS.two +
    " systems the all-in typical is " +
    usd(atTwo.allInTypical) +
    ", or " +
    perSystem(atTwo.allInTypical, TUCSON_HVAC_SYSTEMS.two) +
    " per system. At " +
    TUCSON_HVAC_SYSTEMS.three +
    " systems the all-in typical is " +
    usd(atThree.allInTypical) +
    ", or " +
    perSystem(atThree.allInTypical, TUCSON_HVAC_SYSTEMS.three) +
    " per system. Those per-system figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    TUCSON_HVAC_SYSTEMS.one +
    " system in " +
    label +
    ", the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. ";
  if (TUCSON_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is above that typical of " + usd(atOne.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an average of $7,500, a common range of $5,000 to $12,500, and up to $22,000 with new ductwork. $15,000 is above that $12,500 common high and below that $22,000 new-duct figure. Wage-indexed, the high at " +
    TUCSON_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " is " +
    usd(atOne.allInHigh) +
    ". ";
  if (TUCSON_HVAC_TOO_MUCH_USD < atOne.allInHigh && TUCSON_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSystems != null) {
    const crossed = at(crossSystems);
    tooMuch +=
      "On the typical path the same scale first reaches $15,000 at " +
      crossSystems +
      " systems (" +
      usd(crossed.allInTypical) +
      " typical), which is above the one-system job this page uses as typical. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " typical and high, and " +
    moneyExact(permit.feeLowUsd) +
    " low. Those fees come from 4-02.9 item count, not from project value. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ", and no assumed valuation is recorded on this row. $15,000 is not a valuation input, so this row does not list a permit fee for a $15,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atOne.permitTypical) +
    ". They do not look up a Table 4-02.4 fee at $15,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical HVAC replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, 4-02.9 Trade Permits, retrieved " +
    (permit.retrievedDate || "") +
    ". HVAC change-out is listed trade F (Air Conditioner/Heater Repair/Replace, max 2), not Table 4-02.4 valuation. A 1-item change-out is the first item " +
    moneyExact(first.feeUsd) +
    " plus the digital filing minimum " +
    moneyExact(digital.feeUsd) +
    ", so " +
    moneyExact(first.feeUsd) +
    " + " +
    moneyExact(digital.feeUsd) +
    " = " +
    moneyExact(permit.feeLowUsd) +
    ". The typical furnace plus 3-ton path is two items: " +
    moneyExact(first.feeUsd) +
    " + " +
    moneyExact(additional.feeUsd) +
    " + " +
    moneyExact(digital.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". High equals that typical (" +
    moneyExact(permit.feeHighUsd) +
    ") because the listed maximum of 2 items is already the typical band. Digital filing is 1% of the trade-permit fee, and on both bands that 1% is below the " +
    moneyExact(digital.feeUsd) +
    " minimum, so the minimum is the digital filing line. This row does not record a $0 exemption for a like-for-like change-out. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026, 4-02.9 Trade Permits (" +
    permit.sourceUrl +
    ").";

  const unitAnswer =
    "On section 4-02.9, a unit is a listed trade item, and trade F (Air Conditioner/Heater Repair/Replace) allows at most 2. A 1-unit change-out is the first item at " +
    moneyExact(first.feeUsd) +
    " plus the digital filing minimum of " +
    moneyExact(digital.feeUsd) +
    ", which is " +
    moneyExact(permit.feeLowUsd) +
    ". A 2-unit change-out adds one additional item at " +
    moneyExact(additional.feeUsd) +
    ". The trade lines are " +
    moneyExact(first.feeUsd) +
    " + " +
    moneyExact(additional.feeUsd) +
    " = $200, and digital filing stays the same " +
    moneyExact(digital.feeUsd) +
    " minimum because 1% of either subtotal is below that minimum, so $200 + " +
    moneyExact(digital.feeUsd) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". The extra " +
    moneyExact(additional.feeUsd) +
    " is the only difference between the recorded low and the recorded typical. High equals the typical " +
    moneyExact(permit.feeHighUsd) +
    " because the listed maximum of 2 items is already the typical band. This row does not price a third item. The typical 2-item path on this page is a furnace plus a 3-ton air conditioner. Tonnage does not change the fee. The cost model is separate: it prices one complete system as the typical job and adds the rounded typical permit of " +
    usd(atOne.permitTypical) +
    " on that row. It does not switch the all-in to the 1-item fee of " +
    moneyExact(permit.feeLowUsd) +
    " when the calculator is set to 1 system.";

  return [
    {
      question: "How much does a 3-ton HVAC replacement cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does HVAC replacement cost per system in " + city.name + "?",
      answer: asSentence(perSystemAnswer),
    },
    {
      question: "Is $15,000 too much for HVAC replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace an air conditioner or furnace in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a 1-unit versus a 2-unit HVAC change-out permit cost in " + city.name + "?",
      answer: asSentence(unitAnswer),
    },
  ];
}

const AUSTIN_HVAC_SYSTEMS = { one: 1, two: 2, three: 3 };
const AUSTIN_HVAC_TOO_MUCH_USD = 15000;

/**
 * Austin HVAC People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * Change-Out Program row. Returns false if those anchors drift.
 */
function austinHvacPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "austin-tx" || project.projectSlug !== "hvac-replacement" || !permit) return false;
  if (permit.feeModel !== "flat" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 80.09 || permit.feeTypicalUsd !== 80.09 || permit.feeHighUsd !== 121.56) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const first = extras[0];
  const additional = extras[1];
  if (!/^Change-Out Program; HVAC \(first system\)$/.test(first?.name || "") || first?.feeUsd !== 80.09) {
    return false;
  }
  if ((first?.note || "") !== "FY26 adopted residential change-out fee from City Council fee exhibit.") return false;
  if (!/^Each additional HVAC system$/.test(additional?.name || "") || additional?.feeUsd !== 41.47) return false;
  if ((additional?.note || "") !== "FY26. High total assumes first + one additional.") return false;
  if (Math.round(first.feeUsd * 100) !== Math.round(permit.feeLowUsd * 100)) return false;
  if (Math.round(permit.feeTypicalUsd * 100) !== Math.round(permit.feeLowUsd * 100)) return false;
  if (
    Math.round(first.feeUsd * 100) + Math.round(additional.feeUsd * 100) !==
    Math.round(permit.feeHighUsd * 100)
  ) {
    return false;
  }
  if (!/CM Vela Item 4 Motion 1 Attachment 1/.test(permit.sourceName || "")) return false;
  if (/\u2014/.test(permit.sourceName || "")) return false;
  if (permit.sourceUrl !== "https://services.austintexas.gov/edims/document.cfm?id=456810") return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== AUSTIN_HVAC_SYSTEMS.one || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 1 || meta.quantityMax !== 4 || meta.quantityStep !== 1) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || !/3-ton \(36,000 BTU\)/.test(spec.typical)) return false;
  const scope = project.scopeNote || "";
  if (!/\$7,500/.test(scope) || !/\$5,000/.test(scope) || !/\$12,500/.test(scope) || !/\$22,000/.test(scope)) {
    return false;
  }
  if (!/new ductwork/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/Change-Out Program/.test(note) || !note.includes("2026-08-13")) return false;
  if (!note.includes("Low and typical are the first system Change-Out fee of $80.09.")) return false;
  if (!note.includes("$80.09 + $41.47 = $121.56")) return false;
  if (!/A third system is not totaled/.test(note)) return false;
  if (!/not per ton/.test(note)) return false;
  if (!/No assumed valuation is recorded/.test(note)) return false;
  if (!/like-for-like HVAC/.test(note)) return false;
  if (!note.includes("New systems, duct redesign, or work outside the program use different residential building/mechanical fees.")) {
    return false;
  }
  if (/\u2014/.test(note) || /\u2014/.test(first?.name || "")) return false;
  return true;
}

/**
 * Austin HVAC People-Also-Ask entries.
 * A code exemption is omitted: the recorded row requires a permit and does not
 * list a $0 like-for-like path. Tonnage is not a separate published rate.
 */
function austinHvacPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!austinHvacPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const first = (permit.extras || [])[0];
  const additional = (permit.extras || [])[1];
  if (first?.feeUsd == null || additional?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atOne = at(AUSTIN_HVAC_SYSTEMS.one);
  const atTwo = at(AUSTIN_HVAC_SYSTEMS.two);
  const atThree = at(AUSTIN_HVAC_SYSTEMS.three);
  if (atOne.job.quantity !== AUSTIN_HVAC_SYSTEMS.one) return [];
  if (atTwo.job.quantity !== AUSTIN_HVAC_SYSTEMS.two) return [];
  if (atThree.job.quantity !== AUSTIN_HVAC_SYSTEMS.three) return [];
  if (atOne.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atOne.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atOne.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atOne.permitTypical !== atTwo.permitTypical || atTwo.permitTypical !== atThree.permitTypical) return [];
  if (atOne.allInLow !== atOne.job.low + atOne.permitLow) return [];
  if (atOne.allInTypical !== atOne.job.typical + atOne.permitTypical) return [];
  if (atOne.allInHigh !== atOne.job.high + atOne.permitHigh) return [];
  if (atTwo.allInTypical !== atTwo.job.typical + atTwo.permitTypical) return [];
  if (atThree.allInTypical !== atThree.job.typical + atThree.permitTypical) return [];

  const perSystem = (allIn: number, systems: number) => usd(allIn / systems);

  let crossSystems: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= AUSTIN_HVAC_TOO_MUCH_USD) {
      crossSystems = qty;
      break;
    }
  }

  const sizeAnswer =
    "The documented typical job is a " +
    spec.typical +
    ". This cost model prices that job as one system. It does not price tons as a separate rate. The cost-by-size rows are " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system, " +
    AUSTIN_HVAC_SYSTEMS.two +
    " systems, and " +
    AUSTIN_HVAC_SYSTEMS.three +
    " systems. The calculator scales the installed job by the system count divided by " +
    meta.defaultQuantity +
    ", and " +
    AUSTIN_HVAC_SYSTEMS.one +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale. At " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the recorded Change-Out bands. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atOne.permitLow) +
    " on the low, " +
    usd(atOne.permitTypical) +
    " on the typical, and " +
    usd(atOne.permitHigh) +
    " on the high. The typical recorded fee is the 1-system Change-Out Program fee, not a per-ton permit. The permit is a flat Change-Out fee, so it is not rescaled when the system count changes. The other table rows are " +
    AUSTIN_HVAC_SYSTEMS.two +
    " systems at " +
    usd(atTwo.allInTypical) +
    " typical and " +
    AUSTIN_HVAC_SYSTEMS.three +
    " systems at " +
    usd(atThree.allInTypical) +
    " typical.";

  const perSystemAnswer =
    "Cost per system on this page is the all-in typical divided by the system count on that row. One system is a complete heating-and-cooling change-out, not a single Change-Out line and not a ton of capacity. The cost-by-size rows are " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system, " +
    AUSTIN_HVAC_SYSTEMS.two +
    " systems, and " +
    AUSTIN_HVAC_SYSTEMS.three +
    " systems. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atOne.permitTypical) +
    " on each of those rows, because this permit is a flat Change-Out fee and is not rescaled when the system count changes, and the model rounds the permit to the nearest dollar. At " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in typical is " +
    usd(atOne.allInTypical) +
    ", which is " +
    perSystem(atOne.allInTypical, AUSTIN_HVAC_SYSTEMS.one) +
    " per system after rounding to the nearest dollar. At " +
    AUSTIN_HVAC_SYSTEMS.two +
    " systems the all-in typical is " +
    usd(atTwo.allInTypical) +
    ", or " +
    perSystem(atTwo.allInTypical, AUSTIN_HVAC_SYSTEMS.two) +
    " per system. At " +
    AUSTIN_HVAC_SYSTEMS.three +
    " systems the all-in typical is " +
    usd(atThree.allInTypical) +
    ", or " +
    perSystem(atThree.allInTypical, AUSTIN_HVAC_SYSTEMS.three) +
    " per system. Those per-system figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system in " +
    label +
    ", the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. ";
  if (AUSTIN_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is above that typical of " + usd(atOne.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an average of $7,500, a common range of $5,000 to $12,500, and up to $22,000 with new ductwork. $15,000 is above that $12,500 common high and below that $22,000 new-duct figure. Wage-indexed, the high at " +
    AUSTIN_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " is " +
    usd(atOne.allInHigh) +
    ". ";
  if (AUSTIN_HVAC_TOO_MUCH_USD < atOne.allInHigh && AUSTIN_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSystems != null) {
    const crossed = at(crossSystems);
    tooMuch +=
      "On the typical path the same scale first reaches $15,000 at " +
      crossSystems +
      " systems (" +
      usd(crossed.allInTypical) +
      " typical), which is above the one-system job this page uses as typical. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " low and typical, and " +
    moneyExact(permit.feeHighUsd) +
    " high. Those fees come from Change-Out Program system count, not from project value. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ", and no assumed valuation is recorded on this row. $15,000 is not a valuation input, so this row does not list a permit fee for a $15,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atOne.permitTypical) +
    ". They do not look up a valuation-table fee at $15,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical HVAC replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Austin Council backup, CM Vela Item 4 Motion 1 Attachment 1 (FY26 residential fees), retrieved " +
    (permit.retrievedDate || "") +
    ". Low and typical are the first-system Change-Out fee of " +
    moneyExact(first.feeUsd) +
    ". High adds one additional system at " +
    moneyExact(additional.feeUsd) +
    ", so " +
    moneyExact(first.feeUsd) +
    " + " +
    moneyExact(additional.feeUsd) +
    " = " +
    moneyExact(permit.feeHighUsd) +
    ". This is the residential Change-Out Program for like-for-like HVAC, not a valuation table. This row does not record a $0 exemption for a like-for-like change-out. New systems, duct redesign, or work outside the program use different residential building/mechanical fees, and those other fees are not in these totals. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Austin Council backup; CM Vela Item 4 Motion 1 Attachment 1 (FY26 residential fees)") +
    " (" +
    permit.sourceUrl +
    ").";

  const unitAnswer =
    "On the Change-Out Program, a system is one like-for-like HVAC change-out. A 1-system permit is the first-system fee of " +
    moneyExact(first.feeUsd) +
    ", which is both the recorded low and the recorded typical. A 2-system permit adds one additional system at " +
    moneyExact(additional.feeUsd) +
    ". The arithmetic is " +
    moneyExact(first.feeUsd) +
    " + " +
    moneyExact(additional.feeUsd) +
    " = " +
    moneyExact(permit.feeHighUsd) +
    ", and that sum is the recorded high. The extra " +
    moneyExact(additional.feeUsd) +
    " is the only difference between the recorded typical and the recorded high. This row does not total a third system. The fee is per system, not per ton. A 3-ton (36,000 BTU) like-for-like split system is the documented typical job, and a 2-ton or 5-ton unit is not a separate fee band. The cost model is separate: it prices one complete system as the typical job and adds the rounded typical permit of " +
    usd(atOne.permitTypical) +
    " on that row. The 2-system and 3-system cost-by-size rows still use that same rounded typical permit. They do not switch the all-in to the high fee of " +
    moneyExact(permit.feeHighUsd) +
    ".";

  return [
    {
      question: "How much does a 3-ton HVAC replacement cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does HVAC replacement cost per system in " + city.name + "?",
      answer: asSentence(perSystemAnswer),
    },
    {
      question: "Is $15,000 too much for HVAC replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace an air conditioner or furnace in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a 1-system versus a 2-system HVAC change-out permit cost in " + city.name + "?",
      answer: asSentence(unitAnswer),
    },
  ];
}

const AUSTIN_ROOF_EXPRESS_TRIGGER =
  "WUI and 50%+ replacement, or replacing more than 128 sq ft of decking";
const AUSTIN_ROOF_EXPRESS_SUM =
  "Express Residential Plan Review $106.72 + Residential Express Permits inspection $66.33 = $173.05";
const AUSTIN_ROOF_ZERO_BANDS = "Recorded fee low, typical, and high stay $0 / $0 / $0.";
const AUSTIN_ROOF_PDF_LINE = "Residential Express Permits/Kitchen Remodels - Inspection";
const AUSTIN_ROOF_CAVEAT =
  "Typical asphalt-on-asphalt reroof is listed as exempt under Work Exempt from Building Permits residential items 12 (asphalt shingles replacing existing asphalt shingles) and 13 (roof covering replacement that does not adversely affect the roof structure), unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced. Express-permit path still exists for WUI 50%+ jobs and for decking replacement over 128 sq ft. Express plan review and Express inspection are recorded add-ons and are not in the $0 typical total. Fire roof-replacement inspection is a per-case add-on, not in the $0 typical total.";
const AUSTIN_ROOF_SOURCE_NAME =
  "City of Austin Work Exempt from Building Permits (residential items 12\u201313); FY 2025-26 Residential Building Plan Review & Inspection Permit Fees PDF";

/**
 * Austin roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars stay the recorded $0
 * exemption. Express $173.05 and Fire $370 are extras and are not totals.
 * Returns false if those anchors drift.
 */
function austinRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "austin-tx" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "none" || permit.permitRequired !== false) return false;
  if (permit.feeLowUsd !== 0 || permit.feeHighUsd !== 0) return false;
  const typicalFee = permit.feeTypicalUsd;
  if (typicalFee !== 0) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-31") return false;
  if (city.permitDeptName !== "Austin Development Services Department (DSD)") return false;
  if (permit.sourceUrl !== "https://www.austintexas.gov/development-services/work-exempt-building-permits") {
    return false;
  }
  if (permit.sourceName !== AUSTIN_ROOF_SOURCE_NAME) return false;
  if (/\u2014/.test(permit.sourceName)) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  if ((permit.caveat || "") !== AUSTIN_ROOF_CAVEAT) return false;
  if (!/items 12/.test(permit.caveat) || !/asphalt shingles replacing existing asphalt shingles/.test(permit.caveat)) {
    return false;
  }
  if (!/Wildland-Urban Interface and 50% or more/.test(permit.caveat)) return false;
  if (!/decking replacement over 128 sq ft/.test(permit.caveat)) return false;
  if (!/not in the \$0 typical total/.test(permit.caveat)) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const review = extras[0];
  const inspection = extras[1];
  const fire = extras[2];
  if (!review || !inspection || !fire) return false;
  if (review.name !== "Express Residential Plan Review (only if the asphalt-reroof exemption does not apply)") {
    return false;
  }
  if (inspection.name !== "Residential Express Permits inspection (only if a permit is issued)") return false;
  if (fire.name !== "Austin Fire Residential Roof Replacement Inspection (per-case)") return false;
  const reviewFee = review.feeUsd;
  const inspectionFee = inspection.feeUsd;
  const fireFee = fire.feeUsd;
  if (reviewFee == null || inspectionFee == null || fireFee == null) return false;
  if (Math.round(reviewFee * 100) !== 10672) return false;
  if (Math.round(inspectionFee * 100) !== 6633) return false;
  if (Math.round(fireFee * 100) !== 37000) return false;
  if (Math.round(reviewFee * 100) + Math.round(inspectionFee * 100) !== 17305) return false;
  if (Math.round(reviewFee * 100) + Math.round(inspectionFee * 100) === Math.round(typicalFee * 100)) {
    return false;
  }
  if (Math.round(fireFee * 100) === Math.round(typicalFee * 100)) return false;
  const reviewNote = review.note || "";
  const inspectionNote = inspection.note || "";
  const fireNote = fire.note || "";
  if (
    reviewNote !==
    "FY 2025-26 Residential Building Plan Review PDF (updated 7/15/2026). Express path for roof work that needs a permit (WUI and 50%+ replacement, or replacing more than 128 sq ft of decking). Not included in totals."
  ) {
    return false;
  }
  if (!reviewNote.includes(AUSTIN_ROOF_EXPRESS_TRIGGER)) return false;
  if (!/Not included in totals/.test(reviewNote)) return false;
  if (
    inspectionNote !==
    "FY 2025-26 PDF line 'Residential Express Permits/Kitchen Remodels - Inspection'. Not included in totals."
  ) {
    return false;
  }
  if (!inspectionNote.includes(AUSTIN_ROOF_PDF_LINE)) return false;
  if (
    fireNote !==
    "FY 2025-26 PDF, fire miscellaneous; listed as may or may not apply per case. Not included in totals."
  ) {
    return false;
  }
  if (!/may or may not apply per case/.test(fireNote)) return false;
  if (!/Not included in totals/.test(fireNote)) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 8 || meta.quantityMax !== 60 || meta.quantityStep !== 1) return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;

  if (!austinRoofCalculationNoteOk(permit.calculationNote)) return false;
  const note = permit.calculationNote || "";
  if (!note.includes(AUSTIN_ROOF_EXPRESS_SUM)) return false;
  if (!note.includes(AUSTIN_ROOF_ZERO_BANDS)) return false;
  if (!note.includes(AUSTIN_ROOF_EXPRESS_TRIGGER)) return false;
  if (!/source retrieved 2026-08-31/.test(note)) return false;
  if (/\u2014/.test(note)) return false;
  return true;
}

/**
 * Austin roof People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. The permit line stays $0.
 * Express and Fire stay recorded extras. No further permit total is built.
 */
function austinRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!austinRoofPaaAnchors(city, project, permit)) return [];
  if (!austinRoofPageCopy(city, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  if (permit.typicalProjectValueUsd == null) return [];
  const review = (permit.extras || [])[0];
  const inspection = (permit.extras || [])[1];
  const fire = (permit.extras || [])[2];
  if (!review || !inspection || !fire) return [];
  const reviewFee = review.feeUsd;
  const inspectionFee = inspection.feeUsd;
  const fireFee = fire.feeUsd;
  if (reviewFee == null || inspectionFee == null || fireFee == null) return [];

  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atRoof.job.quantity !== squaresForRoof) return [];
  if (atRoof.permitLow !== 0 || atRoof.permitTypical !== 0 || atRoof.permitHigh !== 0) return [];
  if (atLow.permitTypical !== 0 || atTypical.permitTypical !== 0 || atHigh.permitTypical !== 0) return [];
  if (atRoof.allInLow !== atRoof.job.low) return [];
  if (atRoof.allInTypical !== atRoof.job.typical) return [];
  if (atRoof.allInHigh !== atRoof.job.high) return [];
  if (atLow.allInTypical !== atLow.job.typical) return [];
  if (atTypical.allInTypical !== atTypical.job.typical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. The recorded permit on the typical path is " +
    moneyExact(permit.feeTypicalUsd) +
    ", so those figures are the wage-indexed job cost. " +
    AUSTIN_ROOF_ZERO_BANDS +
    " The model rounds each recorded fee to the nearest dollar before adding it, so the all-in uses " +
    usd(atRoof.permitLow) +
    " on the low, " +
    usd(atRoof.permitTypical) +
    " on the typical, and " +
    usd(atRoof.permitHigh) +
    " on the high. The permit stays " +
    moneyExact(permit.feeTypicalUsd) +
    " when the roof size changes. It is not a new fee for 20 squares. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    " at " +
    usd(atLow.allInTypical) +
    " typical, " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". " +
    AUSTIN_ROOF_ZERO_BANDS +
    " The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is the recorded exemption and is not rescaled when the roof size changes, and the model rounds the permit to the nearest dollar. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate, and they are not a permit fee.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical)";
    if (crossSquares > 18) {
      tooMuch += ", which is outside the about 13 to 18 squares this page uses for a typical house";
    }
    tooMuch += ". ";
  }
  tooMuch +=
    "The recorded permit on this row stays " +
    moneyExact(permit.feeLowUsd) +
    " low, " +
    moneyExact(permit.feeTypicalUsd) +
    " typical, and " +
    moneyExact(permit.feeHighUsd) +
    " high on the asphalt-on-asphalt exemption. $30,000 is above the recorded high assumed valuation of " +
    usd(assumed.high) +
    ", so this row does not list a permit fee for a $30,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not turn the Express subtotal of " +
    moneyExact(173.05) +
    " or the per-case Fire inspection of " +
    moneyExact(fireFee) +
    " into the typical permit.";

  const permitAnswer =
    "On the typical asphalt-on-asphalt path, no. " +
    city.permitDeptName +
    " lists a typical roof replacement in " +
    label +
    " as not requiring a permit, and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". Item 12 exempts asphalt shingles replacing existing asphalt shingles. Item 13 exempts roof-covering replacement that does not adversely affect the roof structure. The exemption does not apply when the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced. An Express-permit path is recorded when the exemption does not apply (" +
    AUSTIN_ROOF_EXPRESS_TRIGGER +
    "). Replacing more than 128 sq ft of decking is that recorded decking path. Those cases are not the typical path, and their dollars are not included in the " +
    moneyExact(permit.feeTypicalUsd) +
    " totals. The cited source is City of Austin Work Exempt from Building Permits, retrieved " +
    permit.retrievedDate +
    ". " +
    "Confirm exemption, WUI status, and decking scope with Austin Development Services Department before filing.";

  const zeroAnswer =
    "The recorded " +
    moneyExact(permit.feeTypicalUsd) +
    " is the published asphalt-on-asphalt exemption, not a missing fee and not a blank schedule. " +
    AUSTIN_ROOF_ZERO_BANDS +
    " Low, typical, and high are all recorded. They are not left blank. Item 12 exempts asphalt shingles replacing existing asphalt shingles, and item 13 exempts roof-covering replacement that does not adversely affect the roof structure, unless the property is in the Wildland-Urban Interface and 50% or more of the roofing is being replaced. The Express subtotal " +
    AUSTIN_ROOF_EXPRESS_SUM +
    " is not included in totals. Austin Fire Residential Roof Replacement Inspection " +
    moneyExact(fireFee) +
    " is per-case and is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical and not in the " +
    moneyExact(173.05) +
    " Express subtotal. Recorded assumed valuations are low " +
    usd(assumed.low) +
    ", typical " +
    usd(assumed.typical) +
    ", and high " +
    usd(assumed.high) +
    ". Those values do not replace the " +
    moneyExact(permit.feeTypicalUsd) +
    " with a valuation-table fee.";

  const expressAnswer =
    "When the asphalt-on-asphalt exemption does not apply, the recorded alternate is an Express permit for " +
    AUSTIN_ROOF_EXPRESS_TRIGGER +
    ". Express Residential Plan Review is " +
    moneyExact(reviewFee) +
    " and Residential Express Permits inspection is " +
    moneyExact(inspectionFee) +
    ", so " +
    AUSTIN_ROOF_EXPRESS_SUM +
    ". That " +
    moneyExact(173.05) +
    " is the recorded Express subtotal only. It is not included in totals, and it is not added to the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. This row does not invent any further permit line on that path. The inspection line on the PDF is labeled " +
    AUSTIN_ROOF_PDF_LINE +
    ". That label is the schedule line for this Express inspection. It is not a kitchen-remodel fee added onto this roof row. The per-case Fire inspection is not part of the " +
    moneyExact(173.05) +
    " subtotal. Source retrieved " +
    permit.retrievedDate +
    ". Confirm exemption, WUI status, and decking scope with Austin Development Services Department before filing.";

  const fireAnswer =
    "Austin Fire Residential Roof Replacement Inspection is " +
    moneyExact(fireFee) +
    ". The recorded extra lists it as may or may not apply per case, and it is not included in totals. It is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical, and it is not in the " +
    moneyExact(173.05) +
    " Express subtotal. This page does not add " +
    moneyExact(fireFee) +
    " to either figure, and it does not record a combined Express-plus-Fire total. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ".";

  const bandsAnswer =
    AUSTIN_ROOF_ZERO_BANDS +
    " The typical path is the asphalt-on-asphalt exemption under Work Exempt residential items 12 and 13, not three different valuation fees. Recorded assumed valuations are low " +
    usd(assumed.low) +
    ", typical " +
    usd(assumed.typical) +
    ", and high " +
    usd(assumed.high) +
    ". The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd) +
    ". Those bands change the wage-indexed job cost. They do not change the permit line, because this row does not price the exemption from a valuation table. The Express subtotal of " +
    moneyExact(173.05) +
    " and the per-case Fire inspection of " +
    moneyExact(fireFee) +
    " are recorded extras. They are not the low fee and they are not the high fee.";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a $0 roof permit fee mean in " + city.name + "?",
      answer: asSentence(zeroAnswer),
    },
    {
      question: "What does the Express roof permit cost in " + city.name + " when the exemption does not apply?",
      answer: asSentence(expressAnswer),
    },
    {
      question: "What is the Austin Fire roof-replacement inspection fee?",
      answer: asSentence(fireAnswer),
    },
    {
      question: "Why are the low, typical, and high roof permit fees all $0 in " + city.name + "?",
      answer: asSentence(bandsAnswer),
    },
  ];
}

const TACOMA_ROOF_ZERO_BANDS = "Recorded fee low, typical, and high stay $0 / $0 / $0.";
const TACOMA_ROOF_OVERLAY =
  "Overlay without tear-off is a separate OTC/ePermit and is not this typical.";

/**
 * Tacoma roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate and ROOF_SQUARES. Permit dollars stay
 * the recorded $0 exemption. Returns false if those anchors drift.
 */
function tacomaRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "tacoma-wa" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (!tacomaRoofPageCopy(city, permit)) return false;
  if (!tacomaRoofCalculationNoteOk(permit.calculationNote)) return false;
  if (permit.feeModel !== "exemption" || permit.permitRequired !== false) return false;
  if (permit.feeLowUsd !== 0 || permit.feeTypicalUsd !== 0 || permit.feeHighUsd !== 0) return false;
  if ((permit.extras || []).length !== 0) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 8 || meta.quantityMax !== 60 || meta.quantityStep !== 1) return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const adj = project.cityAdjustments?.[city.slug];
  if (!adj || adj.blsConstructionMeanHourlyUsd == null || !adj.metro) return false;
  if (project.laborShare == null) return false;
  if (/\u2014/.test(permit.calculationNote || "") || /\u2014/.test(permit.caveat || "")) return false;
  return true;
}

/**
 * Tacoma roof People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. The permit line stays $0.
 * No competitor price is pasted, and no overlay fee is invented.
 */
function tacomaRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!tacomaRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  const adj = project.cityAdjustments?.[city.slug];
  if (!adj || adj.blsConstructionMeanHourlyUsd == null || !adj.metro || project.laborShare == null) {
    return [];
  }

  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];
  const fifteenHundredSquares = 1500 / 100;
  if (fifteenHundredSquares !== 15) return [];
  if ((ROOF_SQUARES.typical as number) === fifteenHundredSquares) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atRoof.job.quantity !== squaresForRoof) return [];
  if (atRoof.permitLow !== 0 || atRoof.permitTypical !== 0 || atRoof.permitHigh !== 0) return [];
  if (atLow.permitTypical !== 0 || atTypical.permitTypical !== 0 || atHigh.permitTypical !== 0) return [];
  if (atRoof.allInTypical !== atRoof.job.typical) return [];
  if (atTypical.allInTypical !== atTypical.job.typical) return [];
  if (atLow.allInTypical !== atLow.job.typical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. The recorded permit on the typical path is " +
    moneyExact(permit.feeTypicalUsd as number) +
    ", so those figures are the wage-indexed job cost. " +
    TACOMA_ROOF_ZERO_BANDS +
    " The permit stays " +
    moneyExact(permit.feeTypicalUsd as number) +
    " when the roof size changes. It is not a new fee for 20 squares. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    " at " +
    usd(atLow.allInTypical) +
    " typical, " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd as number) +
    ". " +
    TACOMA_ROOF_ZERO_BANDS +
    " At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate, and they are not a permit fee.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  if (30000 > atTypical.allInLow) {
    tooMuch += "$30,000 is above the low of " + usd(atTypical.allInLow) + ". ";
  }
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical)";
    if (crossSquares > 18) {
      tooMuch += ", which is outside the about 13 to 18 squares this page uses for a typical house";
    }
    tooMuch += ". ";
  }
  tooMuch +=
    "The recorded permit on this row stays " +
    moneyExact(permit.feeLowUsd as number) +
    " low, " +
    moneyExact(permit.feeTypicalUsd as number) +
    " typical, and " +
    moneyExact(permit.feeHighUsd as number) +
    " high on the asphalt strip-and-reroof exemption. $30,000 is above the recorded high assumed valuation of " +
    usd(assumed.high) +
    ", so this row does not list a permit fee for a $30,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not invent a new fee at $30,000.";

  const permitAnswer =
    "On the typical asphalt strip-and-reroof path, no. " +
    city.permitDeptName +
    " lists that reroof in " +
    label +
    " as not requiring a permit, and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd as number) +
    ". IRC R105.2 and TMC 2.02.540 exempt reroofing of a single-family home or a duplex when the existing roof coverings are removed, the new roofing does not exceed 2.5 psf (or a previously approved same-weight vegetated roof), no roof-framing changes are made, and the building is not unreinforced masonry. " +
    TACOMA_ROOF_OVERLAY +
    " The cited source is City of Tacoma residential permits, retrieved " +
    permit.retrievedDate +
    ". Confirm the exemption with " +
    city.permitDeptName +
    " (PDS) before you start work.";

  const zeroAnswer =
    "The recorded " +
    moneyExact(permit.feeTypicalUsd as number) +
    " is the published strip-and-reroof exemption, not a missing fee and not a blank schedule. " +
    TACOMA_ROOF_ZERO_BANDS +
    " Low, typical, and high are all recorded. They are not left blank. The exemption is IRC R105.2 and TMC 2.02.540 when existing coverings are removed, the new roofing does not exceed 2.5 psf, there is no roof-framing change, and the building is not unreinforced masonry. " +
    TACOMA_ROOF_OVERLAY +
    " This row does not invent a fee for that overlay path. Recorded assumed valuations are low " +
    usd(assumed.low) +
    ", typical " +
    usd(assumed.typical) +
    ", and high " +
    usd(assumed.high) +
    ". Those values do not replace the " +
    moneyExact(permit.feeTypicalUsd as number) +
    " with a valuation-table fee.";

  let lower =
    "The typical on this page is the wage-indexed all-in at " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ": " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. 1,500 sq ft of roof surface is " +
    fifteenHundredSquares +
    " squares, so it is not this typical. The job is an asphalt strip-and-reroof. Labor is wage-indexed to the recorded " +
    adj.metro +
    " construction-and-extraction mean of $" +
    adj.blsConstructionMeanHourlyUsd.toFixed(2) +
    " per hour";
  if (adj.blsVintage) lower += " (" + adj.blsVintage + ")";
  lower +=
    ", applied to the recorded " +
    Math.round(project.laborShare * 100) +
    "% labor share. Materials stay on the national share. The recorded permit is " +
    moneyExact(permit.feeTypicalUsd as number) +
    " on the IRC R105.2 and TMC 2.02.540 strip-and-reroof exemption, so this typical does not add a city fee. Other published averages are often higher than this model. This page does not paste those averages as the Tacoma figure. Per square, these rows divide to " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " at " +
    ROOF_SQUARES.low +
    " squares, " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " at " +
    ROOF_SQUARES.typical +
    " squares, and " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " at " +
    ROOF_SQUARES.high +
    " squares. Those per-square figures are this model's own rows.";

  const ageAnswer =
    "Age alone is not a replacement rule on this page, and the recorded Tacoma exemption does not set a roof age. A 20 year old asphalt roof can still shed water, or it can be worn out. Check for leaks, missing or curled shingles, heavy granule loss, soft decking, and daylight through the boards. Those are maintenance signs. They are not a city age limit, and this page does not invent one. If the roof is replaced, the recorded typical path is a strip-and-reroof that removes the existing coverings, uses new roofing that does not exceed 2.5 psf, does not change roof framing, and is not on an unreinforced masonry building. That path is the " +
    moneyExact(permit.feeTypicalUsd as number) +
    " exemption under IRC R105.2 and TMC 2.02.540. An overlay that leaves the old layer in place is a separate OTC/ePermit and is not this typical. Confirm the scope with " +
    city.permitDeptName +
    ".";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a $0 roof permit fee mean in " + city.name + "?",
      answer: asSentence(zeroAnswer),
    },
    {
      question: "Why can the roof replacement typical in " + city.name + " read lower than other published averages?",
      answer: asSentence(lower),
    },
    {
      question: "Should I replace a 20 year old roof in " + city.name + "?",
      answer: asSentence(ageAnswer),
    },
  ];
}

/**
 * St. Louis roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate and ROOF_SQUARES. Permit dollars stay
 * the recorded $105 / $145 / $245 valuation. Returns false if those anchors drift.
 */
function stLouisRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "st-louis-mo" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (!stLouisRoofPageCopy(city, permit)) return false;
  if (!stLouisRoofCalculationNoteOk(permit.calculationNote)) return false;
  if (!stLouisRoofWageOk(project, city)) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 105 || permit.feeTypicalUsd !== 145 || permit.feeHighUsd !== 245) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const application = extras.find((e) => e.name === "Application fee");
  const building = extras.find((e) => e.name === "Building permit fee");
  if (!application || application.feeUsd !== 25) return false;
  if (!building || building.feeUsd !== 120) return false;
  if (25 + 120 !== 145) return false;
  if (25 + 10 * 8 !== 105 || 25 + 10 * 12 !== 145 || 25 + 10 * 22 !== 245) return false;
  if (!/not St. Louis County/.test(permit.caveat || "")) return false;
  if (!/Historic-district extras were not extracted/.test(permit.caveat || "")) return false;
  if (/\u2014/.test(permit.calculationNote || "") || /\u2014/.test(permit.caveat || "")) return false;
  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 8 || meta.quantityMax !== 60 || meta.quantityStep !== 1) return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;
  if (!/1,300/.test(scope) || !/1,800/.test(scope)) return false;
  return true;
}

/**
 * St. Louis roof People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. The permit line stays
 * $105 / $145 / $245. No hail or Class 4 claim is added.
 */
function stLouisRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!stLouisRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  const feeLow = permit.feeLowUsd;
  const feeTypical = permit.feeTypicalUsd;
  const feeHigh = permit.feeHighUsd;
  if (feeLow == null || feeTypical == null || feeHigh == null) return [];
  const adj = project.cityAdjustments?.[city.slug];
  const hourly = adj?.blsConstructionMeanHourlyUsd;
  const metro = adj?.metro;
  const vintage = adj?.blsVintage;
  const laborMult = adj?.laborWageMultiplier;
  const laborShare = project.laborShare;
  if (hourly == null || !metro || !vintage || laborMult == null || laborShare == null) return [];

  const squaresForTwoThousand = 2000 / 100;
  const squaresForTwelveHundred = 1200 / 100;
  if (squaresForTwoThousand !== 20 || squaresForTwelveHundred !== 12) return [];
  if (squaresForTwoThousand < meta.quantityMin || squaresForTwoThousand > meta.quantityMax) return [];
  if (squaresForTwelveHundred < meta.quantityMin || squaresForTwelveHundred > meta.quantityMax) return [];
  const tableSquares: number[] = [ROOF_SQUARES.low, ROOF_SQUARES.typical, ROOF_SQUARES.high];
  if (tableSquares.includes(squaresForTwelveHundred)) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atTwoThousand = at(squaresForTwoThousand);
  const atTwelveHundred = at(squaresForTwelveHundred);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atTwoThousand.job.quantity !== squaresForTwoThousand) return [];
  if (atTwelveHundred.job.quantity !== squaresForTwelveHundred) return [];
  const permitMatches = (est: ReturnType<typeof buildEstimate>) =>
    est.permitLow === permit.feeLowUsd &&
    est.permitTypical === permit.feeTypicalUsd &&
    est.permitHigh === permit.feeHighUsd &&
    est.allInLow === est.job.low + (est.permitLow ?? 0) &&
    est.allInTypical === est.job.typical + (est.permitTypical ?? 0) &&
    est.allInHigh === est.job.high + (est.permitHigh ?? 0);
  if (!permitMatches(atTwoThousand) || !permitMatches(atTwelveHundred)) return [];
  if (!permitMatches(atTypical) || !permitMatches(atLow) || !permitMatches(atHigh)) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);
  const wageSentence =
    "Job cost is wage-indexed to the BLS construction-and-extraction mean of $" +
    hourly.toFixed(2) +
    " per hour for the " +
    metro +
    " metro (" +
    vintage +
    "), labor wage multiplier " +
    laborMult.toFixed(3) +
    ", applied to the recorded " +
    Math.round(laborShare * 100) +
    "% labor share. The permit line is not wage-indexed.";

  const sizeAnswer = (sqFt: number, squares: number, est: ReturnType<typeof buildEstimate>) =>
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, " +
    sqFt.toLocaleString("en-US") +
    " sq ft means roof surface (" +
    squares +
    " squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no " +
    sqFt.toLocaleString("en-US") +
    " sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, " +
    sqFt.toLocaleString("en-US") +
    " sq ft is " +
    squares +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squares +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squares +
    " squares in " +
    label +
    " the all-in is " +
    usd(est.allInLow) +
    " low, " +
    usd(est.allInTypical) +
    " typical, and " +
    usd(est.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(feeLow) +
    ", " +
    moneyExact(feeTypical) +
    ", and " +
    moneyExact(feeHigh) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(est.permitLow ?? 0) +
    " on the low, " +
    usd(est.permitTypical ?? 0) +
    " on the typical, and " +
    usd(est.permitHigh ?? 0) +
    " on the high. The permit is based on the assumed valuation, so it is not rescaled when the roof size changes. " +
    wageSentence;

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The project scope note describes a typical home roof of about 1,300 to 1,800 sq ft of surface. This model's typical row is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", inside that range. The recorded typical permit fee is " +
    moneyExact(feeTypical) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical ?? 0) +
    " on each of those rows, because this permit is based on the assumed valuation and is not rescaled when the roof size changes. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  } else if (30000 < atTypical.allInTypical) {
    tooMuch += "$30,000 is below that typical of " + usd(atTypical.allInTypical) + ". ";
  } else {
    tooMuch += "$30,000 matches that typical. ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  } else if (30000 > atTypical.allInHigh) {
    tooMuch += "$30,000 is above that wage-indexed high. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical)";
    if (crossSquares > 18) {
      tooMuch += ", which is outside the about 13 to 18 squares this page uses for a typical house";
    }
    tooMuch += ". ";
  }
  tooMuch +=
    "The recorded permit on this row stays " +
    moneyExact(feeLow) +
    " low, " +
    moneyExact(feeTypical) +
    " typical, and " +
    moneyExact(feeHigh) +
    " high. $30,000 is above the recorded high assumed valuation of " +
    usd(assumed.high) +
    ", so this row does not list a permit fee for a $30,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical ?? 0) +
    ". They do not look up a new fee at $30,000.";

  const permitAnswer =
    "Yes. " +
    city.permitDeptName +
    " requires a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(feeTypical) +
    ". That total is the $25 application fee plus the $120 building permit fee at the recorded " +
    moneyExact(assumed.typical) +
    " valuation. These totals are for the City of St. Louis, an independent city, not St. Louis County. This row does not record a St. Louis County fee. Historic-district extras were not extracted and are not added. The cited source is " +
    (permit.sourceName || "the official schedule on file") +
    ", source retrieved " +
    permit.retrievedDate +
    ". Confirm the scope with " +
    city.permitDeptName +
    " before filing.";

  const includedAnswer =
    "The recorded typical fee of " +
    moneyExact(feeTypical) +
    " includes two extras, and both are included in the total. The Application fee is " +
    moneyExact(25) +
    ". The Building permit fee is " +
    moneyExact(120) +
    " at the " +
    moneyExact(assumed.typical) +
    " typical valuation ($10 times 12). " +
    moneyExact(25) +
    " + " +
    moneyExact(120) +
    " = " +
    moneyExact(feeTypical) +
    ". The formula is $25 plus $10 per $1,000 of the full assumed valuation. Historic-district extras were not extracted and are not added, so they are not part of that " +
    moneyExact(feeTypical) +
    ".";

  const bandsAnswer =
    "The low, typical, and high fees are three applications of the same City of St. Louis formula, not three different schedules. Low " +
    moneyExact(assumed.low) +
    ": $25 + $10 times 8 = " +
    moneyExact(feeLow) +
    ". Typical " +
    moneyExact(assumed.typical) +
    ": $25 + $10 times 12 = " +
    moneyExact(feeTypical) +
    ". High " +
    moneyExact(assumed.high) +
    ": $25 + $10 times 22 = " +
    moneyExact(feeHigh) +
    ". The $10 rate is applied to each full assumed valuation. It is not applied only to the dollars above $3,000. The recorded typical project value is " +
    moneyExact(permit.typicalProjectValueUsd as number) +
    ". Both recorded extras, the $25 application fee and the $120 building permit fee, are included in the typical total. Historic-district extras were not extracted and are not added.";

  const missouriAnswer =
    "This page prices roof replacement for the City of St. Louis, an independent city in Missouri. It is not a statewide Missouri average, and it is not St. Louis County. At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high, including the recorded " +
    city.permitDeptName +
    " permit fee of " +
    moneyExact(feeTypical) +
    ". " +
    wageSentence +
    " St. Louis County is a different jurisdiction, and this row does not record a county fee. Historic-district extras were not extracted and are not added.";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer(2000, squaresForTwoThousand, atTwoThousand)),
    },
    {
      question: "How much does a roof replacement cost on a 1,200 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer(1200, squaresForTwelveHundred, atTwelveHundred)),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does the typical " + moneyExact(feeTypical) + " roof permit fee include in " + city.name + "?",
      answer: asSentence(includedAnswer),
    },
    {
      question:
        "Why are the low, typical, and high roof permit fees " +
        moneyExact(feeLow) +
        ", " +
        moneyExact(feeTypical) +
        ", and " +
        moneyExact(feeHigh) +
        " in " +
        city.name +
        "?",
      answer: asSentence(bandsAnswer),
    },
    {
      question: "What does a roof replacement cost in Missouri?",
      answer: asSentence(missouriAnswer),
    },
  ];
}

const AUSTIN_KITCHEN_SF = { low: 150, typical: 200, high: 400 };
const AUSTIN_KITCHEN_TOO_MUCH_USD = 50000;
const AUSTIN_KITCHEN_EXPRESS_LINE = "Residential Express Permits/Kitchen Remodels-Inspection";
const AUSTIN_KITCHEN_TIERED =
  "Low and high are omitted because the fee model is tiered on remodel square footage and trade mix, not a low–high band.";
const AUSTIN_KITCHEN_SUM_LINE =
  "interior remodel plan review (201–300 sq ft) $342.70 + residential plan review application processing $136.45 + residential building permit fee (≤1,000 sq ft) $334.74 + electric fee (≤1,000 sq ft) $166.90 + plumbing fee (≤1,000 sq ft) $200.43 + energy fee $86.06 = $1,267.28";

/**
 * Austin kitchen People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * FY26 201–300 sq ft interior-remodel row. Returns false if those anchors drift.
 * Low and high stay omitted. Express is an alternate and is not in the typical.
 */
function austinKitchenPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "austin-tx" || project.projectSlug !== "kitchen-remodel" || !permit) return false;
  if (permit.feeModel !== "tiered" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd != null || permit.feeHighUsd != null) return false;
  if (permit.feeTypicalUsd == null || Math.round(permit.feeTypicalUsd * 100) !== 126728) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  if (city.permitDeptName !== "Austin Development Services Department (DSD)") return false;
  if (permit.sourceUrl !== "https://services.austintexas.gov/edims/document.cfm?id=456810") return false;
  if (!/City of Austin Council backup/.test(permit.sourceName || "")) return false;
  if (!/FY26 residential plan review and permit fees/.test(permit.sourceName || "")) return false;

  const extras = permit.extras || [];
  if (extras.length !== 7) return false;
  const plan = extras[0];
  const processing = extras[1];
  const building = extras[2];
  const electric = extras[3];
  const plumbing = extras[4];
  const energy = extras[5];
  const express = extras[6];
  if (plan?.name !== "Interior remodel plan review (201–300 sq ft)") return false;
  if (plan.feeUsd == null || Math.round(plan.feeUsd * 100) !== 34270) return false;
  if (
    (plan.note || "") !==
    "FY26. Other brackets: ≤100 sf $212.90; 101–200 $214.40; 301–400 $452.00; 401–500 $551.10; 501+ $643.50 + $78.52/100 sf."
  ) {
    return false;
  }
  if (processing?.name !== "Residential plan review application processing") return false;
  if (processing.feeUsd == null || Math.round(processing.feeUsd * 100) !== 13645) return false;
  if ((processing.note || "") !== "FY26.") return false;
  if (building?.name !== "Residential building permit fee (≤1,000 sq ft)") return false;
  if (building.feeUsd == null || Math.round(building.feeUsd * 100) !== 33474) return false;
  if ((building.note || "") !== "FY26. Higher sf brackets exist.") return false;
  if (electric?.name !== "Electric fee (≤1,000 sq ft)") return false;
  if (electric.feeUsd == null || Math.round(electric.feeUsd * 100) !== 16690) return false;
  if ((electric.note || "") !== "FY26.") return false;
  if (plumbing?.name !== "Plumbing fee (≤1,000 sq ft)") return false;
  if (plumbing.feeUsd == null || Math.round(plumbing.feeUsd * 100) !== 20043) return false;
  if ((plumbing.note || "") !== "FY26.") return false;
  if (energy?.name !== "Energy fee") return false;
  if (energy.feeUsd == null || Math.round(energy.feeUsd * 100) !== 8606) return false;
  if ((energy.note || "") !== "FY26.") return false;
  if (express?.name !== "Express kitchen-remodel inspection (alternate path)") return false;
  if (express.feeUsd == null || Math.round(express.feeUsd * 100) !== 8749) return false;
  if (
    (express.note || "") !==
    "FY26 'Residential Express Permits/Kitchen Remodels-Inspection'. Not added into typical; it is a different program."
  ) {
    return false;
  }
  if (!express.note?.includes(AUSTIN_KITCHEN_EXPRESS_LINE)) return false;

  const included =
    Math.round(plan.feeUsd * 100) +
    Math.round(processing.feeUsd * 100) +
    Math.round(building.feeUsd * 100) +
    Math.round(electric.feeUsd * 100) +
    Math.round(plumbing.feeUsd * 100) +
    Math.round(energy.feeUsd * 100);
  if (included !== 126728 || included !== Math.round(permit.feeTypicalUsd * 100)) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== AUSTIN_KITCHEN_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 500 || meta.quantityStep !== 10) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "150 sf" || spec.typical !== "200 sf affected area" || spec.high !== "400 sf") {
    return false;
  }
  const scope = project.scopeNote || "";
  if (!/\$75/.test(scope) || !/\$250/.test(scope)) return false;
  if (!/\$14,600/.test(scope) || !/\$41,300/.test(scope) || !/\$65,000/.test(scope)) return false;
  if (!/not this typical/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (/\u2014/.test(note)) return false;
  if (note.trim().length < 1500 || note.trim().length > 2200) return false;
  if (!note.includes(AUSTIN_KITCHEN_SUM_LINE)) return false;
  if (!note.includes(AUSTIN_KITCHEN_TIERED)) return false;
  if (!/201–300 sq ft plan-review bracket is the typical bracket/.test(note)) return false;
  if (!note.includes("$342.70 + $136.45 = $479.15")) return false;
  if (!note.includes("$479.15 + $334.74 = $813.89")) return false;
  if (!note.includes("$813.89 + $166.90 = $980.79")) return false;
  if (!note.includes("$980.79 + $200.43 = $1,181.22")) return false;
  if (!note.includes("$1,181.22 + $86.06 = $1,267.28")) return false;
  if (!/Walk the six recorded components/.test(note)) return false;
  if (!/No assumed valuation is recorded/.test(note)) return false;
  if (!/not a valuation table/.test(note)) return false;
  if (!note.includes("$35,000")) return false;
  if (!/Alternate path not included in the typical/.test(note)) return false;
  if (!note.includes(AUSTIN_KITCHEN_EXPRESS_LINE)) return false;
  if (!note.includes("$87.49")) return false;
  if (!/It is a different program/.test(note)) return false;
  if (!/not in the \$1,267\.28 typical/.test(note)) return false;
  if (!/Mechanical \(\$146\.80\) is omitted unless HVAC is relocated/.test(note)) return false;
  if (!/Higher square-footage brackets exist on the residential building permit fee/.test(note)) return false;
  if (!note.includes("2026-08-13")) return false;
  if (/\$212\.90|\$214\.40|\$452\.00|\$551\.10|\$643\.50/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/201/.test(caveat) || !/building\+electric\+plumbing\+energy/.test(caveat)) return false;
  if (!/Mechanical \(\$146\.80\) omitted unless HVAC is relocated/.test(caveat)) return false;
  if (!/Low\/high left null/.test(caveat)) return false;
  return true;
}

/**
 * Austin kitchen People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. Permit dollars stay the
 * recorded $1,267.28 typical. Other plan-review brackets, the Express
 * inspection, and the mechanical line are not turned into a low or high.
 */
function austinKitchenPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!austinKitchenPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  if (permit.feeTypicalUsd == null || permit.typicalProjectValueUsd == null) return [];
  const plan = (permit.extras || [])[0];
  const processing = (permit.extras || [])[1];
  const building = (permit.extras || [])[2];
  const electric = (permit.extras || [])[3];
  const plumbing = (permit.extras || [])[4];
  const energy = (permit.extras || [])[5];
  const express = (permit.extras || [])[6];
  if (
    plan?.feeUsd == null ||
    processing?.feeUsd == null ||
    building?.feeUsd == null ||
    electric?.feeUsd == null ||
    plumbing?.feeUsd == null ||
    energy?.feeUsd == null ||
    express?.feeUsd == null
  ) {
    return [];
  }

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(AUSTIN_KITCHEN_SF.low);
  const atTypical = at(AUSTIN_KITCHEN_SF.typical);
  const atHigh = at(AUSTIN_KITCHEN_SF.high);
  if (atLow.job.quantity !== AUSTIN_KITCHEN_SF.low) return [];
  if (atTypical.job.quantity !== AUSTIN_KITCHEN_SF.typical) return [];
  if (atHigh.job.quantity !== AUSTIN_KITCHEN_SF.high) return [];
  if (atLow.permitLow != null || atTypical.permitLow != null || atHigh.permitLow != null) return [];
  if (atLow.permitHigh != null || atTypical.permitHigh != null || atHigh.permitHigh != null) return [];
  if (atLow.permitTypical == null || atTypical.permitTypical == null || atHigh.permitTypical == null) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atLow.permitTypical !== atTypical.permitTypical || atTypical.permitTypical !== atHigh.permitTypical) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitTypical) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitTypical) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);
  const roundedPermit = usd(atTypical.permitTypical);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= AUSTIN_KITCHEN_TOO_MUCH_USD) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is kitchen room area. The typical job is " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    AUSTIN_KITCHEN_SF.low +
    " sq ft, " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft, and " +
    AUSTIN_KITCHEN_SF.high +
    " sq ft. The calculator prices the remodel per square foot, and " +
    AUSTIN_KITCHEN_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded typical permit. Low and high permit fees are omitted on this row. The recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The model rounds that fee to the nearest dollar before adding it, so the all-in uses " +
    roundedPermit +
    " on the low, " +
    roundedPermit +
    " on the typical, and " +
    roundedPermit +
    " on the high. The recorded permit is the FY26 interior-remodel path for a 201–300 sq ft kitchen with building, electric, plumbing, and energy. The cost-by-size table keeps that same rounded typical on every row. It does not look up another plan-review bracket when the kitchen size changes, and it is not a new fee for " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft. The other table rows are " +
    AUSTIN_KITCHEN_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    AUSTIN_KITCHEN_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the kitchen square feet on that row. The square feet are room area, and the typical row is " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    AUSTIN_KITCHEN_SF.low +
    " sq ft, " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft, and " +
    AUSTIN_KITCHEN_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low and high permit fees are omitted. The cost-by-size table rounds that typical fee to " +
    roundedPermit +
    " on each of those rows, because this permit is the recorded 201–300 sq ft interior-remodel total and is not rescaled when the kitchen size changes, and the model rounds the permit to the nearest dollar. At " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, AUSTIN_KITCHEN_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    AUSTIN_KITCHEN_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, AUSTIN_KITCHEN_SF.low) +
    " per sq ft. At " +
    AUSTIN_KITCHEN_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, AUSTIN_KITCHEN_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate, and they are not a different permit bracket.";

  let tooMuch =
    "At the model's typical " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft kitchen in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (AUSTIN_KITCHEN_TOO_MUCH_USD > atTypical.allInTypical) {
    tooMuch += "$50,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites a remodeled kitchen at $75 to $250 per sq ft, an average remodel of $14,600 to $41,300, and a new-from-scratch kitchen around $65,000 as a different scope. $50,000 is above that $41,300 remodel high and below that $65,000 scratch-kitchen figure. Wage-indexed, the high at " +
    AUSTIN_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " is " +
    usd(atTypical.allInHigh) +
    ". ";
  if (AUSTIN_KITCHEN_TOO_MUCH_USD > atTypical.allInHigh) {
    tooMuch += "$50,000 is above that wage-indexed high. ";
  } else if (
    AUSTIN_KITCHEN_TOO_MUCH_USD < atTypical.allInHigh &&
    AUSTIN_KITCHEN_TOO_MUCH_USD > atTypical.allInTypical
  ) {
    tooMuch += "$50,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $50,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. " +
    AUSTIN_KITCHEN_TIERED +
    " The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd) +
    ", and no assumed valuation is recorded on this row. $50,000 is not a valuation input, so this row does not list a permit fee for a $50,000 project value. The all-in figures add the model's rounded typical permit of " +
    roundedPermit +
    ". They do not look up a valuation-table fee at $50,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical kitchen remodel in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Austin Council backup, FY26 residential plan review and permit fees, retrieved " +
    (permit.retrievedDate || "") +
    ". The recorded typical path is a 201–300 sq ft interior remodel with building, electric, plumbing, and energy. It is not a valuation table. The recorded sum is " +
    AUSTIN_KITCHEN_SUM_LINE +
    ". " +
    AUSTIN_KITCHEN_TIERED +
    " Express kitchen-remodel inspection is " +
    moneyExact(express.feeUsd) +
    " (FY26 " +
    AUSTIN_KITCHEN_EXPRESS_LINE +
    "). It is an alternate path and is not added into the typical. Mechanical ($146.80) is omitted unless HVAC is relocated and is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: City of Austin Council backup; FY26 residential plan review and permit fees (" +
    permit.sourceUrl +
    ").";

  const includedAnswer =
    "The typical " +
    moneyExact(permit.feeTypicalUsd) +
    " includes six published FY26 lines for a 201–300 sq ft interior remodel with building, electric, plumbing, and energy. Walk the six recorded components. Interior remodel plan review (201–300 sq ft) is " +
    moneyExact(plan.feeUsd) +
    ". Residential plan review application processing is " +
    moneyExact(processing.feeUsd) +
    ", so $342.70 + $136.45 = $479.15. Residential building permit fee (≤1,000 sq ft) is " +
    moneyExact(building.feeUsd) +
    ", so $479.15 + $334.74 = $813.89. Electric fee (≤1,000 sq ft) is " +
    moneyExact(electric.feeUsd) +
    ", so $813.89 + $166.90 = $980.79. Plumbing fee (≤1,000 sq ft) is " +
    moneyExact(plumbing.feeUsd) +
    ", so $980.79 + $200.43 = $1,181.22. Energy fee is " +
    moneyExact(energy.feeUsd) +
    ", so $1,181.22 + $86.06 = " +
    moneyExact(permit.feeTypicalUsd) +
    ". The recorded sum is " +
    AUSTIN_KITCHEN_SUM_LINE +
    ". Express kitchen-remodel inspection " +
    moneyExact(express.feeUsd) +
    " is not one of those six lines. Mechanical ($146.80) is not one of those six lines. " +
    AUSTIN_KITCHEN_TIERED +
    " This " +
    moneyExact(permit.feeTypicalUsd) +
    " figure is the typical only.";

  const expressAnswer =
    "Express kitchen-remodel inspection (alternate path) is " +
    moneyExact(express.feeUsd) +
    " (FY26 '" +
    AUSTIN_KITCHEN_EXPRESS_LINE +
    "'). The recorded extra says it is not added into the typical; it is a different program. Alternate path not included in the typical: that " +
    moneyExact(express.feeUsd) +
    " inspection. It is not added to the " +
    moneyExact(permit.feeTypicalUsd) +
    " interior-remodel total. This row does not record a combined total of the interior-remodel path and the Express inspection. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ".";

  const rangeAnswer =
    AUSTIN_KITCHEN_TIERED +
    " No assumed valuation is recorded on this row. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd) +
    ", and that figure is the cost-model job value, not an input to this tiered fee. This row does not price a low valuation and a high valuation. The 201–300 sq ft plan-review bracket is the typical bracket used for this row. Other plan-review brackets exist (≤100, 101–200, 301–400, 401–500, and above) and are not totaled here as a low or high. The plan-review line lists other published bracket dollars. Those dollars are not recorded as a low fee or a high fee, and this page does not add them into the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. Higher square-footage brackets exist on the residential building permit fee and are not totaled here as a low or high. No separate dollar for those higher building brackets is recorded as a fee on this row. Express kitchen-remodel inspection " +
    moneyExact(express.feeUsd) +
    " is an alternate path, not a high fee. Mechanical ($146.80) is omitted unless HVAC is relocated. It is not a high fee, and it is not in the typical.";

  const mechanicalAnswer =
    "Mechanical ($146.80) is omitted unless HVAC is relocated and is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. The recorded typical is the six lines for a 201–300 sq ft interior remodel: interior remodel plan review, residential plan review application processing, the residential building permit fee (≤1,000 sq ft), the electric fee (≤1,000 sq ft), the plumbing fee (≤1,000 sq ft), and the energy fee. Mechanical is not one of those lines. This page does not add $146.80 to " +
    moneyExact(permit.feeTypicalUsd) +
    ". If HVAC is relocated, this row does not record a replacement total. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ".";

  return [
    {
      question: "How much does a 200 sq ft kitchen remodel cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a kitchen remodel cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $50,000 too much for a kitchen remodel in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to remodel a kitchen in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question:
        "What does the typical " + moneyExact(permit.feeTypicalUsd) + " kitchen permit include in " + city.name + "?",
      answer: asSentence(includedAnswer),
    },
    {
      question: "What is the Express kitchen-remodel inspection fee in " + city.name + "?",
      answer: asSentence(expressAnswer),
    },
    {
      question: "Why is there no low–high kitchen permit range in " + city.name + "?",
      answer: asSentence(rangeAnswer),
    },
    {
      question: "Is a mechanical permit included in the typical kitchen remodel fee in " + city.name + "?",
      answer: asSentence(mechanicalAnswer),
    },
  ];
}

const AUSTIN_DECK_SF = { low: 200, typical: 320, high: 400 };
const AUSTIN_DECK_TOO_MUCH_USD = 20000;
const AUSTIN_DECK_SUM_LINE =
  "Small Projects Plan Review $132.86 + Residential Plan Review Application Processing $106.72 + Residential building permit fee (base, ≤1,000 sq ft) $289.53 = $529.11";
const AUSTIN_DECK_FLAT_BANDS =
  "Low $529.11 and high $529.11 equal that typical because the fee model is flat.";
const AUSTIN_DECK_ELECTRIC_LINE = "Electric fee (base, ≤1,000 sq ft)";
const AUSTIN_DECK_SOURCE_NAME =
  "City of Austin FY 2025-26 Residential Building Plan Review & Inspection Permit Fees (updated 7/15/2026, effective 10/01/2025)";
const AUSTIN_DECK_SOURCE_URL = "https://austin.widen.net/s/fz9rhwg8qq/fees_residential";
const AUSTIN_DECK_CAVEAT =
  "Typical 16×20 uncovered decks are attached and over 200 sq ft, so they are not on the work-exempt list (item 10 is ≤200 sq ft, ≤30 in above grade, not attached, not in a flood hazard). Path used is Small Projects Plan Review plus building permit. The PDF parenthetical for small projects names garage conversions, carport/porch enclosures, amnesty CO, fences, and pools; uncovered decks are listed on the Pool/Uncovered Deck residential plan-review form and share the 5-business-day small-project review time. Electric/energy/tree/WUI reviews are extra if triggered. Published dollars do not change with the $8k/$12k/$19.2k valuation bands.";
const AUSTIN_DECK_NOTE_DOLLARS = [
  "$132.86",
  "$106.72",
  "$289.53",
  "$166.99",
  "$529.11",
  "$8,000",
  "$12,000",
  "$19,200",
];

/**
 * Austin deck People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars stay the recorded
 * $529.11 flat Small Projects path. Electric $166.99 stays out of that total.
 * Returns false if those anchors drift.
 */
function austinDeckPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "austin-tx" || project.projectSlug !== "deck" || !permit) return false;
  if (permit.feeModel !== "flat" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return false;
  if (Math.round(permit.feeLowUsd * 100) !== 52911) return false;
  if (Math.round(permit.feeTypicalUsd * 100) !== 52911) return false;
  if (Math.round(permit.feeHighUsd * 100) !== 52911) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-31") return false;
  if (city.permitDeptName !== "Austin Development Services Department (DSD)") return false;
  if (permit.sourceUrl !== AUSTIN_DECK_SOURCE_URL) return false;
  if (permit.sourceName !== AUSTIN_DECK_SOURCE_NAME) return false;
  if (/\u2014/.test(permit.sourceName)) return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  if ((permit.caveat || "") !== AUSTIN_DECK_CAVEAT) return false;
  if (!/item 10/.test(permit.caveat) || !/not on the work-exempt list/.test(permit.caveat)) return false;
  if (!/16×20/.test(permit.caveat) || !/Published dollars do not change/.test(permit.caveat)) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  const plan = extras[0];
  const processing = extras[1];
  const building = extras[2];
  const electric = extras[3];
  if (plan?.name !== "Small Projects Plan Review") return false;
  if (plan.feeUsd == null || Math.round(plan.feeUsd * 100) !== 13286) return false;
  if (
    (plan.note || "") !==
    "FY 2025-26 Residential Building Plan Review PDF. Uncovered decks are a listed residential project; DSD bills small projects at this published rate. Included."
  ) {
    return false;
  }
  if (!/\bIncluded\b/.test(plan.note || "")) return false;
  if (processing?.name !== "Residential Plan Review Application Processing") return false;
  if (processing.feeUsd == null || Math.round(processing.feeUsd * 100) !== 10672) return false;
  if ((processing.note || "") !== "FY 2025-26. Payable at submittal. Included.") return false;
  if (building?.name !== "Residential building permit fee (base, ≤1,000 sq ft)") return false;
  if (building.feeUsd == null || Math.round(building.feeUsd * 100) !== 28953) return false;
  if ((building.note || "") !== "FY 2025-26. Typical 16×20 deck is 320 sq ft. Higher sf brackets exist. Included.") {
    return false;
  }
  if (electric?.name !== AUSTIN_DECK_ELECTRIC_LINE) return false;
  if (electric.feeUsd == null || Math.round(electric.feeUsd * 100) !== 16699) return false;
  if ((electric.note || "") !== "FY 2025-26. Not added unless the deck adds lighting or outlets.") return false;
  if (/\bIncluded\b/.test(electric.note || "")) return false;
  const included =
    Math.round(plan.feeUsd * 100) + Math.round(processing.feeUsd * 100) + Math.round(building.feeUsd * 100);
  if (included !== 52911 || included !== Math.round(permit.feeTypicalUsd * 100)) return false;
  if (included + Math.round(electric.feeUsd * 100) === Math.round(permit.feeTypicalUsd * 100)) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== AUSTIN_DECK_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 1200 || meta.quantityStep !== 10) return false;
  if (16 * 20 !== AUSTIN_DECK_SF.typical) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "200 sf" || spec.typical !== "16×20 = 320 sf" || spec.high !== "400 sf") return false;
  const scope = project.scopeNote || "";
  if (!/\$30/.test(scope) || !/\$60/.test(scope) || !/\$8,316/.test(scope)) return false;
  if (!/\$4,340/.test(scope) || !/\$12,652/.test(scope)) return false;
  if (!/\$12,800/.test(scope) || !/\$19,200/.test(scope)) return false;
  if (!/Pressure-treated/.test(scope) || !/second-story/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (/\u2014/.test(note)) return false;
  if (note.trim().length < 1500 || note.trim().length > 2200) return false;
  if (!note.includes(AUSTIN_DECK_SUM_LINE)) return false;
  if (!note.includes(AUSTIN_DECK_FLAT_BANDS)) return false;
  if (!/fee model is flat/.test(note)) return false;
  if (!/Walk the three recorded lines/.test(note)) return false;
  if (!/Those three included lines are the only dollars in the \$529\.11 total/.test(note)) return false;
  if (!/not a valuation table/.test(note)) return false;
  if (!note.includes(AUSTIN_DECK_ELECTRIC_LINE)) return false;
  if (!/not added unless the deck adds lighting or outlets/i.test(note)) return false;
  if (!/not in the \$529\.11 typical/.test(note)) return false;
  if (!/does not add \$166\.99 to \$529\.11/.test(note)) return false;
  if (!/does not record a combined total/.test(note)) return false;
  if (!/not on the work-exempt list/.test(note) || !/item 10/.test(note)) return false;
  if (!/item 10 does not exempt it/.test(note)) return false;
  if (!/16×20/.test(note)) return false;
  if (!/Pool\/Uncovered Deck/.test(note) || !/5-business-day/.test(note)) return false;
  if (!/Published dollars do not change/.test(note)) return false;
  if (!/source retrieved 2026-08-31/.test(note)) return false;
  if (!/FY 2025-26 Residential Building Plan Review/.test(note)) return false;
  const dollars: string[] = note.match(/\$\d[\d,]*(?:\.\d+)?/g) ?? [];
  if (!dollars.length) return false;
  for (const d of dollars) {
    if (!AUSTIN_DECK_NOTE_DOLLARS.includes(d)) return false;
  }
  for (const need of AUSTIN_DECK_NOTE_DOLLARS) {
    if (!dollars.includes(need)) return false;
  }
  return true;
}

/**
 * Austin deck People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. Permit dollars stay the
 * recorded $529.11 flat fee. Electric $166.99 is not turned into a high fee,
 * and the valuation bands are not turned into a new permit total.
 */
function austinDeckPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!austinDeckPaaAnchors(city, project, permit)) return [];
  if (!austinDeckPageCopy(city, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (assumed.high >= AUSTIN_DECK_TOO_MUCH_USD) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  if (permit.typicalProjectValueUsd == null) return [];
  const plan = (permit.extras || [])[0];
  const processing = (permit.extras || [])[1];
  const building = (permit.extras || [])[2];
  const electric = (permit.extras || [])[3];
  if (plan?.feeUsd == null || processing?.feeUsd == null || building?.feeUsd == null || electric?.feeUsd == null) {
    return [];
  }

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(AUSTIN_DECK_SF.low);
  const atTypical = at(AUSTIN_DECK_SF.typical);
  const atHigh = at(AUSTIN_DECK_SF.high);
  if (atLow.job.quantity !== AUSTIN_DECK_SF.low) return [];
  if (atTypical.job.quantity !== AUSTIN_DECK_SF.typical) return [];
  if (atHigh.job.quantity !== AUSTIN_DECK_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.permitLow !== atTypical.permitTypical || atTypical.permitHigh !== atTypical.permitTypical) return [];
  if (atLow.permitTypical !== atTypical.permitTypical || atHigh.permitTypical !== atTypical.permitTypical) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);
  const roundedPermit = usd(atTypical.permitTypical);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= AUSTIN_DECK_TOO_MUCH_USD) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is deck walking surface. A 16 by 20 deck is " +
    AUSTIN_DECK_SF.typical +
    " sq ft, and that is the typical job. The cost-by-size rows are " +
    AUSTIN_DECK_SF.low +
    " sq ft, " +
    AUSTIN_DECK_SF.typical +
    " sq ft, and " +
    AUSTIN_DECK_SF.high +
    " sq ft. The calculator prices the installed deck per square foot, and " +
    AUSTIN_DECK_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    AUSTIN_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    " low, " +
    moneyExact(permit.feeTypicalUsd) +
    " typical, and " +
    moneyExact(permit.feeHighUsd) +
    " high. " +
    AUSTIN_DECK_FLAT_BANDS +
    " The model rounds each recorded fee to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is a flat fee, so it is not rescaled when the deck size changes, and it is not a new fee for " +
    AUSTIN_DECK_SF.typical +
    " sq ft. The other table rows are " +
    AUSTIN_DECK_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    AUSTIN_DECK_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the deck square feet on that row. The square feet are walking surface. The cost-by-size rows are " +
    AUSTIN_DECK_SF.low +
    " sq ft, " +
    AUSTIN_DECK_SF.typical +
    " sq ft (a 16 by 20 deck), and " +
    AUSTIN_DECK_SF.high +
    " sq ft. The recorded permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    " at each recorded valuation of " +
    usd(assumed.low) +
    ", " +
    usd(assumed.typical) +
    ", and " +
    usd(assumed.high) +
    ". " +
    AUSTIN_DECK_FLAT_BANDS +
    " The cost-by-size table rounds that fee to " +
    roundedPermit +
    " on each of those rows, because this permit is a flat fee and is not rescaled when the deck size changes, and the model rounds the permit to the nearest dollar. At " +
    AUSTIN_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, AUSTIN_DECK_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    AUSTIN_DECK_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, AUSTIN_DECK_SF.low) +
    " per sq ft. At " +
    AUSTIN_DECK_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, AUSTIN_DECK_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate, and they are not a permit fee.";

  let tooMuch =
    "At the model's typical 16 by 20 deck (" +
    AUSTIN_DECK_SF.typical +
    " sq ft) in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (AUSTIN_DECK_TOO_MUCH_USD > atTypical.allInTypical) {
    tooMuch += "$20,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an installed range of $30 to $60 per sq ft, an average job of $8,316 (range $4,340 to $12,652), and a 16 by 20 (320 sq ft) table of $12,800 to $19,200. $20,000 is above that table high. The same scope calls pressure-treated the low end and second-story, high-end wood, or custom the high end. Wage-indexed, that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    AUSTIN_DECK_SF.typical +
    " sq ft in " +
    label +
    ". ";
  if (AUSTIN_DECK_TOO_MUCH_USD > atTypical.allInHigh) {
    tooMuch += "$20,000 is above that wage-indexed high. ";
  } else if (
    AUSTIN_DECK_TOO_MUCH_USD < atTypical.allInHigh &&
    AUSTIN_DECK_TOO_MUCH_USD > atTypical.allInTypical
  ) {
    tooMuch += "$20,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $20,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeLowUsd) +
    " low, " +
    moneyExact(permit.feeTypicalUsd) +
    " typical, and " +
    moneyExact(permit.feeHighUsd) +
    " high. " +
    AUSTIN_DECK_FLAT_BANDS +
    " Published dollars do not change with the recorded " +
    moneyExact(assumed.low) +
    " / " +
    moneyExact(assumed.typical) +
    " / " +
    moneyExact(assumed.high) +
    " valuation bands. $20,000 is above that recorded high valuation, so this row does not list a permit fee for a $20,000 project value. The all-in figures add the model's rounded typical permit of " +
    roundedPermit +
    ". They do not add " +
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    ", and they do not look up a new fee at $20,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical deck in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Austin FY 2025-26 Residential Building Plan Review & Inspection Permit Fees, retrieved " +
    permit.retrievedDate +
    ". Typical 16×20 uncovered decks are attached and over 200 sq ft, so they are not on the work-exempt list (item 10 is ≤200 sq ft, ≤30 in above grade, not attached, not in a flood hazard). A typical attached 16×20 deck is 320 sq ft, so item 10 does not exempt it. The recorded path is Small Projects Plan Review plus the building permit. The recorded sum is " +
    AUSTIN_DECK_SUM_LINE +
    ". " +
    AUSTIN_DECK_FLAT_BANDS +
    " " +
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    " is recorded but is not added unless the deck adds lighting or outlets, and it is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. Confirm the Small Projects Plan Review path with Austin Development Services Department before filing. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || AUSTIN_DECK_SOURCE_NAME) +
    " (" +
    permit.sourceUrl +
    ").";

  const includedAnswer =
    "The typical " +
    moneyExact(permit.feeTypicalUsd) +
    " includes three published lines on the flat Small Projects Plan Review path. Walk the three recorded lines. Small Projects Plan Review is " +
    moneyExact(plan.feeUsd) +
    " and is included. Residential Plan Review Application Processing is " +
    moneyExact(processing.feeUsd) +
    " and is included. Residential building permit fee (base, ≤1,000 sq ft) is " +
    moneyExact(building.feeUsd) +
    " and is included. Those three included lines are the only dollars in the " +
    moneyExact(permit.feeTypicalUsd) +
    " total. The recorded sum is " +
    AUSTIN_DECK_SUM_LINE +
    ". " +
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    " is recorded but is not one of those three lines. It is not added unless the deck adds lighting or outlets, and it is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. " +
    AUSTIN_DECK_FLAT_BANDS +
    " This " +
    moneyExact(permit.feeTypicalUsd) +
    " figure is the low, the typical, and the high.";

  const sameAnswer =
    AUSTIN_DECK_FLAT_BANDS +
    " The fee model is flat, so the valuation bands do not create a lower fee or a higher fee. Recorded assumed valuations are low " +
    moneyExact(assumed.low) +
    ", typical " +
    moneyExact(assumed.typical) +
    ", and high " +
    moneyExact(assumed.high) +
    ". The recorded typical project value is " +
    moneyExact(permit.typicalProjectValueUsd) +
    ". Published dollars do not change with the recorded " +
    moneyExact(assumed.low) +
    " / " +
    moneyExact(assumed.typical) +
    " / " +
    moneyExact(assumed.high) +
    " valuation bands. " +
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    " is not the high fee. Higher square-footage brackets exist on the residential building permit fee and are not totaled here as a different low or high. The recorded low, typical, and high stay " +
    moneyExact(permit.feeTypicalUsd) +
    ".";

  const electricAnswer =
    AUSTIN_DECK_ELECTRIC_LINE +
    " is " +
    moneyExact(electric.feeUsd) +
    ". The recorded extra says it is not added unless the deck adds lighting or outlets. It is not in the " +
    moneyExact(permit.feeTypicalUsd) +
    " typical. This row does not add " +
    moneyExact(electric.feeUsd) +
    " to " +
    moneyExact(permit.feeTypicalUsd) +
    ", and it does not record a combined total when lighting or outlets are added. If the deck adds lighting or outlets, this row does not record a replacement total. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source retrieved " +
    permit.retrievedDate +
    ".";

  const valuationAnswer =
    "Recorded assumed valuations for a deck in " +
    label +
    " are " +
    moneyExact(assumed.low) +
    " low, " +
    moneyExact(assumed.typical) +
    " typical, and " +
    moneyExact(assumed.high) +
    " high. The recorded typical project value is " +
    moneyExact(permit.typicalProjectValueUsd) +
    ". Those figures are the cost-model job bands. They do not change the published permit dollars, because this row is not a valuation table. " +
    AUSTIN_DECK_FLAT_BANDS +
    " Published dollars do not change with the recorded " +
    moneyExact(assumed.low) +
    " / " +
    moneyExact(assumed.typical) +
    " / " +
    moneyExact(assumed.high) +
    " valuation bands. The recorded low, typical, and high permit fees stay " +
    moneyExact(permit.feeTypicalUsd) +
    ". Deck size changes the wage-indexed installed cost on the cost-by-size table. It does not change this permit line. " +
    AUSTIN_DECK_ELECTRIC_LINE +
    " " +
    moneyExact(electric.feeUsd) +
    " is not a high valuation fee, and it is not in the typical.";

  return [
    {
      question: "How much does a 16 by 20 deck cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a deck cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $20,000 too much for a deck in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to build a deck in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does the typical " + moneyExact(permit.feeTypicalUsd) + " deck permit include in " + city.name + "?",
      answer: asSentence(includedAnswer),
    },
    {
      question: "Why are the low, typical, and high deck permit fees the same in " + city.name + "?",
      answer: asSentence(sameAnswer),
    },
    {
      question: "What is the electric fee if a deck in " + city.name + " adds lighting or outlets?",
      answer: asSentence(electricAnswer),
    },
    {
      question:
        "Do the " +
        moneyExact(assumed.low) +
        ", " +
        moneyExact(assumed.typical) +
        ", and " +
        moneyExact(assumed.high) +
        " valuation bands change the deck permit fee in " +
        city.name +
        "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const RALEIGH_HVAC_SYSTEMS = { one: 1, two: 2, three: 3 };
const RALEIGH_HVAC_TOO_MUCH_USD = 15000;

/**
 * Raleigh HVAC People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * FY27 minimum-trade row. Returns false if those anchors drift.
 */
function raleighHvacPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "hvac-replacement" || !permit) return false;
  if (permit.feeModel !== "flat" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 124 || permit.feeTypicalUsd !== 124 || permit.feeHighUsd !== 248) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  if (permit.assumedValuationUsd != null) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const mechanical = extras[0];
  const electrical = extras[1];
  if (!/^Minimum trade permit \(mechanical\)$/.test(mechanical?.name || "") || mechanical?.feeUsd !== 124) {
    return false;
  }
  if ((mechanical?.note || "") !== "FY27 Minimum Trade Permit Fee $124 per trade.") return false;
  if (!/^Second trade \(electrical\) if new circuit\/disconnect$/.test(electrical?.name || "")) return false;
  if (electrical?.feeUsd !== 124) return false;
  if ((electrical?.note || "") !== "Included in high only.") return false;
  if (Math.round(mechanical.feeUsd * 100) !== Math.round(permit.feeLowUsd * 100)) return false;
  if (Math.round(permit.feeTypicalUsd * 100) !== Math.round(permit.feeLowUsd * 100)) return false;
  if (
    Math.round(mechanical.feeUsd * 100) + Math.round(electrical.feeUsd * 100) !==
    Math.round(permit.feeHighUsd * 100)
  ) {
    return false;
  }
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide; Minimum Trade Permit Fee") return false;
  if (/\u2014/.test(permit.sourceName || "")) return false;
  if (
    permit.sourceUrl !==
    "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf"
  ) {
    return false;
  }
  if (city.permitDeptName !== "Planning and Development Department") return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== RALEIGH_HVAC_SYSTEMS.one || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 1 || meta.quantityMax !== 4 || meta.quantityStep !== 1) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || !/3-ton \(36,000 BTU\)/.test(spec.typical)) return false;
  const scope = project.scopeNote || "";
  if (!/\$7,500/.test(scope) || !/\$5,000/.test(scope) || !/\$12,500/.test(scope) || !/\$22,000/.test(scope)) {
    return false;
  }
  if (!/new ductwork/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(permit.sourceName) || !note.includes("2026-08-13")) return false;
  if (!/Minimum Trade Permit Fee is \$124 per trade/.test(note)) return false;
  if (!/Like-for-like change-out typically one mechanical trade/.test(note)) return false;
  if (!/recorded low and typical fees are each \$124/.test(note)) return false;
  if (!note.includes("$124 + $124 = $248")) return false;
  if (!/included in high only/.test(note)) return false;
  if (!/A third trade is not totaled/.test(note)) return false;
  if (!/not per ton/.test(note)) return false;
  if (!/A second system is not a second trade/.test(note)) return false;
  if (!/Assumed valuation is not recorded/.test(note)) return false;
  if (!/fee model is flat/.test(note)) return false;
  if (/\u2014/.test(note)) return false;
  return true;
}

/**
 * Raleigh HVAC People-Also-Ask entries.
 * A code exemption is omitted: the recorded row requires a permit and does not
 * list a $0 like-for-like path. Tonnage is not a separate published rate.
 * Two trades is the electrical add-on, not a second system.
 */
function raleighHvacPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!raleighHvacPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const mechanical = (permit.extras || [])[0];
  const electrical = (permit.extras || [])[1];
  if (mechanical?.feeUsd == null || electrical?.feeUsd == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atOne = at(RALEIGH_HVAC_SYSTEMS.one);
  const atTwo = at(RALEIGH_HVAC_SYSTEMS.two);
  const atThree = at(RALEIGH_HVAC_SYSTEMS.three);
  if (atOne.job.quantity !== RALEIGH_HVAC_SYSTEMS.one) return [];
  if (atTwo.job.quantity !== RALEIGH_HVAC_SYSTEMS.two) return [];
  if (atThree.job.quantity !== RALEIGH_HVAC_SYSTEMS.three) return [];
  if (atOne.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atOne.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atOne.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atOne.permitTypical !== atTwo.permitTypical || atTwo.permitTypical !== atThree.permitTypical) return [];
  if (atOne.allInLow !== atOne.job.low + atOne.permitLow) return [];
  if (atOne.allInTypical !== atOne.job.typical + atOne.permitTypical) return [];
  if (atOne.allInHigh !== atOne.job.high + atOne.permitHigh) return [];
  if (atTwo.allInTypical !== atTwo.job.typical + atTwo.permitTypical) return [];
  if (atThree.allInTypical !== atThree.job.typical + atThree.permitTypical) return [];

  const perSystem = (allIn: number, systems: number) => usd(allIn / systems);

  let crossSystems: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= RALEIGH_HVAC_TOO_MUCH_USD) {
      crossSystems = qty;
      break;
    }
  }

  const sizeAnswer =
    "The documented typical job is a " +
    spec.typical +
    ". This cost model prices that job as one system. It does not price tons as a separate rate. The cost-by-size rows are " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system, " +
    RALEIGH_HVAC_SYSTEMS.two +
    " systems, and " +
    RALEIGH_HVAC_SYSTEMS.three +
    " systems. The calculator scales the installed job by the system count divided by " +
    meta.defaultQuantity +
    ", and " +
    RALEIGH_HVAC_SYSTEMS.one +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale. At " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the recorded trade bands. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atOne.permitLow) +
    " on the low, " +
    usd(atOne.permitTypical) +
    " on the typical, and " +
    usd(atOne.permitHigh) +
    " on the high. The typical recorded fee is one mechanical trade at the FY27 minimum, not a per-ton permit. The permit is a flat minimum trade fee, so it is not rescaled when the system count changes. The other table rows are " +
    RALEIGH_HVAC_SYSTEMS.two +
    " systems at " +
    usd(atTwo.allInTypical) +
    " typical and " +
    RALEIGH_HVAC_SYSTEMS.three +
    " systems at " +
    usd(atThree.allInTypical) +
    " typical.";

  const perSystemAnswer =
    "Cost per system on this page is the all-in typical divided by the system count on that row. One system is a complete heating-and-cooling change-out, not a single trade line and not a ton of capacity. The cost-by-size rows are " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system, " +
    RALEIGH_HVAC_SYSTEMS.two +
    " systems, and " +
    RALEIGH_HVAC_SYSTEMS.three +
    " systems. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atOne.permitTypical) +
    " on each of those rows, because this permit is a flat minimum trade fee and is not rescaled when the system count changes, and the model rounds the permit to the nearest dollar. At " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " the all-in typical is " +
    usd(atOne.allInTypical) +
    ", which is " +
    perSystem(atOne.allInTypical, RALEIGH_HVAC_SYSTEMS.one) +
    " per system after rounding to the nearest dollar. At " +
    RALEIGH_HVAC_SYSTEMS.two +
    " systems the all-in typical is " +
    usd(atTwo.allInTypical) +
    ", or " +
    perSystem(atTwo.allInTypical, RALEIGH_HVAC_SYSTEMS.two) +
    " per system. At " +
    RALEIGH_HVAC_SYSTEMS.three +
    " systems the all-in typical is " +
    usd(atThree.allInTypical) +
    ", or " +
    perSystem(atThree.allInTypical, RALEIGH_HVAC_SYSTEMS.three) +
    " per system. Those per-system figures are that division of the row. They are not a separate published rate, and they are not the two-trade permit.";

  let tooMuch =
    "At the model's typical " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system in " +
    label +
    ", the all-in is " +
    usd(atOne.allInLow) +
    " low, " +
    usd(atOne.allInTypical) +
    " typical, and " +
    usd(atOne.allInHigh) +
    " high. ";
  if (RALEIGH_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is above that typical of " + usd(atOne.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an average of $7,500, a common range of $5,000 to $12,500, and up to $22,000 with new ductwork. $15,000 is above that $12,500 common high and below that $22,000 new-duct figure. Wage-indexed, the high at " +
    RALEIGH_HVAC_SYSTEMS.one +
    " system in " +
    label +
    " is " +
    usd(atOne.allInHigh) +
    ". ";
  if (RALEIGH_HVAC_TOO_MUCH_USD < atOne.allInHigh && RALEIGH_HVAC_TOO_MUCH_USD > atOne.allInTypical) {
    tooMuch += "$15,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSystems != null) {
    const crossed = at(crossSystems);
    tooMuch +=
      "On the typical path the same scale first reaches $15,000 at " +
      crossSystems +
      " systems (" +
      usd(crossed.allInTypical) +
      " typical), which is above the one-system job this page uses as typical. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " low and typical, and " +
    moneyExact(permit.feeHighUsd) +
    " high. Those fees come from trade count on the FY27 minimum trade permit, not from project value. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ", and no assumed valuation is recorded on this row. $15,000 is not a valuation input, so this row does not list a permit fee for a $15,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atOne.permitTypical) +
    ". They do not look up a valuation-table fee at $15,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical HVAC replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Raleigh FY27 Development Fee Guide, Minimum Trade Permit Fee, retrieved " +
    (permit.retrievedDate || "") +
    ". Low and typical are one mechanical trade at " +
    moneyExact(mechanical.feeUsd) +
    ". High adds the electrical trade when a new circuit or disconnect is required, also " +
    moneyExact(electrical.feeUsd) +
    ", so " +
    moneyExact(mechanical.feeUsd) +
    " + " +
    moneyExact(electrical.feeUsd) +
    " = " +
    moneyExact(permit.feeHighUsd) +
    ". That electrical amount is included in high only. This is the FY27 Minimum Trade Permit Fee, not a valuation table. This row does not record a $0 exemption for a like-for-like change-out. Like-for-like change-out typically stays on the one mechanical trade. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Raleigh FY27 Development Fee Guide; Minimum Trade Permit Fee") +
    " (" +
    permit.sourceUrl +
    ").";

  const tradeAnswer =
    "On this row, one trade is the minimum trade permit for mechanical work. A 1-trade permit is " +
    moneyExact(mechanical.feeUsd) +
    ", which is both the recorded low and the recorded typical. A 2-trade permit adds the electrical trade when a new circuit or disconnect is required, also " +
    moneyExact(electrical.feeUsd) +
    ". The arithmetic is " +
    moneyExact(mechanical.feeUsd) +
    " + " +
    moneyExact(electrical.feeUsd) +
    " = " +
    moneyExact(permit.feeHighUsd) +
    ", and that sum is the recorded high. The electrical " +
    moneyExact(electrical.feeUsd) +
    " is included in high only. It is the only difference between the recorded typical and the recorded high. This row does not total a third trade. The fee is per trade, not per ton and not per system. A 3-ton (36,000 BTU) like-for-like split system is the documented typical job, and a 2-ton or 5-ton unit is not a separate fee band. A second system is not a second trade. The cost model is separate: it prices one complete system as the typical job and adds the rounded typical permit of " +
    usd(atOne.permitTypical) +
    " on that row. The 2-system and 3-system cost-by-size rows still use that same rounded typical permit. They do not switch the all-in to the high fee of " +
    moneyExact(permit.feeHighUsd) +
    ".";

  return [
    {
      question: "How much does a 3-ton HVAC replacement cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does HVAC replacement cost per system in " + city.name + "?",
      answer: asSentence(perSystemAnswer),
    },
    {
      question: "Is $15,000 too much for HVAC replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace an air conditioner or furnace in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a 1-trade versus a 2-trade HVAC change-out permit cost in " + city.name + "?",
      answer: asSentence(tradeAnswer),
    },
  ];
}

/**
 * Raleigh roof People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * FY27 Level 1 row. Returns false if those anchors drift.
 * An inspection-only dollar is omitted: the row says some reroofs may be
 * inspection-only and does not record a separate fee for that path.
 */
function raleighRoofPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "raleigh-nc" || project.projectSlug !== "roof-replacement" || !permit) return false;
  if (permit.feeModel !== "tiered" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 248 || permit.feeTypicalUsd !== 248 || permit.feeHighUsd !== 248) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-08-13") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 22000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const level1 = extras[0];
  const plan = extras[1];
  if (
    !/^Level 1 alteration building permit \(28% of 0\.38% value, min \$124\)$/.test(level1?.name || "") ||
    level1?.feeUsd !== 124
  ) {
    return false;
  }
  if ((level1?.note || "") !== "FY27. Like-for-like covering replacement is Level 1.") return false;
  if (
    !/^Alteration plan review \(55% of building-permit base, min \$124\)$/.test(plan?.name || "") ||
    plan?.feeUsd !== 124
  ) {
    return false;
  }
  if ((plan?.note || "") !== "Included. Some reroofs may be inspection-only; confirm with the city calculator.") {
    return false;
  }
  if (Math.round(level1.feeUsd * 100) + Math.round(plan.feeUsd * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }
  if (Math.round(permit.feeLowUsd * 100) !== Math.round(permit.feeTypicalUsd * 100)) return false;
  if (Math.round(permit.feeHighUsd * 100) !== Math.round(permit.feeTypicalUsd * 100)) return false;
  if (
    permit.sourceUrl !==
    "https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR15/DevelopmentFeeGuide.pdf"
  ) {
    return false;
  }
  if (permit.sourceName !== "City of Raleigh FY27 Development Fee Guide (Jul 1, 2026\u2013Jun 30, 2027)") {
    return false;
  }
  if (/\u2014/.test(permit.sourceName || "") || /\u2014/.test(permit.calculationNote || "")) return false;
  if (city.permitDeptName !== "Planning and Development Department") return false;
  if (!/0\.38% × value/.test(permit.caveat || "") || !/\$124\+\$124 floor/.test(permit.caveat || "")) return false;

  if ((8000 * 38) / 100 !== 3040 || 3040 * 28 !== 85120 || (3040 * 55) / 100 !== 1672) return false;
  if ((12000 * 38) / 100 !== 4560 || 4560 * 28 !== 127680 || (4560 * 55) / 100 !== 2508) return false;
  if ((22000 * 38) / 100 !== 8360 || 8360 * 28 !== 234080 || (8360 * 55) / 100 !== 4598) return false;
  if (85120 >= 124 * 10000 || 1672 >= 12400) return false;
  if (127680 >= 124 * 10000 || 2508 >= 12400) return false;
  if (234080 >= 124 * 10000 || 4598 >= 12400) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== ROOF_SQUARES.typical || meta.pricing !== "job") return false;
  if (meta.quantityMin !== 8 || meta.quantityMax !== 60 || meta.quantityStep !== 1) return false;
  if (!/13 to 18 squares/.test(meta.quantityHint || "")) return false;
  const scope = project.scopeNote || "";
  if (!/\$5,800/.test(scope) || !/\$20,000/.test(scope) || !/\$46,000/.test(scope)) return false;
  if (!/steep or premium materials/i.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!note.includes(permit.sourceName) || !note.includes("2026-08-13")) return false;
  if (!/Like-for-like covering replacement is Level 1/.test(note)) return false;
  if (!/0\.38% × value/.test(note) || !/\$124 minimums/.test(note)) return false;
  if (!/28% of 0\.38% of value, minimum \$124/.test(note)) return false;
  if (!/55% of the building-permit base, minimum \$124/.test(note)) return false;
  if (!note.includes("Typical $12,000: Level 1 alteration building permit $124 + alteration plan review $124 = $248")) {
    return false;
  }
  if (!note.includes("Low $8,000 = $248 total") || !note.includes("high $22,000 = $248 total")) return false;
  if (!note.includes("$124 + $124 = $248")) return false;
  if (!note.includes("0.38% × $8,000 = $30.40") || !note.includes("28% × $30.40 = $8.512")) return false;
  if (!note.includes("55% × $30.40 = $16.72")) return false;
  if (!note.includes("0.38% × $12,000 = $45.60") || !note.includes("28% × $45.60 = $12.768")) return false;
  if (!note.includes("55% × $45.60 = $25.08")) return false;
  if (!note.includes("0.38% × $22,000 = $83.60") || !note.includes("28% × $83.60 = $23.408")) return false;
  if (!note.includes("55% × $83.60 = $45.98")) return false;
  if (!/\$8,000, \$12,000, and \$22,000 valuations/.test(note)) return false;
  if (!/not a separate recorded fee/.test(note)) return false;
  if (!/inspection-only/.test(note) || !/city calculator/.test(note)) return false;
  if (!/inspection-only dollar/.test(note)) return false;
  return true;
}

/**
 * Raleigh roof People-Also-Ask entries.
 * A separate inspection-only fee is omitted: the recorded row does not price it.
 * Dollars stay on the FY27 Level 1 floor of $124 + $124.
 */
function raleighRoofPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!raleighRoofPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const level1Fee = (permit.extras || [])[0]?.feeUsd;
  const planFee = (permit.extras || [])[1]?.feeUsd;
  if (level1Fee == null || planFee == null) return [];

  const roofSqFt = 2000;
  const squaresForRoof = roofSqFt / 100;
  if (squaresForRoof !== 20) return [];
  if (squaresForRoof < meta.quantityMin || squaresForRoof > meta.quantityMax) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atRoof = at(squaresForRoof);
  const atTypical = at(ROOF_SQUARES.typical);
  const atLow = at(ROOF_SQUARES.low);
  const atHigh = at(ROOF_SQUARES.high);
  if (atLow.job.quantity !== ROOF_SQUARES.low) return [];
  if (atTypical.job.quantity !== ROOF_SQUARES.typical) return [];
  if (atHigh.job.quantity !== ROOF_SQUARES.high) return [];
  if (atRoof.job.quantity !== squaresForRoof) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atRoof.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atRoof.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atRoof.allInLow !== atRoof.job.low + atRoof.permitLow) return [];
  if (atRoof.allInTypical !== atRoof.job.typical + atRoof.permitTypical) return [];
  if (atRoof.allInHigh !== atRoof.job.high + atRoof.permitHigh) return [];

  const perSquare = (allIn: number, squares: number) => usd(allIn / squares);

  let crossSquares: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= 30000) {
      crossSquares = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size in this model is roof surface. One roofing square is 100 sq ft of roof surface, and the typical job is " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ". In this model, 2,000 sq ft means roof surface (20 squares). It is separate from the floor area of a home, and the model has no floor-area input. The cost-by-size table has no 2,000 sq ft row; its rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". Read as roof surface, 2,000 sq ft is " +
    squaresForRoof +
    " squares. The calculator already scales job cost by squares divided by " +
    ROOF_SQUARES.typical +
    ", and " +
    squaresForRoof +
    " is inside the allowed range of " +
    meta.quantityMin +
    " to " +
    meta.quantityMax +
    ", so these figures are that same scale, not a guess between table rows. At " +
    squaresForRoof +
    " squares in " +
    label +
    " the all-in is " +
    usd(atRoof.allInLow) +
    " low, " +
    usd(atRoof.allInTypical) +
    " typical, and " +
    usd(atRoof.allInHigh) +
    " high. Those all-in figures add the recorded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, and these fees are already whole dollars, so the all-in uses " +
    usd(atRoof.permitLow) +
    " on the low, " +
    usd(atRoof.permitTypical) +
    " on the typical, and " +
    usd(atRoof.permitHigh) +
    " on the high. The permit is the recorded Level 1 floor for the project value. It is not rescaled when the roof size changes, and it is not a new FY27 calculation for 20 squares. The nearest table rows are " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    " at " +
    usd(atHigh.allInTypical) +
    " typical and " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " at " +
    usd(atTypical.allInTypical) +
    " typical.";

  const squareAnswer =
    "Cost per square on this page is the all-in typical divided by the roof squares on that row. One square is 100 sq ft of roof surface, not floor area. The cost-by-size rows are " +
    roofSquaresPhrase(ROOF_SQUARES.low, false) +
    ", " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    ", and " +
    roofSquaresPhrase(ROOF_SQUARES.high, false) +
    ". The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table uses " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is the recorded project-value floor and is not rescaled when the roof size changes, and the model rounds the permit to the nearest dollar. At " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSquare(atTypical.allInTypical, ROOF_SQUARES.typical) +
    " per square after rounding to the nearest dollar. At " +
    ROOF_SQUARES.low +
    " squares the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSquare(atLow.allInTypical, ROOF_SQUARES.low) +
    " per square. At " +
    ROOF_SQUARES.high +
    " squares the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSquare(atHigh.allInTypical, ROOF_SQUARES.high) +
    " per square. Those per-square figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    roofSquaresPhrase(ROOF_SQUARES.typical) +
    " in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "Published asphalt-shingle installed prices run $5,800 to $20,000, so $30,000 is above that band. The national high of $46,000 is the published broad high for steep or premium materials. Wage-indexed for " +
    city.name +
    ", that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    ROOF_SQUARES.typical +
    " squares. ";
  if (30000 < atTypical.allInHigh && 30000 > atTypical.allInTypical) {
    tooMuch += "$30,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSquares != null) {
    const crossed = at(crossSquares);
    tooMuch +=
      "On the typical path the same scale first reaches $30,000 at " +
      crossSquares +
      " squares (" +
      usd(crossed.allInTypical) +
      " typical), which is outside the about 13 to 18 squares this page uses for a typical house. ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $30,000 is above that recorded high valuation, so this row does not list a permit fee for a $30,000 project value. The all-in figures add the recorded typical permit of " +
    moneyExact(permit.feeTypicalUsd) +
    ". They do not look up a new Level 1 fee at $30,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical roof replacement in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Raleigh FY27 Development Fee Guide, retrieved " +
    (permit.retrievedDate || "") +
    ". Like-for-like covering replacement is Level 1. Alteration fee = (0.38% × value) × Level rate, with $124 minimums. The Level 1 alteration building permit is 28% of 0.38% of value, minimum $124. Alteration plan review is 55% of the building-permit base, minimum $124. At the recorded " +
    usd(assumed.typical) +
    " valuation the building-permit base is $45.60. Level 1 is 28% × $45.60 = $12.768, under the $124 minimum, so the recorded Level 1 line is " +
    moneyExact(level1Fee) +
    ". Plan review is 55% × $45.60 = $25.08, under the $124 minimum, so the recorded plan-review line is " +
    moneyExact(planFee) +
    ". " +
    moneyExact(level1Fee) +
    " + " +
    moneyExact(planFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". Some reroofs may be inspection-only; confirm with the city calculator. This row does not record a separate inspection-only dollar. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Raleigh FY27 Development Fee Guide (Jul 1, 2026\u2013Jun 30, 2027)") +
    " (" +
    permit.sourceUrl +
    ").";

  const valuationAnswer =
    "Recorded assumed valuations for a roof replacement in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". The building-permit base is 0.38% of each valuation. Level 1 is 28% of that base, minimum $124. Plan review is 55% of that base, minimum $124. Low $8,000: 0.38% × $8,000 = $30.40. Level 1 is 28% × $30.40 = $8.512, and plan review is 55% × $30.40 = $16.72. Both are under $124, so the recorded total is " +
    moneyExact(level1Fee) +
    " + " +
    moneyExact(planFee) +
    " = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical $12,000: 0.38% × $12,000 = $45.60. Level 1 is 28% × $45.60 = $12.768, and plan review is 55% × $45.60 = $25.08. Both are under $124, so the recorded total is " +
    moneyExact(permit.feeTypicalUsd) +
    ". High $22,000: 0.38% × $22,000 = $83.60. Level 1 is 28% × $83.60 = $23.408, and plan review is 55% × $83.60 = $45.98. Both are under $124, so the recorded total is " +
    moneyExact(permit.feeHighUsd) +
    ". Those products are the formula before the minimum. They are not a separate recorded fee and are not added on top of the $124 lines. The high is not added on top of the typical. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ".";

  return [
    {
      question: "How much does a roof replacement cost on a 2,000 sq ft home in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does roof replacement cost per square in " + city.name + "?",
      answer: asSentence(squareAnswer),
    },
    {
      question: "Is $30,000 too much for a roof replacement in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to replace my roof in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a roof permit cost at $8,000, $12,000, and $22,000 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const TUCSON_DECK_SF = { low: 200, typical: 320, high: 400 };
const TUCSON_DECK_TOO_MUCH_USD = 20000;

/**
 * Tucson deck People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * Table 4-02.4 row. Returns false if those anchors drift.
 */
function tucsonDeckPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "tucson-az" || project.projectSlug !== "deck" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 245.69 || permit.feeTypicalUsd !== 337.49 || permit.feeHighUsd !== 521.09) {
    return false;
  }
  if (permit.typicalProjectValueUsd !== 12000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 8000 || assumed.typical !== 12000 || assumed.high !== 19200) return false;
  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  const table = extras[0];
  const digital = extras[1];
  const tableFee = table?.feeUsd;
  const digitalFee = digital?.feeUsd;
  if (!/^4-02\.4 Construction Valuation Table$/.test(table?.name || "") || tableFee !== 318.95) {
    return false;
  }
  if ((table?.note || "") !== "Included.") return false;
  if (!/^Digital filing 1%, min \$18\.54$/.test(digital?.name || "") || digitalFee !== 18.54) return false;
  if ((digital?.note || "") !== "Included.") return false;
  if (Math.round(tableFee * 100) + Math.round(digitalFee * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }
  if (
    permit.sourceUrl !==
    "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf"
  ) {
    return false;
  }
  if (!/FY27/.test(permit.sourceName || "") || !/effective July 1, 2026/.test(permit.sourceName || "")) {
    return false;
  }

  const lowTable = 8945 + 2295 * 6;
  const typicalTable = 8945 + 2295 * 10;
  const highTable = 8945 + 2295 * 18;
  if (lowTable !== 22715 || lowTable + 1854 !== 24569) return false;
  if (typicalTable !== 31895 || typicalTable + 1854 !== 33749) return false;
  if (highTable !== 50255 || highTable + 1854 !== 52109) return false;
  if (2295 * 4 !== 9180 || 22715 + 9180 !== 31895 || 24569 + 9180 !== 33749) return false;
  if (2295 * 8 !== 18360 || 31895 + 18360 !== 50255 || 33749 + 18360 !== 52109) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== TUCSON_DECK_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 1200 || meta.quantityStep !== 10) return false;
  if (16 * 20 !== TUCSON_DECK_SF.typical) return false;
  const scope = project.scopeNote || "";
  if (!/\$30/.test(scope) || !/\$60/.test(scope) || !/\$8,316/.test(scope)) return false;
  if (!/\$4,340/.test(scope) || !/\$12,652/.test(scope)) return false;
  if (!/\$12,800/.test(scope) || !/\$19,200/.test(scope)) return false;
  if (!/Pressure-treated/.test(scope) || !/second-story/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes("valuation-table portion $318.95 + digital filing $18.54 = $337.49")) return false;
  if (!note.includes("Low $8,000 = $245.69 total") || !note.includes("high $19,200 = $521.09 total")) return false;
  if (!note.includes("$89.45 + $22.95 x 6 = $227.15") || !note.includes("$227.15 + $18.54 = $245.69")) {
    return false;
  }
  if (!note.includes("$89.45 + $22.95 x 10 = $318.95")) return false;
  if (!note.includes("$89.45 + $22.95 x 18 = $502.55") || !note.includes("$502.55 + $18.54 = $521.09")) {
    return false;
  }
  if (!/rounded up to the nearest fee threshold/.test(note)) return false;
  if (!/1% of the valuation-table portion is below/.test(note)) return false;
  if (!/new-construction valuation table at the assumed job value/.test(note)) return false;
  if (!/Shade-structure line points to the same building-permit table/.test(note)) return false;
  if (!/not a second fee/.test(note)) return false;
  if (!/not unincorporated Pima County/.test(note)) return false;
  return true;
}

/**
 * Tucson deck People-Also-Ask entries.
 * A height or setback exemption is omitted: the cost model and the recorded
 * permit row do not state one. Dollars stay on the recorded Table 4-02.4 path.
 */
function tucsonDeckPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!tucsonDeckPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const table = (permit.extras || [])[0];
  const digital = (permit.extras || [])[1];
  const tableFee = table?.feeUsd;
  const digitalFee = digital?.feeUsd;
  if (tableFee == null || digitalFee == null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(TUCSON_DECK_SF.low);
  const atTypical = at(TUCSON_DECK_SF.typical);
  const atHigh = at(TUCSON_DECK_SF.high);
  if (atLow.job.quantity !== TUCSON_DECK_SF.low) return [];
  if (atTypical.job.quantity !== TUCSON_DECK_SF.typical) return [];
  if (atHigh.job.quantity !== TUCSON_DECK_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= TUCSON_DECK_TOO_MUCH_USD) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is deck walking surface. A 16 by 20 deck is " +
    TUCSON_DECK_SF.typical +
    " sq ft, and that is the typical job. The cost-by-size rows are " +
    TUCSON_DECK_SF.low +
    " sq ft, " +
    TUCSON_DECK_SF.typical +
    " sq ft, and " +
    TUCSON_DECK_SF.high +
    " sq ft. The calculator prices the installed deck per square foot, and " +
    TUCSON_DECK_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    TUCSON_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    ". The model rounds each to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the deck size changes, and it is not a new fee for " +
    TUCSON_DECK_SF.typical +
    " sq ft. The other table rows are " +
    TUCSON_DECK_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    TUCSON_DECK_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical. Recorded assumed valuations behind those permit lines are " +
    usd(assumed.low) +
    ", " +
    usd(assumed.typical) +
    ", and " +
    usd(assumed.high) +
    ".";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the deck square feet on that row. The square feet are walking surface. The cost-by-size rows are " +
    TUCSON_DECK_SF.low +
    " sq ft, " +
    TUCSON_DECK_SF.typical +
    " sq ft (a 16 by 20 deck), and " +
    TUCSON_DECK_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the deck size changes, and the model rounds the permit to the nearest dollar. At " +
    TUCSON_DECK_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, TUCSON_DECK_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    TUCSON_DECK_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, TUCSON_DECK_SF.low) +
    " per sq ft. At " +
    TUCSON_DECK_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, TUCSON_DECK_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical 16 by 20 deck (" +
    TUCSON_DECK_SF.typical +
    " sq ft) in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (TUCSON_DECK_TOO_MUCH_USD > atTypical.allInTypical) {
    tooMuch += "$20,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites an installed range of $30 to $60 per sq ft, an average job of $8,316 (range $4,340 to $12,652), and a 16 by 20 (320 sq ft) table of $12,800 to $19,200. $20,000 is above that table high. The same scope calls pressure-treated the low end and second-story, high-end wood, or custom the high end. Wage-indexed, that high is " +
    usd(atTypical.allInHigh) +
    " at " +
    TUCSON_DECK_SF.typical +
    " sq ft in " +
    label +
    ". ";
  if (TUCSON_DECK_TOO_MUCH_USD > atTypical.allInHigh) {
    tooMuch += "$20,000 is above that wage-indexed high. ";
  } else if (TUCSON_DECK_TOO_MUCH_USD < atTypical.allInHigh && TUCSON_DECK_TOO_MUCH_USD > atTypical.allInTypical) {
    tooMuch += "$20,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $20,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $20,000 is above that recorded high valuation, so this row does not list a permit fee for a $20,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new fee at $20,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical deck in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, Table 4-02.4 Construction Valuation, retrieved " +
    (permit.retrievedDate || "") +
    ". New decks use the new-construction valuation table at the assumed job value. The shade-structure line points to the same building-permit table and is not a second fee. This is City of Tucson PDSD, not unincorporated Pima County. At the recorded " +
    usd(assumed.typical) +
    " valuation the valuation-table portion is " +
    moneyExact(tableFee) +
    " and digital filing is " +
    moneyExact(digitalFee) +
    ", so " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". Digital filing is 1% of the valuation-table portion, and on each recorded band that 1% is below the " +
    moneyExact(digitalFee) +
    " minimum, so the minimum is the digital filing line. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026") +
    " (" +
    permit.sourceUrl +
    ").";

  const valuationAnswer =
    "Recorded assumed valuations for a deck in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". All three are inside Table 4-02.4 band $2,000.01 to $25,000: base $89.45 plus $22.95 per extra $1,000 above $2,000, plus digital filing at the $18.54 minimum. Low is 6 extra thousands: $89.45 + $22.95 x 6 = $227.15, then $227.15 + $18.54 = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical is 10 extra thousands: $89.45 + $22.95 x 10 = " +
    moneyExact(tableFee) +
    ", then " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". The schedule rounds values up to the nearest fee threshold, so high " +
    usd(assumed.high) +
    " rounds up to $20,000, which is 18 extra thousands: $89.45 + $22.95 x 18 = $502.55, then $502.55 + $18.54 = " +
    moneyExact(permit.feeHighUsd) +
    ". The $227.15 and $502.55 figures are the valuation-table portions of those recorded totals, not separate extras. The recorded extra on this row is the typical valuation-table portion of " +
    moneyExact(tableFee) +
    ". New decks use the new-construction valuation table. The shade-structure line points to the same building-permit table and is not a second fee. This is City of Tucson PDSD, not unincorporated Pima County.";

  return [
    {
      question: "How much does a 16 by 20 deck cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a deck cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $20,000 too much for a deck in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to build a deck in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question: "What does a deck permit cost at $8,000, $12,000, and $19,200 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
  ];
}

const TUCSON_KITCHEN_SF = { low: 150, typical: 200, high: 400 };
const TUCSON_KITCHEN_TOO_MUCH_USD = 50000;
const TUCSON_KITCHEN_SOURCE_URL =
  "https://www.tucsonaz.gov/files/sharedassets/public/v/1/pdsd/documents/fee-schedule/fy27_fee_schedule.pdf";
const TUCSON_KITCHEN_SOURCE_NAME =
  "City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, effective July 1, 2026";
const TUCSON_KITCHEN_CAVEAT =
  "Level-2 reconfiguration would use 15% of standard building valuation if no contract is provided. Dataset uses assumed contract valuation on Table 4-02.4.";
const TUCSON_KITCHEN_TRADE_NOTE =
  "$150 first + $50 each additional if filed separately. Not added to the building total.";

/**
 * Tucson kitchen People-Also-Ask anchors.
 * Job dollars come from buildEstimate. Permit dollars come from the recorded
 * Table 4-02.4 row. Returns false if those anchors drift.
 */
function tucsonKitchenPaaAnchors(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): permit is Permit {
  if (city.slug !== "tucson-az" || project.projectSlug !== "kitchen-remodel" || !permit) return false;
  if (permit.feeModel !== "valuation" || permit.permitRequired !== true) return false;
  if (permit.feeLowUsd !== 406.34 || permit.feeTypicalUsd !== 804.14 || permit.feeHighUsd !== 1297.59) {
    return false;
  }
  if (Math.round(permit.feeLowUsd * 100) !== 40634) return false;
  if (Math.round(permit.feeTypicalUsd * 100) !== 80414) return false;
  if (Math.round(permit.feeHighUsd * 100) !== 129759) return false;
  if (permit.typicalProjectValueUsd !== 35000) return false;
  if (permit.retrievedDate !== "2026-09-01") return false;
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low !== 15000 || assumed.typical !== 35000 || assumed.high !== 75000) return false;
  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  const table = extras[0];
  const digital = extras[1];
  const trade = extras[2];
  const tableFee = table?.feeUsd;
  const digitalFee = digital?.feeUsd;
  if (!/^4-02\.4 Construction Valuation Table$/.test(table?.name || "") || tableFee !== 785.6) return false;
  if (Math.round((tableFee ?? NaN) * 100) !== 78560) return false;
  if ((table?.note || "") !== "Included.") return false;
  if (!/^Digital filing 1%, min \$18\.54$/.test(digital?.name || "") || digitalFee !== 18.54) return false;
  if ((digital?.note || "") !== "Included.") return false;
  if (!/^Trade permits \(plumbing fixture \/ electrical circuit\)$/.test(trade?.name || "")) return false;
  if (trade?.feeUsd != null) return false;
  if ((trade?.note || "") !== TUCSON_KITCHEN_TRADE_NOTE) return false;
  if (Math.round(tableFee * 100) + Math.round(digitalFee * 100) !== Math.round(permit.feeTypicalUsd * 100)) {
    return false;
  }
  if (permit.sourceUrl !== TUCSON_KITCHEN_SOURCE_URL) return false;
  if (permit.sourceName !== TUCSON_KITCHEN_SOURCE_NAME) return false;
  if ((permit.caveat || "") !== TUCSON_KITCHEN_CAVEAT) return false;

  const lowTable = 8945 + 2295 * 13;
  const typicalTable = 61730 + 1683 * 10;
  const highTable = 103805 + 964 * 25;
  if (lowTable !== 38780 || lowTable + 1854 !== 40634) return false;
  if (typicalTable !== 78560 || typicalTable + 1854 !== 80414) return false;
  if (highTable !== 127905 || highTable + 1854 !== 129759) return false;
  if (lowTable >= 1854 * 100 || typicalTable >= 1854 * 100 || highTable >= 1854 * 100) return false;

  const meta = projectMeta(project.projectSlug);
  if (meta.defaultQuantity !== TUCSON_KITCHEN_SF.typical || meta.pricing !== "per-unit") return false;
  if (meta.quantityMin !== 80 || meta.quantityMax !== 500 || meta.quantityStep !== 10) return false;
  const spec = typicalJobSpec(project.projectSlug);
  if (!spec || spec.low !== "150 sf" || spec.typical !== "200 sf affected area" || spec.high !== "400 sf") {
    return false;
  }
  const scope = project.scopeNote || "";
  if (!/\$75/.test(scope) || !/\$250/.test(scope)) return false;
  if (!/\$14,600/.test(scope) || !/\$41,300/.test(scope) || !/\$65,000/.test(scope)) return false;
  if (!/not this typical/.test(scope)) return false;

  const note = permit.calculationNote || "";
  if (/\u2014/.test(note)) return false;
  if (!/Table 4-02\.4/.test(note) || !note.includes("2026-09-01")) return false;
  if (!note.includes("valuation-table portion $785.60 + digital filing $18.54 = $804.14")) return false;
  if (!note.includes("Low $15,000 = $406.34 total") || !note.includes("High $75,000 = $1,297.59 total")) {
    return false;
  }
  if (!note.includes("$89.45 + $22.95 x 13 = $387.80") || !note.includes("$387.80 + $18.54 = $406.34")) {
    return false;
  }
  if (!note.includes("$617.30 + $16.83 x 10 = $785.60")) return false;
  if (!note.includes("$1,038.05 + $9.64 x 25 = $1,279.05") || !note.includes("$1,279.05 + $18.54 = $1,297.59")) {
    return false;
  }
  if (!/rounded up to the nearest fee threshold/.test(note)) return false;
  if (!/1% of the total fee is below/.test(note)) return false;
  if (!/\$15,000, \$35,000, and \$75,000 are already on a \$1,000 threshold/.test(note)) return false;
  if (!/assumed contract valuation on Table 4-02\.4/.test(note)) return false;
  if (!/Level-2 15%-of-standard-building-valuation path is not used/.test(note)) return false;
  if (!/Trade permits \(plumbing fixture \/ electrical circuit\) are separate/.test(note)) return false;
  if (!/not added to the building total/.test(note)) return false;
  if (!/not unincorporated Pima County/.test(note)) return false;
  if (!/Band \$2,000\.01\u2013\$25,000: base \$89\.45 \+ \$22\.95/.test(note)) return false;
  if (!/Band \$25,000\.01\u2013\$50,000: base \$617\.30 \+ \$16\.83/.test(note)) return false;
  if (!/Band \$50,000\.01\u2013\$100,000: base \$1,038\.05 \+ \$9\.64/.test(note)) return false;
  return true;
}

/**
 * Tucson kitchen People-Also-Ask entries.
 * Size dollars come from the wage-indexed model. Permit dollars stay the
 * recorded Table 4-02.4 totals. A cabinet-only dollar is omitted: the row
 * does not record a same-layout cosmetic fee or a $0 total.
 */
function tucsonKitchenPaaFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!tucsonKitchenPaaAnchors(city, project, permit)) return [];
  const meta = projectMeta(project.projectSlug);
  const label = cityLabel(city);
  const assumed = permit.assumedValuationUsd;
  if (!assumed || assumed.low == null || assumed.typical == null || assumed.high == null) return [];
  if (permit.feeLowUsd == null || permit.feeTypicalUsd == null || permit.feeHighUsd == null) return [];
  const table = (permit.extras || [])[0];
  const digital = (permit.extras || [])[1];
  const trade = (permit.extras || [])[2];
  const tableFee = table?.feeUsd;
  const digitalFee = digital?.feeUsd;
  if (tableFee == null || digitalFee == null || trade?.feeUsd != null) return [];

  const at = (qty: number) => buildEstimate(project, city, permit, qty);
  const atLow = at(TUCSON_KITCHEN_SF.low);
  const atTypical = at(TUCSON_KITCHEN_SF.typical);
  const atHigh = at(TUCSON_KITCHEN_SF.high);
  if (atLow.job.quantity !== TUCSON_KITCHEN_SF.low) return [];
  if (atTypical.job.quantity !== TUCSON_KITCHEN_SF.typical) return [];
  if (atHigh.job.quantity !== TUCSON_KITCHEN_SF.high) return [];
  if (atLow.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atHigh.permitTypical !== Math.round(permit.feeTypicalUsd)) return [];
  if (atTypical.permitLow !== Math.round(permit.feeLowUsd)) return [];
  if (atTypical.permitHigh !== Math.round(permit.feeHighUsd)) return [];
  if (atTypical.allInLow !== atTypical.job.low + atTypical.permitLow) return [];
  if (atTypical.allInTypical !== atTypical.job.typical + atTypical.permitTypical) return [];
  if (atTypical.allInHigh !== atTypical.job.high + atTypical.permitHigh) return [];
  if (atLow.allInTypical !== atLow.job.typical + atLow.permitTypical) return [];
  if (atHigh.allInTypical !== atHigh.job.typical + atHigh.permitTypical) return [];

  const perSqFt = (allIn: number, sqft: number) => usd(allIn / sqft);

  let crossSqFt: number | null = null;
  for (let qty = meta.quantityMin; qty <= meta.quantityMax; qty += meta.quantityStep) {
    if (at(qty).allInTypical >= TUCSON_KITCHEN_TOO_MUCH_USD) {
      crossSqFt = qty;
      break;
    }
  }

  const sizeAnswer =
    "Size on this page is kitchen room area. The typical job is " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    TUCSON_KITCHEN_SF.low +
    " sq ft, " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft, and " +
    TUCSON_KITCHEN_SF.high +
    " sq ft. The calculator prices the remodel per square foot, and " +
    TUCSON_KITCHEN_SF.typical +
    " is inside the allowed range of " +
    meta.quantityMin.toLocaleString("en-US") +
    " to " +
    meta.quantityMax.toLocaleString("en-US") +
    ", so these figures are that same scale. At " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. Those all-in figures add the model's rounded permit for the valuation bands on this row. The recorded fees are " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". The model rounds each fee to the nearest dollar before adding it, so the all-in uses " +
    usd(atTypical.permitLow) +
    " on the low, " +
    usd(atTypical.permitTypical) +
    " on the typical, and " +
    usd(atTypical.permitHigh) +
    " on the high. The permit is based on project value, so it is not rescaled when the kitchen size changes, and it is not a new Table 4-02.4 fee for " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft. The other table rows are " +
    TUCSON_KITCHEN_SF.low +
    " sq ft at " +
    usd(atLow.allInTypical) +
    " typical and " +
    TUCSON_KITCHEN_SF.high +
    " sq ft at " +
    usd(atHigh.allInTypical) +
    " typical.";

  const sqftAnswer =
    "Cost per square foot on this page is the all-in typical divided by the kitchen square feet on that row. The square feet are room area, and the typical row is " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft of affected area. The cost-by-size rows are " +
    TUCSON_KITCHEN_SF.low +
    " sq ft, " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft, and " +
    TUCSON_KITCHEN_SF.high +
    " sq ft. The recorded typical permit fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cost-by-size table rounds that fee to " +
    usd(atTypical.permitTypical) +
    " on each of those rows, because this permit is based on project value and is not rescaled when the kitchen size changes, and the model rounds the permit to the nearest dollar. At " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " the all-in typical is " +
    usd(atTypical.allInTypical) +
    ", which is " +
    perSqFt(atTypical.allInTypical, TUCSON_KITCHEN_SF.typical) +
    " per sq ft after rounding to the nearest dollar. At " +
    TUCSON_KITCHEN_SF.low +
    " sq ft the all-in typical is " +
    usd(atLow.allInTypical) +
    ", or " +
    perSqFt(atLow.allInTypical, TUCSON_KITCHEN_SF.low) +
    " per sq ft. At " +
    TUCSON_KITCHEN_SF.high +
    " sq ft the all-in typical is " +
    usd(atHigh.allInTypical) +
    ", or " +
    perSqFt(atHigh.allInTypical, TUCSON_KITCHEN_SF.high) +
    " per sq ft. Those per-square-foot figures are that division of the row. They are not a separate published rate.";

  let tooMuch =
    "At the model's typical " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft kitchen in " +
    label +
    ", the all-in is " +
    usd(atTypical.allInLow) +
    " low, " +
    usd(atTypical.allInTypical) +
    " typical, and " +
    usd(atTypical.allInHigh) +
    " high. ";
  if (TUCSON_KITCHEN_TOO_MUCH_USD > atTypical.allInTypical) {
    tooMuch += "$50,000 is above that typical of " + usd(atTypical.allInTypical) + ". ";
  }
  tooMuch +=
    "The project scope cites a remodeled kitchen at $75 to $250 per sq ft, an average remodel of $14,600 to $41,300, and a new-from-scratch kitchen around $65,000 as a different scope. $50,000 is above that $41,300 remodel high and below that $65,000 scratch-kitchen figure. Wage-indexed, the high at " +
    TUCSON_KITCHEN_SF.typical +
    " sq ft in " +
    label +
    " is " +
    usd(atTypical.allInHigh) +
    ". ";
  if (TUCSON_KITCHEN_TOO_MUCH_USD > atTypical.allInHigh) {
    tooMuch += "$50,000 is above that wage-indexed high. ";
  } else if (
    TUCSON_KITCHEN_TOO_MUCH_USD < atTypical.allInHigh &&
    TUCSON_KITCHEN_TOO_MUCH_USD > atTypical.allInTypical
  ) {
    tooMuch += "$50,000 is below that wage-indexed high and above the typical. ";
  }
  if (crossSqFt != null) {
    const crossed = at(crossSqFt);
    tooMuch +=
      "On the typical path the same scale first reaches $50,000 at " +
      crossSqFt +
      " sq ft (" +
      usd(crossed.allInTypical) +
      " typical). ";
  }
  tooMuch +=
    "The recorded permit on this row is " +
    moneyExact(permit.feeTypicalUsd) +
    " at a " +
    usd(assumed.typical) +
    " valuation, " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". $50,000 sits between the recorded typical valuation and the recorded high valuation, so this row does not list a separate permit fee for a $50,000 project value. The all-in figures add the model's rounded typical permit of " +
    usd(atTypical.permitTypical) +
    ". They do not look up a new Table 4-02.4 fee at $50,000.";

  const permitAnswer =
    "On the recorded path, yes. " +
    city.permitDeptName +
    " is recorded as requiring a permit for a typical kitchen remodel in " +
    label +
    ", and the recorded typical fee is " +
    moneyExact(permit.feeTypicalUsd) +
    ". The cited source is the City of Tucson PDSD FY27 Planning and Permitting Fee Schedule, Table 4-02.4 Construction Valuation, retrieved " +
    (permit.retrievedDate || "") +
    ". Alterations use assumed contract valuation on Table 4-02.4. The Level-2 15%-of-standard-building-valuation path is not used because a contract value is assumed. This is City of Tucson PDSD, not unincorporated Pima County. At the recorded " +
    usd(assumed.typical) +
    " valuation the valuation-table portion is " +
    moneyExact(tableFee) +
    " and digital filing is " +
    moneyExact(digitalFee) +
    ", so " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". Low " +
    usd(assumed.low) +
    " is a recorded total of " +
    moneyExact(permit.feeLowUsd) +
    ". High " +
    usd(assumed.high) +
    " is a recorded total of " +
    moneyExact(permit.feeHighUsd) +
    ". Digital filing is 1% of the total fee, and on each recorded band that 1% is below the " +
    moneyExact(digitalFee) +
    " minimum, so the minimum is the digital filing line. It is already inside each total. Trade permits (plumbing fixture / electrical circuit) are separate and are not added to the building total. The recorded extra says $150 first + $50 each additional if filed separately. That line is not added to the building total. The recorded typical stays " +
    moneyExact(permit.feeTypicalUsd) +
    ". Source: " +
    (permit.sourceName || TUCSON_KITCHEN_SOURCE_NAME) +
    " (" +
    permit.sourceUrl +
    ").";

  const layoutAnswer =
    "The recorded row does not set a same-layout cosmetic fee, and it does not record a $0 cabinet-only total. The recorded caveat says Level-2 reconfiguration would use 15% of standard building valuation if no contract is provided. That is the layout-change path named on this row, and only when no contract is provided. This dataset uses assumed contract valuation on Table 4-02.4, so the Level-2 15%-of-standard-building-valuation path is not used. A layout change with an assumed contract value stays on Table 4-02.4. When that recorded path applies, the totals stay " +
    moneyExact(permit.feeLowUsd) +
    " at " +
    usd(assumed.low) +
    ", " +
    moneyExact(permit.feeTypicalUsd) +
    " at " +
    usd(assumed.typical) +
    ", and " +
    moneyExact(permit.feeHighUsd) +
    " at " +
    usd(assumed.high) +
    ". Trade permits (plumbing fixture / electrical circuit) are separate and are not added to the building total.";

  const valuationAnswer =
    "Recorded assumed valuations for a kitchen remodel in " +
    label +
    " are " +
    usd(assumed.low) +
    " low, " +
    usd(assumed.typical) +
    " typical, and " +
    usd(assumed.high) +
    " high. The recorded typical project value is " +
    usd(permit.typicalProjectValueUsd as number) +
    ". Each valuation is already on a $1,000 threshold, so the schedule's round-up to the nearest fee threshold does not add another thousand. Digital filing is 1% of the total fee, minimum $18.54. On each recorded band that 1% is below the minimum, so digital filing is " +
    moneyExact(digitalFee) +
    " and is already inside each total. Low " +
    usd(assumed.low) +
    " is in the $2,000.01 to $25,000 band: 13 extra thousands, $89.45 + $22.95 x 13 = $387.80, then $387.80 + $18.54 = " +
    moneyExact(permit.feeLowUsd) +
    ". Typical " +
    usd(assumed.typical) +
    " is in the $25,000.01 to $50,000 band: 10 extra thousands, $617.30 + $16.83 x 10 = " +
    moneyExact(tableFee) +
    ", then " +
    moneyExact(tableFee) +
    " + " +
    moneyExact(digitalFee) +
    " = " +
    moneyExact(permit.feeTypicalUsd) +
    ". High " +
    usd(assumed.high) +
    " is in the $50,000.01 to $100,000 band: 25 extra thousands, $1,038.05 + $9.64 x 25 = $1,279.05, then $1,279.05 + $18.54 = " +
    moneyExact(permit.feeHighUsd) +
    ". The $387.80 and $1,279.05 figures are the valuation-table portions of those recorded totals, not separate extras. The recorded extra on this row is the typical valuation-table portion of " +
    moneyExact(tableFee) +
    ". Alterations use assumed contract valuation on Table 4-02.4. The Level-2 15%-of-standard-building-valuation path is not used because a contract value is assumed. Trade permits are separate and are not added to the building total. This is City of Tucson PDSD, not unincorporated Pima County.";

  const rangeAnswer =
    "The recorded permit range is " +
    moneyExact(permit.feeLowUsd) +
    " to " +
    moneyExact(permit.feeHighUsd) +
    " because the three assumed valuations sit in three different Table 4-02.4 bands. It is not one fee with a guess on either side. Low " +
    usd(assumed.low) +
    " uses $22.95 per extra $1,000 in the $2,000.01 to $25,000 band and totals " +
    moneyExact(permit.feeLowUsd) +
    ". Typical " +
    usd(assumed.typical) +
    " uses $16.83 per extra $1,000 in the $25,000.01 to $50,000 band and totals " +
    moneyExact(permit.feeTypicalUsd) +
    ". High " +
    usd(assumed.high) +
    " uses $9.64 per extra $1,000 in the $50,000.01 to $100,000 band and totals " +
    moneyExact(permit.feeHighUsd) +
    ". Digital filing is 1% of the total fee, minimum $18.54. On each recorded band that 1% is below the minimum, so digital filing stays " +
    moneyExact(digitalFee) +
    " and does not widen the range. It is already inside each total. The spread is the valuation-table portions: $387.80 at " +
    usd(assumed.low) +
    ", " +
    moneyExact(tableFee) +
    " at " +
    usd(assumed.typical) +
    ", and $1,279.05 at " +
    usd(assumed.high) +
    ". Trade permits (plumbing fixture / electrical circuit) are separate and are not in this range. This is City of Tucson PDSD, not unincorporated Pima County.";

  return [
    {
      question: "How much does a 200 sq ft kitchen remodel cost in " + city.name + "?",
      answer: asSentence(sizeAnswer),
    },
    {
      question: "How much does a kitchen remodel cost per square foot in " + city.name + "?",
      answer: asSentence(sqftAnswer),
    },
    {
      question: "Is $50,000 too much for a kitchen remodel in " + city.name + "?",
      answer: asSentence(tooMuch),
    },
    {
      question: "Do I need a permit to remodel a kitchen in " + city.name + "?",
      answer: asSentence(permitAnswer),
    },
    {
      question:
        "Does a same-layout cosmetic kitchen remodel pay a different permit fee than a layout change in " +
        city.name +
        "?",
      answer: asSentence(layoutAnswer),
    },
    {
      question:
        "What does a kitchen remodel permit cost at $15,000, $35,000, and $75,000 in " + city.name + "?",
      answer: asSentence(valuationAnswer),
    },
    {
      question:
        "Why does the kitchen remodel permit fee range from " +
        moneyExact(permit.feeLowUsd) +
        " to " +
        moneyExact(permit.feeHighUsd) +
        " in " +
        city.name +
        "?",
      answer: asSentence(rangeAnswer),
    },
  ];
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

const SAN_ANTONIO_ROOF_SOURCE_NAME =
  "City of San Antonio DSD FY2026 Development Fee Schedule (Rev. October 2025), p. 5 Residential Re-roof Permit $25.00";
const SAN_ANTONIO_ROOF_SOURCE_URL =
  "https://docsonline.sanantonio.gov/DSDUploads/CurrentFeeSchedule.pdf";

type SanAntonioRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars. The locked totals are $25 / $25 / $25. */
  typicalExact: string;
  rangeExact: string;
};

function sanAntonioMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function sanAntonioSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * San Antonio roof: FY2026 p. 5 Residential Re-roof Permit is $25 at every
 * recorded valuation. Fees stay $25 / $25 / $25. The valuation table is unused
 * for covering-only reroof. Structural sheathing/framing uses the section 10-38
 * valuation building-permit table and is not the recorded typical path.
 * Returns null if those anchors drift.
 */
function sanAntonioRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "san-antonio-tx" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sanAntonioSameCents(permit.feeLowUsd, 25)) return false;
  if (!sanAntonioSameCents(permit.feeTypicalUsd, 25)) return false;
  if (!sanAntonioSameCents(permit.feeHighUsd, 25)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== SAN_ANTONIO_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== SAN_ANTONIO_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !== "Residential Re-roof Permit" ||
    !sanAntonioSameCents(extras[0]?.feeUsd, 25)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included in the $25 total. FY2026 p. 5 Residential Re-roof Permit.") {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(SAN_ANTONIO_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$25, feeTypicalUsd is \$25, and feeHighUsd is \$25/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not an input on this flat path/.test(note)) return false;
  if (!/unused and do not change the \$25 \/ \$25 \/ \$25/.test(note)) return false;
  if (!/valuation table is not used for covering-only reroof/.test(note)) return false;
  if (!/does not invent valuation-table dollars into the locked totals/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$25/.test(note)) return false;
  if (!/Residential Re-roof Permit is \$25 at \$8,000, so feeLowUsd is \$25/.test(note)) return false;
  if (!/same covering-only path as the typical/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$25/.test(note)) return false;
  if (!/Residential Re-roof Permit is \$25 at \$12,000, so feeTypicalUsd is \$25/.test(note)) return false;
  if (!/included in the \$25 and is not added again/.test(note)) return false;
  if (!/High \$22,000: valuation is unused, so feeHighUsd stays \$25/.test(note)) return false;
  if (!/The high uses the same covering-only path/.test(note)) return false;
  if (!/Residential Re-roof Permit is \$25 at \$22,000, so feeHighUsd is \$25/.test(note)) return false;
  if (!/The \$25 high is the same total as the \$25 typical and is not added on top/.test(note)) return false;
  if (!/Structural sheathing\/framing uses the \u00a710-38 valuation building-permit table instead/.test(note)) {
    return false;
  }
  if (!/not the recorded covering-only typical path/.test(note)) return false;
  if (!/That \u00a710-38 path is not feeLowUsd, feeTypicalUsd, or feeHighUsd, and this note does not add it/.test(note)) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$25 total/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Covering-only reroof is the published \$25 Residential Re-roof Permit/.test(caveat)) return false;
  if (!/not the valuation table/.test(caveat)) return false;
  if (!/Structural sheathing\/framing uses the \u00a710-38 valuation building-permit table instead/.test(caveat)) {
    return false;
  }
  return true;
}

/**
 * Short San Antonio roof copy. The $25 Residential Re-roof Permit walk stays on
 * the permit callout calculation note. Null unless the recorded $25 / $25 / $25
 * anchors match.
 */
function sanAntonioRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): SanAntonioRoofPageCopy | null {
  if (!sanAntonioRoofFacts(city, permit)) return null;
  const low = sanAntonioMoneyExact(permit.feeLowUsd as number);
  const typical = sanAntonioMoneyExact(permit.feeTypicalUsd as number);
  const high = sanAntonioMoneyExact(permit.feeHighUsd as number);
  const projectValue = sanAntonioMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.high as number);
  const reroof = sanAntonioMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat Residential Re-roof Permit path, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". That total is the " +
        reroof +
        " Residential Re-roof Permit on p. 5 of the FY2026 Development Fee Schedule. The valuation table is not used for covering-only reroof. Structural sheathing/framing uses the \u00a710-38 valuation building-permit table instead and is not the recorded covering-only typical path. Full detail is in the calculation note on this page. Recorded valuations of " +
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
        ": the Residential Re-roof Permit on p. 5 (" +
        reroof +
        "). Low and high are the same " +
        low +
        " covering-only path. Valuation is unused. The walk is in the calculation note on this page",
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
        " on the Residential Re-roof Permit line (" +
        reroof +
        "). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is the same total and is not added on top of the typical. Valuation is unused. Structural sheathing/framing uses the \u00a710-38 valuation building-permit table instead and is not the recorded covering-only typical path. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical covering-only reroof is the recorded path, and the typical fee on that path is " +
      typical +
      ". Structural sheathing/framing on the \u00a710-38 valuation building-permit table is not the typical path.",
    includedClause:
      "The " +
      reroof +
      " Residential Re-roof Permit is included in that " +
      typical +
      ". The " +
      high +
      " high is the same covering-only total and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const SAN_ANTONIO_HVAC_SOURCE_NAME =
  "City of San Antonio DSD FY2026 Development Fee Schedule (Rev. October 2025), p. 16 Heating and Air Conditioning (Mechanical) Inspection Fees \u2014 Commercial and Existing Residential";
const SAN_ANTONIO_HVAC_SOURCE_URL =
  "https://docsonline.sanantonio.gov/DSDUploads/CurrentFeeSchedule.pdf";

type SanAntonioHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars. The locked totals are $56.25 / $65.85 / $72.10. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * San Antonio HVAC: FY2026 p. 16 existing-residential mechanical basic $50
 * plus per-device lines. Low is one replacement device ($56.25). Typical is a
 * 3-ton like-for-like furnace plus AC ($65.85). High adds an air handler
 * ($72.10). Valuation is unused. The section 10-38 valuation table and the $77
 * new-system line are not recorded totals. A separate electrical permit is not
 * in the locked totals. Returns null if those anchors drift.
 */
function sanAntonioHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "san-antonio-tx" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!sanAntonioSameCents(permit.feeLowUsd, 56.25)) return false;
  if (!sanAntonioSameCents(permit.feeTypicalUsd, 65.85)) return false;
  if (!sanAntonioSameCents(permit.feeHighUsd, 72.1)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== SAN_ANTONIO_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== SAN_ANTONIO_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 3) return false;
  if (
    (extras[0]?.name || "") !== "Basic Heating and Air Conditioning (Mechanical) Permit" ||
    !sanAntonioSameCents(extras[0]?.feeUsd, 50)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Gas furnace (per item)" || !sanAntonioSameCents(extras[1]?.feeUsd, 9.6)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Condensing unit / heat pump / air handler (per item)" ||
    !sanAntonioSameCents(extras[2]?.feeUsd, 6.25)
  ) {
    return false;
  }
  const basicNote = extras[0]?.note || "";
  if (!/Included in the \$56\.25, \$65\.85, and \$72\.10/.test(basicNote)) return false;
  if (!/basic Heating and Air Conditioning \(Mechanical\) Permit \$50\.00/.test(basicNote)) return false;
  if (!/Online processing \$10 is free/.test(basicNote)) return false;
  const furnaceNote = extras[1]?.note || "";
  if (!/Included in the \$65\.85 typical and the \$72\.10 high/.test(furnaceNote)) return false;
  if (!/Not on the \$56\.25 one-device low/.test(furnaceNote)) return false;
  if (!/gas furnace \$9\.60 each/.test(furnaceNote)) return false;
  const deviceNote = extras[2]?.note || "";
  if (!/Per-item \$6\.25/.test(deviceNote)) return false;
  if (!/One replacement device on the \$56\.25 low/.test(deviceNote)) return false;
  if (!/one condensing unit on the \$65\.85 typical/.test(deviceNote)) return false;
  if (!/high adds a second \$6\.25/.test(deviceNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(SAN_ANTONIO_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/3-ton like-for-like furnace plus AC/.test(note)) return false;
  if (!/existing-residential mechanical basic plus per-device lines/.test(note)) return false;
  if (!/not the \u00a710-38 valuation table and not the \$77 new-system line/.test(note)) return false;
  if (!/feeModel is tiered/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$56\.25, feeTypicalUsd is \$65\.85, and feeHighUsd is \$72\.10/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/Valuation is not an input on this mechanical inspection fee path/.test(note)) return false;
  if (!/unused and do not change the \$56\.25 \/ \$65\.85 \/ \$72\.10/.test(note)) return false;
  if (!/basic Heating and Air Conditioning \(Mechanical\) Permit is \$50\.00/.test(note)) return false;
  if (!/online processing is free/.test(note)) return false;
  if (!/gas furnace is \$9\.60 each/.test(note)) return false;
  if (!/condensing unit, heat pump, air handler, or replacement device is \$6\.25 each/.test(note)) return false;
  if (!/Low \$5,000: valuation is unused, so feeLowUsd stays \$56\.25/.test(note)) return false;
  if (!/one replacement device: basic mechanical permit \$50\.00 \+ replacement device \$6\.25 = \$56\.25, so feeLowUsd is \$56\.25/.test(note)) {
    return false;
  }
  if (!/gas furnace line is not on the low path/.test(note)) return false;
  if (!/Typical \$7,500: valuation is unused, so feeTypicalUsd stays \$65\.85/.test(note)) return false;
  if (!/3-ton like-for-like furnace plus AC: basic mechanical permit \$50\.00 \+ gas furnace \$9\.60 \+ condensing unit \$6\.25 = \$65\.85, so feeTypicalUsd is \$65\.85/.test(note)) {
    return false;
  }
  if (!/included in the \$65\.85 and are not added again/.test(note)) return false;
  if (!/High \$16,000: valuation is unused, so feeHighUsd stays \$72\.10/.test(note)) return false;
  if (!/furnace plus condensing unit plus air handler: basic mechanical permit \$50\.00 \+ gas furnace \$9\.60 \+ condensing unit \$6\.25 \+ air handler \$6\.25 = \$72\.10, so feeHighUsd is \$72\.10/.test(note)) {
    return false;
  }
  if (!/\$72\.10 high is not a second fee stacked on top of the \$65\.85 typical/.test(note)) return false;
  if (!/\$77 new-system line is not feeLowUsd, feeTypicalUsd, or feeHighUsd, and this note does not add it/.test(note)) {
    return false;
  }
  if (!/\u00a710-38 valuation table is not used for this like-for-like change-out/.test(note)) return false;
  if (!/does not invent valuation-table dollars into the locked totals/.test(note)) return false;
  if (!/separate electrical permit applies if a new circuit is needed and is not invented into the locked totals/.test(note)) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$56\.25, \$65\.85, and \$72\.10 totals/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/existing-residential mechanical basic \+ per-device lines/.test(caveat)) return false;
  if (!/not the \u00a710-38 valuation table and not the \$77 new-system line/.test(caveat)) return false;
  if (!/Online processing fee is free/.test(caveat)) return false;
  if (!/Separate electrical permit if a new circuit/.test(caveat)) return false;
  return true;
}

/**
 * Short San Antonio HVAC copy. The $56.25 / $65.85 / $72.10 device walk stays
 * on the permit callout calculation note. Null unless those anchors match.
 */
function sanAntonioHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): SanAntonioHvacPageCopy | null {
  if (!sanAntonioHvacFacts(city, permit)) return null;
  const low = sanAntonioMoneyExact(permit.feeLowUsd as number);
  const typical = sanAntonioMoneyExact(permit.feeTypicalUsd as number);
  const high = sanAntonioMoneyExact(permit.feeHighUsd as number);
  const projectValue = sanAntonioMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = sanAntonioMoneyExact(permit.assumedValuationUsd?.high as number);
  const basic = sanAntonioMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  const furnace = sanAntonioMoneyExact((permit.extras || [])[1]?.feeUsd as number);
  const device = sanAntonioMoneyExact((permit.extras || [])[2]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded existing-residential mechanical basic plus per-device lines, so the low fee is " +
        low +
        " (one replacement device: " +
        basic +
        " + " +
        device +
        "), the typical fee is " +
        typical +
        " (3-ton like-for-like furnace plus AC: " +
        basic +
        " + " +
        furnace +
        " + " +
        device +
        "), and the high fee is " +
        high +
        " (furnace plus condensing unit plus air handler: " +
        basic +
        " + " +
        furnace +
        " + " +
        device +
        " + " +
        device +
        "). The high is not a second fee stacked on top of the typical. The \u00a710-38 valuation table and the $77 new-system line are not the recorded typical path. A separate electrical permit if a new circuit is not in these totals. Full arithmetic is in the calculation note on this page. Recorded valuations of " +
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
        ": basic mechanical permit " +
        basic +
        " plus gas furnace " +
        furnace +
        " plus one condensing unit " +
        device +
        ". Low is " +
        low +
        " on one replacement device (" +
        basic +
        " + " +
        device +
        "). High is " +
        high +
        " with an added air handler (" +
        device +
        "). Valuation is unused. The walk is in the calculation note on this page",
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
        " high. Valuation is not an input on the existing-residential mechanical inspection fees, so those amounts are unused and the recorded fees stay " +
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
        " on the existing-residential mechanical basic plus per-device lines (" +
        basic +
        " + " +
        furnace +
        " + " +
        device +
        "). The low fee is " +
        low +
        " on one replacement device and is not added on top of the typical. The high fee is " +
        high +
        " for a furnace plus condensing unit plus air handler and is not a second fee stacked on the typical. Valuation is unused. The \u00a710-38 valuation table and the $77 new-system line are not the recorded typical path. A separate electrical permit if a new circuit is not in these totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical 3-ton like-for-like furnace plus AC is the recorded path, and the typical fee on that path is " +
      typical +
      ". The $77 new-system line and the \u00a710-38 valuation table are not the typical path.",
    includedClause:
      "The " +
      basic +
      " basic mechanical permit, the " +
      furnace +
      " gas furnace, and the " +
      device +
      " condensing unit are included in that " +
      typical +
      ". The " +
      low +
      " low is one replacement device and is not added on top of the typical. The " +
      high +
      " high adds an air handler and is not a second fee. A separate electrical permit is not in that total.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const TAMPA_ROOF_SOURCE_NAME =
  "City of Tampa Trade Permit Fee Schedule (updated 2/16/2023, effective Oct 1, 2018)";
const TAMPA_ROOF_SOURCE_URL =
  "https://www.tampa.gov/sites/default/files/document/2023/trade_permit_fee_schedule_02.16.23.pdf";

type TampaRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 181.43 to $181. */
  typicalExact: string;
  rangeExact: string;
};

function tampaMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function tampaSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Tampa roof: Trade schedule Roofing (1-2 family) $177.00 plus the Florida
 * Building Permit Surcharge. The table excludes that surcharge. The surcharge
 * is 2.5% of permit value or a $4.00 minimum, so max($4.00, 0.025 x $177 =
 * $4.43) is $4.43. Fees stay $181.43 / $181.43 / $181.43. Valuation does not
 * change the trade fee. Returns null if those anchors drift.
 */
function tampaRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "tampa-fl" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!tampaSameCents(permit.feeLowUsd, 181.43)) return false;
  if (!tampaSameCents(permit.feeTypicalUsd, 181.43)) return false;
  if (!tampaSameCents(permit.feeHighUsd, 181.43)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== TAMPA_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== TAMPA_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "Trade schedule Roofing (1-2 family)" ||
    !tampaSameCents(extras[0]?.feeUsd, 177)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Florida Building Permit Surcharge" ||
    !tampaSameCents(extras[1]?.feeUsd, 4.43)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included in the $181.43 total. Table excludes FL surcharge.") return false;
  if (
    (extras[1]?.note || "") !==
    "2.5% of permit value or $4.00 minimum (0.025\u00d7177=$4.43). Included in the $181.43 total."
  ) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(TAMPA_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/1-2 family roofing trade permit/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$181\.43, feeTypicalUsd is \$181\.43, and feeHighUsd is \$181\.43/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not an input on this flat trade fee/.test(note)) return false;
  if (!/unused and do not change the \$181\.43 \/ \$181\.43 \/ \$181\.43/.test(note)) return false;
  if (!/Trade schedule Roofing \(1-2 family\) line is \$177\.00/.test(note)) return false;
  if (!/table excludes the Florida Building Permit Surcharge/.test(note)) return false;
  if (!/2\.5% of permit value or a \$4\.00 minimum/.test(note)) return false;
  if (!/0\.025 times \$177 is \$4\.43/.test(note)) return false;
  if (!/max\(\$4\.00, 0\.025\u00d7177=\$4\.43\)/.test(note)) return false;
  if (!/Low \$8,000: valuation is unused, so feeLowUsd stays \$181\.43/.test(note)) return false;
  if (!/so feeLowUsd is \$181\.43/.test(note)) return false;
  if (!/same roofing path as the typical/.test(note)) return false;
  if (!/Valuation does not change the trade fee/.test(note)) return false;
  if (!/Typical \$12,000: valuation is unused, so feeTypicalUsd stays \$181\.43/.test(note)) return false;
  if (!/so feeTypicalUsd is \$181\.43/.test(note)) return false;
  if (!/included in the \$181\.43 and are not added again/.test(note)) return false;
  if (!/High \$22,000: valuation is unused, so feeHighUsd stays \$181\.43/.test(note)) return false;
  if (!/so feeHighUsd is \$181\.43/.test(note)) return false;
  if (!/not added on top/.test(note)) return false;
  if (!/later Construction Services increase had not taken effect/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$181\.43/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/flat trade fee, not valuation/.test(caveat)) return false;
  if (!/Schedule still posted 2026-09-01/.test(caveat)) return false;
  if (!/later Construction Services increase had not taken effect/.test(caveat)) return false;
  return true;
}

/**
 * Short Tampa roof copy. The $177.00 plus $4.43 surcharge walk stays on the
 * permit callout calculation note. Null unless the recorded $181.43 / $181.43 /
 * $181.43 anchors match.
 */
function tampaRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): TampaRoofPageCopy | null {
  if (!tampaRoofFacts(city, permit)) return null;
  const low = tampaMoneyExact(permit.feeLowUsd as number);
  const typical = tampaMoneyExact(permit.feeTypicalUsd as number);
  const high = tampaMoneyExact(permit.feeHighUsd as number);
  const projectValue = tampaMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = tampaMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = tampaMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = tampaMoneyExact(permit.assumedValuationUsd?.high as number);
  const roofing = tampaMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  const surcharge = tampaMoneyExact((permit.extras || [])[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded flat Trade schedule Roofing (1-2 family) path, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". That total is the " +
        roofing +
        " roofing line plus the Florida Building Permit Surcharge of max($4.00, 0.025\u00d7177=" +
        surcharge +
        "), which is " +
        surcharge +
        ". The table excludes that surcharge until it is added. Valuation does not change the trade fee. A later Construction Services increase had not taken effect on the 2026-09-01 retrieval date. Full detail is in the calculation note on this page. Recorded valuations of " +
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
        ": Trade schedule Roofing (1-2 family) " +
        roofing +
        " plus the Florida Building Permit Surcharge " +
        surcharge +
        " (the greater of $4.00 and 2.5% of $177). Low and high are the same " +
        low +
        " roofing path. Valuation is unused. The walk is in the calculation note on this page",
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
        " high. Valuation is not an input on this flat trade fee, so those amounts are unused and the recorded fees stay " +
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
        " on the Trade schedule Roofing (1-2 family) line (" +
        roofing +
        " plus the Florida Building Permit Surcharge " +
        surcharge +
        "). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is the same total and is not added on top of the typical. Valuation is unused and does not change the trade fee. A later Construction Services increase had not taken effect on the 2026-09-01 retrieval date. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical 1-2 family roofing trade permit is the recorded path, and the typical fee on that path is " +
      typical +
      ". Valuation does not change that trade fee.",
    includedClause:
      "The " +
      roofing +
      " Trade schedule Roofing (1-2 family) line and the " +
      surcharge +
      " Florida Building Permit Surcharge are included in that " +
      typical +
      ". The table excludes the surcharge until it is added, and it is not added again. The " +
      high +
      " high is the same roofing total and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const ORLANDO_ROOF_SOURCE_NAME =
  "City of Orlando Permitting Development Fees — Residential (1 or 2 units), effective January 2026";
const ORLANDO_ROOF_SOURCE_URL =
  "https://www.orlando.gov/files/sharedassets/public/v/1/departments/edv/permitting-services-division/permitting-development-fees-residential-2026.pdf";

type OrlandoRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 108.88 / 127.93 / 175.94. */
  typicalExact: string;
  rangeExact: string;
};

function orlandoMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function orlandoSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Orlando roof: residential 1 or 2 unit BLD fee is $66.24 for the first
 * $1,000 plus $4.41 each additional $1,000 or fraction, plus AIF 1.5%
 * (minimum $2), Operational Trust Fund 1% (minimum $2), technology surcharge
 * 3%, and concurrency surcharge 5% of the building permit fee. Fees stay
 * $108.88 / $127.93 / $175.94 at $8,000 / $12,000 / $22,000.
 * Returns null if those anchors drift.
 */
function orlandoRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "orlando-fl" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!orlandoSameCents(permit.feeLowUsd, 108.88)) return false;
  if (!orlandoSameCents(permit.feeTypicalUsd, 127.93)) return false;
  if (!orlandoSameCents(permit.feeHighUsd, 175.94)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== ORLANDO_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== ORLANDO_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 5) return false;
  if (
    (extras[0]?.name || "") !== "Building permit fee — residential 1 or 2 units" ||
    !orlandoSameCents(extras[0]?.feeUsd, 114.75)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Administrative Inspection Fund 1.5% (min $2)" ||
    !orlandoSameCents(extras[1]?.feeUsd, 2)
  ) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "Operational Trust Fund 1% (min $2)" ||
    !orlandoSameCents(extras[2]?.feeUsd, 2)
  ) {
    return false;
  }
  if (
    (extras[3]?.name || "") !== "Technology surcharge 3%" ||
    !orlandoSameCents(extras[3]?.feeUsd, 3.44)
  ) {
    return false;
  }
  if (
    (extras[4]?.name || "") !== "Concurrency surcharge 5%" ||
    !orlandoSameCents(extras[4]?.feeUsd, 5.74)
  ) {
    return false;
  }
  if (
    (extras[0]?.note || "") !==
    "$66.24 first $1,000 + $4.41 each additional $1,000 or fraction. Included."
  ) {
    return false;
  }
  if ((extras[1]?.note || "") !== "Included.") return false;
  if ((extras[2]?.note || "") !== "Included. F.S. building-permit surcharge analogue on this sheet.") {
    return false;
  }
  if ((extras[3]?.note || "") !== "Included.") return false;
  if ((extras[4]?.note || "") !== "5% of the building permit fee. Included.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(ORLANDO_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/residential 1 or 2 unit BLD building permit fee/.test(note)) return false;
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$108\.88, feeTypicalUsd is \$127\.93, and feeHighUsd is \$175\.94/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/\$66\.24 for the first \$1,000 plus \$4\.41/.test(note)) return false;
  if (!/each additional \$1,000 or fraction/.test(note)) return false;
  if (!/Administrative Inspection Fund \(AIF\) 1\.5%/.test(note)) return false;
  if (!/Operational Trust Fund 1% of the BLD fee \(minimum \$2\)/.test(note)) return false;
  if (!/technology surcharge 3% of the BLD fee/.test(note)) return false;
  if (!/concurrency surcharge 5% of the building permit fee/.test(note)) return false;
  if (!/exact thousand, so no fractional thousand is added/.test(note)) return false;
  if (!/rounded to the cent/.test(note)) return false;
  if (!/Low \$8,000: BLD \$66\.24 \+ \$4\.41 x 7 = \$97\.11/.test(note)) return false;
  if (!/\$97\.11 \+ \$2\.00 \+ \$2\.00 \+ \$2\.91 \+ \$4\.86 = \$108\.88/.test(note)) return false;
  if (!/which is feeLowUsd \$108\.88/.test(note)) return false;
  if (!/Typical \$12,000: BLD \$66\.24 \+ \$4\.41 x 11 = \$114\.75/.test(note)) return false;
  if (!/\$114\.75 \+ \$2\.00 \+ \$2\.00 \+ \$3\.44 \+ \$5\.74 = \$127\.93/.test(note)) return false;
  if (!/which is feeTypicalUsd \$127\.93/.test(note)) return false;
  if (!/included in the typical total/.test(note) || !/not added again/.test(note)) return false;
  if (!/High \$22,000: BLD \$66\.24 \+ \$4\.41 x 21 = \$158\.85/.test(note)) return false;
  if (!/\$158\.85 \+ \$2\.38 \+ \$2\.00 \+ \$4\.77 \+ \$7\.94 = \$175\.94/.test(note)) return false;
  if (!/which is feeHighUsd \$175\.94/.test(note)) return false;
  if (!/\$175\.94 high is not added on top of the \$127\.93 typical/.test(note)) return false;
  if (!/ICC BVD or the contract, whichever is greater/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$108\.88, \$127\.93, and \$175\.94 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/ICC BVD or contract, whichever is greater/.test(caveat)) return false;
  if (!/assumed valuations used/.test(caveat)) return false;
  if (!/5% concurrency surcharge is listed on the BLD sheet and is included/.test(caveat)) return false;
  return true;
}

/**
 * Short Orlando roof copy. The BLD plus AIF, trust, tech, and concurrency
 * walk stays on the permit callout calculation note. Null unless the recorded
 * $108.88 / $127.93 / $175.94 anchors match.
 */
function orlandoRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): OrlandoRoofPageCopy | null {
  if (!orlandoRoofFacts(city, permit)) return null;
  const low = orlandoMoneyExact(permit.feeLowUsd as number);
  const typical = orlandoMoneyExact(permit.feeTypicalUsd as number);
  const high = orlandoMoneyExact(permit.feeHighUsd as number);
  const projectValue = orlandoMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = orlandoMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = orlandoMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = orlandoMoneyExact(permit.assumedValuationUsd?.high as number);
  const extras = permit.extras || [];
  const bld = orlandoMoneyExact(extras[0]?.feeUsd as number);
  const aif = orlandoMoneyExact(extras[1]?.feeUsd as number);
  const trust = orlandoMoneyExact(extras[2]?.feeUsd as number);
  const tech = orlandoMoneyExact(extras[3]?.feeUsd as number);
  const concurrency = orlandoMoneyExact(extras[4]?.feeUsd as number);
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
        ". Each total is the residential 1 or 2 unit BLD building permit fee ($66.24 for the first $1,000 plus $4.41 each additional $1,000 or fraction) plus AIF 1.5% (minimum $2), the Operational Trust Fund 1% (minimum $2), the technology surcharge 3%, and the concurrency surcharge 5% of the building permit fee. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The residential 1 or 2 unit BLD fee is $66.24 for the first $1,000 plus $4.41 each additional $1,000 or fraction, plus AIF, the Operational Trust Fund, the technology surcharge, and the concurrency surcharge. The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ". The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee uses the recorded assumed valuations of " +
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
        ". The high is not added on top of the typical. The total includes the BLD building permit fee plus AIF, the Operational Trust Fund, the technology surcharge, and the concurrency surcharge. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical roof replacement is the recorded residential 1 or 2 unit BLD valuation path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      bld +
      " building permit fee, the " +
      aif +
      " Administrative Inspection Fund, the " +
      trust +
      " Operational Trust Fund, the " +
      tech +
      " technology surcharge, and the " +
      concurrency +
      " concurrency surcharge are included in that " +
      typical +
      ". They are not added again. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const ORLANDO_HVAC_SOURCE_NAME =
  "City of Orlando residential MEC Mechanical Permit Fee, January 2026";
const ORLANDO_HVAC_SOURCE_URL =
  "https://www.orlando.gov/files/sharedassets/public/v/1/departments/edv/permitting-services-division/permitting-development-fees-residential-2026.pdf";

type OrlandoHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 113.67 / 147.75 / 238.64. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Orlando HVAC: residential mechanical fee is $66.24 for the first $1,000
 * plus $11.03 each additional $1,000 through $25,000, plus a technology
 * surcharge of 3% of that mechanical fee. Fees stay $113.67 / $147.75 /
 * $238.64 at $5,000 / $7,500 / $16,000. AIF, trust, and concurrency are not
 * on this row. Returns null if those anchors drift.
 */
function orlandoHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "orlando-fl" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!orlandoSameCents(permit.feeLowUsd, 113.67)) return false;
  if (!orlandoSameCents(permit.feeTypicalUsd, 147.75)) return false;
  if (!orlandoSameCents(permit.feeHighUsd, 238.64)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== ORLANDO_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== ORLANDO_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if ((extras[0]?.name || "") !== "Mechanical permit fee" || !orlandoSameCents(extras[0]?.feeUsd, 143.45)) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Technology surcharge 3%" ||
    !orlandoSameCents(extras[1]?.feeUsd, 4.3)
  ) {
    return false;
  }
  if (
    (extras[0]?.note || "") !==
    "$66.24 first $1,000 + $11.03 each additional $1,000 through $25,000. Included."
  ) {
    return false;
  }
  if ((extras[1]?.note || "") !== "Included.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(ORLANDO_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/residential mechanical permit fee/.test(note)) return false;
  if (!/\$66\.24 for the first \$1,000 plus \$11\.03/.test(note)) return false;
  if (!/each additional \$1,000 through \$25,000/.test(note)) return false;
  if (!/technology surcharge of 3% of the mechanical permit fee/.test(note)) return false;
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$113\.67, feeTypicalUsd is \$147\.75, and feeHighUsd is \$238\.64/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/mechanical valuation schedule, not the residential building \$4\.41 table/.test(note)) return false;
  if (!/Percent amounts are rounded to the cent/.test(note)) return false;
  if (!/\$5,000 and \$16,000 valuations are exact thousands/.test(note)) return false;
  if (!/\$7,500 valuation leaves a \$500 remainder/.test(note)) return false;
  if (!/remainder counts as one additional \$1,000, so the multiplier is 7/.test(note)) return false;
  if (
    !/Administrative Inspection Fund, Operational Trust Fund, and concurrency surcharge are not on this mechanical row and are not added/.test(
      note,
    )
  ) {
    return false;
  }
  if (!/Low \$5,000: mechanical \$66\.24 \+ \$11\.03 x 4 = \$110\.36/.test(note)) return false;
  if (!/Technology surcharge 3% of \$110\.36 rounds to \$3\.31/.test(note)) return false;
  if (!/\$110\.36 \+ \$3\.31 = \$113\.67, which is feeLowUsd \$113\.67/.test(note)) return false;
  if (!/Typical \$7,500: mechanical \$66\.24 \+ \$11\.03 x 7 = \$143\.45/.test(note)) return false;
  if (!/Technology surcharge 3% of \$143\.45 rounds to \$4\.30/.test(note)) return false;
  if (!/\$143\.45 \+ \$4\.30 = \$147\.75, which is feeTypicalUsd \$147\.75/.test(note)) return false;
  if (!/included in the typical total/.test(note) || !/not added again/.test(note)) return false;
  if (!/High \$16,000: mechanical \$66\.24 \+ \$11\.03 x 15 = \$231\.69/.test(note)) return false;
  if (!/Technology surcharge 3% of \$231\.69 rounds to \$6\.95/.test(note)) return false;
  if (!/\$231\.69 \+ \$6\.95 = \$238\.64, which is feeHighUsd \$238\.64/.test(note)) return false;
  if (!/\$238\.64 high is not added on top of the \$147\.75 typical/.test(note)) return false;
  if (!/electrical permit if a new circuit uses the ELE formula and is not in these totals/.test(note)) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$113\.67, \$147\.75, and \$238\.64 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/HVAC uses the mechanical valuation formula/.test(caveat)) return false;
  if (!/not the building \$4\.41 table/.test(caveat)) return false;
  if (!/Electrical extra if a new circuit \(ELE formula\)/.test(caveat)) return false;
  if (!/not in totals/.test(caveat)) return false;
  return true;
}

/**
 * Short Orlando HVAC copy. The mechanical valuation plus 3% technology
 * surcharge walk stays on the permit callout calculation note. Null unless
 * the recorded $113.67 / $147.75 / $238.64 anchors match.
 */
function orlandoHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): OrlandoHvacPageCopy | null {
  if (!orlandoHvacFacts(city, permit)) return null;
  const low = orlandoMoneyExact(permit.feeLowUsd as number);
  const typical = orlandoMoneyExact(permit.feeTypicalUsd as number);
  const high = orlandoMoneyExact(permit.feeHighUsd as number);
  const projectValue = orlandoMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = orlandoMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = orlandoMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = orlandoMoneyExact(permit.assumedValuationUsd?.high as number);
  const extras = permit.extras || [];
  const mechanical = orlandoMoneyExact(extras[0]?.feeUsd as number);
  const tech = orlandoMoneyExact(extras[1]?.feeUsd as number);
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
        ". Each total is the residential mechanical permit fee ($66.24 for the first $1,000 plus $11.03 each additional $1,000 through $25,000) plus a technology surcharge of 3% of that mechanical fee. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The residential mechanical permit fee is $66.24 for the first $1,000 plus $11.03 each additional $1,000 through $25,000, plus a technology surcharge of 3% of that mechanical fee. The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ". The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee uses the recorded assumed valuations of " +
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
        ". The high is not added on top of the typical. The total includes the mechanical permit fee plus the technology surcharge. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical HVAC replacement is the recorded residential mechanical valuation path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      mechanical +
      " mechanical permit fee and the " +
      tech +
      " technology surcharge are included in that " +
      typical +
      ". They are not added again. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const JACKSONVILLE_ROOF_SOURCE_NAME =
  "City of Jacksonville coj.net/fees implementing Ordinance Code \u00a7320.409(10) Roofing";
const JACKSONVILLE_ROOF_SOURCE_URL = "https://www.coj.net/fees";

type JacksonvilleRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 167.5 to $168. */
  typicalExact: string;
  rangeExact: string;
};

function jacksonvilleMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function jacksonvilleSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Jacksonville roof: BID roofing is $10 per 1,000 sf, with a $150 minimum
 * when an inspection is required, plus the $17.50 roofing C&D debris fee.
 * At 1,000 / 1,500 / 1,800 sf that is 1-2 squares ($10-$20), so the $150
 * inspection minimum applies on all three paths. Fees stay $167.50 / $167.50 /
 * $167.50. Assumed project values are not the fee driver. Returns null if
 * those anchors drift.
 */
function jacksonvilleRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "jacksonville-fl" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "area") return false;
  if (!jacksonvilleSameCents(permit.feeLowUsd, 167.5)) return false;
  if (!jacksonvilleSameCents(permit.feeTypicalUsd, 167.5)) return false;
  if (!jacksonvilleSameCents(permit.feeHighUsd, 167.5)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== JACKSONVILLE_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== JACKSONVILLE_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 2) return false;
  if (
    (extras[0]?.name || "") !== "BID roofing minimum (inspection path)" ||
    !jacksonvilleSameCents(extras[0]?.feeUsd, 150)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "C&D debris fee" || !jacksonvilleSameCents(extras[1]?.feeUsd, 17.5)) {
    return false;
  }
  if (
    (extras[0]?.note || "") !==
    "$10 per 1,000 sf; 1,000\u20131,800 sf is 1\u20132 squares ($10\u2013$20) so the $150 inspection minimum applies. Included."
  ) {
    return false;
  }
  if ((extras[1]?.note || "") !== "Roofing C&D line. Included.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(JACKSONVILLE_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/BID roofing inspection path on the per-1,000-sf line/.test(note)) return false;
  if (!/feeModel is area/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$167\.50, feeTypicalUsd is \$167\.50, and feeHighUsd is \$167\.50/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/Valuation is not the fee driver on this area schedule/.test(note)) return false;
  if (!/unused and do not change the \$167\.50 \/ \$167\.50 \/ \$167\.50/.test(note)) return false;
  if (!/published BID roofing line is \$10 per 1,000 sf/.test(note)) return false;
  if (!/that line has a \$150 minimum/.test(note)) return false;
  if (!/roofing C&D debris fee is \$17\.50/.test(note)) return false;
  if (!/1,000 sf low, 1,500 sf typical, and 1,800 sf high/.test(note)) return false;
  if (!/1-2 squares \(\$10-\$20\)/.test(note)) return false;
  if (!/\$150 inspection minimum applies on all three paths/.test(note)) return false;
  if (!/ceil\(sf\/1000\) x \$10, minimum \$150 with inspection, plus \$17\.50 C&D equals \$167\.50/.test(note)) {
    return false;
  }
  if (!/Low 1,000 sf: ceil\(1000\/1000\) x \$10 = \$10/.test(note)) return false;
  if (!/which is feeLowUsd \$167\.50/.test(note)) return false;
  if (!/\$8,000 assumed project value is unused/.test(note)) return false;
  if (!/Typical 1,500 sf: ceil\(1500\/1000\) x \$10 = \$20/.test(note)) return false;
  if (!/which is feeTypicalUsd \$167\.50/.test(note)) return false;
  if (!/included in the \$167\.50 and are not added again/.test(note)) return false;
  if (!/High 1,800 sf: ceil\(1800\/1000\) x \$10 = \$20/.test(note)) return false;
  if (!/which is feeHighUsd \$167\.50/.test(note)) return false;
  if (!/\$22,000 assumed project value is unused/.test(note)) return false;
  if (!/not added on top/.test(note)) return false;
  if (!/Repairs under 500 sf are \$10 and are not this typical job/.test(note)) return false;
  if (!/F\.S\. 2\.5% surcharge is not itemized on the COJ fee page and is not added/.test(note)) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$167\.50 total/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Documented typical roof surface 1,500 sf/.test(caveat)) return false;
  if (!/All three stay on the \$150 inspection minimum/.test(caveat)) return false;
  if (!/Repairs <500 sf are \$10/.test(caveat)) return false;
  if (!/F\.S\. 2\.5% surcharge is not itemized on the COJ fee page and is not added/.test(caveat)) {
    return false;
  }
  return true;
}

/**
 * Short Jacksonville roof copy. The BID per-1,000-sf line, $150 inspection
 * minimum, and $17.50 C&D walk stays on the permit callout calculation note.
 * Null unless the recorded $167.50 / $167.50 / $167.50 anchors match.
 */
function jacksonvilleRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): JacksonvilleRoofPageCopy | null {
  if (!jacksonvilleRoofFacts(city, permit)) return null;
  const low = jacksonvilleMoneyExact(permit.feeLowUsd as number);
  const typical = jacksonvilleMoneyExact(permit.feeTypicalUsd as number);
  const high = jacksonvilleMoneyExact(permit.feeHighUsd as number);
  const projectValue = jacksonvilleMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.high as number);
  const minimum = jacksonvilleMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  const debris = jacksonvilleMoneyExact((permit.extras || [])[1]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded BID roofing inspection path, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". That total is the " +
        minimum +
        " BID roofing minimum plus the " +
        debris +
        " C&D debris fee. The schedule is $10 per 1,000 sf. At 1,000 / 1,500 / 1,800 sf that is 1-2 squares ($10-$20), so the $150 inspection minimum applies on all three paths. Valuation is not the fee driver. Assumed project values of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused and do not change the fee. Full detail is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": BID roofing minimum " +
        minimum +
        " plus the C&D debris fee " +
        debris +
        ". The schedule is $10 per 1,000 sf, and at 1,000 / 1,500 / 1,800 sf the $150 inspection minimum applies. Low and high are the same " +
        low +
        ". Valuation is unused and is not the fee driver. The walk is in the calculation note on this page",
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
        " high. Valuation is not the fee driver on this area schedule, so those amounts are unused and the recorded fees stay " +
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
        " (area). The typical path is " +
        typical +
        " on the BID roofing inspection path (" +
        minimum +
        " minimum plus the " +
        debris +
        " C&D debris fee). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is the same total and is not added on top of the typical. The schedule is $10 per 1,000 sf, and at 1,000 / 1,500 / 1,800 sf the $150 inspection minimum applies. Valuation is unused and does not change the fee. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical roof replacement is the recorded BID roofing inspection path, and the typical fee on that path is " +
      typical +
      ". Valuation is not the fee driver.",
    includedClause:
      "The " +
      minimum +
      " BID roofing minimum and the " +
      debris +
      " C&D debris fee are included in that " +
      typical +
      ". They are not added again. The " +
      high +
      " high is the same roofing total and is not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const JACKSONVILLE_HVAC_SOURCE_NAME =
  "City of Jacksonville Mechanical Permit Fees \u00a7320.409";
const JACKSONVILLE_HVAC_SOURCE_URL = "https://www.coj.net/fees";

type JacksonvilleHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars. Low and typical are both $60; high is $94. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Jacksonville HVAC: air conditioning is $11 per ton for 1-10 tons, the furnace
 * first 200,000 BTU step is $22, and a $60 mechanical minimum applies when the
 * device lines fall under $60. The $17 first-2,000-CFM duct line is high path
 * only. Fees stay $60 / $60 / $94. Assumed project values are not the fee
 * driver. Returns null if those anchors drift.
 */
function jacksonvilleHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "jacksonville-fl" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "tiered") return false;
  if (!jacksonvilleSameCents(permit.feeLowUsd, 60)) return false;
  if (!jacksonvilleSameCents(permit.feeTypicalUsd, 60)) return false;
  if (!jacksonvilleSameCents(permit.feeHighUsd, 94)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== JACKSONVILLE_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== JACKSONVILLE_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if (
    (extras[0]?.name || "") !== "Air conditioning $11/ton (1\u201310 tons)" ||
    !jacksonvilleSameCents(extras[0]?.feeUsd, 33)
  ) {
    return false;
  }
  if (
    (extras[1]?.name || "") !== "Furnace first 200,000 BTU" ||
    !jacksonvilleSameCents(extras[1]?.feeUsd, 22)
  ) {
    return false;
  }
  if ((extras[2]?.name || "") !== "Mechanical minimum" || !jacksonvilleSameCents(extras[2]?.feeUsd, 60)) {
    return false;
  }
  if (
    (extras[3]?.name || "") !== "Air duct systems first 2,000 CFM" ||
    !jacksonvilleSameCents(extras[3]?.feeUsd, 17)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Typical 3-ton. Then mechanical minimum $60 applies.") return false;
  if (
    (extras[1]?.note || "") !==
    "80 kBTU typical (and 60/120 kBTU) all sit in the first 200 kBTU step."
  ) {
    return false;
  }
  if ((extras[2]?.note || "") !== "Included as typical/low.") return false;
  if ((extras[3]?.note || "") !== "High path only.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(JACKSONVILLE_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/mechanical device schedule with the \$60 mechanical minimum/.test(note)) return false;
  if (!/feeModel is tiered/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$60, feeTypicalUsd is \$60, and feeHighUsd is \$94/.test(note)) return false;
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/Valuation is not the fee driver on this tiered schedule/.test(note)) return false;
  if (!/unused and do not change the \$60 \/ \$60 \/ \$94/.test(note)) return false;
  if (!/published air conditioning line is \$11 per ton for 1-10 tons/.test(note)) return false;
  if (!/furnace line is \$22 for the first 200,000 BTU/.test(note)) return false;
  if (!/80 kBTU and the 60 kBTU and 120 kBTU sizes all sit in that first 200,000 BTU step/.test(note)) {
    return false;
  }
  if (!/mechanical minimum is \$60 and applies when the device lines fall under \$60/.test(note)) return false;
  if (!/air duct systems line is \$17 for the first 2,000 CFM and is used on the high path only/.test(note)) {
    return false;
  }
  if (!/Low 2-ton: \$11 x 2 = \$22/.test(note)) return false;
  if (!/which is feeLowUsd \$60/.test(note)) return false;
  if (!/\$5,000 assumed project value is unused/.test(note)) return false;
  if (!/Typical 3-ton plus furnace: air conditioning \$11 x 3 = \$33, plus furnace first 200,000 BTU \$22, equals \$55/.test(note)) {
    return false;
  }
  if (!/which is feeTypicalUsd \$60/.test(note)) return false;
  if (!/\$7,500 assumed project value is unused/.test(note)) return false;
  if (!/\$33 air conditioning line, the \$22 furnace line, and the \$60 mechanical minimum are included as typical and low/.test(note)) {
    return false;
  }
  if (!/not added again/.test(note)) return false;
  if (!/\$60 minimum replaces the \$55 device sum/.test(note)) return false;
  if (!/not stacked on top of \$55/.test(note)) return false;
  if (!/High 5-ton plus furnace plus ducts: air conditioning \$11 x 5 = \$55, plus furnace first 200,000 BTU \$22, plus air duct systems first 2,000 CFM \$17, equals \$94/.test(note)) {
    return false;
  }
  if (!/which is feeHighUsd \$94/.test(note)) return false;
  if (!/\$16,000 assumed project value is unused/.test(note)) return false;
  if (!/\$60 minimum does not stack on top of the \$94/.test(note)) return false;
  if (!/\$17 duct line is on the high path only and is not added to the \$60 low or the \$60 typical/.test(note)) {
    return false;
  }
  if (!/electrical extra is not dollarized and is not in these totals/.test(note)) return false;
  if (!/Florida 2\.5% surcharge is not on the COJ table and is not added/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$60, \$60, and \$94 totals/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/3-ton AC \+ 80 kBTU furnace/.test(caveat)) return false;
  if (!/\$60 minimum/.test(caveat)) return false;
  if (!/first 2,000 CFM ducts/.test(caveat)) return false;
  if (!/\$55\+\$22\+\$17=\$94/.test(caveat)) return false;
  if (!/Electrical extra not dollarized/.test(caveat)) return false;
  if (!/Florida 2\.5% not on the COJ table/.test(caveat)) return false;
  return true;
}

/**
 * Short Jacksonville HVAC copy. The $11/ton line, first-200-kBTU furnace step,
 * $60 mechanical minimum, and high-path-only $17 duct line stay on the permit
 * callout calculation note. Null unless the recorded $60 / $60 / $94 anchors match.
 */
function jacksonvilleHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): JacksonvilleHvacPageCopy | null {
  if (!jacksonvilleHvacFacts(city, permit)) return null;
  const low = jacksonvilleMoneyExact(permit.feeLowUsd as number);
  const typical = jacksonvilleMoneyExact(permit.feeTypicalUsd as number);
  const high = jacksonvilleMoneyExact(permit.feeHighUsd as number);
  const projectValue = jacksonvilleMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = jacksonvilleMoneyExact(permit.assumedValuationUsd?.high as number);
  const extras = permit.extras || [];
  const ac = jacksonvilleMoneyExact(extras[0]?.feeUsd as number);
  const furnace = jacksonvilleMoneyExact(extras[1]?.feeUsd as number);
  const minimum = jacksonvilleMoneyExact(extras[2]?.feeUsd as number);
  const ducts = jacksonvilleMoneyExact(extras[3]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded mechanical device schedule, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". Air conditioning is $11 per ton for 1-10 tons. Low is a 2-ton line ($22), then the " +
        minimum +
        " mechanical minimum. Typical is a 3-ton line (" +
        ac +
        ") plus the furnace first-200,000-BTU step (" +
        furnace +
        "), which is $55, then the " +
        minimum +
        " mechanical minimum. High is a 5-ton line ($55) plus that furnace step (" +
        furnace +
        ") plus the " +
        ducts +
        " first-2,000-CFM duct line, which is " +
        high +
        ". The " +
        minimum +
        " minimum does not stack on the " +
        high +
        ", and the duct line is high path only. Valuation is not the fee driver. Assumed project values of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " are unused and do not change the fee. Full detail is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        ": a 3-ton air conditioner at $11 per ton (" +
        ac +
        ") plus the furnace first-200,000-BTU step (" +
        furnace +
        ") equals $55, then the " +
        minimum +
        " mechanical minimum. Low is a 2-ton line ($22), then the same " +
        minimum +
        " minimum. High is a 5-ton line ($55) plus the furnace step (" +
        furnace +
        ") plus the " +
        ducts +
        " first-2,000-CFM duct line, which is " +
        high +
        ". The " +
        minimum +
        " minimum does not stack on the " +
        high +
        ", and the duct line is high path only. Valuation is unused and is not the fee driver. The walk is in the calculation note on this page",
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
        " high. Valuation is not the fee driver on this tiered mechanical schedule, so those amounts are unused and the recorded fees stay " +
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
        " after the " +
        minimum +
        " mechanical minimum (3-ton air conditioning " +
        ac +
        " plus furnace " +
        furnace +
        " equals $55). The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is a 5-ton line plus the furnace step plus the " +
        ducts +
        " duct line and is not added on top of the typical. The " +
        minimum +
        " minimum does not stack on the " +
        high +
        ". Valuation is unused and does not change the fee. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical HVAC replacement is the recorded mechanical device path, and the typical fee on that path is " +
      typical +
      ". Valuation is not the fee driver.",
    includedClause:
      "The " +
      ac +
      " air conditioning line, the " +
      furnace +
      " furnace line, and the " +
      minimum +
      " mechanical minimum are included in that " +
      typical +
      ". They are not added again. The " +
      ducts +
      " duct line is on the high path only. The " +
      high +
      " high is not added on top of the typical, and the " +
      minimum +
      " minimum does not stack on the " +
      high +
      ".",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
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
 * Short Boston deck copy. Assumptions, why, and FAQs stay one short clause and
 * point at the calculation note. The full long-form walk stays on the permit
 * callout and the fee-model callout. Null unless the recorded $130 / $170 / $250
 * anchors match.
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
  return {
    assumption: asSentence(
      "For the permit line we assumed a new or expanded deck on the recorded long-form schedule at the recorded " +
        typicalVal +
        " typical valuation (not a city-assessed value), so the typical fee is " +
        typical +
        ". Low and high totals are in the calculation note on this page",
    ),
    howCalculated: asSentence(
      "Recorded long-form totals are " +
        low +
        " at " +
        lowVal +
        ", " +
        typical +
        " at " +
        typicalVal +
        ", and " +
        high +
        " at " +
        highVal +
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
        ". The permit totals at those values are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (valuation). The typical path is " +
        typical +
        " at the recorded " +
        typicalVal +
        " valuation for a new or expanded deck. Low and high totals are in the calculation note on this page. Verify the long-form path with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A new or expanded deck is the recorded long-form path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "That " +
      typical +
      " is the recorded long-form total at the recorded " +
      typicalVal +
      " valuation.",
    typicalExact: typical,
    rangeExact: low + " – " + high,
  };
}

const SACRAMENTO_ROOF_SOURCE_NAME =
  "City of Sacramento CDD-0245 Fees and Charges Collected on Residential Building Permits, revised 07-12-2026";
const SACRAMENTO_ROOF_SOURCE_URL =
  "https://www.cityofsacramento.gov/content/dam/portal/cdd/Building/Forms/CDD-0245_Fees-and-Charges-on-Residential-Bldg-Permits.pdf";

type SacramentoRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 215.34 / 226.26 / 253.56. */
  typicalExact: string;
  rangeExact: string;
};

function sacramentoMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function sacramentoSameCents(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

/**
 * Sacramento roof: CDD-0245 HVAC and Re-roof specific-cost permit is $175 on
 * every path, plus a 10% technology surcharge ($17.50) that does not scale,
 * the $1 Green Building / CBSC minimum, General Plan at $2.60 per $1,000, and
 * SMIP at 0.00013 x valuation. Fees stay $215.34 / $226.26 / $253.56 at
 * $8,000 / $12,000 / $22,000. Returns null if those anchors drift.
 */
function sacramentoRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "sacramento-ca" || permit.projectSlug !== "roof-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sacramentoSameCents(permit.feeLowUsd, 215.34)) return false;
  if (!sacramentoSameCents(permit.feeTypicalUsd, 226.26)) return false;
  if (!sacramentoSameCents(permit.feeHighUsd, 253.56)) return false;
  if (permit.typicalProjectValueUsd !== 12000) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 8000 || valuation.typical !== 12000 || valuation.high !== 22000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== SACRAMENTO_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== SACRAMENTO_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 5) return false;
  if (
    (extras[0]?.name || "") !== "HVAC and Re-roof specific-cost permit" ||
    !sacramentoSameCents(extras[0]?.feeUsd, 175)
  ) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Technology surcharge 10%" || !sacramentoSameCents(extras[1]?.feeUsd, 17.5)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "General Plan fee $2.60 per $1,000" ||
    !sacramentoSameCents(extras[2]?.feeUsd, 31.2)
  ) {
    return false;
  }
  if ((extras[3]?.name || "") !== "Green Building / CBSC min $1" || !sacramentoSameCents(extras[3]?.feeUsd, 1)) {
    return false;
  }
  if (
    (extras[4]?.name || "") !== "Strong Motion (SMIP) 0.00013 \u00d7 valuation" ||
    !sacramentoSameCents(extras[4]?.feeUsd, 1.56)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "CDD-0245. Included.") return false;
  if ((extras[1]?.note || "") !== "Of permit fee. Included.") return false;
  if ((extras[2]?.note || "") !== "At $12,000. Included.") return false;
  if ((extras[3]?.note || "") !== "Included.") return false;
  if ((extras[4]?.note || "") !== "At $12,000. Included.") return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(SACRAMENTO_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/CDD-0245 HVAC and Re-roof specific-cost permit/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$215\.34, feeTypicalUsd is \$226\.26, and feeHighUsd is \$253\.56/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/HVAC and Re-roof specific-cost permit is \$175\.00 \(CDD-0245\) and is included on every path/.test(note)) {
    return false;
  }
  if (!/technology surcharge is 10% of the permit fee, which is \$17\.50, and is included on every path/.test(note)) {
    return false;
  }
  if (!/It does not scale with valuation/.test(note)) return false;
  if (!/General Plan fee is \$2\.60 per \$1,000 of valuation/.test(note)) return false;
  if (!/\$8,000 is \$20\.80, \$12,000 is \$31\.20, and \$22,000 is \$57\.20/.test(note)) return false;
  if (!/Green Building \/ CBSC minimum is \$1\.00 and is included on every path/.test(note)) return false;
  if (!/Strong Motion \(SMIP\) is 0\.00013 x valuation/.test(note)) return false;
  if (!/\$8,000 is \$1\.04, \$12,000 is \$1\.56, and \$22,000 is \$2\.86/.test(note)) return false;
  if (!/Low \$8,000: \$175 \+ \$17\.50 \+ \$20\.80 \+ \$1 \+ \$1\.04 = \$215\.34/.test(note)) return false;
  if (!/which is feeLowUsd \$215\.34/.test(note)) return false;
  if (!/Typical \$12,000: \$175 \+ \$17\.50 \+ \$31\.20 \+ \$1 \+ \$1\.56 = \$226\.26/.test(note)) return false;
  if (!/which is feeTypicalUsd \$226\.26/.test(note)) return false;
  if (!/included in the \$226\.26 and are not added again/.test(note)) return false;
  if (!/High \$22,000: \$175 \+ \$17\.50 \+ \$57\.20 \+ \$1 \+ \$2\.86 = \$253\.56/.test(note)) return false;
  if (!/which is feeHighUsd \$253\.56/.test(note)) return false;
  if (!/\$253\.56 high is not added on top of the \$226\.26 typical/.test(note)) return false;
  if (!/Fire inspection \$0\.11\/sf min \$294 is for new area and is not applied to reroof/.test(note)) {
    return false;
  }
  if (
    !/city business operations tax of 0\.0004 x valuation, if the contractor is the applicant, is extra and is not in these totals/.test(
      note,
    )
  ) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$215\.34, \$226\.26, and \$253\.56 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (!/City of Sacramento, not the county/.test(caveat)) return false;
  if (!/Fire inspection \$0\.11\/sf min \$294 is for new area, not applied to reroof/.test(caveat)) return false;
  if (!/0\.0004\u00d7val if contractor is the applicant is extra/.test(caveat)) return false;
  return true;
}

/**
 * Short Sacramento roof copy. The CDD-0245 specific-cost re-roof, 10%
 * technology surcharge, $2.60-per-$1,000 General Plan fee, $1 Green Building /
 * CBSC minimum, and SMIP 0.00013 walk stays on the permit callout calculation
 * note. Null unless the recorded $215.34 / $226.26 / $253.56 anchors match.
 */
function sacramentoRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): SacramentoRoofPageCopy | null {
  if (!sacramentoRoofFacts(city, permit)) return null;
  const low = sacramentoMoneyExact(permit.feeLowUsd as number);
  const typical = sacramentoMoneyExact(permit.feeTypicalUsd as number);
  const high = sacramentoMoneyExact(permit.feeHighUsd as number);
  const projectValue = sacramentoMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = sacramentoMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = sacramentoMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = sacramentoMoneyExact(permit.assumedValuationUsd?.high as number);
  const extras = permit.extras || [];
  const specific = sacramentoMoneyExact(extras[0]?.feeUsd as number);
  const tech = sacramentoMoneyExact(extras[1]?.feeUsd as number);
  const generalPlan = sacramentoMoneyExact(extras[2]?.feeUsd as number);
  const green = sacramentoMoneyExact(extras[3]?.feeUsd as number);
  const smip = sacramentoMoneyExact(extras[4]?.feeUsd as number);
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
        ". Every path includes the " +
        specific +
        " HVAC and Re-roof specific-cost permit (CDD-0245), the 10% technology surcharge (" +
        tech +
        ", which does not scale with valuation), and the " +
        green +
        " Green Building / CBSC minimum. The General Plan fee is $2.60 per $1,000 of valuation and Strong Motion (SMIP) is 0.00013 x valuation, so those two lines change with the recorded valuations. Fire inspection at $0.11 per square foot (minimum $294) is for new area and is not applied to this reroof. The city business operations tax, if the contractor is the applicant, is extra and is not in these totals. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ": HVAC and Re-roof specific-cost permit " +
        specific +
        " plus technology surcharge " +
        tech +
        " plus General Plan fee " +
        generalPlan +
        " plus Green Building / CBSC minimum " +
        green +
        " plus Strong Motion (SMIP) " +
        smip +
        ". The " +
        specific +
        " permit, the 10% technology surcharge, and the " +
        green +
        " minimum are on every path. The technology surcharge does not scale with valuation. General Plan is $2.60 per $1,000 and SMIP is 0.00013 x valuation. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The General Plan fee and Strong Motion (SMIP) use the recorded assumed valuations of " +
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
        ". The " +
        specific +
        " specific-cost permit, the " +
        tech +
        " technology surcharge, and the " +
        green +
        " Green Building / CBSC minimum do not scale with valuation. Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. Every path includes the " +
        specific +
        " HVAC and Re-roof specific-cost permit, the " +
        tech +
        " technology surcharge (10% of the permit fee; it does not scale with valuation), and the " +
        green +
        " Green Building / CBSC minimum. General Plan is $2.60 per $1,000 and SMIP is 0.00013 x valuation. Fire inspection for new area and the city business operations tax, if the contractor is the applicant, are not in these totals. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical roof replacement is the recorded CDD-0245 HVAC and Re-roof specific-cost path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      specific +
      " HVAC and Re-roof specific-cost permit, the " +
      tech +
      " technology surcharge, the " +
      generalPlan +
      " General Plan fee, the " +
      green +
      " Green Building / CBSC minimum, and the " +
      smip +
      " Strong Motion (SMIP) line are included in that " +
      typical +
      ". They are not added again. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const SACRAMENTO_HVAC_SOURCE_NAME = "City of Sacramento CDD-0245 (HVAC and Re-roof $175)";
const SACRAMENTO_HVAC_SOURCE_URL =
  "https://www.cityofsacramento.gov/content/dam/portal/cdd/Building/Forms/CDD-0245_Fees-and-Charges-on-Residential-Bldg-Permits.pdf";

type SacramentoHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 206.50 / 213.00 / 235.10. */
  typicalExact: string;
  rangeExact: string;
};

function sacramentoHvacMoneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = String(abs % 100).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + dollars + "." + rem;
}

/**
 * Sacramento HVAC: CDD-0245 HVAC specific-cost permit is $175.00 on every
 * path, plus a 10% technology surcharge ($17.50) that does not scale, the $1.00
 * Green Building minimum, and General Plan at $2.60 per $1,000. SMIP stays on
 * the reroof path and is not in these totals. Fees stay $206.50 / $213.00 /
 * $235.10 at $5,000 / $7,500 / $16,000. Returns null if those anchors drift.
 */
function sacramentoHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "sacramento-ca" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "flat") return false;
  if (!sacramentoSameCents(permit.feeLowUsd, 206.5)) return false;
  if (!sacramentoSameCents(permit.feeTypicalUsd, 213)) return false;
  if (!sacramentoSameCents(permit.feeHighUsd, 235.1)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== SACRAMENTO_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== SACRAMENTO_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 4) return false;
  if ((extras[0]?.name || "") !== "HVAC specific-cost permit" || !sacramentoSameCents(extras[0]?.feeUsd, 175)) {
    return false;
  }
  if ((extras[1]?.name || "") !== "Technology 10%" || !sacramentoSameCents(extras[1]?.feeUsd, 17.5)) {
    return false;
  }
  if (
    (extras[2]?.name || "") !== "General Plan $2.60 per $1,000" ||
    !sacramentoSameCents(extras[2]?.feeUsd, 19.5)
  ) {
    return false;
  }
  if ((extras[3]?.name || "") !== "Green Building min $1" || !sacramentoSameCents(extras[3]?.feeUsd, 1)) {
    return false;
  }
  if ((extras[0]?.note || "") !== "Included.") return false;
  if ((extras[1]?.note || "") !== "Included.") return false;
  if ((extras[2]?.note || "") !== "At $7,500. Included.") return false;
  if (
    (extras[3]?.note || "") !==
    "Included. SMIP is listed on the reroof path; HVAC change-out page does not list SMIP \u2014 not added."
  ) {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(SACRAMENTO_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/CDD-0245 HVAC specific-cost permit/.test(note)) return false;
  if (!/feeModel is flat/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$206\.50, feeTypicalUsd is \$213\.00, and feeHighUsd is \$235\.10/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/HVAC specific-cost permit is \$175\.00 \(CDD-0245\) and is included on every path/.test(note)) {
    return false;
  }
  if (!/technology surcharge is 10% of the permit fee, which is \$17\.50, and is included on every path/.test(note)) {
    return false;
  }
  if (!/It does not scale with valuation/.test(note)) return false;
  if (!/General Plan fee is \$2\.60 per \$1,000 of valuation/.test(note)) return false;
  if (!/\$5,000 is \$13\.00, \$7,500 is \$19\.50, and \$16,000 is \$41\.60/.test(note)) return false;
  if (!/Green Building minimum is \$1\.00 and is included on every path/.test(note)) return false;
  if (
    !/SMIP is listed on the reroof path; the HVAC change-out page does not list SMIP, and SMIP is not added into these HVAC totals/.test(
      note,
    )
  ) {
    return false;
  }
  if (!/Low \$5,000: \$175 \+ \$17\.50 \+ \$13\.00 \+ \$1 = \$206\.50/.test(note)) return false;
  if (!/which is feeLowUsd \$206\.50/.test(note)) return false;
  if (!/Typical \$7,500: \$175 \+ \$17\.50 \+ \$19\.50 \+ \$1 = \$213\.00/.test(note)) return false;
  if (!/which is feeTypicalUsd \$213\.00/.test(note)) return false;
  if (!/included in the \$213\.00 and are not added again/.test(note)) return false;
  if (!/High \$16,000: \$175 \+ \$17\.50 \+ \$41\.60 \+ \$1 = \$235\.10/.test(note)) return false;
  if (!/which is feeHighUsd \$235\.10/.test(note)) return false;
  if (!/\$235\.10 high is not added on top of the \$213\.00 typical/.test(note)) return false;
  if (!/Like-for-like 3-ton uses the \$175 HVAC specific-cost permit, not the valuation table/.test(note)) {
    return false;
  }
  if (!/does not invent a fee beyond the recorded \$206\.50, \$213\.00, and \$235\.10 totals/.test(note)) {
    return false;
  }

  const caveat = permit.caveat || "";
  if (caveat !== "Like-for-like 3-ton uses the $175 HVAC specific-cost permit, not the valuation table.") {
    return false;
  }
  return true;
}

/**
 * Short Sacramento HVAC copy. The CDD-0245 specific-cost permit, 10%
 * technology surcharge, $2.60-per-$1,000 General Plan fee, and $1 Green
 * Building minimum walk stays on the permit callout calculation note. SMIP
 * stays off this path. Null unless the recorded $206.50 / $213.00 / $235.10
 * anchors match.
 */
function sacramentoHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): SacramentoHvacPageCopy | null {
  if (!sacramentoHvacFacts(city, permit)) return null;
  const low = sacramentoHvacMoneyExact(permit.feeLowUsd as number);
  const typical = sacramentoHvacMoneyExact(permit.feeTypicalUsd as number);
  const high = sacramentoHvacMoneyExact(permit.feeHighUsd as number);
  const projectValue = sacramentoMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = sacramentoMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = sacramentoMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = sacramentoMoneyExact(permit.assumedValuationUsd?.high as number);
  const extras = permit.extras || [];
  const specific = sacramentoHvacMoneyExact(extras[0]?.feeUsd as number);
  const tech = sacramentoHvacMoneyExact(extras[1]?.feeUsd as number);
  const generalPlan = sacramentoHvacMoneyExact(extras[2]?.feeUsd as number);
  const green = sacramentoHvacMoneyExact(extras[3]?.feeUsd as number);
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
        ". Every path includes the " +
        specific +
        " HVAC specific-cost permit (CDD-0245), the 10% technology surcharge (" +
        tech +
        ", which does not scale with valuation), and the " +
        green +
        " Green Building minimum. The General Plan fee is $2.60 per $1,000 of valuation, so that line changes with the recorded valuations. SMIP is listed on the reroof path; this HVAC change-out path does not list SMIP, and SMIP is not in these totals. Like-for-like 3-ton uses the HVAC specific-cost permit, not the valuation table. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ": HVAC specific-cost permit " +
        specific +
        " plus technology surcharge " +
        tech +
        " plus General Plan fee " +
        generalPlan +
        " plus Green Building minimum " +
        green +
        ". The " +
        specific +
        " permit, the 10% technology surcharge, and the " +
        green +
        " minimum are on every path. The technology surcharge does not scale with valuation. General Plan is $2.60 per $1,000. SMIP stays off this HVAC path. The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The General Plan fee uses the recorded assumed valuations of " +
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
        ". The " +
        specific +
        " specific-cost permit, the " +
        tech +
        " technology surcharge, and the " +
        green +
        " Green Building minimum do not scale with valuation. SMIP is not on this HVAC path. Low and high arithmetic are in the calculation note on this page",
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (flat). The typical path is " +
        typical +
        " on the recorded " +
        typicalVal +
        " valuation. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The high is not added on top of the typical. Every path includes the " +
        specific +
        " HVAC specific-cost permit, the " +
        tech +
        " technology surcharge (10% of the permit fee; it does not scale with valuation), and the " +
        green +
        " Green Building minimum. General Plan is $2.60 per $1,000. SMIP is listed on the reroof path and is not in these HVAC totals. Like-for-like 3-ton uses the specific-cost permit, not the valuation table. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical HVAC replacement is the recorded CDD-0245 HVAC specific-cost path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      specific +
      " HVAC specific-cost permit, the " +
      tech +
      " technology surcharge, the " +
      generalPlan +
      " General Plan fee, and the " +
      green +
      " Green Building minimum are included in that " +
      typical +
      ". They are not added again. SMIP is not included. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
    typicalExact: typical,
    rangeExact: low + " \u2013 " + high,
  };
}

const KANSAS_CITY_ROOF_SOURCE_NAME =
  "KCMO Building Code §18-16 exempt work and §18-20(b)(2) 1-2 family fees (official code PDF 14842)";
const KANSAS_CITY_ROOF_SOURCE_URL =
  "https://www.kcmo.gov/city-hall/departments/city-planning-development/building-and-development-fee-schedule";

type KansasCityRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  exemptionFaq: string;
};

/**
 * Kansas City roof: like-kind light covering on a one- and two-family dwelling
 * is the recorded $0 path. The §18-20 extra is $101.30 at $12,000 and stays
 * outside those totals. Returns null if those anchors drift.
 */
function kansasCityRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "kansas-city-mo" || permit.projectSlug !== "roof-replacement") return false;
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
  if (permit.sourceUrl !== KANSAS_CITY_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== KANSAS_CITY_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !== "If exemption fails (sheathing/structure): §18-20 1-2 family" ||
    !dallasSameCents(extras[0]?.feeUsd, 101.3)
  ) {
    return false;
  }
  const extraNote = extras[0]?.note || "";
  if (!/Not included in the recorded \$0 totals/.test(extraNote)) return false;
  if (!/\$101\.30 at \$12,000 \(\$58 \+ \$4\.33 x 10\)/.test(extraNote)) return false;
  if (!/only if the exemption fails/.test(extraNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(KANSAS_CITY_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/like-kind replacement of roof coverings on a one- and two-family dwelling with a light roof covering/.test(note)) {
    return false;
  }
  if (!/That path is exempt and does not require a permit/.test(note)) return false;
  if (!/feeModel is none/.test(note)) return false;
  if (!/permitRequired is false on that typical path/.test(note)) return false;
  if (!/feeLowUsd, feeTypicalUsd, and feeHighUsd are each \$0/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/do not change the recorded \$0 \/ \$0 \/ \$0 fees/.test(note)) return false;
  if (!/Low \$8,000: the exempt path does not use valuation, so feeLowUsd stays \$0/.test(note)) return false;
  if (!/Typical \$12,000: the exempt path does not use valuation, so feeTypicalUsd stays \$0/.test(note)) return false;
  if (!/High \$22,000: the exempt path does not use valuation, so feeHighUsd stays \$0/.test(note)) return false;
  if (!/KCMO \(Jackson County\), not Kansas City, Kansas/.test(note)) return false;
  if (!/does not include replacement of roof sheathing or deck, or structural modifications/.test(note)) {
    return false;
  }
  if (!/not rolled into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$58 \+ \$4\.33 x 10 = \$101\.30/.test(note)) return false;
  if (!/\$101\.30 is not in the recorded \$0 totals/.test(note)) return false;
  if (!/\$58 plus \$4\.33 per additional \$1,000 or fraction over \$2,000/.test(note)) return false;
  if (!/does not invent a non-exempt fee at \$8,000 or at \$22,000/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$0, \$0, and \$0 totals/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/KCMO \(Jackson County\), not Kansas City, Kansas/.test(caveat)) return false;
  if (!/light roof covering is exempt/.test(caveat)) return false;
  if (!/does not include replacement of roof sheathing\/deck or structural modifications/.test(caveat)) {
    return false;
  }
  return true;
}

/**
 * Short Kansas City roof copy. The exemption walk stays on the permit callout
 * calculation note. Null unless the recorded $0 / $0 / $0 anchors match.
 */
function kansasCityRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): KansasCityRoofPageCopy | null {
  if (!kansasCityRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  const alternate = dallasMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded like-kind light roof covering exemption for a one- and two-family dwelling, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". The " +
        alternate +
        " section 18-20 line, if sheathing, deck, or structural work means the exemption fails, is an extra at the recorded " +
        typicalVal +
        " ($58 + $4.33 x 10) and is not rolled into those totals. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " do not change the recorded " +
        low +
        " fees. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        " because a like-kind replacement of a light roof covering on a one- and two-family dwelling is exempt. The " +
        alternate +
        " extra ($58 + $4.33 x 10 at " +
        typicalVal +
        ") is not rolled into the recorded low, typical, or high fees. The walk is in the calculation note on this page",
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
        " high. Those amounts do not change the recorded fees, which stay " +
        low +
        ", " +
        typical +
        ", and " +
        high +
        ". The only recorded non-exempt dollar on this row is the " +
        alternate +
        " extra at " +
        typicalVal +
        ", and it is not in those totals. This page does not invent a non-exempt fee at " +
        lowVal +
        " or " +
        highVal,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (fee model none). The typical path is " +
        typical +
        " on the like-kind light covering exemption. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The " +
        alternate +
        " section 18-20 extra, if the exemption fails, is not in those totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical like-kind replacement of a light roof covering on a one- and two-family dwelling does not require a permit, and the recorded fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      alternate +
      " section 18-20 line, recorded at " +
      typicalVal +
      " only if sheathing, deck, or structural work means the exemption fails, is not part of that " +
      typical +
      ".",
    exemptionFaq: asSentence(
      "The recorded typical path is " +
        typical +
        " for reroofing, meaning replacement of roof coverings, of a one- and two-family dwelling with a light roof covering. The exemption does not include replacement of roof sheathing or deck, or structural modifications. The recorded extra on that non-exempt path is " +
        alternate +
        " at " +
        typicalVal +
        " and is not part of the typical " +
        typical,
    ),
  };
}

const INDIANAPOLIS_ROOF_SOURCE_NAME =
  "Indianapolis Revised Code §536-201(b)(2) as amended by Proposal 239, 2025";
const INDIANAPOLIS_ROOF_SOURCE_URL = "https://www.indy.gov/activity/license-and-permit-fees";

type IndianapolisRoofPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  exemptionFaq: string;
};

/**
 * Indianapolis roof: a typical asphalt like-kind reroof is the recorded $0
 * path (permitRequired false, feeModel none). The Class 2 remodel extra is
 * $390 and stays outside those totals. Returns null if those anchors drift.
 */
function indianapolisRoofFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "indianapolis-in" || permit.projectSlug !== "roof-replacement") return false;
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
  if (permit.sourceUrl !== INDIANAPOLIS_ROOF_SOURCE_URL) return false;
  if (permit.sourceName !== INDIANAPOLIS_ROOF_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !==
      "If exemption fails: Class 2 remodel ≤1,000 sf $200 + application $40 + remodel plan review $150" ||
    !dallasSameCents(extras[0]?.feeUsd, 390)
  ) {
    return false;
  }
  const extraNote = extras[0]?.note || "";
  if (!/Not included in the recorded \$0 totals/.test(extraNote)) return false;
  if (!/\$390 \(\$200 \+ \$40 \+ \$150\)/.test(extraNote)) return false;
  if (!/only if the exemption fails/.test(extraNote)) return false;
  if (!/structural, rafter, or heavier covering path/.test(extraNote)) return false;
  if (!/See the calculation note on this page/.test(extraNote)) return false;

  const note = permit.calculationNote || "";
  if (!note.startsWith(INDIANAPOLIS_ROOF_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (!/typical asphalt like-kind reroof/.test(note)) return false;
  if (!/That path requires no permit/.test(note)) return false;
  if (!/feeModel is none/.test(note)) return false;
  if (!/permitRequired is false on that typical path/.test(note)) return false;
  if (!/feeLowUsd, feeTypicalUsd, and feeHighUsd are each \$0/.test(note)) return false;
  if (!/recorded typical project value is \$12,000/.test(note)) return false;
  if (!/\$8,000 low, \$12,000 typical, and \$22,000 high/.test(note)) return false;
  if (!/do not change the recorded \$0 \/ \$0 \/ \$0 fees/.test(note)) return false;
  if (!/Low \$8,000: the exempt path does not use valuation, so feeLowUsd stays \$0/.test(note)) return false;
  if (!/Typical \$12,000: the exempt path does not use valuation, so feeTypicalUsd stays \$0/.test(note)) return false;
  if (!/High \$22,000: the exempt path does not use valuation, so feeHighUsd stays \$0/.test(note)) return false;
  if (!/listed contractor \(or qualifying owner-occupant\)/.test(note)) return false;
  if (!/no change in roof configuration/.test(note)) return false;
  if (!/no heavier covering/.test(note)) return false;
  if (!/more than 128 sf of decking/.test(note)) return false;
  if (!/no heat-applied roofing/.test(note)) return false;
  if (!/feeModel is none on that path/.test(note)) return false;
  if (!/not rolled into feeLowUsd, feeTypicalUsd, or feeHighUsd/.test(note)) return false;
  if (!/\$200 \+ application \$40 \+ remodel plan review \$150 = \$390/.test(note)) return false;
  if (!/\$390 is not in the recorded \$0 totals/.test(note)) return false;
  if (!/does not invent a non-exempt fee at \$8,000 or at \$22,000/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$0, \$0, and \$0 totals/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (!/Like-kind replacement of an existing roof by a listed contractor/.test(caveat)) return false;
  if (!/permit-exempt/.test(caveat)) return false;
  if (!/no heavier covering/.test(caveat)) return false;
  if (!/>128 sf of decking/.test(caveat)) return false;
  if (!/heat-applied roofing/.test(caveat)) return false;
  return true;
}

/**
 * Short Indianapolis roof copy. The exemption walk stays on the permit callout
 * calculation note. Null unless the recorded $0 / $0 / $0 anchors match.
 */
function indianapolisRoofPageCopy(
  city: City,
  permit: Permit | null | undefined,
): IndianapolisRoofPageCopy | null {
  if (!indianapolisRoofFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  const alternate = dallasMoneyExact((permit.extras || [])[0]?.feeUsd as number);
  return {
    assumption: asSentence(
      "For the permit line we assumed the recorded typical asphalt like-kind reroof exemption, so the low fee is " +
        low +
        ", the typical fee is " +
        typical +
        ", and the high fee is " +
        high +
        ". The " +
        alternate +
        " Class 2 remodel line, if structural, rafter, or heavier covering work means the exemption fails, is an extra ($200 + application $40 + remodel plan review $150) and is not rolled into those totals. Full detail is in the calculation note on this page. Recorded valuations of " +
        lowVal +
        ", " +
        typicalVal +
        ", and " +
        highVal +
        " do not change the recorded " +
        low +
        " fees. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The recorded typical path is " +
        typical +
        " because a typical asphalt like-kind reroof requires no permit. The " +
        alternate +
        " extra ($200 + application $40 + remodel plan review $150) is not rolled into the recorded low, typical, or high fees. The walk is in the calculation note on this page",
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
        " high. Those amounts do not change the recorded fees, which stay " +
        low +
        ", " +
        typical +
        ", and " +
        high +
        ". The only recorded non-exempt dollar on this row is the " +
        alternate +
        " extra, and it is not in those totals. This page does not invent a non-exempt fee at " +
        lowVal +
        " or " +
        highVal,
    ),
    differ: asSentence(
      "The recorded " +
        cityLabel(city) +
        " fee comes from " +
        permit.sourceName +
        " (fee model none). The typical path is " +
        typical +
        " on the typical asphalt like-kind reroof exemption. The low fee is " +
        low +
        " and the high fee is " +
        high +
        ". The " +
        alternate +
        " Class 2 remodel extra, if the exemption fails, is not in those totals. Full detail is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical asphalt like-kind reroof does not require a permit, and the recorded fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      alternate +
      " Class 2 remodel line, recorded only if structural, rafter, or heavier covering work means the exemption fails, is not part of that " +
      typical +
      ".",
    exemptionFaq: asSentence(
      "The recorded typical path is " +
        typical +
        " for a typical asphalt like-kind reroof. The exemption requires no change in roof configuration, no heavier covering, no replacement of basic structural members (for example a rafter or more than 128 sf of decking), and no heat-applied roofing. The recorded extra on that non-exempt path is " +
        alternate +
        " and is not part of the typical " +
        typical,
    ),
  };
}

const KANSAS_CITY_HVAC_SOURCE_NAME =
  "KCMO Building Code §18-20 one- and two-family detached dwelling permit fees";
const KANSAS_CITY_HVAC_SOURCE_URL =
  "https://www.kcmo.gov/city-hall/departments/city-planning-development/building-and-development-fee-schedule";

type KansasCityHvacPageCopy = {
  assumption: string;
  howCalculated: string;
  valuationFaq: string;
  differ: string;
  requiredClause: string;
  includedClause: string;
  /** Exact recorded dollars; usd() would round 70.99 / 83.98 / 118.62. */
  typicalExact: string;
  rangeExact: string;
};

/**
 * Kansas City HVAC: section 18-20 one- and two-family combined building/MEP
 * fee on the recorded $2,001–$100,000 band ($58 plus $4.33 per additional
 * $1,000 or fraction over $2,000). Fees stay $70.99 / $83.98 / $118.62 at
 * $5,000 / $7,500 / $16,000. Optional express review of $30 is not included.
 * Returns null if those anchors drift.
 */
function kansasCityHvacFacts(city: City, permit: Permit | null | undefined): permit is Permit {
  if (!permit || city.slug !== "kansas-city-mo" || permit.projectSlug !== "hvac-replacement") return false;
  if (permit.permitRequired !== true || permit.feeModel !== "valuation") return false;
  if (!dallasSameCents(permit.feeLowUsd, 70.99)) return false;
  if (!dallasSameCents(permit.feeTypicalUsd, 83.98)) return false;
  if (!dallasSameCents(permit.feeHighUsd, 118.62)) return false;
  if (permit.typicalProjectValueUsd !== 7500) return false;
  const valuation = permit.assumedValuationUsd;
  if (!valuation || valuation.low !== 5000 || valuation.typical !== 7500 || valuation.high !== 16000) {
    return false;
  }
  if (permit.retrievedDate !== "2026-09-01") return false;
  if (permit.sourceUrl !== KANSAS_CITY_HVAC_SOURCE_URL) return false;
  if (permit.sourceName !== KANSAS_CITY_HVAC_SOURCE_NAME) return false;

  const extras = permit.extras || [];
  if (extras.length !== 1) return false;
  if (
    (extras[0]?.name || "") !== "One- and two-family combined building/MEP permit §18-20" ||
    !dallasSameCents(extras[0]?.feeUsd, 83.98)
  ) {
    return false;
  }
  if ((extras[0]?.note || "") !== "At $7,500. Included. Optional express review $30 not included.") {
    return false;
  }

  const note = permit.calculationNote || "";
  if (!note.startsWith(KANSAS_CITY_HVAC_SOURCE_NAME)) return false;
  if (!/source retrieved 2026-09-01/.test(note)) return false;
  if (
    !/one- and two-family combined building, mechanical, plumbing, and electrical permit under section 18-20/.test(
      note,
    )
  ) {
    return false;
  }
  if (!/not a separate HVAC flat/.test(note)) return false;
  if (!/\$2,001–\$100,000: \$58 plus \$4\.33 per additional \$1,000 or fraction over \$2,000/.test(note)) {
    return false;
  }
  if (!/feeModel is valuation/.test(note)) return false;
  if (!/permitRequired is true on that typical path/.test(note)) return false;
  if (!/feeLowUsd is \$70\.99, feeTypicalUsd is \$83\.98, and feeHighUsd is \$118\.62/.test(note)) {
    return false;
  }
  if (!/recorded typical project value is \$7,500/.test(note)) return false;
  if (!/\$5,000 low, \$7,500 typical, and \$16,000 high/.test(note)) return false;
  if (!/All three recorded valuations fall in that \$2,001–\$100,000 band/.test(note)) return false;
  if (!/\$5,000 valuation is \$3,000 over \$2,000, which is 3 exact additional thousands, so the multiplier is 3/.test(note)) {
    return false;
  }
  if (!/\$16,000 valuation is \$14,000 over \$2,000, which is 14 exact additional thousands, so the multiplier is 14/.test(note)) {
    return false;
  }
  if (!/\$7,500 valuation is \$5,500 over \$2,000/.test(note)) return false;
  if (!/remainder counts as one additional \$1,000, so the multiplier is 6/.test(note)) return false;
  if (!/Optional express review of \$30 is not included/.test(note)) return false;
  if (!/Low \$5,000: \$58 \+ \$4\.33 x 3 = \$70\.99, which is feeLowUsd \$70\.99/.test(note)) return false;
  if (!/Typical \$7,500: \$58 \+ \$4\.33 x 6 = \$83\.98, which is feeTypicalUsd \$83\.98/.test(note)) return false;
  if (!/included in the typical total/.test(note) || !/not added again/.test(note)) return false;
  if (!/High \$16,000: \$58 \+ \$4\.33 x 14 = \$118\.62, which is feeHighUsd \$118\.62/.test(note)) return false;
  if (!/\$118\.62 high is not added on top of the \$83\.98 typical/.test(note)) return false;
  if (!/does not invent a fee beyond the recorded \$70\.99, \$83\.98, and \$118\.62 totals/.test(note)) {
    return false;
  }
  if (!/does not use an unlisted schedule band/.test(note)) return false;

  const caveat = permit.caveat || "";
  if (caveat !== "Combined building/mechanical/plumbing/electrical fee for 1-2 family, not a separate HVAC flat.") {
    return false;
  }
  return true;
}

/**
 * Short Kansas City HVAC copy. The section 18-20 valuation walk stays on the
 * permit callout calculation note. Null unless the recorded $70.99 / $83.98 /
 * $118.62 anchors match.
 */
function kansasCityHvacPageCopy(
  city: City,
  permit: Permit | null | undefined,
): KansasCityHvacPageCopy | null {
  if (!kansasCityHvacFacts(city, permit)) return null;
  const low = dallasMoneyExact(permit.feeLowUsd as number);
  const typical = dallasMoneyExact(permit.feeTypicalUsd as number);
  const high = dallasMoneyExact(permit.feeHighUsd as number);
  const projectValue = dallasMoneyExact(permit.typicalProjectValueUsd as number);
  const lowVal = dallasMoneyExact(permit.assumedValuationUsd?.low as number);
  const typicalVal = dallasMoneyExact(permit.assumedValuationUsd?.typical as number);
  const highVal = dallasMoneyExact(permit.assumedValuationUsd?.high as number);
  const combined = dallasMoneyExact((permit.extras || [])[0]?.feeUsd as number);
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
        ". Each total is the section 18-20 one- and two-family combined building/MEP fee on the $2,001–$100,000 band: $58 plus $4.33 per additional $1,000 or fraction over $2,000. Full arithmetic is in the calculation note on this page. The recorded typical project value is " +
        projectValue,
    ),
    howCalculated: asSentence(
      "The section 18-20 one- and two-family combined building/MEP fee on the $2,001–$100,000 band is $58 plus $4.33 per additional $1,000 or fraction over $2,000. The recorded typical path at " +
        typicalVal +
        " is " +
        typical +
        ". The three-valuation walk is in the calculation note on this page",
    ),
    valuationFaq: asSentence(
      "The recorded typical project value is " +
        projectValue +
        ". The fee uses the recorded assumed valuations of " +
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
        ". The high is not added on top of the typical. The total is the combined building/MEP fee, not a separate HVAC flat. Optional express review of $30 is not included. Full arithmetic is in the calculation note on this page. Verify the fee with " +
        city.permitDeptName,
    ),
    requiredClause:
      "A typical HVAC replacement is the recorded section 18-20 one- and two-family combined building/MEP path, and the typical fee on that path is " +
      typical +
      ".",
    includedClause:
      "The " +
      combined +
      " one- and two-family combined building/MEP permit is that " +
      typical +
      " total. It is not added again. Optional express review of $30 is not included. The " +
      high +
      " high and the " +
      low +
      " low are the other recorded valuations and are not added on top of the typical.",
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

/** Same dollar the permit callout shows for the recorded typical fee. */
function displayedTypicalFee(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string | null {
  if (!permit || typeof permit.feeTypicalUsd !== "number") return null;
  const model = permitCalloutModel(city, project, permit);
  if (model.kind === "zero") return usd(0);
  if (model.kind !== "known") return null;
  if (model.typicalLabel) return model.typicalLabel;
  const fee = model.typicalUsd;
  // Keep recorded cents. usd() would turn $80.09 into $80.
  if (Math.round(fee * 100) % 100 !== 0) return moneyExact(fee);
  return usd(fee);
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
  const tacomaRoofPath = tacomaRoofPageCopy(city, permit);
  const stLouisRoofPath = stLouisRoofPageCopy(city, permit);
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
  const sanAntonioRoofPath = sanAntonioRoofPageCopy(city, permit);
  const sanAntonioHvacPath = sanAntonioHvacPageCopy(city, permit);
  const tampaRoofPath = tampaRoofPageCopy(city, permit);
  const orlandoRoofPath = orlandoRoofPageCopy(city, permit);
  const orlandoHvacPath = orlandoHvacPageCopy(city, permit);
  const jacksonvilleRoofPath = jacksonvilleRoofPageCopy(city, permit);
  const jacksonvilleHvacPath = jacksonvilleHvacPageCopy(city, permit);
  const sacramentoRoofPath = sacramentoRoofPageCopy(city, permit);
  const sacramentoHvacPath = sacramentoHvacPageCopy(city, permit);
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
  const kansasCityRoofPath = kansasCityRoofPageCopy(city, permit);
  const indianapolisRoofPath = indianapolisRoofPageCopy(city, permit);
  const kansasCityHvacPath = kansasCityHvacPageCopy(city, permit);
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
    !tacomaRoofPath &&
    !stLouisRoofPath &&
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
    !sanAntonioRoofPath &&
    !sanAntonioHvacPath &&
    !tampaRoofPath &&
    !orlandoRoofPath &&
    !orlandoHvacPath &&
    !jacksonvilleRoofPath &&
    !jacksonvilleHvacPath &&
    !sacramentoRoofPath &&
    !sacramentoHvacPath &&
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
    !kansasCityRoofPath &&
    !indianapolisRoofPath &&
    !kansasCityHvacPath &&
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
    v += "; not a city-assessed value";
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
  if (tacomaRoofPath) out.push(tacomaRoofPath.assumption);
  if (stLouisRoofPath) out.push(stLouisRoofPath.assumption);
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
  if (sanAntonioRoofPath) out.push(sanAntonioRoofPath.assumption);
  if (sanAntonioHvacPath) out.push(sanAntonioHvacPath.assumption);
  if (tampaRoofPath) out.push(tampaRoofPath.assumption);
  if (orlandoRoofPath) out.push(orlandoRoofPath.assumption);
  if (orlandoHvacPath) out.push(orlandoHvacPath.assumption);
  if (jacksonvilleRoofPath) out.push(jacksonvilleRoofPath.assumption);
  if (jacksonvilleHvacPath) out.push(jacksonvilleHvacPath.assumption);
  if (sacramentoRoofPath) out.push(sacramentoRoofPath.assumption);
  if (sacramentoHvacPath) out.push(sacramentoHvacPath.assumption);
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
  if (kansasCityRoofPath) out.push(kansasCityRoofPath.assumption);
  if (indianapolisRoofPath) out.push(indianapolisRoofPath.assumption);
  if (kansasCityHvacPath) out.push(kansasCityHvacPath.assumption);
  if (chicagoHvacPath) out.push(chicagoHvacPath.assumption);
  if (chicagoKitchenPath) out.push(chicagoKitchenPath.assumption);
  if (chicagoDeckPath) out.push(chicagoDeckPath.assumption);
  if (bostonRoofPath) out.push(bostonRoofPath.assumption);
  if (bostonHvacPath) out.push(bostonHvacPath.assumption);
  if (bostonKitchenPath) out.push(bostonKitchenPath.assumption);
  if (bostonDeckPath) out.push(bostonDeckPath.assumption);

  // Charlotte roof already explains the exemption in Why costs differ.
  // Pasting the full calculation note here repeats the LUESA wall.
  // Austin roof, Tacoma roof, St. Louis roof, HVAC, kitchen, and deck, Denver HVAC, Denver roof, Denver deck, Denver kitchen, Phoenix
  // roof, HVAC, kitchen, and deck, Tucson roof, Tucson HVAC, Tucson kitchen, Tucson deck, Portland roof, Portland kitchen, Portland deck, Raleigh roof, Raleigh HVAC, Raleigh kitchen, Raleigh deck, Seattle HVAC, Seattle roof, Seattle deck, Seattle kitchen, Charlotte HVAC, Charlotte kitchen, Nashville deck, Nashville roof, Atlanta roof, Atlanta HVAC, Atlanta deck, Atlanta kitchen, Memphis HVAC, Memphis kitchen, Memphis deck, Houston HVAC, Houston deck, Philadelphia roof, Detroit roof, San Antonio roof, San Antonio HVAC, Tampa roof, Orlando roof, Orlando HVAC, Jacksonville roof, Jacksonville HVAC, Sacramento roof, Sacramento HVAC, Dallas roof, Dallas HVAC, Dallas kitchen, Dallas deck, Minneapolis roof, Minneapolis HVAC, Minneapolis deck, Miami roof, Miami HVAC, Miami kitchen, Miami deck, Las Vegas deck, Las Vegas roof, Las Vegas HVAC, Chicago roof, Kansas City roof, Indianapolis roof, Kansas City HVAC, Chicago HVAC, Chicago kitchen, Chicago deck, Boston roof, Boston HVAC, Boston kitchen, and Boston deck keep a short assumption.
  // The full note stays on the permit callout and the fee-model callout.
  // How-calculated summarizes and points at that note so assumptions and
  // why-costs do not repeat the wall.
  // Notes longer than 400 characters, with no bespoke short copy, become
  // one clause that names the recorded typical fee.
  if (permit && charlotteRoofStatuteExempt(permit)) {
    out.push(charlotteRoofAssumption());
  } else {
    const calc = (permit?.calculationNote || "").trim();
    if (
      calc &&
      !austinPath &&
      !tacomaRoofPath &&
      !stLouisRoofPath &&
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
      !sanAntonioRoofPath &&
    !sanAntonioHvacPath &&
      !tampaRoofPath &&
      !orlandoRoofPath &&
      !orlandoHvacPath &&
      !jacksonvilleRoofPath &&
      !jacksonvilleHvacPath &&
      !sacramentoRoofPath &&
      !sacramentoHvacPath &&
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
      !kansasCityRoofPath &&
      !indianapolisRoofPath &&
      !kansasCityHvacPath &&
      !chicagoHvacPath &&
      !chicagoKitchenPath &&
      !chicagoDeckPath &&
      !bostonRoofPath &&
      !bostonHvacPath &&
      !bostonKitchenPath &&
      !bostonDeckPath
    ) {
      out.push(asSentence(shortCalcNoteForProse(permit, displayedTypicalFee(city, project, permit))));
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
  const phoenixKitchen = phoenixKitchenPageCopy(city, permit);
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
  const sanAntonioRoof = sanAntonioRoofPageCopy(city, permit);
  const sanAntonioHvac = sanAntonioHvacPageCopy(city, permit);
  const tampaRoof = tampaRoofPageCopy(city, permit);
  const orlandoRoof = orlandoRoofPageCopy(city, permit);
  const orlandoHvac = orlandoHvacPageCopy(city, permit);
  const jacksonvilleRoof = jacksonvilleRoofPageCopy(city, permit);
  const jacksonvilleHvac = jacksonvilleHvacPageCopy(city, permit);
  const sacramentoRoof = sacramentoRoofPageCopy(city, permit);
  const sacramentoHvac = sacramentoHvacPageCopy(city, permit);
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
  const kansasCityHvac = kansasCityHvacPageCopy(city, permit);
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
      phoenixKitchen?.rangeExact ??
      houstonHvac?.rangeExact ??
      houstonDeck?.rangeExact ??
      detroitRoof?.rangeExact ??
      orlandoRoof?.rangeExact ??
      orlandoHvac?.rangeExact ??
      jacksonvilleHvac?.rangeExact ??
      sacramentoRoof?.rangeExact ??
      sacramentoHvac?.rangeExact ??
      sanAntonioHvac?.rangeExact ??
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
      kansasCityHvac?.rangeExact ??
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
      phoenixKitchen?.typicalExact ??
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
      sanAntonioRoof?.typicalExact ??
      sanAntonioHvac?.typicalExact ??
      tampaRoof?.typicalExact ??
      orlandoRoof?.typicalExact ??
      orlandoHvac?.typicalExact ??
      jacksonvilleRoof?.typicalExact ??
      jacksonvilleHvac?.typicalExact ??
      sacramentoRoof?.typicalExact ??
      sacramentoHvac?.typicalExact ??
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
      kansasCityHvac?.typicalExact ??
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
    const tacomaRoofRequired = tacomaRoofPageCopy(city, permit);
    const chicagoRoofRequired = chicagoRoofPageCopy(city, permit);
    const kansasCityRoofRequired = kansasCityRoofPageCopy(city, permit);
    const indianapolisRoofRequired = indianapolisRoofPageCopy(city, permit);
    const chicagoHvacRequired = chicagoHvacPageCopy(city, permit);
    if (charlotteRoofStatuteExempt(permit)) {
      requiredAnswer +=
        " A like-for-like single-family reroof at or under $40,000 does not require a building permit under N.C.G.S. 160D-1110(c)(5).";
    } else if (austinRequired) {
      requiredAnswer += " " + austinRequired.requiredClause;
    } else if (tacomaRoofRequired) {
      requiredAnswer += " " + tacomaRoofRequired.requiredClause;
    } else if (chicagoRoofRequired) {
      requiredAnswer += " " + chicagoRoofRequired.requiredClause;
    } else if (kansasCityRoofRequired) {
      requiredAnswer += " " + kansasCityRoofRequired.requiredClause;
    } else if (indianapolisRoofRequired) {
      requiredAnswer += " " + indianapolisRoofRequired.requiredClause;
    } else if (chicagoHvacRequired) {
      requiredAnswer += " " + chicagoHvacRequired.requiredClause;
    } else if (caveatFirst) requiredAnswer += " " + caveatFirst;
  } else if (required === true) {
    requiredAnswer =
      "Yes. " + dept + " requires a permit for a typical " + job + " in " + label + ".";
    if (fee != null && fee > 0) {
      requiredAnswer += " The typical recorded fee is " + usd(fee) + ".";
    } else if (fee === 0) {
      requiredAnswer += " The recorded typical fee is still $0; see the caveat on this page.";
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
    const stLouisRoofRequired = permit ? stLouisRoofPageCopy(city, permit) : null;
    const atlantaRoofRequired = permit ? atlantaRoofPageCopy(city, permit) : null;
    const atlantaHvacRequired = permit ? atlantaHvacPageCopy(city, permit) : null;
    const houstonHvacRequired = permit ? houstonHvacPageCopy(city, permit) : null;
    const houstonDeckRequired = permit ? houstonDeckPageCopy(city, permit) : null;
    const philadelphiaRoofRequired = permit ? philadelphiaRoofPageCopy(city, permit) : null;
    const detroitRoofRequired = permit ? detroitRoofPageCopy(city, permit) : null;
    const sanAntonioRoofRequired = permit ? sanAntonioRoofPageCopy(city, permit) : null;
    const sanAntonioHvacRequired = permit ? sanAntonioHvacPageCopy(city, permit) : null;
    const tampaRoofRequired = permit ? tampaRoofPageCopy(city, permit) : null;
    const orlandoRoofRequired = permit ? orlandoRoofPageCopy(city, permit) : null;
    const orlandoHvacRequired = permit ? orlandoHvacPageCopy(city, permit) : null;
    const kansasCityHvacRequired = permit ? kansasCityHvacPageCopy(city, permit) : null;
    const jacksonvilleRoofRequired = permit ? jacksonvilleRoofPageCopy(city, permit) : null;
    const jacksonvilleHvacRequired = permit ? jacksonvilleHvacPageCopy(city, permit) : null;
    const sacramentoRoofRequired = permit ? sacramentoRoofPageCopy(city, permit) : null;
    const sacramentoHvacRequired = permit ? sacramentoHvacPageCopy(city, permit) : null;
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
    } else if (fee != null && fee > 0 && sanAntonioRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + sanAntonioRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && sanAntonioHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + sanAntonioHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && tampaRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + tampaRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && orlandoRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + orlandoRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && orlandoHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + orlandoHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && kansasCityHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + kansasCityHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && jacksonvilleRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + jacksonvilleRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && jacksonvilleHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + jacksonvilleHvacRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && sacramentoRoofRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + sacramentoRoofRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && sacramentoHvacRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + sacramentoHvacRequired.typicalExact + ".",
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
    else if (stLouisRoofRequired) requiredAnswer += " " + stLouisRoofRequired.requiredClause;
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
    else if (sanAntonioRoofRequired) requiredAnswer += " " + sanAntonioRoofRequired.requiredClause;
    else if (sanAntonioHvacRequired) requiredAnswer += " " + sanAntonioHvacRequired.requiredClause;
    else if (tampaRoofRequired) requiredAnswer += " " + tampaRoofRequired.requiredClause;
    else if (orlandoRoofRequired) requiredAnswer += " " + orlandoRoofRequired.requiredClause;
    else if (orlandoHvacRequired) requiredAnswer += " " + orlandoHvacRequired.requiredClause;
    else if (kansasCityHvacRequired) requiredAnswer += " " + kansasCityHvacRequired.requiredClause;
    else if (jacksonvilleRoofRequired) requiredAnswer += " " + jacksonvilleRoofRequired.requiredClause;
    else if (jacksonvilleHvacRequired) requiredAnswer += " " + jacksonvilleHvacRequired.requiredClause;
    else if (sacramentoRoofRequired) requiredAnswer += " " + sacramentoRoofRequired.requiredClause;
    else if (sacramentoHvacRequired) requiredAnswer += " " + sacramentoHvacRequired.requiredClause;
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
  if (project.projectSlug === "roof-replacement") {
    const squares = projectMeta(project.projectSlug).defaultQuantity;
    included += " for " + roofSquaresPhrase(squares);
  } else if (spec) included += " for a " + spec.typical + " " + job;
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
  const stLouisRoofIncluded = permit ? stLouisRoofPageCopy(city, permit) : null;
  const atlantaRoofIncluded = permit ? atlantaRoofPageCopy(city, permit) : null;
  const atlantaHvacIncluded = permit ? atlantaHvacPageCopy(city, permit) : null;
  const houstonHvacIncluded = permit ? houstonHvacPageCopy(city, permit) : null;
  const houstonDeckIncluded = permit ? houstonDeckPageCopy(city, permit) : null;
  const philadelphiaRoofIncluded = permit ? philadelphiaRoofPageCopy(city, permit) : null;
  const detroitRoofIncluded = permit ? detroitRoofPageCopy(city, permit) : null;
  const sanAntonioRoofIncluded = permit ? sanAntonioRoofPageCopy(city, permit) : null;
  const sanAntonioHvacIncluded = permit ? sanAntonioHvacPageCopy(city, permit) : null;
  const tampaRoofIncluded = permit ? tampaRoofPageCopy(city, permit) : null;
  const orlandoRoofIncluded = permit ? orlandoRoofPageCopy(city, permit) : null;
  const orlandoHvacIncluded = permit ? orlandoHvacPageCopy(city, permit) : null;
  const kansasCityHvacIncluded = permit ? kansasCityHvacPageCopy(city, permit) : null;
  const jacksonvilleRoofIncluded = permit ? jacksonvilleRoofPageCopy(city, permit) : null;
  const jacksonvilleHvacIncluded = permit ? jacksonvilleHvacPageCopy(city, permit) : null;
  const sacramentoRoofIncluded = permit ? sacramentoRoofPageCopy(city, permit) : null;
  const sacramentoHvacIncluded = permit ? sacramentoHvacPageCopy(city, permit) : null;
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
      : sanAntonioRoofIncluded
      ? sanAntonioRoofIncluded.typicalExact
      : sanAntonioHvacIncluded
      ? sanAntonioHvacIncluded.typicalExact
      : tampaRoofIncluded
      ? tampaRoofIncluded.typicalExact
      : orlandoRoofIncluded
      ? orlandoRoofIncluded.typicalExact
      : orlandoHvacIncluded
      ? orlandoHvacIncluded.typicalExact
      : kansasCityHvacIncluded
      ? kansasCityHvacIncluded.typicalExact
      : jacksonvilleRoofIncluded
      ? jacksonvilleRoofIncluded.typicalExact
      : jacksonvilleHvacIncluded
      ? jacksonvilleHvacIncluded.typicalExact
      : sacramentoRoofIncluded
      ? sacramentoRoofIncluded.typicalExact
      : sacramentoHvacIncluded
      ? sacramentoHvacIncluded.typicalExact
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
    else if (stLouisRoofIncluded) included += " " + stLouisRoofIncluded.includedClause;
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
    else if (sanAntonioRoofIncluded) included += " " + sanAntonioRoofIncluded.includedClause;
    else if (sanAntonioHvacIncluded) included += " " + sanAntonioHvacIncluded.includedClause;
    else if (tampaRoofIncluded) included += " " + tampaRoofIncluded.includedClause;
    else if (orlandoRoofIncluded) included += " " + orlandoRoofIncluded.includedClause;
    else if (orlandoHvacIncluded) included += " " + orlandoHvacIncluded.includedClause;
    else if (kansasCityHvacIncluded) included += " " + kansasCityHvacIncluded.includedClause;
    else if (jacksonvilleRoofIncluded) included += " " + jacksonvilleRoofIncluded.includedClause;
    else if (jacksonvilleHvacIncluded) included += " " + jacksonvilleHvacIncluded.includedClause;
    else if (sacramentoRoofIncluded) included += " " + sacramentoRoofIncluded.includedClause;
    else if (sacramentoHvacIncluded) included += " " + sacramentoHvacIncluded.includedClause;
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
    const tacomaRoofIncluded = permit ? tacomaRoofPageCopy(city, permit) : null;
    const chicagoRoofIncluded = permit ? chicagoRoofPageCopy(city, permit) : null;
    const kansasCityRoofIncluded = permit ? kansasCityRoofPageCopy(city, permit) : null;
    const indianapolisRoofIncluded = permit ? indianapolisRoofPageCopy(city, permit) : null;
    const chicagoHvacIncluded = permit ? chicagoHvacPageCopy(city, permit) : null;
    if (austinIncluded) included += " " + austinIncluded.includedClause;
    else if (tacomaRoofIncluded) included += " " + tacomaRoofIncluded.includedClause;
    else if (chicagoRoofIncluded) included += " " + chicagoRoofIncluded.includedClause;
    else if (kansasCityRoofIncluded) included += " " + kansasCityRoofIncluded.includedClause;
    else if (indianapolisRoofIncluded) included += " " + indianapolisRoofIncluded.includedClause;
    else if (chicagoHvacIncluded) included += " " + chicagoHvacIncluded.includedClause;
  } else {
    included +=
      " The permit line is blank, so the all-in figure is job cost only; we do not guess a city fee.";
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
  const stLouisRoofDiffer = permit ? stLouisRoofPageCopy(city, permit) : null;
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
  const sanAntonioRoofDiffer = permit ? sanAntonioRoofPageCopy(city, permit) : null;
  const sanAntonioHvacDiffer = permit ? sanAntonioHvacPageCopy(city, permit) : null;
  const tampaRoofDiffer = permit ? tampaRoofPageCopy(city, permit) : null;
  const orlandoRoofDiffer = permit ? orlandoRoofPageCopy(city, permit) : null;
  const orlandoHvacDiffer = permit ? orlandoHvacPageCopy(city, permit) : null;
  const kansasCityHvacDiffer = permit ? kansasCityHvacPageCopy(city, permit) : null;
  const jacksonvilleRoofDiffer = permit ? jacksonvilleRoofPageCopy(city, permit) : null;
  const jacksonvilleHvacDiffer = permit ? jacksonvilleHvacPageCopy(city, permit) : null;
  const sacramentoRoofDiffer = permit ? sacramentoRoofPageCopy(city, permit) : null;
  const sacramentoHvacDiffer = permit ? sacramentoHvacPageCopy(city, permit) : null;
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
  } else if (fee != null && fee > 0 && stLouisRoofDiffer) {
    differ = stLouisRoofDiffer.differ;
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
  } else if (fee != null && fee > 0 && sanAntonioRoofDiffer) {
    differ = sanAntonioRoofDiffer.differ;
  } else if (fee != null && fee > 0 && sanAntonioHvacDiffer) {
    differ = sanAntonioHvacDiffer.differ;
  } else if (fee != null && fee > 0 && tampaRoofDiffer) {
    differ = tampaRoofDiffer.differ;
  } else if (fee != null && fee > 0 && orlandoRoofDiffer) {
    differ = orlandoRoofDiffer.differ;
  } else if (fee != null && fee > 0 && orlandoHvacDiffer) {
    differ = orlandoHvacDiffer.differ;
  } else if (fee != null && fee > 0 && kansasCityHvacDiffer) {
    differ = kansasCityHvacDiffer.differ;
  } else if (fee != null && fee > 0 && jacksonvilleRoofDiffer) {
    differ = jacksonvilleRoofDiffer.differ;
  } else if (fee != null && fee > 0 && jacksonvilleHvacDiffer) {
    differ = jacksonvilleHvacDiffer.differ;
  } else if (fee != null && fee > 0 && sacramentoRoofDiffer) {
    differ = sacramentoRoofDiffer.differ;
  } else if (fee != null && fee > 0 && sacramentoHvacDiffer) {
    differ = sacramentoHvacDiffer.differ;
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
    const calcForDiffer =
      calcFirst.length > 400 ? shortCalcNoteForProse(permit, displayedTypicalFee(city, project, permit)) : calcFirst;
    if (calcForDiffer) differ += " " + calcForDiffer;
    else if (caveatFirst) differ += " " + caveatFirst;
    differ +=
      " Site conditions, extras not in the typical row, and schedule updates can change what you actually pay. Verify with " +
      dept +
      ".";
  } else if (fee === 0) {
    const austinDiffer = permit ? austinRoofPageCopy(city, permit) : null;
    const tacomaRoofDiffer = permit ? tacomaRoofPageCopy(city, permit) : null;
    const chicagoRoofDiffer = permit ? chicagoRoofPageCopy(city, permit) : null;
    const kansasCityRoofDiffer = permit ? kansasCityRoofPageCopy(city, permit) : null;
    const indianapolisRoofDiffer = permit ? indianapolisRoofPageCopy(city, permit) : null;
    const chicagoHvacDiffer = permit ? chicagoHvacPageCopy(city, permit) : null;
    if (charlotteRoofStatuteExempt(permit)) {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0 because a like-for-like single-family reroof at or under $40,000 is exempt under N.C.G.S. 160D-1110(c)(5). If the exemption does not apply, the recorded alternate is the LUESA Section II.A path in the calculation note on this page, and it is not folded into the typical $0. We do not invent a fee beyond that note, including for a job over $40,000.";
    } else if (austinDiffer) {
      differ = austinDiffer.differ;
    } else if (tacomaRoofDiffer) {
      differ = tacomaRoofDiffer.differ;
    } else if (chicagoRoofDiffer) {
      differ = chicagoRoofDiffer.differ;
    } else if (kansasCityRoofDiffer) {
      differ = kansasCityRoofDiffer.differ;
    } else if (indianapolisRoofDiffer) {
      differ = indianapolisRoofDiffer.differ;
    } else if (chicagoHvacDiffer) {
      differ = chicagoHvacDiffer.differ;
    } else {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0.";
      if (caveatFirst) differ += " " + caveatFirst;
      differ +=
        " If your job is outside that exemption, the city may charge a different published line; we do not invent that dollar here.";
    }
  } else {
    differ =
      "We have not extracted a typical dollar from the official " +
      label +
      " schedule, so we do not show a fee.";
    if (caveatFirst) differ += " " + caveatFirst;
    else if (calcFirst) {
      differ +=
        " " +
        (calcFirst.length > 400
          ? shortCalcNoteForProse(permit, displayedTypicalFee(city, project, permit))
          : calcFirst);
    }
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
    ...charlotteRoofPaaFaqItems(city, project, permit),
    ...denverRoofPaaFaqItems(city, project, permit),
    ...phoenixRoofPaaFaqItems(city, project, permit),
    ...phoenixKitchenPaaFaqItems(city, project, permit),
    ...portlandRoofPaaFaqItems(city, project, permit),
    ...portlandDeckPaaFaqItems(city, project, permit),
    ...tucsonRoofPaaFaqItems(city, project, permit),
    ...tucsonHvacPaaFaqItems(city, project, permit),
    ...austinHvacPaaFaqItems(city, project, permit),
    ...austinKitchenPaaFaqItems(city, project, permit),
    ...austinRoofPaaFaqItems(city, project, permit),
    ...tacomaRoofPaaFaqItems(city, project, permit),
    ...stLouisRoofPaaFaqItems(city, project, permit),
    ...austinDeckPaaFaqItems(city, project, permit),
    ...raleighHvacPaaFaqItems(city, project, permit),
    ...raleighRoofPaaFaqItems(city, project, permit),
    ...tucsonDeckPaaFaqItems(city, project, permit),
    ...tucsonKitchenPaaFaqItems(city, project, permit),
    ...raleighDeckPaaFaqItems(city, project, permit),
    ...raleighKitchenPaaFaqItems(city, project, permit),
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

  const stLouisRoof = stLouisRoofPageCopy(city, permit);
  if (stLouisRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      stLouisRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      stLouisRoof.valuationFaq,
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

  const sanAntonioRoof = sanAntonioRoofPageCopy(city, permit);
  if (sanAntonioRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      sanAntonioRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      sanAntonioRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const sanAntonioHvac = sanAntonioHvacPageCopy(city, permit);
  if (sanAntonioHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      sanAntonioHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      sanAntonioHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const tampaRoof = tampaRoofPageCopy(city, permit);
  if (tampaRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tampaRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tampaRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const orlandoRoof = orlandoRoofPageCopy(city, permit);
  if (orlandoRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      orlandoRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      orlandoRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const orlandoHvac = orlandoHvacPageCopy(city, permit);
  if (orlandoHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      orlandoHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      orlandoHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const jacksonvilleRoof = jacksonvilleRoofPageCopy(city, permit);
  if (jacksonvilleRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      jacksonvilleRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      jacksonvilleRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const jacksonvilleHvac = jacksonvilleHvacPageCopy(city, permit);
  if (jacksonvilleHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      jacksonvilleHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      jacksonvilleHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const sacramentoRoof = sacramentoRoofPageCopy(city, permit);
  if (sacramentoRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      sacramentoRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      sacramentoRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const sacramentoHvac = sacramentoHvacPageCopy(city, permit);
  if (sacramentoHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      sacramentoHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      sacramentoHvac.valuationFaq,
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
  const kansasCityHvac = kansasCityHvacPageCopy(city, permit);
  if (kansasCityHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      kansasCityHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      kansasCityHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const indianapolisRoof = indianapolisRoofPageCopy(city, permit);
  if (indianapolisRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      indianapolisRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      indianapolisRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      indianapolisRoof.exemptionFaq,
      "The $390 line stays an extra and is not part of the typical $0.",
    );
    return extra.slice(0, 3);
  }

  const kansasCityRoof = kansasCityRoofPageCopy(city, permit);
  if (kansasCityRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      kansasCityRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      kansasCityRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      kansasCityRoof.exemptionFaq,
      "The $101.30 line stays an extra and is not part of the typical $0.",
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

  const tacomaRoof = tacomaRoofPageCopy(city, permit);
  if (tacomaRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      tacomaRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      tacomaRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      tacomaRoof.exemptionFaq,
      "We do not invent a fee for the overlay path.",
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
    // Long notes stay on the permit callout. This answer names the typical fee.
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      shortCalcNoteForProse(permit, displayedTypicalFee(city, project, permit)),
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
