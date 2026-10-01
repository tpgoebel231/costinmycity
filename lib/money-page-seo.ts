import { cityLabel } from "@/lib/data-client";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { recordedFeePartsNote, recordedQuickPermitPathNote, shortDeptName } from "@/lib/sourcing";
import {
  austinDeckPageCopy,
  austinHvacPageCopy,
  austinKitchenPageCopy,
  austinRoofPageCopy,
  phoenixDeckPageCopy,
  phoenixHvacPageCopy,
  phoenixKitchenPageCopy,
  phoenixRoofPageCopy,
  portlandDeckPageCopy,
  portlandKitchenPageCopy,
  portlandRoofPageCopy,
  raleighDeckPageCopy,
  raleighHvacPageCopy,
  raleighKitchenPageCopy,
  raleighRoofPageCopy,
  tucsonDeckPageCopy,
  tucsonHvacPageCopy,
  tucsonKitchenPageCopy,
  tucsonRoofPageCopy,
  nashvilleRoofPageCopy,
} from "@/lib/why-costs-differ";
import type { City, Permit, ProjectCost } from "@/lib/types";

/** Lowercase job name for prose; keepHvac restores HVAC casing. */
export function jobProseName(project: ProjectCost): string {
  return keepHvac(shortProjectName(project.projectSlug).toLowerCase());
}

function mentionsExemption(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  const blob = [permit.caveat, permit.calculationNote, ...(permit.extras || []).map((e) => e.note || "")]
    .join(" ");
  return /\bexempt/i.test(blob);
}


/**
 * Short factual permit clause for SERP meta and how-much FAQ.
 * Does not invent fees; $0 / exempt only when the recorded row supports it.
 * Uses shortDeptName when a city is passed (Atlanta Office of Buildings).
 */
export function moneyPagePermitClause(
  permit: Permit | null | undefined,
  city?: City | null,
): {
  fee: number | null;
  /** Trailing sentence or clause about the permit line. */
  sentence: string;
  /** Snappy mid-sentence clause when fee > 0 (for meta). */
  includedMid: string | null;
} {
  const fee = permit?.feeTypicalUsd ?? null;
  const dept = city ? shortDeptName(city) : "local";
  if (fee == null) {
    return {
      fee: null,
      sentence: "Local permit fee not yet recorded.",
      includedMid: null,
    };
  }
  if (fee === 0) {
    const austin = city ? austinRoofPageCopy(city, permit) : null;
    if (austin) {
      return { fee: 0, sentence: austin.metaSentence, includedMid: null };
    }
    let sentence = "The recorded typical path permit fee is $0";
    if (mentionsExemption(permit) || permit?.permitRequired === false) {
      sentence += " (exempt)";
    }
    sentence += ".";
    return { fee: 0, sentence, includedMid: null };
  }
  const austinHvac = city ? austinHvacPageCopy(city, permit) : null;
  if (austinHvac) {
    return {
      fee,
      sentence: austinHvac.permitSentence,
      includedMid: austinHvac.includedMid,
    };
  }
  const austinKitchen = city ? austinKitchenPageCopy(city, permit) : null;
  if (austinKitchen) {
    return {
      fee,
      sentence: austinKitchen.permitSentence,
      includedMid: austinKitchen.includedMid,
    };
  }
  const austinDeck = city ? austinDeckPageCopy(city, permit) : null;
  if (austinDeck) {
    return {
      fee,
      sentence: austinDeck.permitSentence,
      includedMid: austinDeck.includedMid,
    };
  }
  const portlandRoof = city ? portlandRoofPageCopy(city, permit) : null;
  if (portlandRoof) {
    return {
      fee,
      sentence: portlandRoof.permitSentence,
      includedMid: portlandRoof.includedMid,
    };
  }
  const portlandKitchen = city ? portlandKitchenPageCopy(city, permit) : null;
  if (portlandKitchen) {
    return {
      fee,
      sentence: portlandKitchen.permitSentence,
      includedMid: portlandKitchen.includedMid,
    };
  }
  const portlandDeck = city ? portlandDeckPageCopy(city, permit) : null;
  if (portlandDeck) {
    return {
      fee,
      sentence: portlandDeck.permitSentence,
      includedMid: portlandDeck.includedMid,
    };
  }
  const phoenixRoof = city ? phoenixRoofPageCopy(city, permit) : null;
  if (phoenixRoof) {
    return {
      fee,
      sentence: phoenixRoof.permitSentence,
      includedMid: phoenixRoof.includedMid,
    };
  }
  const tucsonRoof = city ? tucsonRoofPageCopy(city, permit) : null;
  if (tucsonRoof) {
    return {
      fee,
      sentence: tucsonRoof.permitSentence,
      includedMid: tucsonRoof.includedMid,
    };
  }
  const tucsonHvac = city ? tucsonHvacPageCopy(city, permit) : null;
  if (tucsonHvac) {
    return {
      fee,
      sentence: tucsonHvac.permitSentence,
      includedMid: tucsonHvac.includedMid,
    };
  }
  const tucsonKitchen = city ? tucsonKitchenPageCopy(city, permit) : null;
  if (tucsonKitchen) {
    return {
      fee,
      sentence: tucsonKitchen.permitSentence,
      includedMid: tucsonKitchen.includedMid,
    };
  }
  const tucsonDeck = city ? tucsonDeckPageCopy(city, permit) : null;
  if (tucsonDeck) {
    return {
      fee,
      sentence: tucsonDeck.permitSentence,
      includedMid: tucsonDeck.includedMid,
    };
  }
  const raleighRoof = city ? raleighRoofPageCopy(city, permit) : null;
  if (raleighRoof) {
    return {
      fee,
      sentence: raleighRoof.permitSentence,
      includedMid: raleighRoof.includedMid,
    };
  }
  const raleighHvac = city ? raleighHvacPageCopy(city, permit) : null;
  if (raleighHvac) {
    return {
      fee,
      sentence: raleighHvac.permitSentence,
      includedMid: raleighHvac.includedMid,
    };
  }
  const raleighKitchen = city ? raleighKitchenPageCopy(city, permit) : null;
  if (raleighKitchen) {
    return {
      fee,
      sentence: raleighKitchen.permitSentence,
      includedMid: raleighKitchen.includedMid,
    };
  }
  const raleighDeck = city ? raleighDeckPageCopy(city, permit) : null;
  if (raleighDeck) {
    return {
      fee,
      sentence: raleighDeck.permitSentence,
      includedMid: raleighDeck.includedMid,
    };
  }
  const nashvilleRoof = city ? nashvilleRoofPageCopy(city, permit) : null;
  if (nashvilleRoof) {
    return {
      fee,
      sentence: nashvilleRoof.permitSentence,
      includedMid: nashvilleRoof.includedMid,
    };
  }
  const phoenixHvac = city ? phoenixHvacPageCopy(city, permit) : null;
  if (phoenixHvac) {
    return {
      fee,
      sentence: phoenixHvac.permitSentence,
      includedMid: phoenixHvac.includedMid,
    };
  }
  const phoenixKitchen = city ? phoenixKitchenPageCopy(city, permit) : null;
  if (phoenixKitchen) {
    return {
      fee,
      sentence: phoenixKitchen.permitSentence,
      includedMid: phoenixKitchen.includedMid,
    };
  }
  const phoenixDeck = city ? phoenixDeckPageCopy(city, permit) : null;
  if (phoenixDeck) {
    return {
      fee,
      sentence: phoenixDeck.permitSentence,
      includedMid: phoenixDeck.includedMid,
    };
  }
  const partsNote = permit ? recordedFeePartsNote(permit) : null;
  const pathNote =
    permit && !partsNote ? recordedQuickPermitPathNote(permit) : null;
  const feeNote = partsNote || pathNote;
  const feeBit = usd(fee) + (feeNote ? " " + feeNote : "");
  // Dept label + dollars (+ recorded floor parts / Quick Permit path) for CTR
  // on fee>0 money URLs (Atlanta roof multi-line floor; Denver roof Quick Permit).
  return {
    fee,
    sentence:
      "The recorded " + dept + " permit fee of " + feeBit + " is included in the all-in.",
    includedMid: "including the recorded " + dept + " permit fee of " + feeBit,
  };
}

