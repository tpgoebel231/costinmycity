/**
 * Homeowner wording for calculation notes and other rendered copy.
 *
 * Permit rows keep internal names (feeLowUsd, feeUsd, null) so anchor
 * checks can still match the recorded text. Pages, meta descriptions,
 * and JSON-LD run this before the copy is shown. Dollar amounts are
 * left character-for-character intact.
 */

const FIELD_LABELS: Record<string, string> = {
  feeLowUsd: "the low fee",
  feeHighUsd: "the high fee",
  feeTypicalUsd: "the typical fee",
  typicalProjectValueUsd: "the typical project value",
  assumedValuationUsd: "the assumed project value",
  feeUsd: "the fee amount",
};

function humanizeFieldToken(token: string): string {
  const known = FIELD_LABELS[token];
  if (known) return known;
  const stem = token.replace(/Usd$/, "");
  const words = stem
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .toLowerCase();
  return words ? "the " + words : "the amount";
}

function maskUrls(text: string): { text: string; urls: string[] } {
  const urls: string[] = [];
  const masked = text.replace(/https?:\/\/[^\s)\]"'<>]+/g, (url) => {
    urls.push(url);
    return "\u0000URL" + (urls.length - 1) + "\u0000";
  });
  return { text: masked, urls };
}

function restoreUrls(text: string, urls: string[]): string {
  return text.replace(/\u0000URL(\d+)\u0000/g, (_, index: string) => urls[Number(index)] ?? "");
}

/**
 * Rewrite camelCase *Usd field names and bare null / undefined / NaN
 * into plain sentences. Safe to run more than once.
 */
export function humanizeCopy(text: string): string {
  if (!text || typeof text !== "string") return text;
  if (/^https?:\/\//i.test(text.trim())) return text;

  const masked = maskUrls(text);
  let s = masked.text;

  s = s.replace(
    /assumedValuationUsd is null, and typicalProjectValueUsd is null/g,
    "no project value is recorded",
  );
  s = s.replace(/assumedValuationUsd is null/g, "no assumed project value is recorded");
  s = s.replace(/typicalProjectValueUsd is null/g, "no typical project value is recorded");

  s = s.replace(/feeHighUsd is null because/g, "no high fee is shown because");
  s = s.replace(/feeLowUsd is null because/g, "no low fee is shown because");
  s = s.replace(/feeTypicalUsd is null because/g, "no typical fee is shown because");
  s = s.replace(/feeHighUsd is null:/g, "no high fee is shown:");
  s = s.replace(/feeLowUsd is null:/g, "no low fee is shown:");
  s = s.replace(/feeTypicalUsd is null:/g, "no typical fee is shown:");
  s = s.replace(/feeHighUsd stays null/g, "no high fee is shown");
  s = s.replace(/feeLowUsd stays null/g, "no low fee is shown");
  s = s.replace(/feeTypicalUsd stays null/g, "no typical fee is shown");
  s = s.replace(/feeHighUsd is null/g, "no high fee is shown");
  s = s.replace(/feeLowUsd is null/g, "no low fee is shown");
  s = s.replace(/feeTypicalUsd is null/g, "no typical fee is shown");

  s = s.replace(/([A-Za-z][\w/-]*)\s+\bfeeUsd\b stays null/g, "$1 amount is not listed");
  s = s.replace(/([A-Za-z][\w/-]*)\s+\bfeeUsd\b is null/g, "$1 amount is not listed");
  s = s.replace(/\bfeeUsd\b stays null/g, "no amount is listed");
  s = s.replace(/\bfeeUsd\b is null/g, "no amount is listed");
  s = s.replace(/\(feeUsd null here\)/g, "(no published amount)");
  s = s.replace(/\(feeUsd null\)/g, "(no published amount)");
  s = s.replace(/\bfeeUsd\b null here/g, "no published amount");
  s = s.replace(/\bfeeUsd\b null/g, "no published amount");

  s = s.replace(
    /has a null fee and is marked not included in totals/g,
    "has no published amount and is not included in the totals",
  );
  s = s.replace(
    /has a null fee/g,
    "has no published amount and is not included in the totals",
  );

  s = s.replace(/amounts above (\$[\d,.]+) stay null/g, "amounts above $1 are not listed");
  s = s.replace(/Low\/high left null/g, "The low and high fees are not listed");
  s = s.replace(/High left null/g, "The high fee is not listed");
  s = s.replace(/Typical left null/g, "The typical fee is not listed");
  s = s.replace(/Low left null/g, "The low fee is not listed");
  s = s.replace(/Dollars left null/g, "Dollars are not listed");
  s = s.replace(/dollars left null/g, "dollars are not listed");
  s = s.replace(/are left null/g, "are not listed");
  s = s.replace(/left null/g, "is not listed");
  s = s.replace(/stay null/g, "are not listed");
  s = s.replace(/stays null/g, "is not listed");
  s = s.replace(/and null here/g, "and is not listed here");
  s = s.replace(/are null here/g, "are not listed here");
  s = s.replace(/\bnull here\b/g, "not listed here");

  s = s.replace(/\bfeeUsd\b lines/g, "fee lines");
  s = s.replace(/\bfeeUsd\b line/g, "fee line");
  s = s.replace(/\bfeeUsd\b amounts/g, "fee amounts");
  s = s.replace(/\bfeeUsd\b was recorded/g, "amount was recorded");
  s = s.replace(/\bfeeUsd\b is (\$)/g, "amount is $1");
  s = s.replace(/as feeUsd\b/g, "as a fee amount");
  s = s.replace(/\bthe feeUsd\b/g, "the amount");
  s = s.replace(/\bfeeUsd\b/g, "the fee amount");

  for (const [field, label] of Object.entries(FIELD_LABELS)) {
    if (field === "feeUsd") continue;
    s = s.replace(new RegExp("which is " + field + " (\\$)", "g"), "which is " + label + " of $1");
    s = s.replace(new RegExp("\\b" + field + " is (\\$)", "g"), label + " is $1");
    s = s.replace(new RegExp("\\b" + field + " (\\$)", "g"), label + " of $1");
  }

  s = s.replace(/\b[A-Za-z]+Usd\b/g, (token) => humanizeFieldToken(token));

  s = s.replace(/\bundefined\b/g, "not recorded");
  s = s.replace(/\bNaN\b/g, "not recorded");
  s = s.replace(/\bis null\b/g, "is not listed");
  s = s.replace(/\bare null\b/g, "are not listed");
  s = s.replace(/\bwas null\b/g, "was not listed");
  s = s.replace(/\bbe null\b/g, "be omitted");
  s = s.replace(/\bnull\b/g, "not listed");

  s = s.replace(/\bthe the /g, "the ");
  s = s.replace(
    /(^|[.!?]\s+)(no (?:high fee is shown|low fee is shown|typical fee is shown|amount is listed|project value is recorded|assumed project value is recorded|typical project value is recorded))/g,
    (_, prefix: string, phrase: string) => prefix + phrase.charAt(0).toUpperCase() + phrase.slice(1),
  );

  return restoreUrls(s, masked.urls);
}
