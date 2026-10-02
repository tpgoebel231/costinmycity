import { cityLabel } from "@/lib/data-client";
import { usd, usdRange } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { charlotteHvacPageCopy, charlotteKitchenPageCopy, nashvilleDeckPageCopy, nashvilleRoofPageCopy, raleighHvacPageCopy, raleighKitchenPageCopy, seattleDeckPageCopy, seattleKitchenPageCopy, seattleRoofPageCopy } from "@/lib/why-costs-differ";
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

/** Tucson roof, Tucson HVAC, Tucson kitchen, Tucson deck, Portland roof, Portland kitchen, and Portland deck keep recorded cents. Other rows stay on rounded usd(). */
function moneyExact(n: number): string {
  const cents = Math.round(n * 100);
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (cents < 0 ? "-$" : "$") + body;
}

function sameMoney(n: number | null | undefined, expected: number): boolean {
  return typeof n === "number" && Math.round(n * 100) === Math.round(expected * 100);
}

function recordedFeeLabel(permit: Permit, n: number): string {
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeTypicalUsd, 337.49) &&
    sameMoney(permit.feeHighUsd, 566.99)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 168.54) &&
    sameMoney(permit.feeTypicalUsd, 218.54) &&
    sameMoney(permit.feeHighUsd, 218.54)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(permit.feeLowUsd, 406.34) &&
    sameMoney(permit.feeTypicalUsd, 804.14) &&
    sameMoney(permit.feeHighUsd, 1297.59)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "deck" &&
    sameMoney(permit.feeLowUsd, 245.69) &&
    sameMoney(permit.feeTypicalUsd, 337.49) &&
    sameMoney(permit.feeHighUsd, 521.09)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeTypicalUsd, 102.69) &&
    sameMoney(permit.feeHighUsd, 155.22)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(permit.feeLowUsd, 118.45) &&
    sameMoney(permit.feeTypicalUsd, 210.07) &&
    sameMoney(permit.feeHighUsd, 334.22)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "deck" &&
    sameMoney(permit.feeLowUsd, 81.68) &&
    sameMoney(permit.feeTypicalUsd, 102.69) &&
    sameMoney(permit.feeHighUsd, 144.72)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "raleigh-nc" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(permit.feeLowUsd, 496) &&
    sameMoney(permit.feeTypicalUsd, 496) &&
    sameMoney(permit.feeHighUsd, 547.25)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "houston-tx" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 180.56) &&
    sameMoney(permit.feeTypicalUsd, 230.56) &&
    sameMoney(permit.feeHighUsd, 400.56)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "dallas-tx" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 196) &&
    sameMoney(permit.feeTypicalUsd, 196) &&
    sameMoney(permit.feeHighUsd, 422.42)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "dallas-tx" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 315) &&
    sameMoney(permit.feeTypicalUsd, 315) &&
    sameMoney(permit.feeHighUsd, 345.39)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "minneapolis-mn" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 379.87) &&
    sameMoney(permit.feeTypicalUsd, 517.83) &&
    sameMoney(permit.feeHighUsd, 862.73)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "miami-fl" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 158.8) &&
    sameMoney(permit.feeTypicalUsd, 161.2) &&
    sameMoney(permit.feeHighUsd, 167.2)
  ) {
    return moneyExact(n);
  }
  if (
    permit.citySlug === "miami-fl" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 183) &&
    sameMoney(permit.feeTypicalUsd, 184.5) &&
    sameMoney(permit.feeHighUsd, 198.8)
  ) {
    return moneyExact(n);
  }
  return usd(n);
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
  if (
    city.slug === "memphis-tn" &&
    permit.projectSlug === "deck" &&
    permit.feeLowUsd === 50 &&
    permit.feeTypicalUsd === 50 &&
    permit.feeHighUsd === 50
  ) {
    const label = cityLabel(city);
    const job = shortProjectName(project.projectSlug);
    const answer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      usd(low) +
      " low, " +
      usd(typical) +
      " typical, and " +
      usd(high) +
      " high. Low, typical, and high are the same recorded flat $50. The walk is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (low === high && high === typical) return null;
  if (low === 0 && high === 0 && typical === 0) return null;

  const label = cityLabel(city);
  const job = shortProjectName(project.projectSlug);
  const portlandRoofExact =
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(low, 81.68) &&
    sameMoney(typical, 102.69) &&
    sameMoney(high, 155.22);
  const portlandKitchenExact =
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(low, 118.45) &&
    sameMoney(typical, 210.07) &&
    sameMoney(high, 334.22);
  const portlandDeckExact =
    permit.citySlug === "portland-or" &&
    permit.projectSlug === "deck" &&
    sameMoney(low, 81.68) &&
    sameMoney(typical, 102.69) &&
    sameMoney(high, 144.72);
  const tucsonRoofExact =
    permit.citySlug === "tucson-az" && permit.projectSlug === "roof-replacement";
  const tucsonHvacExact =
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(low, 168.54) &&
    sameMoney(typical, 218.54) &&
    sameMoney(high, 218.54);
  const tucsonKitchenExact =
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(low, 406.34) &&
    sameMoney(typical, 804.14) &&
    sameMoney(high, 1297.59);
  const tucsonDeckExact =
    permit.citySlug === "tucson-az" &&
    permit.projectSlug === "deck" &&
    sameMoney(low, 245.69) &&
    sameMoney(typical, 337.49) &&
    sameMoney(high, 521.09);
  const raleighKitchenExact =
    permit.citySlug === "raleigh-nc" &&
    permit.projectSlug === "kitchen-remodel" &&
    sameMoney(low, 496) &&
    sameMoney(typical, 496) &&
    sameMoney(high, 547.25);
  const houstonHvacExact =
    permit.citySlug === "houston-tx" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(low, 180.56) &&
    sameMoney(typical, 230.56) &&
    sameMoney(high, 400.56);
  const dallasRoofExact =
    permit.citySlug === "dallas-tx" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(low, 196) &&
    sameMoney(typical, 196) &&
    sameMoney(high, 422.42);
  const dallasHvacExact =
    permit.citySlug === "dallas-tx" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(low, 315) &&
    sameMoney(typical, 315) &&
    sameMoney(high, 345.39);
  const minneapolisRoofExact =
    permit.citySlug === "minneapolis-mn" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(low, 379.87) &&
    sameMoney(typical, 517.83) &&
    sameMoney(high, 862.73);
  const miamiRoofExact =
    permit.citySlug === "miami-fl" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(low, 158.8) &&
    sameMoney(typical, 161.2) &&
    sameMoney(high, 167.2);
  const miamiHvacExact =
    permit.citySlug === "miami-fl" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(low, 183) &&
    sameMoney(typical, 184.5) &&
    sameMoney(high, 198.8);
  let answer =
    "Recorded permit fees for " +
    job +
    " in " +
    label +
    " span " +
    (portlandRoofExact ||
    portlandKitchenExact ||
    portlandDeckExact ||
    tucsonRoofExact ||
    tucsonHvacExact ||
    tucsonKitchenExact ||
    tucsonDeckExact ||
    raleighKitchenExact ||
    houstonHvacExact
      ? recordedFeeLabel(permit, low) + " – " + recordedFeeLabel(permit, high)
      : usdRange(low, high)) +
    ", with a typical of " +
    recordedFeeLabel(permit, typical) +
    ".";
  if (portlandRoofExact || portlandKitchenExact || portlandDeckExact || tucsonKitchenExact || tucsonDeckExact) {
    answer += " Band arithmetic is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (charlotteHvacPageCopy(city, permit)) {
    answer += " Low, high, and the alternate non-TIP path are in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (charlotteKitchenPageCopy(city, permit)) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. These are the LUESA Section II.A Note a trade bands. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (seattleRoofPageCopy(city, permit)) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. These are the Tables D-1 and D-2 STFI fee bands. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (seattleDeckPageCopy(city, permit)) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. These are the Tables D-1 and D-2 full plan-review fee bands. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (seattleKitchenPageCopy(city, permit)) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. These are the Tables D-1 and D-2 full plan-review fee bands. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (raleighHvacPageCopy(city, permit)) {
    answer += " Low is one mechanical trade and high adds the recorded electrical trade.";
    answer += " Full arithmetic is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (raleighKitchenPageCopy(city, permit)) {
    answer += " Low and typical sit on the recorded $124 floor; the high band is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (nashvilleDeckPageCopy(city, permit)) {
    answer += " Low and high bands and the plan-review exemption are in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (nashvilleRoofPageCopy(city, permit)) {
    answer += " Low and high bands and the plan-review exemption are in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (
    city.slug === "memphis-tn" &&
    permit.projectSlug === "hvac-replacement" &&
    permit.feeLowUsd === 43 &&
    permit.feeTypicalUsd === 51 &&
    permit.feeHighUsd === 67
  ) {
    answer += " Low, typical, and high tonnage arithmetic is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (
    city.slug === "memphis-tn" &&
    permit.projectSlug === "kitchen-remodel" &&
    permit.feeLowUsd === 75 &&
    permit.feeTypicalUsd === 175 &&
    permit.feeHighUsd === 325
  ) {
    answer += " Low, typical, and high valuation arithmetic is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (
    city.slug === "denver-co" &&
    permit.projectSlug === "deck" &&
    sameMoney(low, 124.5) &&
    sameMoney(typical, 172.5) &&
    sameMoney(high, 268.5)
  ) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Low, typical, and high are the ADMIN 138 building permit plus 50% plan review. The walk is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (houstonHvacExact) {
    answer += " Low, typical, and high valuation arithmetic is in the calculation note on this page.";
    answer += " We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(answer),
    };
  }
  if (dallasRoofExact) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Low and typical are the Table B-II master plus the technology fee. The high bound is the Table B-I standalone path. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (dallasHvacExact) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Low and typical use the Table B-I minimum of $175 plus the $125 additional inspection and the $15 technology fee. The high bound is the valuation line above that minimum. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (minneapolisRoofExact) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Each band is the $2,001–$25,000 building-permit line plus 65% plan review plus the 0.0005 Minnesota state surcharge. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (miamiRoofExact) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Each band is max($110, 0.50% of valuation) plus the $40 application fee plus $0 solid waste (roofing exempt) plus the state minimums plus Miami-Dade §8-12(e) at $0.60 per $1,000. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
  if (miamiHvacExact) {
    const exactAnswer =
      "Recorded permit fees for " +
      job +
      " in " +
      label +
      " are " +
      moneyExact(low) +
      " low, " +
      moneyExact(typical) +
      " typical, and " +
      moneyExact(high) +
      " high. Each band is max($110, 0.50% of valuation) plus the $40 application fee plus solid waste ($0.22 per $100, minimum $26) plus the F.S. surcharge minimums plus Miami-Dade §8-12(e) at $0.60 per $1,000. Full arithmetic is in the calculation note on this page. We do not invent dollars outside the recorded row.";
    return {
      question: "Why does the " + job + " permit fee in " + label + " show a low-to-high range?",
      answer: asSentence(exactAnswer),
    };
  }
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
  const houstonHvacExact =
    permit.citySlug === "houston-tx" &&
    permit.projectSlug === "hvac-replacement" &&
    sameMoney(permit.feeLowUsd, 180.56) &&
    sameMoney(permit.feeTypicalUsd, 230.56) &&
    sameMoney(permit.feeHighUsd, 400.56);
  const dallasRoofExact =
    permit.citySlug === "dallas-tx" &&
    permit.projectSlug === "roof-replacement" &&
    sameMoney(permit.feeLowUsd, 196) &&
    sameMoney(permit.feeTypicalUsd, 196) &&
    sameMoney(permit.feeHighUsd, 422.42);
  const bits = extras.slice(0, 3).map((e) => {
    const fee = extraFeeUsd(e)!;
    const note = firstUsefulNote(e);
    const feeText = houstonHvacExact || dallasRoofExact ? moneyExact(fee) : usd(fee);
    return (e.name || "").trim() + ": " + feeText + (note ? " (" + note + ")" : "");
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
