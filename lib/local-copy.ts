import { cityLabel } from "@/lib/data-client";
import { usd, usdRange } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { assumedValuation, typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type FaqItem = { question: string; answer: string };

export type PermitCalloutModel =
  | {
      kind: "known";
      typicalUsd: number;
      lowUsd: number | null;
      highUsd: number | null;
      rangeLabel: string | null;
      sourceName: string;
      retrievedDate: string | null;
      caveat: string | null;
      dept: string;
      job: string;
      city: string;
    }
  | {
      kind: "unknown";
      sourceName: string | null;
      retrievedDate: string | null;
      caveat: string | null;
      calculationNote: string | null;
      job: string;
      city: string;
    }
  | {
      kind: "zero";
      permitRequired: boolean | null;
      caveat: string | null;
      extraNotes: string[];
      sourceName: string | null;
      retrievedDate: string | null;
      job: string;
      city: string;
    }
  | {
      kind: "missing";
      job: string;
      city: string;
      dept: string;
    };

function asSentence(s: string): string {
  const t = keepHvac((s || "").trim());
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function firstSentence(s: string): string {
  const t = (s || "").trim();
  if (!t) return "";
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return asSentence(m ? m[0] : t);
}

/** Short visible paragraphs for the "What we assumed" block. */
export function assumptionParagraphs(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): string[] {
  const out: string[] = [];
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  const sourcesVal = assumedValuation(project.projectSlug);

  if (spec) {
    out.push(
      asSentence(
        job +
          " in " +
          label +
          " is priced as a documented typical job of " +
          spec.typical +
          " (scope " +
          spec.low +
          " to " +
          spec.high +
          "). " +
          spec.why,
      ),
    );
  } else {
    out.push(asSentence(job + " in " + label + " uses the recorded typical-job scope on this page"));
  }

  const scope = (project.scopeNote || "").trim();
  const unit = (project.unitNote || "").trim();
  if (scope) out.push(asSentence(firstSentence(scope)));
  if (unit && unit !== scope) out.push(asSentence(firstSentence(unit)));

  const rowVal = permit?.assumedValuationUsd;
  const typicalVal =
    rowVal?.typical ?? permit?.typicalProjectValueUsd ?? sourcesVal?.typical ?? null;
  const lowVal = rowVal?.low ?? sourcesVal?.low ?? null;
  const highVal = rowVal?.high ?? sourcesVal?.high ?? null;

  if (typicalVal != null) {
    let v =
      "When a published schedule is a valuation formula, the documented assumed valuation is " +
      usd(typicalVal);
    if (lowVal != null && highVal != null) {
      v += " typical (" + usd(lowVal) + " low, " + usd(highVal) + " high)";
    }
    v += " — not a city-assessed value";
    if (sourcesVal?.why) v += ". " + sourcesVal.why;
    if (
      permit?.typicalProjectValueUsd != null &&
      permit.typicalProjectValueUsd !== typicalVal
    ) {
      v +=
        ". This city's permit row records typical project value " +
        usd(permit.typicalProjectValueUsd);
    }
    out.push(asSentence(v));
  }

  const calc = (permit?.calculationNote || "").trim();
  if (calc) out.push(asSentence(calc));

  return out.filter(Boolean).map(keepHvac);
}

export function permitCalloutModel(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): PermitCalloutModel {
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);

  if (!permit) {
    return { kind: "missing", job, city: label, dept: city.permitDeptName };
  }

  const fee = permit.feeTypicalUsd;
  if (fee == null) {
    return {
      kind: "unknown",
      sourceName: permit.sourceName || null,
      retrievedDate: permit.retrievedDate || null,
      caveat: permit.caveat?.trim() || null,
      calculationNote: permit.calculationNote?.trim() || null,
      job,
      city: label,
    };
  }

  if (fee === 0) {
    const extraNotes = (permit.extras || [])
      .map((e) => {
        const note = (e.note || "").trim();
        const name = (e.name || "").trim();
        if (note && name) return asSentence(name + ": " + note);
        if (note) return asSentence(note);
        if (name) return asSentence(name);
        return "";
      })
      .filter(Boolean)
      .slice(0, 3);
    return {
      kind: "zero",
      permitRequired: permit.permitRequired,
      caveat: permit.caveat?.trim() || null,
      extraNotes,
      sourceName: permit.sourceName || null,
      retrievedDate: permit.retrievedDate || null,
      job,
      city: label,
    };
  }

  const low = permit.feeLowUsd;
  const high = permit.feeHighUsd;
  const showRange =
    (low != null || high != null) && !(low === fee && high === fee);
  return {
    kind: "known",
    typicalUsd: fee,
    lowUsd: low,
    highUsd: high,
    rangeLabel: showRange ? usdRange(low, high) : null,
    sourceName: permit.sourceName,
    retrievedDate: permit.retrievedDate || null,
    caveat: permit.caveat?.trim() || null,
    dept: city.permitDeptName,
    job,
    city: label,
  };
}

export function moneyFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const spec = typicalJobSpec(project.projectSlug);
  const fee = permit?.feeTypicalUsd ?? null;
  const required = permit?.permitRequired ?? null;
  const caveatFirst = permit?.caveat ? firstSentence(permit.caveat) : "";
  const calcFirst = permit?.calculationNote ? firstSentence(permit.calculationNote) : "";
  const dept = city.permitDeptName;

  let requiredAnswer: string;
  if (!permit) {
    requiredAnswer =
      "Whether a permit is required for " +
      job +
      " in " +
      label +
      " is not recorded on this page. Confirm with " +
      dept +
      " before you apply.";
  } else if (required === false) {
    requiredAnswer =
      "The typical path is recorded as not requiring a permit for " +
      job +
      " in " +
      label +
      ".";
    if (fee === 0) requiredAnswer += " The recorded typical fee is $0.";
    if (caveatFirst) requiredAnswer += " " + caveatFirst;
  } else if (required === true) {
    requiredAnswer =
      "Yes. " + dept + " requires a permit for a typical " + job + " in " + label + ".";
    if (fee != null && fee > 0) {
      requiredAnswer += " The typical recorded fee is " + usd(fee) + ".";
    } else if (fee === 0) {
      requiredAnswer += " The recorded typical fee is still $0 — see the caveat on this page.";
    } else {
      requiredAnswer +=
        " The fee itself is not yet recorded from the official schedule, so that line stays blank.";
    }
    if (caveatFirst) requiredAnswer += " " + caveatFirst;
  } else {
    requiredAnswer =
      "Whether a permit is required for " +
      job +
      " in " +
      label +
      " is not marked on the permit row. Confirm with " +
      dept +
      ".";
    if (caveatFirst) requiredAnswer += " " + caveatFirst;
  }

  let included =
    "The estimate is labor (wage-indexed for " +
    label +
    ") plus materials at the national figure";
  if (spec) included += " for a " + spec.typical + " " + job;
  else included += " for this " + job;
  included += ".";
  if (fee != null && fee > 0) {
    included +=
      " The recorded typical permit fee of " +
      usd(fee) +
      " is included in the all-in typical.";
  } else if (fee === 0) {
    included +=
      " The permit line is $0 on the typical path, so all-in is the job cost.";
  } else {
    included +=
      " The permit line is blank, so the all-in figure is job cost only — we do not guess a city fee.";
  }

  let differ: string;
  if (fee != null && fee > 0) {
    differ =
      "The recorded " +
      label +
      " fee comes from " +
      (permit?.sourceName || "the official schedule on file");
    if (permit?.feeModel) differ += " (" + permit.feeModel.replace(/_/g, " ") + ")";
    differ += ".";
    if (calcFirst) differ += " " + calcFirst;
    else if (caveatFirst) differ += " " + caveatFirst;
    differ +=
      " Site conditions, extras not in the typical row, and schedule updates can change what you actually pay. Verify with " +
      dept +
      ".";
  } else if (fee === 0) {
    differ =
      "The typical path in " +
      label +
      " is recorded as $0.";
    if (caveatFirst) differ += " " + caveatFirst;
    differ +=
      " If your job is outside that exemption, the city may charge a different published line — we do not invent that dollar here.";
  } else {
    differ =
      "We have not extracted a typical dollar from the official " +
      label +
      " schedule, so we do not show a fee.";
    if (caveatFirst) differ += " " + caveatFirst;
    else if (calcFirst) differ += " " + calcFirst;
    differ += " Confirm the current line with " + dept + ".";
  }

  const items: FaqItem[] = [
    {
      question: "Is a permit required for " + job + " in " + label + "?",
      answer: asSentence(requiredAnswer),
    },
    {
      question: "What is included in this " + job + " estimate for " + label + "?",
      answer: asSentence(included),
    },
    {
      question: "Why might the " + city.name + " permit fee differ from this typical figure?",
      answer: asSentence(differ),
    },
    ...extraPermitFaqItems(city, project, permit),
  ];

  return items.map((item) => ({
    question: keepHvac(item.question),
    answer: keepHvac(item.answer),
  }));
}

