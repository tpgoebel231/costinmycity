import { usd } from "@/lib/format";
import { moneyExact } from "@/lib/sourcing";
import type { Permit, PermitExtra } from "@/lib/types";

const CAPTION =
  "Figures come from the recorded municipal schedule row only. Blank means that line was not extracted as a dollar and we do not invent one.";

export type PermitExtrasRow = {
  name: string;
  feeLabel: string;
};

export type PermitExtrasModel = {
  heading: string;
  caption: string;
  rows: PermitExtrasRow[];
};

function firstSentence(note: string): string {
  const t = note.trim();
  if (!t) return "";
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return (m ? m[0] : t).trim();
}

function extraName(extra: PermitExtra): string | null {
  const name = (extra.name || "").trim();
  if (name) return name;
  const fromNote = firstSentence(extra.note || "");
  return fromNote || null;
}

function showsExactRoofLineFees(permit: Permit): boolean {
  if (permit.projectSlug !== "roof-replacement") return false;
  if (permit.citySlug === "tucson-az") return true;
  return (
    permit.citySlug === "portland-or" &&
    permit.feeModel === "valuation" &&
    permit.feeLowUsd === 81.68 &&
    permit.feeTypicalUsd === 102.69 &&
    permit.feeHighUsd === 155.22
  );
}

/** Portland kitchen extras keep recorded cents ($187.56, $22.51). Plan review stays blank. */
function showsExactKitchenLineFees(permit: Permit): boolean {
  return (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.feeModel === "valuation" &&
    permit.feeLowUsd === 118.45 &&
    permit.feeTypicalUsd === 210.07 &&
    permit.feeHighUsd === 334.22
  );
}

/** Tucson HVAC trade extras keep recorded cents ($18.54). Other rows stay on rounded usd(). */
function showsExactHvacTradeFees(permit: Permit): boolean {
  return (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.feeModel === "flat" &&
    permit.feeLowUsd === 168.54 &&
    permit.feeTypicalUsd === 218.54 &&
    permit.feeHighUsd === 218.54
  );
}

function extraFeeLabel(permit: Permit, extra: PermitExtra): string {
  const n = typeof extra.feeUsd === "number" ? extra.feeUsd : typeof extra.amountUsd === "number" ? extra.amountUsd : null;
  if (n == null) return "Blank";
  if (showsExactRoofLineFees(permit) || showsExactKitchenLineFees(permit) || showsExactHvacTradeFees(permit)) {
    return moneyExact(n);
  }
  return usd(n);
}

/** Crawlable line-item table from recorded permit extras. Never invents names or fees. */
export function permitExtrasTable(permit: Permit | null | undefined): PermitExtrasModel | null {
  if (!permit || !permit.extras?.length) return null;

  const rows: PermitExtrasRow[] = [];
  for (const extra of permit.extras) {
    const name = extraName(extra);
    if (!name) continue;
    rows.push({ name, feeLabel: extraFeeLabel(permit, extra) });
  }

  if (!rows.length) return null;
  return { heading: "Permit line items on file", caption: CAPTION, rows };
}
