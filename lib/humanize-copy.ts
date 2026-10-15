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
    "no project value is listed",
  );
  s = s.replace(/assumedValuationUsd is null/g, "no assumed project value is listed");
  s = s.replace(/typicalProjectValueUsd is null/g, "no typical project value is listed");

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
  s = s.replace(/\bfeeUsd\b was recorded/g, "amount is listed");
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

  s = s.replace(/\bundefined\b/g, "not listed");
  s = s.replace(/\bNaN\b/g, "not listed");
  s = s.replace(/\bis null\b/g, "is not listed");
  s = s.replace(/\bare null\b/g, "are not listed");
  s = s.replace(/\bwas null\b/g, "was not listed");
  s = s.replace(/\bbe null\b/g, "be omitted");
  s = s.replace(/\bnull\b/g, "not listed");

  // Recorded fee method and permit flag, written for homeowners.
  const FEE_MODEL_LABELS: Record<string, string> = {
    valuation: "the fee is based on the project valuation",
    flat: "the fee is a flat amount",
    tiered: "the fee follows a tiered schedule",
    area: "the fee is based on square footage",
    none: "no permit fee applies",
    exemption: "the path is exempt, so no permit fee applies",
    unknown: "the fee method is not listed",
  };
  s = s.replace(/\bfeeModel is ([a-z-]+)/g, (_, kind: string) =>
    FEE_MODEL_LABELS[kind] ?? "the fee method is " + kind,
  );
  s = s.replace(/\bpermitRequired is true\b/g, "a permit is required");
  s = s.replace(/\bpermitRequired is false\b/g, "a permit is not required");
  s = s.replace(/\bfeeModel\b/g, "the fee method");
  s = s.replace(/\bpermitRequired\b/g, "the permit requirement");

  // Visitor-facing leftovers: raw fee-model enums and download/403 phrasing.
  s = s.replace(/\. Fee model: unknown\.?/gi, ".");
  s = s.replace(/Fee model: unknown\.?/gi, "");
  s = s.replace(/Fee model: none\b/gi, "Fee model: No permit fee");
  s = s.replace(/could not be downloaded[^.]*\./gi, "");
  s = s.replace(/Host 403 on direct PDF;\s*/gi, "");
  s = s.replace(/\s{2,}/g, " ").replace(/ \./g, ".");

  s = s.replace(/\bthe the /g, "the ");
  s = s.replace(
    /(^|[.!?]\s+)(no (?:high fee is shown|low fee is shown|typical fee is shown|amount is listed|project value is listed|assumed project value is listed|typical project value is listed|permit fee applies)|the (?:low|typical|high) fee|the low, typical|the fee (?:is|follows|method|amount)|the path is exempt|the typical project value|the assumed project value|the permit requirement|a permit is (?:required|not required))/g,
    (_, prefix: string, phrase: string) => prefix + phrase.charAt(0).toUpperCase() + phrase.slice(1),
  );

  s = plainConsumerCopy(s);

  return restoreUrls(s, masked.urls);
}

/**
 * Homeowner language for phrases that still sound like a database.
 * Runs after field-name cleanup. Dollar amounts stay intact.
 */
