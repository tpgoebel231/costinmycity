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
  ];

  return items.map((item) => ({
    question: keepHvac(item.question),
    answer: keepHvac(item.answer),
  }));
}
