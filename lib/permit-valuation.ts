import { usd } from "@/lib/format";
import type { Permit, PermitExtra } from "@/lib/types";

const CAPTION =
  "These are the recorded valuations used when the schedule scales with project value. Not a quote.";

/** Chicago roof, Chicago HVAC, Chicago kitchen, Chicago deck, Las Vegas roof, Las Vegas HVAC, Minneapolis HVAC, Houston deck, and Philadelphia roof record the shared band but do not use it. Dallas kitchen and Dallas deck use the high valuation only. Detroit roof uses the $2,001-$25,000 building/residential band. Other rows keep CAPTION. */
function valuationCaption(permit: Permit | null | undefined): string {
  if (
    permit?.citySlug === "chicago-il" &&
    permit.projectSlug === "roof-replacement" &&
    permit.permitRequired === false &&
    permit.feeModel === "none" &&
    permit.feeLowUsd === 0 &&
    permit.feeTypicalUsd === 0 &&
    permit.feeHighUsd === 0
  ) {
    return "Recorded on this row only. Valuation is not an input for the Group R steep-slope exemption, so these amounts are unused and the recorded fees stay $0.";
  }
  if (
    permit?.citySlug === "chicago-il" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.permitRequired === false &&
    permit.feeModel === "none" &&
    permit.feeLowUsd === 0 &&
    permit.feeTypicalUsd === 0 &&
    permit.feeHighUsd === 0
  ) {
    return "Recorded on this row only. Valuation is not an input for the Group R in-kind HVAC exemption, so these amounts are unused and the recorded fees stay $0.";
  }
  if (
    permit?.citySlug === "chicago-il" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 0 &&
    permit.feeTypicalUsd === 500 &&
    permit.feeHighUsd === 602
  ) {
    return "Recorded on this row only. Valuation is not an input for these flat paths, so these amounts are unused and the recorded fees stay $0, $500, and $602.";
  }
  if (
    permit?.citySlug === "chicago-il" &&
    permit.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 300 &&
    permit.feeTypicalUsd === 602 &&
    permit.feeHighUsd === 602
  ) {
    return "Recorded on this row only. Valuation is not an input for these flat paths, so these amounts are unused and the recorded fees stay $300, $602, and $602.";
  }
  if (
    permit?.citySlug === "las-vegas-nv" &&
    permit.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 242 &&
    permit.feeTypicalUsd === 242 &&
    permit.feeHighUsd === 281
  ) {
    return "Recorded on this row only. Valuation is not an input for these flat paths, so these amounts are unused and the recorded fees stay $242, $242, and $281.";
  }
  if (
    permit?.citySlug === "las-vegas-nv" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 238 &&
    permit.feeTypicalUsd === 238 &&
    permit.feeHighUsd === 257
  ) {
    return "Recorded on this row only. Valuation is not an input for these flat paths, so these amounts are unused and the recorded fees stay $238, $238, and $257.";
  }
  if (
    permit?.citySlug === "minneapolis-mn" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "tiered" &&
    Math.round((permit.feeLowUsd ?? NaN) * 100) === 13340 &&
    Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 21760 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 21760
  ) {
    return "Recorded on this row only. Valuation is not an input on the existing-residential mechanical table, so these amounts are unused and the recorded fees stay $133.40, $217.60, and $217.60.";
  }
  if (
    permit?.citySlug === "dallas-tx" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 296 &&
    permit.feeTypicalUsd === 396 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 135279
  ) {
    return "Recorded on this row. Table B-II does not scale with the $15,000 or $35,000 valuations, so the low and typical fees stay $296 and $396. The high fee is Table B-I at the recorded $75,000 valuation ($1,352.79).";
  }
  if (
    permit?.citySlug === "houston-tx" &&
    permit.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "area" &&
    Math.round((permit.feeLowUsd ?? NaN) * 100) === 17704 &&
    Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 25744 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 30568
  ) {
    return "Recorded on this row only. Valuation is not an input on the Type VB area table, so these amounts are unused and the recorded fees stay $177.04, $257.44, and $305.68.";
  }
  if (
    permit?.citySlug === "philadelphia-pa" &&
    permit.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    Math.round((permit.feeLowUsd ?? NaN) * 100) === 7650 &&
    Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 7650 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 7650
  ) {
    return "Recorded on this row only. Valuation is not an input on this flat roof covering replacement path, so these amounts are unused and the recorded fees stay $76.50, $76.50, and $76.50.";
  }
  if (
    permit?.citySlug === "detroit-mi" &&
    permit.projectSlug === "roof-replacement" &&
    permit.permitRequired === true &&
    permit.feeModel === "valuation" &&
    Math.round((permit.feeLowUsd ?? NaN) * 100) === 47597 &&
    Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 61233 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 95323
  ) {
    return "Recorded on this row. The $2,001-$25,000 building/residential band uses these valuations. Fees stay $475.97, $612.33, and $953.23. The 35% plan-review deposit is credited to the permit and is not added on top.";
  }
  if (
    permit?.citySlug === "dallas-tx" &&
    permit.projectSlug === "deck" &&
    permit.permitRequired === true &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 196 &&
    permit.feeTypicalUsd === 196 &&
    Math.round((permit.feeHighUsd ?? NaN) * 100) === 38647
  ) {
    return "Recorded on this row. Table B-II does not scale with the $8,000 or $12,000 valuations, so the low and typical fees stay $196 and $196. The high fee is Table B-I at the recorded $19,200 valuation ($386.47).";
  }
  return CAPTION;
}

