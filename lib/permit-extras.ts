import { usd } from "@/lib/format";
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

/** Tucson roof recorded cents. Other rows stay on rounded usd(). */
function moneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function extraFeeLabel(permit: Permit, extra: PermitExtra): string {
  const n = typeof extra.feeUsd === "number" ? extra.feeUsd : typeof extra.amountUsd === "number" ? extra.amountUsd : null;
  if (n == null) return "Blank";
  if (permit.citySlug === "tucson-az" && permit.projectSlug === "roof-replacement") return moneyExact(n);
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
