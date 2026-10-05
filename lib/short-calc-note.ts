import { usd } from "@/lib/format";

/**
 * Assumptions, why-costs, and FAQ answers paste calculationNote when a city
 * has no bespoke short copy. Notes longer than this become one clause that
 * restates the recorded typical fee and points at the full note on the
 * permit callout. The permit and fee-model callouts keep the full note.
 */
export const CALC_NOTE_SHORT_LIMIT = 400;

export function calcNoteExceedsShortLimit(note: string | null | undefined): boolean {
  return (note || "").trim().length > CALC_NOTE_SHORT_LIMIT;
}

/**
 * Text for a short slot that would otherwise copy calculationNote in full.
 * At or under the limit, the recorded note is returned unchanged.
 * Above the limit, one clause names the typical fee using the label the
 * permit callout already shows and points at the full note. No dollar is
 * invented when that label is missing.
 */
export function shortCalcNoteForProse(
  permit: {
    feeTypicalUsd?: number | null;
    calculationNote?: string | null;
  } | null | undefined,
  displayedTypicalFee?: string | null,
): string {
  const note = (permit?.calculationNote || "").trim();
  if (!note) return "";
  if (!calcNoteExceedsShortLimit(note)) return note;
  const label = (displayedTypicalFee || "").trim();
  const fee = permit?.feeTypicalUsd;
  const fallback =
    !label && typeof fee === "number" && Number.isFinite(fee) ? usd(fee) : "";
  const shown = label || fallback;
  if (shown && !shown.includes("\u2014")) {
    return (
      "The recorded typical permit fee is " +
      shown +
      ". Full detail is in the calculation note on this page."
    );
  }
  return "Full detail is in the calculation note on this page.";
}