function extraNotes(permit: Permit): string[] {
  return (permit.extras || [])
    .map((e) => (e.note || "").trim())
    .filter(Boolean);
}

function extraBlob(permit: Permit): string {
  return [
    permit.caveat || "",
    permit.calculationNote || "",
    ...(permit.extras || []).map((e) => [e.name, e.note].filter(Boolean).join(" ")),
  ].join(" ");
}

function matchingSentence(text: string, re: RegExp, which: "first" | "last" = "first"): string {
  const parts = text
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const hits = parts.filter((p) => re.test(p));
  const hit = which === "last" ? hits[hits.length - 1] : hits[0];
  return hit ? asSentence(hit) : "";
}

function snippetFrom(text: string | null | undefined, re: RegExp, which: "first" | "last" = "first"): string {
  const t = (text || "").trim();
  if (!t || !re.test(t)) return "";
  return matchingSentence(t, re, which) || firstSentence(t);
}

/** Prefer extra notes, then calculation note, then caveat. Names are not used as copy. */
function firstMatchingSnippet(
  permit: Permit,
  re: RegExp,
  order: Array<"extras" | "calc" | "caveat"> = ["extras", "calc", "caveat"],
  which: "first" | "last" = "first",
): string {
  for (const key of order) {
    if (key === "extras") {
      for (const note of extraNotes(permit)) {
        const hit = snippetFrom(note, re, which);
        if (hit) return hit;
      }
    } else if (key === "calc") {
      const hit = snippetFrom(permit.calculationNote, re, which);
      if (hit) return hit;
    } else {
      const hit = snippetFrom(permit.caveat, re, which);
      if (hit) return hit;
    }
  }
  return "";
}

