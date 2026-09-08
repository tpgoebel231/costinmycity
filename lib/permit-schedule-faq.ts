import { cityLabel } from "@/lib/data-client";
import { usd, usdRange } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, PermitExtra, ProjectCost } from "@/lib/types";

export type ScheduleFaqItem = { question: string; answer: string };

function plain(s: string): string {
  return (s || "")
    .replace(/\u2014/g, ",")
    .replace(/\u2013/g, "-")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function asSentence(s: string): string {
  const t = keepHvac(plain(s));
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function splitSentences(text: string): string[] {
  const t = plain(text).replace(/\s+/g, " ").trim();
  if (!t) return [];
  return t
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatRetrieved(iso: string | null | undefined): string {
  const t = (iso || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(t + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return t;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function extraFeeUsd(extra: PermitExtra): number | null {
  if (typeof extra.feeUsd === "number") return extra.feeUsd;
  if (typeof extra.amountUsd === "number") return extra.amountUsd;
  return null;
}

function notIncludedInTypical(extra: PermitExtra): boolean {
  const blob = [extra.name, extra.note].filter(Boolean).join(" ");
  return /\bnot included\b|\bnot added\b|\bshown at\b.*\bnot included\b|\bbecause .*exempt/i.test(
    blob,
  );
}

/** Schedule / ordinance facts from city.notes (not exemption-only repeats). */
function cityNotesItem(city: City, project: ProjectCost): ScheduleFaqItem | null {
  const notes = (city.notes || "").trim();
  if (!notes) return null;
  const label = cityLabel(city);
  const job = shortProjectName(project.projectSlug);
  const sentences = splitSentences(notes);
  const prefer = sentences.filter(
    (s) =>
      /\b(fee|ordinance|schedule|valuation|technology|tech fee|plan review|quick permit|minimum|\$|per \$|BEMP|TIP|ADMIN|SMC|N\.C\.G\.S|RCW|effective|revised)\b/i.test(
        s,
      ) && !/^\s*like[- ]for[- ]like reroof/i.test(s),
  );
  const picked = (prefer.length ? prefer : sentences).slice(0, 2).map(asSentence);
  if (!picked.length) return null;
  return {
    question: "What local fee-schedule notes are on file for " + job + " in " + label + "?",
    answer: picked.join(" "),
  };
}

function sourceItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ScheduleFaqItem | null {
  const source = plain(permit.sourceName || "");
  const retrieved = formatRetrieved(permit.retrievedDate);
  if (!source) return null;
  const label = cityLabel(city);
  const job = shortProjectName(project.projectSlug);
  let answer = "The recorded typical for " + job + " in " + label + " cites " + source;
  if (retrieved) answer += " (retrieved " + retrieved + ")";
  answer += ".";
  if (permit.feeModel && permit.feeModel !== "none") {
    answer += " Fee model on the row: " + permit.feeModel.replace(/_/g, " ") + ".";
  }
  return {
    question: "Which official schedule is this " + job + " fee based on in " + label + "?",
    answer: asSentence(answer),
  };
}

function feeRangeItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ScheduleFaqItem | null {
  const low = permit.feeLowUsd;
  const high = permit.feeHighUsd;
  const typical = permit.feeTypicalUsd;
  if (low == null || high == null || typical == null) return null;
  if (low === high && high === typical) return null;
  if (low === 0 && high === 0 && typical === 0) return null;

  const label = cityLabel(city);
  const job = shortProjectName(project.projectSlug);
  let answer =
    "Recorded permit fees for " +
    job +
    " in " +
    label +
    " span " +
    usdRange(low, high) +
    ", with a typical of " +
    usd(typical) +
    ".";
  const calc = (permit.calculationNote || "").trim();
  if (calc) {
    const first = splitSentences(calc)[0];
    if (first) answer += " " + asSentence(first);
  } else if ((permit.caveat || "").trim()) {
    const rangeish = splitSentences(permit.caveat).find((s) =>
      /\b(low|high|typical|unit|trade|plan review|path)\b/i.test(s),
    );
    if (rangeish) answer += " " + asSentence(rangeish);
  }
  answer += " We do not invent dollars outside the recorded row.";
  return {
    question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
    answer: asSentence(answer),
  };
}

/** Extras with recorded dollars that are explicitly not in the typical total. */
function alternatePathItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ScheduleFaqItem | null {
  const extras = (permit.extras || []).filter(
    (e) => (e.name || "").trim() && extraFeeUsd(e) != null && notIncludedInTypical(e),
  );
  if (!extras.length) return null;
  const label = cityLabel(city);
  const job = shortProjectName(project.projectSlug);
  const bits = extras.slice(0, 3).map((e) => {
    const fee = extraFeeUsd(e)!;
    const note = firstUsefulNote(e);
    return (e.name || "").trim() + ": " + usd(fee) + (note ? " (" + note + ")" : "");
  });
  const answer =
    "The typical path for " +
    job +
    " in " +
    label +
    " does not include these recorded alternate-path line items: " +
    bits.join("; ") +
    ". Confirm with " +
    city.permitDeptName +
    " if your job falls outside the typical path.";
  return {
    question:
      "What alternate permit fees are recorded if the typical " +
      job +
      " path in " +
      label +
      " does not apply?",
    answer: asSentence(answer),
  };
}

function firstUsefulNote(extra: PermitExtra): string {
  const note = plain(extra.note || "");
  if (!note) return "";
  const s = splitSentences(note)[0] || note;
  // Keep short; strip trailing period for parenthetical use.
  return s.replace(/[.!?]$/, "").slice(0, 160);
}

/**
 * Schedule / city-notes FAQ from recorded permit rows and city.notes only.
 * Returns [] when fewer than 2 items can be built. Never invents fees.
 */
export function permitScheduleFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): ScheduleFaqItem[] {
  if (!permit) return [];

  const items: ScheduleFaqItem[] = [];
  const push = (item: ScheduleFaqItem | null) => {
    if (!item) return;
    if (items.some((x) => x.question === item.question)) return;
    items.push(item);
  };

  push(sourceItem(city, project, permit));
  push(cityNotesItem(city, project));
  push(feeRangeItem(city, project, permit));
  push(alternatePathItem(city, project, permit));

  if (items.length < 2) return [];

  return items.slice(0, 4).map((item) => ({
    question: keepHvac(item.question),
    answer: keepHvac(item.answer),
  }));
}
