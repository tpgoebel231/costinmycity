import { usd } from "@/lib/format";
import type { Permit, PermitExtra } from "@/lib/types";

const CAPTION =
  "These are the recorded valuations used when the schedule scales with project value. Not a quote.";

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

  return { heading: "Assumed project value on file", caption: CAPTION, rows };
}