function matchingExtraNotes(permit: Permit, re: RegExp, max = 2): string {
  const out: string[] = [];
  for (const extra of permit.extras || []) {
    const name = (extra.name || "").trim();
    const note = (extra.note || "").trim();
    const text = [name, note].filter(Boolean).join(" ");
    if (!re.test(text)) continue;
    const bit = snippetFrom(note, re) || firstSentence(note || name);
    if (!bit) continue;
    if (name && !bit.toLowerCase().includes(name.toLowerCase().slice(0, 18))) {
      out.push(asSentence(name + ": " + bit.replace(/[.!?]$/, "")));
    } else {
      out.push(bit);
    }
    if (out.length >= max) break;
  }
  return out.join(" ");
}

function recordedValuationAnswer(permit: Permit): string {
  const assumed = permit.assumedValuationUsd;
  const bits: string[] = [];
  if (assumed) {
    if (typeof assumed.low === "number") bits.push("low " + usd(assumed.low));
    if (typeof assumed.typical === "number") bits.push("typical " + usd(assumed.typical));
    if (typeof assumed.high === "number") bits.push("high " + usd(assumed.high));
  }
  if (bits.length) return "Recorded assumed values: " + bits.join(", ") + ".";
  if (typeof permit.typicalProjectValueUsd === "number") {
    return "Recorded typical project value " + usd(permit.typicalProjectValueUsd) + ".";
  }
  return "";
}

/**
 * Extra FAQ items from recorded permit fields only. Calc note and assumed
 * valuation come first so they win the cap; then same-layout/cabinet-only
 * alternate paths, then exemption / STFI / Quick Permit / trades / plan
 * review / minimum-fee-only. Cap 3. Never invents fees.
 */