const BANDS: Array<{ key: "low" | "typical" | "high"; label: string }> = [
  { key: "low", label: "Low" },
  { key: "typical", label: "Typical" },
  { key: "high", label: "High" },
];

export type PermitValuationRow = {
  band: string;
  valueLabel: string;
};

export type PermitValuationModel = {
  heading: string;
  caption: string;
  rows: PermitValuationRow[];
};

/** True when this permit row itself records a project value used for the fee. */
export function permitRowRecordsValuation(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const assumed = permit.assumedValuationUsd;
  if (assumed) {
    if (
      typeof assumed.low === "number" ||
      typeof assumed.typical === "number" ||
      typeof assumed.high === "number"
    ) {
      return true;
    }
  }
  return typeof permit.typicalProjectValueUsd === "number";
}

function permitText(permit: Permit): string {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(" ")),
  ].join(" ");
}

/**
 * Published-minimum floor with no project value on the row (Atlanta Office of
 * Buildings $175). Does not treat a recorded valuation band as unused.
 */
export function isPublishedMinimumFloor(permit: Permit | null | undefined): boolean {
  if (!permit || permitRowRecordsValuation(permit)) return false;
  const fee = permit.feeTypicalUsd;
  if (fee == null || fee <= 0) return false;
  if (permit.feeLowUsd != null && permit.feeLowUsd !== fee) return false;
  return /published (city )?minimum|minimum permit/i.test(permitText(permit));
}

function pricedExtras(permit: Permit): PermitExtra[] {
  return (permit.extras || []).filter((e) => typeof e.feeUsd === "number" && (e.feeUsd as number) > 0);
}

/**
 * Honest answer when the row is a published minimum and records no project value.
 * Uses only fee fields and extra names already on the permit row.
 */
export function publishedMinimumValuationAnswer(
  permit: Permit | null | undefined,
  dept?: string | null,
): string {
  if (!permit || !isPublishedMinimumFloor(permit)) return "";
  const fee = permit.feeTypicalUsd as number;
  const office = (dept || "").trim();
  const who = office && office.toLowerCase() !== "local" ? office + " " : "";
  let answer =
    "The recorded " +
    who +
    "permit row does not include an assumed project value, so this fee is not a valuation-formula result. Low and typical both use the recorded published minimum of " +
    usd(fee);

  const parts = pricedExtras(permit);
  const sum = parts.reduce((s, e) => s + (e.feeUsd as number), 0);
  if (parts.length >= 2 && Math.abs(sum - fee) <= 0.05) {
    answer +=
      " (" +
      parts.map((e) => usd(e.feeUsd as number) + " " + (e.name || "").trim()).join(" + ") +
      ")";
  }
  answer += ".";

  if (permit.feeHighUsd == null) {
    const missing = (permit.extras || []).find(
      (e) => (e.name || "").trim() && e.feeUsd == null && e.amountUsd == null,
    );
    if (missing?.name) {
      answer += " " + missing.name.trim() + " was not extracted, so the high fee stays blank.";
    } else {
      answer += " No official high above that minimum was extracted, so the high fee stays blank.";
    }
  }
  return answer;
}

/** Short callout line when the shared valuation band must not be shown for this row. */
export function omittedAssumedValuationNote(permit: Permit | null | undefined): string | null {
  if (!permit || permitRowRecordsValuation(permit)) return null;
  if (isPublishedMinimumFloor(permit)) {
    return "Not used for this permit fee. This city's permit row does not record an assumed valuation; low and typical stay at the recorded published minimum.";
  }
  return "Not used for this permit fee. This city's permit row does not record an assumed valuation.";
}

/** Crawlable assumed-valuation table from the permit row. Never invents dollars. */
export function permitValuationTable(
  permit: Permit | null | undefined,
): PermitValuationModel | null {
  const assumed = permit?.assumedValuationUsd;
  if (!assumed) return null;

  const rows: PermitValuationRow[] = [];
  for (const { key, label } of BANDS) {
    const n = assumed[key];
    if (typeof n !== "number" || Number.isNaN(n)) continue;
    rows.push({ band: label, valueLabel: usd(n) });
  }
  if (!rows.length) return null;

  return { heading: "Assumed project value on file", caption: valuationCaption(permit), rows };
}