function plainConsumerCopy(text: string): string {
  let s = text;

  const exact: Array<[string, string]> = [
    [
      "Recorded permit-row fields only. Not a substitute for the live municipal calculator.",
      "Official permit schedule figures. Check the city's calculator before you apply.",
    ],
    [
      "Recorded city, BLS OEWS, and permit-row fields only. We do not invent fees or fill blank schedules.",
      "Uses the city fee schedule and BLS wage data. If a fee is not published, that line stays blank.",
    ],
    [
      "Recorded BLS OEWS fields only. Labor is wage-indexed for this metro; materials stay at the national figure.",
      "Labor uses local construction wages for this metro. Materials stay at the national figure.",
    ],
    [
      "Figures come from the recorded municipal schedule only. Blank means that line was not extracted as a dollar and we do not invent one.",
      "Figures come from the city fee schedule. A blank line is not published as a dollar amount.",
    ],
    [
      "Recorded typical-job specs and assumed valuations from our published sources only. Assumed valuations apply official permit formulas; they are not city-assessed values.",
      "Typical job sizes and assumed values from our published sources. Assumed values feed the permit formula. They are not the city's assessed value.",
    ],
    [
      "Recorded project allocation only. Used for wage-index math on the labor share; not a surveyed local contractor split.",
      "Our labor and materials split for this estimate. It is for the local wage adjustment, not a surveyed contractor split.",
    ],
    ["Recorded municipal fields only.", "City permit office figures."],
    ["Recorded Census and county fields only.", "Census and county figures."],
    ["Recorded project allocation only.", "Our labor and materials split for this estimate."],
    ["Recorded permit-row fields only.", "Official permit schedule figures."],
    ["Recorded BLS OEWS fields only.", "BLS wage figures."],
  ];
  for (const [from, to] of exact) s = s.split(from).join(to);

  s = s.replace(/\bon our wage-indexed model\b/g, "on our estimate adjusted for local wages");
  s = s.replace(/\bfrom our wage-indexed model\b/g, "from our estimate adjusted for local wages");
  s = s.replace(/\bour wage-indexed model\b/g, "our estimate adjusted for local wages");
  s = s.replace(/\bwage-indexed model\b/g, "estimate adjusted for local wages");
  s = s.replace(/\bwage-indexed job cost\b/g, "job cost adjusted for local wages");
  s = s.replace(/\bwage-indexed published broad high\b/g, "published broad high, adjusted for local wages");
  s = s.replace(/\bis wage-indexed to\b/g, "is adjusted for local wages using");
  s = s.replace(/\bis wage-indexed for\b/g, "is adjusted for local wages in");
  s = s.replace(/\bwhile labor is wage-indexed\b/g, "while labor is adjusted for local wages");
  s = s.replace(/\bare not wage-indexed\b/g, "are not adjusted for local wages");
  s = s.replace(/\bnot wage-indexed\b/g, "not adjusted for local wages");
  s = s.replace(/\bwage-indexed\b/g, "adjusted for local wages");

  s = s.replace(/\bapplied to laborShare only\b/g, "applied to the labor share only");
  s = s.replace(/\blaborShare\b/g, "labor share");

  s = s.replace(/\bwas not extracted as a dollar\b/gi, "is not published as a dollar amount");
  s = s.replace(/\bnot extracted as a dollar\b/gi, "not published as a dollar amount");
  s = s.replace(/\bwere not extracted\b/gi, "are not published in the fee schedule");
  s = s.replace(/\bwas not extracted\b/gi, "is not published in the fee schedule");
  s = s.replace(/\bhave not extracted\b/gi, "do not have");
  s = s.replace(/\bhas not extracted\b/gi, "does not list");
  s = s.replace(/\bnot yet extracted\b/gi, "not published in the fee schedule");
  s = s.replace(/\bnot extracted\b/gi, "not published in the fee schedule");
  s = s.replace(/\bleft null\b/gi, "not listed");

  s = s.replace(/(?:^|(?<=[.!?]\s))(?:We|we) do not invent\b[^.]*\.?\s*/gi, "");
  s = s.replace(/\bdo not invent\b[^.]*\.?\s*/gi, "");

  // Keep permit-formula project values from reading like a second cost range.
  s = s.replace(/\b(?:Recorded|Listed) assumed values(?: are|:)\s*low\b/g, "Project values used only for the permit formula (not your total cost): low");
  s = s.replace(/\b(\d{2})\/(\d{2}) (?:is an allocation for|used for) wage-index math(?:, not a surveyed split)?\.?/g, "We split labor and materials $1/$2 to adjust labor for local wages.");
  s = replaceKeepingCase(s, /\bnot yet recorded\b/gi, "not listed yet");
  s = replaceKeepingCase(s, /\bnot recorded\b/gi, "not listed");
  s = replaceKeepingCase(s, /\brecorded as\b/gi, "listed as");
  s = replaceKeepingCase(s, /\brecorded for\b/gi, "listed for");
  s = replaceKeepingCase(s, /\bare recorded\b/gi, "are listed");
  s = replaceKeepingCase(s, /\bis recorded\b/gi, "is listed");
  s = replaceKeepingCase(s, /\bwas recorded\b/gi, "is listed");
  s = s.replace(/\bthe recorded\b/g, "the official");
  s = s.replace(/\bThe recorded\b/g, "The official");
  s = s.replace(/\ba recorded\b/g, "an official");
  s = s.replace(/\bRecorded\b/g, "Listed");
  s = s.replace(/\brecorded\b/g, "listed");

  s = s.replace(/\s+and\s*(?=[.,]|$)/g, "");
  s = s.replace(/\s+,/g, ",");
  s = s.replace(/\s+\./g, ".");
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/\.(\s*\.)+/g, ".");
  s = s.replace(/\bthe the\b/g, "the");
  return s.trim();
}

function replaceKeepingCase(text: string, pattern: RegExp, replacement: string): string {
  return text.replace(pattern, (match) => {
    const first = match.charAt(0);
    if (first !== first.toLowerCase() && first === first.toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}