export type MoneyPageSeo = {
  /** On-page H1 / money-keyword base without the (~$…) cue. */
  h1: string;
  /** SERP <title> base (before site suffix), with typical-price cue when known. */
  title: string;
  /** Meta + on-page desc string (kept in sync). */
  description: string;
  allInTypical: number;
  jobTypical: number;
};

/**
 * Shared money-page SERP title + description for generateMetadata and page desc.
 * Title keeps "{shortName} cost in {cityLabel}" and appends (~$typical) for CTR.
 * Description leads with the how-much query; never claims a $0 fee is "included".
 */
export function moneyPageSeo(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): MoneyPageSeo {
  const shortName = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const h1 = shortName + " cost in " + label;
  const title = h1 + " (~" + usd(est.allInTypical) + ")";
  const permitBit = moneyPagePermitClause(permit, city);

  let description: string;
  if (permitBit.fee == null) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    description =
      "How much does " +
      job +
      " cost in " +
      label +
      "? Typical all-in is about " +
      usd(est.allInTypical) +
      ", " +
      (permitBit.includedMid || "including the recorded local permit fee") +
      ".";
  }

  return {
    h1: keepHvac(h1),
    title: keepHvac(title),
    description: keepHvac(description),
    allInTypical: est.allInTypical,
    jobTypical: est.job.typical,
  };
}

/** First FAQ Q/A: query-aligned how-much, same permit rules as meta. */
export function moneyPageHowMuchFaq(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): { question: string; answer: string } {
  const label = cityLabel(city);
  const job = jobProseName(project);
  const est = buildEstimate(project, city, permit ?? undefined);
  const permitBit = moneyPagePermitClause(permit, city);

  const question = "How much does " + job + " cost in " + label + "?";
  let answer: string;
  if (permitBit.fee == null) {
    answer =
      "Typical job cost is about " +
      usd(est.job.typical) +
      ". " +
      permitBit.sentence;
  } else if (permitBit.fee === 0) {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  } else {
    answer =
      "Typical all-in is about " +
      usd(est.allInTypical) +
      ". " +
      permitBit.sentence;
  }

  return {
    question: keepHvac(question),
    answer: keepHvac(answer),
  };
}
