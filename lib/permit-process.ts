import { cityLabel } from "@/lib/data-client";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import type { City, Permit, PermitExtra, ProjectCost } from "@/lib/types";

export type ProcessFaqItem = { question: string; answer: string };

const EXEMPT_RE = /\bexempt(?:ion)?s?\b/i;
const STATUTE_RE = /160D-1110/i;
const REROOF_RE = /\b(?:like[- ]for[- ]like|reroof|re-roof|roofing|roof)\b/i;

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
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function extraBlob(permit: Permit, city: City): string {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(" ")),
    city.notes || "",
  ].join(" ");
}

function recordedSentences(permit: Permit, city: City): string[] {
  const chunks = [
    permit.caveat,
    permit.calculationNote,
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(". ")),
    city.notes,
  ];
  const out: string[] = [];
  for (const chunk of chunks) {
    if (!chunk?.trim()) continue;
    for (const s of splitSentences(chunk)) {
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

function isFeeFormula(s: string): boolean {
  if (EXEMPT_RE.test(s) || /\bdoes not require\b/i.test(s)) return false;
  const dollars = (s.match(/\$/g) || []).length;
  const percents = (s.match(/%/g) || []).length;
  return dollars + percents >= 3;
}

function processNote(permit: Permit): string {
  const caveat = splitSentences(permit.caveat || "");
  const requireish = caveat.filter(
    (s) =>
      !isFeeFormula(s) &&
      /\b(does not require|not requiring|typical path|permit required|requires a permit|need a permit)\b/i.test(s),
  );
  if (requireish[0]) return asSentence(requireish[0]);
  const other = caveat.filter((s) => !isFeeFormula(s) && !EXEMPT_RE.test(s));
  if (other[0]) return asSentence(other[0]);
  const calc = splitSentences(permit.calculationNote || "");
  for (const s of calc) {
    if (EXEMPT_RE.test(s) || /\b(typical path|does not require)\b/i.test(s)) {
      return asSentence(s);
    }
  }
  return "";
}

function extraFeeUsd(extra: PermitExtra): number | null {
  if (typeof extra.feeUsd === "number") return extra.feeUsd;
  if (typeof extra.amountUsd === "number") return extra.amountUsd;
  return null;
}

function namedExtras(permit: Permit): PermitExtra[] {
  return (permit.extras || []).filter((e) => (e.name || "").trim());
}

function needPermitItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ProcessFaqItem | null {
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const required = permit.permitRequired;
  const fee = permit.feeTypicalUsd;
  const note = processNote(permit);
  let answer = "";

  if (required === false && fee === 0) {
    answer =
      "The typical path is recorded as not requiring a permit for " +
      job +
      " in " +
      label +
      ", and the recorded typical fee is " +
      usd(0) +
      ".";
    if (note) answer += " " + note;
  } else if (required === false) {
    answer =
      "The typical path is recorded as not requiring a permit for " +
      job +
      " in " +
      label +
      ".";
    if (fee != null) answer += " The recorded typical fee is " + usd(fee) + ".";
    if (note) answer += " " + note;
  } else if (required === true) {
    answer = "A typical " + job + " in " + label + " is recorded as requiring a permit.";
    if (note) answer += " " + note;
  } else {
    if (!note) return null;
    answer =
      "Whether a typical " +
      job +
      " in " +
      label +
      " needs a permit is not marked on the recorded row. " +
      note;
  }

  return {
    question: "Does a typical " + job + " in " + label + " need a permit?",
    answer: asSentence(answer),
  };
}

function whoIssuesItem(city: City, project: ProjectCost): ProcessFaqItem | null {
  const dept = plain(city.permitDeptName || "");
  const url = (city.permitPortalUrl || "").trim();
  if (!dept || !url) return null;
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const answer = /\bissues\b/i.test(dept)
    ? dept + ". Apply at " + url + "."
    : dept + " issues permits for " + job + " in " + label + ". Apply at " + url + ".";
  return {
    question: "Who issues the permit in " + label + ", and where do I apply?",
    answer: asSentence(answer),
  };
}

function exemptionItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ProcessFaqItem | null {
  if (!EXEMPT_RE.test(extraBlob(permit, city))) return null;
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const sentences = recordedSentences(permit, city);
  const picked: string[] = [];
  const push = (s: string) => {
    const t = asSentence(s);
    if (t && !picked.includes(t)) picked.push(t);
  };

  for (const s of sentences) {
    if (STATUTE_RE.test(s) && (EXEMPT_RE.test(s) || REROOF_RE.test(s))) push(s);
  }
  for (const s of sentences) {
    if (EXEMPT_RE.test(s)) push(s);
  }
  if (!picked.length) return null;

  return {
    question: "Are any permit exemptions recorded for " + job + " in " + label + "?",
    answer: picked.slice(0, 2).join(" "),
  };
}

function extrasItem(
  city: City,
  project: ProjectCost,
  permit: Permit,
): ProcessFaqItem | null {
  const extras = namedExtras(permit);
  if (!extras.length) return null;
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const bits = extras.map((extra) => {
    const name = (extra.name || "").trim();
    const fee = extraFeeUsd(extra);
    if (fee != null) return name + ": " + usd(fee);
    return name + ": not extracted";
  });
  const answer =
    "The recorded permit row lists these extra line items for " +
    job +
    " in " +
    label +
    ": " +
    bits.join("; ") +
    ".";
  return {
    question: "What extra fees or surcharges are recorded for " + job + " in " + label + "?",
    answer: asSentence(answer),
  };
}

/**
 * Process-focused FAQ items from the permit row and city notes only.
 * Returns [] when fewer than 2 items can be built. Never invents fees,
 * exemptions, or who-must-pull rules.
 */
export function permitProcessFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): ProcessFaqItem[] {
  if (!permit) return [];

  const items: ProcessFaqItem[] = [];
  const need = needPermitItem(city, project, permit);
  if (need) items.push(need);
  const who = whoIssuesItem(city, project);
  if (who) items.push(who);
  const exemption = exemptionItem(city, project, permit);
  if (exemption) items.push(exemption);
  const extras = extrasItem(city, project, permit);
  if (extras) items.push(extras);

  if (items.length < 2) return [];

  return items.slice(0, 4).map((item) => ({
    question: keepHvac(item.question),
    answer: keepHvac(item.answer),
  }));
}