function extraPermitFaqItems(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): FaqItem[] {
  if (!permit) return [];

  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const extra: FaqItem[] = [];
  const push = (question: string, snippet: string, suffix?: string) => {
    if (!snippet && !suffix) return;
    extra.push({
      question: keepHvac(question),
      answer: asSentence([snippet, suffix].filter(Boolean).join(" ")),
    });
  };

  const calcNote = (permit.calculationNote || "").trim();
  if (calcNote) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      firstSentence(calcNote),
      "We do not invent fees beyond the recorded note.",
    );
  }

  const valuation = recordedValuationAnswer(permit);
  if (valuation) {
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      valuation,
    );
  }

  const earlyBlob = extraBlob(permit);
  if (/same-layout|cabinet-only|cosmetic/i.test(earlyBlob)) {
    push(
      "Does every " + job + " in " + label + " need a building permit?",
      firstMatchingSnippet(
        permit,
        /same-layout|cabinet-only|cosmetic|may not need/i,
        ["caveat", "extras", "calc"],
      ) || firstSentence(permit.caveat || ""),
      "Confirm the live path with " + city.permitDeptName + ".",
    );
  }

  const blob = extraBlob(permit);
  if (!blob.trim()) return extra.slice(0, 3);

  const exemption =
    (permit.feeTypicalUsd === 0 || permit.permitRequired === false) && /\bexempt/i.test(blob);
  const stfi = /\bstfi\b/i.test(blob);
  const quickPermit = /quick permit/i.test(blob);
  const trades = /\btrades?\b/i.test(blob) || (/electrical/i.test(blob) && /plumbing/i.test(blob));
  const planReview = /plan review/i.test(blob);
  const minimumOnly =
    /minimum/i.test(blob) &&
    (/\bonly\b/i.test(blob) || /not extracted/i.test(blob) || /published (city )?minimum/i.test(blob));

  if (exemption) {
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      firstMatchingSnippet(permit, /\bexempt/i, ["calc", "caveat", "extras"]) ||
        firstSentence(permit.caveat || ""),
      "We do not invent an alternate fee if the exemption does not apply.",
    );
  }

  if (stfi) {
    push(
      "What is the STFI path for " + job + " in " + label + "?",
      firstMatchingSnippet(permit, /\bstfi\b/i, ["extras", "caveat", "calc"], "last"),
    );
  }

  if (quickPermit) {
    push(
      "Does a typical " + job + " in " + label + " use a Quick Permit?",
      firstMatchingSnippet(permit, /quick permit/i, ["caveat", "extras", "calc"]),
    );
  }

  if (trades) {
    const tradeNameRe = /\btrades?\b|electrical|plumbing|mechanical/i;
    const unpriced = (permit.extras || []).filter((e) => {
      const name = (e.name || "").trim();
      if (!tradeNameRe.test(name)) return false;
      return e.feeUsd == null && e.amountUsd == null;
    });
    const suffix = unpriced.length
      ? unpriced.map((e) => e.name).filter(Boolean).join("; ") +
        " amounts are not recorded on this row, so they are not added into the typical."
      : "";
    const namedTradeNotes = (permit.extras || [])
      .filter((e) => tradeNameRe.test((e.name || "").trim()))
      .map((e) => {
        const name = (e.name || "").trim();
        const note = (e.note || "").trim();
        if (note) return asSentence(name ? name + ": " + note.replace(/[.!?]$/, "") : note);
        return name ? asSentence(name) : "";
      })
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    push(
      "Are electrical, plumbing, or other trade permits included in this " +
        job +
        " typical for " +
        label +
        "?",
      namedTradeNotes ||
        matchingExtraNotes(permit, /\btrades?\b/i) ||
        firstMatchingSnippet(permit, /\btrades?\b/i, ["caveat", "extras", "calc"]) ||
        firstMatchingSnippet(permit, /electrical|plumbing/i, ["caveat", "extras", "calc"]),
      suffix,
    );
  }

  if (planReview) {
    const planSnippet =
      firstMatchingSnippet(permit, /if plans are required/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /plan review exempt/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /full plan review/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /no plan review/i, ["caveat", "extras", "calc"]) ||
      firstMatchingSnippet(permit, /plan review/i, ["caveat", "extras", "calc"], "last");
    push(
      "Is plan review included in the typical " + job + " permit for " + label + "?",
      planSnippet,
    );
  }

  if (minimumOnly) {
    push(
      "Is the recorded " +
        label +
        " " +
        job +
        " fee the full schedule or only the published minimum?",
      firstMatchingSnippet(permit, /minimum/i, ["caveat", "extras", "calc"]),
    );
  }

  return extra.slice(0, 3);
}
