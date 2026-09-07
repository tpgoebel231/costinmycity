import { usd } from "@/lib/format";
import type { Permit } from "@/lib/types";

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
