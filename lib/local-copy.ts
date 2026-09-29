import { cityLabel } from "@/lib/data-client";
import { usd, usdRange } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { moneyPageHowMuchFaq } from "@/lib/money-page-seo";
import { keepHvac } from "@/lib/seo";
import {
  isPublishedMinimumFloor,
  permitRowRecordsValuation,
  publishedMinimumValuationAnswer,
} from "@/lib/permit-valuation";
import { shortDeptName } from "@/lib/sourcing";
import { assumedValuation, typicalJobSpec } from "@/lib/typical-specs";
import {
  austinDeckPageCopy,
  austinHvacPageCopy,
  austinKitchenPageCopy,
  austinRoofPageCopy,
  denverHvacPageCopy,
  denverRoofPageCopy,
  phoenixHvacPageCopy,
  phoenixKitchenPageCopy,
  phoenixRoofPageCopy,
} from "@/lib/why-costs-differ";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type FaqItem = { question: string; answer: string };

export type PermitCalloutModel =
  | {
      kind: "known";
      typicalUsd: number;
      lowUsd: number | null;
      highUsd: number | null;
      rangeLabel: string | null;
      /** Exact recorded typical when usd() would drop cents. Null keeps usd(). */
      typicalLabel: string | null;
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
      calculationNote: string | null;
      job: string;
      city: string;
    }
  | {
      kind: "missing";
      job: string;
      city: string;
      dept: string;
    };

/** Charlotte roof row: statutory $0 plus a recorded LUESA alternate. Not other cities. */
function charlotteRoofStatuteExempt(permit: Permit | null | undefined): boolean {
  if (!permit || permit.feeTypicalUsd !== 0) return false;
  const blob = (permit.caveat || "") + " " + (permit.calculationNote || "");
  return (
    /160D-1110\(c\)\(5\)/.test(blob) &&
    /\$40,000/.test(blob) &&
    /like-for-like/i.test(blob) &&
    /OSFM/i.test(blob) &&
    /15%/.test(blob) &&
    /10\/19\/2023/.test(blob) &&
    /Alternate LUESA Section II\.A/.test(permit.calculationNote || "")
  );
}

/**
 * Short "what we assumed" clause for the Charlotte roof $0 exemption.
 * The full LUESA calculation note stays on the fee-model callout.
 */
function charlotteRoofAssumption(): string {
  return asSentence(
    "For the permit line we assumed the recorded statutory exemption under N.C.G.S. 160D-1110(c)(5): a like-for-like single-family reroof at or under $40,000, with a typical fee of $0. The LUESA Section II.A alternate is not included in these totals",
  );
}

/** Used only when the Charlotte roof row has no caveat to show instead. */
function charlotteRoofShortPermitNote(): string {
  return asSentence(
    "Typical path is $0 under N.C.G.S. 160D-1110(c)(5) for a like-for-like single-family reroof at or under $40,000. The LUESA Section II.A alternate is not included in that typical",
  );
}

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

  const austinPath = austinRoofPageCopy(city, permit);
  const austinHvacPath = austinHvacPageCopy(city, permit);
  const austinKitchenPath = austinKitchenPageCopy(city, permit);
  const austinDeckPath = austinDeckPageCopy(city, permit);
  const phoenixRoofPath = phoenixRoofPageCopy(city, permit);
  const phoenixHvacPath = phoenixHvacPageCopy(city, permit);
  const phoenixKitchenPath = phoenixKitchenPageCopy(city, permit);
  const rowVal = permit?.assumedValuationUsd;
  const rowHasValuation = permitRowRecordsValuation(permit);
  const typicalVal = rowHasValuation
    ? (rowVal?.typical ?? permit?.typicalProjectValueUsd ?? sourcesVal?.typical ?? null)
    : null;
  const lowVal = rowHasValuation ? (rowVal?.low ?? sourcesVal?.low ?? null) : null;
  const highVal = rowHasValuation ? (rowVal?.high ?? sourcesVal?.high ?? null) : null;

  if (permit && !rowHasValuation && isPublishedMinimumFloor(permit)) {
    out.push(asSentence(publishedMinimumValuationAnswer(permit, shortDeptName(city))));
  } else if (
    typicalVal != null &&
    !austinPath &&
    !austinHvacPath &&
    !austinKitchenPath &&
    !austinDeckPath &&
    !phoenixRoofPath &&
    !phoenixHvacPath &&
    !phoenixKitchenPath
  ) {
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

  const denverPath = denverHvacPageCopy(city, permit);
  if (denverPath) out.push(denverPath.assumption);
  const denverRoofPath = denverRoofPageCopy(city, permit);
  if (denverRoofPath) out.push(denverRoofPath.assumption);

  if (austinPath) out.push(austinPath.assumption);
  if (austinHvacPath) out.push(austinHvacPath.assumption);
  if (austinKitchenPath) out.push(austinKitchenPath.assumption);
  if (austinDeckPath) out.push(austinDeckPath.assumption);
  if (phoenixRoofPath) out.push(phoenixRoofPath.assumption);
  if (phoenixHvacPath) out.push(phoenixHvacPath.assumption);
  if (phoenixKitchenPath) out.push(phoenixKitchenPath.assumption);

  // Charlotte roof already explains the exemption in Why costs differ.
  // Pasting the full calculation note here repeats the LUESA wall.
  // Austin roof, HVAC, kitchen, and deck, Denver HVAC, Denver roof, and Phoenix
  // roof, HVAC, and kitchen keep a short assumption. The full note stays on the
  // permit callout and the fee-model callout. How-calculated summarizes and
  // points at that note so assumptions and why-costs do not repeat the wall.
  // Seattle roof and Denver deck still paste the note.
  if (permit && charlotteRoofStatuteExempt(permit)) {
    out.push(charlotteRoofAssumption());
  } else {
    const calc = (permit?.calculationNote || "").trim();
    if (
      calc &&
      !austinPath &&
      !austinHvacPath &&
      !austinKitchenPath &&
      !austinDeckPath &&
      !denverPath &&
      !denverRoofPath &&
      !phoenixRoofPath &&
      !phoenixHvacPath &&
      !phoenixKitchenPath
    ) {
      out.push(asSentence(calc));
    }
  }

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
    const caveat = permit.caveat?.trim() || null;
    const statuteExempt = charlotteRoofStatuteExempt(permit);
    // Caveat and the full calculation note are the same exemption wall.
    // Show the caveat, or a short note when the caveat is missing.
    const calculationNote = statuteExempt
      ? caveat
        ? null
        : charlotteRoofShortPermitNote()
      : permit.calculationNote?.trim() || null;
    return {
      kind: "zero",
      permitRequired: permit.permitRequired,
      caveat,
      extraNotes,
      sourceName: permit.sourceName || null,
      retrievedDate: permit.retrievedDate || null,
      calculationNote,
      job,
      city: label,
    };
  }

  const low = permit.feeLowUsd;
  const high = permit.feeHighUsd;
  const showRange =
    (low != null || high != null) && !(low === fee && high === fee);
  const austinKitchen = austinKitchenPageCopy(city, permit);
  const austinDeck = austinDeckPageCopy(city, permit);
  return {
    kind: "known",
    typicalUsd: fee,
    lowUsd: low,
    highUsd: high,
    rangeLabel: showRange ? usdRange(low, high) : null,
    typicalLabel: austinKitchen?.typicalExact ?? austinDeck?.typicalExact ?? null,
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
    const austinRequired = austinRoofPageCopy(city, permit);
    if (charlotteRoofStatuteExempt(permit)) {
      requiredAnswer +=
        " A like-for-like single-family reroof at or under $40,000 does not require a building permit under N.C.G.S. 160D-1110(c)(5).";
    } else if (austinRequired) {
      requiredAnswer += " " + austinRequired.requiredClause;
    } else if (caveatFirst) requiredAnswer += " " + caveatFirst;
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
    const denverRequired = permit ? denverHvacPageCopy(city, permit) : null;
    const denverRoofRequired = permit ? denverRoofPageCopy(city, permit) : null;
    const austinHvacRequired = permit ? austinHvacPageCopy(city, permit) : null;
    const austinKitchenRequired = permit ? austinKitchenPageCopy(city, permit) : null;
    const austinDeckRequired = permit ? austinDeckPageCopy(city, permit) : null;
    const phoenixRoofRequired = permit ? phoenixRoofPageCopy(city, permit) : null;
    const phoenixHvacRequired = permit ? phoenixHvacPageCopy(city, permit) : null;
    const phoenixKitchenRequired = permit ? phoenixKitchenPageCopy(city, permit) : null;
    if (fee != null && fee > 0 && austinKitchenRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + austinKitchenRequired.typicalExact + ".",
      );
    } else if (fee != null && fee > 0 && austinDeckRequired) {
      requiredAnswer = requiredAnswer.replace(
        " The typical recorded fee is " + usd(fee) + ".",
        " The typical recorded fee is " + austinDeckRequired.typicalExact + ".",
      );
    }
    if (denverRequired) requiredAnswer += " " + denverRequired.requiredClause;
    else if (denverRoofRequired) requiredAnswer += " " + denverRoofRequired.requiredClause;
    else if (austinHvacRequired) requiredAnswer += " " + austinHvacRequired.requiredClause;
    else if (austinKitchenRequired) requiredAnswer += " " + austinKitchenRequired.requiredClause;
    else if (austinDeckRequired) requiredAnswer += " " + austinDeckRequired.requiredClause;
    else if (phoenixRoofRequired) requiredAnswer += " " + phoenixRoofRequired.requiredClause;
    else if (phoenixHvacRequired) requiredAnswer += " " + phoenixHvacRequired.requiredClause;
    else if (phoenixKitchenRequired) requiredAnswer += " " + phoenixKitchenRequired.requiredClause;
    else if (caveatFirst) requiredAnswer += " " + caveatFirst;
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
  const denverIncluded = permit ? denverHvacPageCopy(city, permit) : null;
  const denverRoofIncluded = permit ? denverRoofPageCopy(city, permit) : null;
  const austinHvacIncluded = permit ? austinHvacPageCopy(city, permit) : null;
  const austinKitchenIncluded = permit ? austinKitchenPageCopy(city, permit) : null;
  const austinDeckIncluded = permit ? austinDeckPageCopy(city, permit) : null;
  const phoenixRoofIncluded = permit ? phoenixRoofPageCopy(city, permit) : null;
  const phoenixHvacIncluded = permit ? phoenixHvacPageCopy(city, permit) : null;
  const phoenixKitchenIncluded = permit ? phoenixKitchenPageCopy(city, permit) : null;
  if (fee != null && fee > 0) {
    const shownFee = austinKitchenIncluded
      ? austinKitchenIncluded.typicalExact
      : austinDeckIncluded
        ? austinDeckIncluded.typicalExact
        : usd(fee);
    included +=
      " The recorded typical permit fee of " +
      shownFee +
      " is included in the all-in typical.";
    if (denverIncluded) included += " " + denverIncluded.includedClause;
    else if (denverRoofIncluded) included += " " + denverRoofIncluded.includedClause;
    else if (austinHvacIncluded) included += " " + austinHvacIncluded.includedClause;
    else if (austinKitchenIncluded) included += " " + austinKitchenIncluded.includedClause;
    else if (austinDeckIncluded) included += " " + austinDeckIncluded.includedClause;
    else if (phoenixRoofIncluded) included += " " + phoenixRoofIncluded.includedClause;
    else if (phoenixHvacIncluded) included += " " + phoenixHvacIncluded.includedClause;
    else if (phoenixKitchenIncluded) included += " " + phoenixKitchenIncluded.includedClause;
  } else if (fee === 0) {
    included +=
      " The permit line is $0 on the typical path, so all-in is the job cost.";
    const austinIncluded = permit ? austinRoofPageCopy(city, permit) : null;
    if (austinIncluded) included += " " + austinIncluded.includedClause;
  } else {
    included +=
      " The permit line is blank, so the all-in figure is job cost only — we do not guess a city fee.";
  }

  const denverDiffer = permit ? denverHvacPageCopy(city, permit) : null;
  const denverRoofDiffer = permit ? denverRoofPageCopy(city, permit) : null;
  const austinHvacDiffer = permit ? austinHvacPageCopy(city, permit) : null;
  const austinKitchenDiffer = permit ? austinKitchenPageCopy(city, permit) : null;
  const austinDeckDiffer = permit ? austinDeckPageCopy(city, permit) : null;
  const phoenixRoofDiffer = permit ? phoenixRoofPageCopy(city, permit) : null;
  const phoenixHvacDiffer = permit ? phoenixHvacPageCopy(city, permit) : null;
  const phoenixKitchenDiffer = permit ? phoenixKitchenPageCopy(city, permit) : null;
  let differ: string;
  if (fee != null && fee > 0 && denverDiffer) {
    differ = denverDiffer.differ;
  } else if (fee != null && fee > 0 && denverRoofDiffer) {
    differ = denverRoofDiffer.differ;
  } else if (fee != null && fee > 0 && austinHvacDiffer) {
    differ = austinHvacDiffer.differ;
  } else if (fee != null && fee > 0 && austinKitchenDiffer) {
    differ = austinKitchenDiffer.differ;
  } else if (fee != null && fee > 0 && austinDeckDiffer) {
    differ = austinDeckDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixRoofDiffer) {
    differ = phoenixRoofDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixHvacDiffer) {
    differ = phoenixHvacDiffer.differ;
  } else if (fee != null && fee > 0 && phoenixKitchenDiffer) {
    differ = phoenixKitchenDiffer.differ;
  } else if (fee != null && fee > 0) {
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
    const austinDiffer = permit ? austinRoofPageCopy(city, permit) : null;
    if (charlotteRoofStatuteExempt(permit)) {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0 because a like-for-like single-family reroof at or under $40,000 is exempt under N.C.G.S. 160D-1110(c)(5). If the exemption does not apply, the recorded alternate is the LUESA Section II.A path in the calculation note on this page, and it is not folded into the typical $0. We do not invent a fee beyond that note, including for a job over $40,000.";
    } else if (austinDiffer) {
      differ = austinDiffer.differ;
    } else {
      differ =
        "The typical path in " +
        label +
        " is recorded as $0.";
      if (caveatFirst) differ += " " + caveatFirst;
      differ +=
        " If your job is outside that exemption, the city may charge a different published line — we do not invent that dollar here.";
    }
  } else {
    differ =
      "We have not extracted a typical dollar from the official " +
      label +
      " schedule, so we do not show a fee.";
    if (caveatFirst) differ += " " + caveatFirst;
    else if (calcFirst) differ += " " + calcFirst;
    differ += " Confirm the current line with " + dept + ".";
  }

  const howMuch = moneyPageHowMuchFaq(city, project, permit);

  const items: FaqItem[] = [
    {
      question: howMuch.question,
      answer: asSentence(howMuch.answer),
    },
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

  const denverSplit = denverHvacPageCopy(city, permit);
  if (denverSplit) {
    push(
      "How does the recorded Denver HVAC permit fee split between the mechanical permit, plan review, and a technology fee?",
      denverSplit.splitFaq,
    );
  }

  const austinKitchen = austinKitchenPageCopy(city, permit);
  if (austinKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "Why are low and high permit fees blank for " + job + " in " + label + "?",
      austinKitchen.omittedBandsFaq,
    );
    push(
      "Is the Express kitchen-remodel inspection included in the typical permit fee in " + label + "?",
      austinKitchen.expressFaq,
    );
    return extra.slice(0, 3);
  }

  const austinDeck = austinDeckPageCopy(city, permit);
  if (austinDeck) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinDeck.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "Is the electric fee included in the typical permit fee for " + job + " in " + label + "?",
      austinDeck.electricFaq,
    );
    push(
      "Why does the work-exempt path not apply to a typical " + job + " in " + label + "?",
      austinDeck.exemptFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixRoof = phoenixRoofPageCopy(city, permit);
  if (phoenixRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixRoof.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixHvac = phoenixHvacPageCopy(city, permit);
  if (phoenixHvac) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixHvac.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixHvac.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const phoenixKitchen = phoenixKitchenPageCopy(city, permit);
  if (phoenixKitchen) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      phoenixKitchen.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      phoenixKitchen.valuationFaq,
    );
    return extra.slice(0, 3);
  }

  const austinRoof = austinRoofPageCopy(city, permit);
  if (austinRoof) {
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      austinRoof.howCalculated,
      "We do not invent fees beyond the recorded note.",
    );
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      austinRoof.valuationFaq,
    );
    push(
      "Why is the typical permit fee $0 for " + job + " in " + label + "?",
      austinRoof.exemptionFaq,
      "We do not invent an alternate fee beyond the recorded Express and Fire lines.",
    );
    return extra.slice(0, 3);
  }

  const calcNote = (permit.calculationNote || "").trim();
  if (calcNote) {
    // Full recorded note (incl. low/high bands) — not only the first sentence.
    push(
      "How is the typical permit fee calculated for " + job + " in " + label + "?",
      calcNote,
      "We do not invent fees beyond the recorded note.",
    );
  }

  const valuation = recordedValuationAnswer(permit);
  if (valuation) {
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      valuation,
    );
  } else if (project.projectSlug === "roof-replacement" && isPublishedMinimumFloor(permit)) {
    push(
      "What project value is this " + job + " permit fee based on in " + label + "?",
      publishedMinimumValuationAnswer(permit, shortDeptName(city)),
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
      charlotteRoofStatuteExempt(permit)
        ? "The recorded typical path is $0 under N.C.G.S. 160D-1110(c)(5) for a like-for-like single-family reroof at or under $40,000. NC OSFM guidance (10/19/2023) reads that exemption as roofing replacement plus up to 15% of the existing roof deck."
        : firstMatchingSnippet(permit, /\bexempt/i, ["calc", "caveat", "extras"]) ||
            firstSentence(permit.caveat || ""),
      charlotteRoofStatuteExempt(permit)
        ? "The recorded alternate if the exemption does not apply is the LUESA Section II.A path in the calculation note, and it is not part of the typical $0."
        : "We do not invent an alternate fee if the exemption does not apply.",
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

  return extra.slice(0, denverSplit ? 4 : 3);
}
