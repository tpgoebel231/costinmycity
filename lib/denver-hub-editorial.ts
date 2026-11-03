import { getLaunchProjectSlugs, getPermit, getProjectCost, getProjectCostsFile } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { formatDate, usd } from "@/lib/format";
import { laborMaterialsSplit } from "@/lib/labor-materials-split";
import { stateAnchorSlug } from "@/lib/permits-index";
import { inlineProjectName, shortProjectName } from "@/lib/projects";
import { recordedHubPermitFeeLabel, recordedQuickPermitPathNote } from "@/lib/sourcing";
import { statePermitPeers } from "@/lib/state-permits";
import type { City, Permit, ProjectCost } from "@/lib/types";
import { wageHourlyLabel, wageIndexCalloutForCity } from "@/lib/wage-index";

const SLUG = "denver-co";

export type DenverGuideJob = {
  slug: string;
  inlineName: string;
  shortName: string;
  href: string;
  /** All-in typical matching the Projects card (job + rounded permit). */
  allInTypicalNum: number;
  allInTypical: string;
  permitLabel: string;
  /** When the all-in uses a rounded permit (e.g. deck $173 from $172.50). */
  permitRounded: string | null;
};

export type DenverGuideCitation = {
  lead: string;
  name: string;
  url: string;
  tail: string;
};

export type DenverGuideModel = {
  heading: string;
  most: { href: string; inlineName: string; article: string };
  least: { href: string; inlineName: string; article: string };
  jobs: DenverGuideJob[];
  feeParagraph: string;
  exemption: { sentence: string; name: string; url: string; dateLabel: string } | null;
  wage: {
    metro: string;
    mean: string;
    vintage: string;
    metroUrl: string;
    nationalMean: string;
    nationalUrl: string;
    metroLinkLabel: string;
    nationalLinkLabel: string;
  } | null;
  laborSentence: string | null;
  multiplierSentence: string | null;
  citations: DenverGuideCitation[];
  feeScheduleYear: string | null;
  projectSources: { name: string; url: string }[];
  projectRetrievedLabel: string | null;
  permitHref: string;
  peers: { href: string; label: string }[];
  stateHref: string;
  stateLinkLabel: string;
};

function plain(text: string): string | null {
  const cleaned = text
    .replace(/\u2014/g, ";")
    .replace(/\u2013/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  if (/[\u2013\u2014]/.test(cleaned)) return null;
  if (/\b(?:recorded|feeModel|permitRequired|laborShare|null|undefined|NaN)\b/.test(cleaned)) return null;
  return cleaned;
}

function articleFor(name: string): string {
  if (/^hvac\b/i.test(name) || /^[aeiou]/i.test(name)) return "an";
  return "a";
}

function humanJoin(items: string[]): string {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return items[0] + " and " + items[1];
  return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
}

function sentenceMatching(notes: string, pattern: RegExp): string | null {
  const parts = notes.split(/(?<=\.)\s+/);
  for (const part of parts) {
    if (!pattern.test(part)) continue;
    return plain(part);
  }
  return null;
}

function partLabel(name: string): string {
  const n = name.toLowerCase();
  if (/plan review/.test(n)) return "plan review";
  if (/building permit/.test(n)) return "building permit";
  if (/mechanical/.test(n)) return "mechanical permit";
  if (/electrical/.test(n)) return "electrical permit";
  if (/zoning|landmark/.test(n)) return "zoning or landmark review";
  if (/trade/.test(n)) return "trade permits";
  return name.replace(/\s+/g, " ").trim();
}

function valuationLabel(permit: Permit): string | null {
  const assumed = permit.assumedValuationUsd?.typical;
  if (typeof assumed === "number") return usd(assumed);
  if (typeof permit.typicalProjectValueUsd === "number") return usd(permit.typicalProjectValueUsd);
  return null;
}

function shareNoun(slug: string): string {
  if (slug === "roof-replacement") return "a roof";
  if (slug === "hvac-replacement") return "HVAC";
  if (slug === "deck") return "a deck";
  if (slug === "kitchen-remodel") return "a kitchen";
  return slug;
}

type BuiltJob = DenverGuideJob & {
  sourceName: string;
  sourceUrl: string;
  retrievedDate: string;
  dateLabel: string;
  quickPermit: boolean;
  notQuickPermit: boolean;
  likeForLike: boolean;
  valuation: string | null;
  permitHigh: string | null;
  planIncluded: boolean;
  planOmitted: boolean;
  highIncludesPlanReview: boolean;
  included: { amount: string; label: string }[];
  excludedLabels: string[];
  laborPct: string | null;
  multiplier: string | null;
};

function buildJob(city: City, slug: string): BuiltJob | null {
  const project = getProjectCost(slug);
  const permit = getPermit(city.slug, slug);
  if (!project || !permit) return null;
  const est = buildEstimate(project, city, permit);
  const permitLabel = plain(recordedHubPermitFeeLabel(permit));
  if (!permitLabel) return null;
  const rounded = est.permitTypical != null ? usd(est.permitTypical) : null;
  const blob = [
    permit.caveat || "",
    ...(permit.extras || []).map((extra) => (extra.name || "") + " " + (extra.note || "")),
  ].join(" ");
  const included: { amount: string; label: string }[] = [];
  const excludedLabels: string[] = [];
  let planIncluded = false;
  let planOmitted = false;
  let highIncludesPlanReview = false;
  for (const extra of permit.extras || []) {
    const label = partLabel(extra.name || "fee");
    const isPlan = /plan review/i.test(extra.name || "");
    if (typeof extra.feeUsd === "number") {
      included.push({ amount: usd(extra.feeUsd), label });
      if (isPlan) planIncluded = true;
    } else if (isPlan) {
      planOmitted = true;
      if (/high includes/i.test(extra.note || "")) highIncludesPlanReview = true;
    } else {
      excludedLabels.push(label);
    }
  }
  const split = laborMaterialsSplit(project, city);
  const mult = project.cityAdjustments?.[city.slug]?.multiplier;
  const dateLabel = plain(formatDate(permit.retrievedDate)) || permit.retrievedDate;
  return {
    slug,
    inlineName: inlineProjectName(slug),
    shortName: shortProjectName(slug),
    href: "/cost/" + slug + "/" + city.slug + "/",
    allInTypicalNum: est.allInTypical,
    allInTypical: usd(est.allInTypical),
    permitLabel,
    permitRounded: rounded && rounded !== permitLabel ? rounded : null,
    sourceName: permit.sourceName,
    sourceUrl: permit.sourceUrl,
    retrievedDate: permit.retrievedDate,
    dateLabel,
    quickPermit: recordedQuickPermitPathNote(permit) != null,
    notQuickPermit: /not a Quick Permit/i.test(blob),
    likeForLike: /like-for-like/i.test(blob),
    valuation: valuationLabel(permit),
    permitHigh: typeof permit.feeHighUsd === "number" ? usd(permit.feeHighUsd) : null,
    planIncluded,
    planOmitted,
    highIncludesPlanReview,
    included,
    excludedLabels,
    laborPct: split?.laborPctLabel ?? null,
    multiplier: typeof mult === "number" ? String(mult) : null,
  };
}

function includedAmount(job: BuiltJob, label: string): string | null {
  const hit = job.included.find((part) => part.label === label);
  return hit ? hit.amount : null;
}

function feeSentences(dept: string, admin: string | null, plan: string | null, quick: string | null, jobs: BuiltJob[]): string {
  const bits: string[] = [];
  const table = admin ? "the " + admin + " valuation table" : "a valuation table";
  bits.push(dept + " prices these on " + table + ".");
  if (plan) bits.push(plan);
  if (quick) bits.push(quick);

  const roof = jobs.find((job) => job.slug === "roof-replacement");
  const hvac = jobs.find((job) => job.slug === "hvac-replacement");
  const deck = jobs.find((job) => job.slug === "deck");
  const kitchen = jobs.find((job) => job.slug === "kitchen-remodel");

  if (roof?.quickPermit && roof.planOmitted && roof.valuation && includedAmount(roof, "building permit")) {
    bits.push(
      "The roof uses that path, so the " +
        roof.permitLabel +
        " typical is the building permit alone at a " +
        roof.valuation +
        " assumed valuation.",
    );
  }

  if (hvac?.quickPermit && hvac.likeForLike && hvac.planOmitted && hvac.valuation && includedAmount(hvac, "mechanical permit")) {
    bits.push(
      "HVAC is a Quick Permit for a like-for-like change-out, so the " +
        hvac.permitLabel +
        " typical is the mechanical permit at a " +
        hvac.valuation +
        " assumed valuation, and plan review is not in that typical.",
    );
    if (hvac.highIncludesPlanReview && hvac.permitHigh) {
      bits.push(
        "The high HVAC fee is " + hvac.permitHigh + ", which is the band that includes plan review.",
      );
    }
    if (hvac.excludedLabels.includes("electrical permit")) {
      bits.push("A separate electrical permit is not included in that figure.");
    }
  }

  const deckBuilding = deck ? includedAmount(deck, "building permit") : null;
  const deckPlan = deck ? includedAmount(deck, "plan review") : null;
  if (deck?.notQuickPermit && deck.valuation && deckBuilding && deckPlan) {
    const zoning = deck.excludedLabels.find((label) => /zoning or landmark/.test(label));
    bits.push(
      "A deck is not a Quick Permit. Its " +
        deck.permitLabel +
        " typical is a " +
        deckBuilding +
        " building permit plus " +
        deckPlan +
        " plan review at a " +
        deck.valuation +
        " assumed valuation" +
        (zoning ? ", and " + zoning + " is left out." : "."),
    );
  }

  const kitchenBuilding = kitchen ? includedAmount(kitchen, "building permit") : null;
  const kitchenPlan = kitchen ? includedAmount(kitchen, "plan review") : null;
  if (kitchen?.notQuickPermit && kitchen.valuation && kitchenBuilding && kitchenPlan) {
    const trades = kitchen.excludedLabels.find((label) => /trade/.test(label));
    bits.push(
      "A kitchen is not a Quick Permit either. Its " +
        kitchen.permitLabel +
        " typical is a " +
        kitchenBuilding +
        " building permit plus " +
        kitchenPlan +
        " plan review at a " +
        kitchen.valuation +
        " assumed valuation" +
        (trades ? ", and " + trades + " are left out." : "."),
    );
  }

  return bits.join(" ");
}

function citeLead(slugs: string[], names: string[]): string {
  const key = slugs.join(",");
  if (key === "roof-replacement") return "The roof fee is cited to ";
  if (key === "hvac-replacement,deck,kitchen-remodel") return "HVAC, the deck, and the kitchen are cited to ";
  if (names.length > 1) return humanJoin(names) + " are cited to ";
  const name = names[0] || "This fee";
  return name.charAt(0).toUpperCase() + name.slice(1) + " is cited to ";
}

function projectSourceList(projects: ProjectCost[]): { name: string; url: string; dateLabel: string | null }[] {
  const out: { name: string; url: string; dateLabel: string | null }[] = [];
  const seen = new Set<string>();
  for (const project of projects) {
    for (const source of project.sources || []) {
      const name = plain(source.name || "");
      const url = (source.url || "").trim();
      if (!name || !url || seen.has(url)) continue;
      seen.add(url);
      const dateLabel = source.retrievedDate ? plain(formatDate(source.retrievedDate)) : null;
      out.push({ name, url, dateLabel });
    }
  }
  return out;
}

/**
 * Editorial model for the Denver hub only. Returns null for every other city.
 * Dollars use usd() and recordedHubPermitFeeLabel, the same formatters as the hub.
 */
export function denverHubEditorial(city: City): DenverGuideModel | null {
  if (city.slug !== SLUG) return null;
  const notes = city.notes || "";
  const dept = plain(city.permitDeptName);
  if (!dept) return null;
  const admin = notes.match(/ADMIN\s+\d+/)?.[0] || null;
  const planSentence = sentenceMatching(notes, /plan review is/i);
  const quickSentence = sentenceMatching(notes, /quick permit/i);

  const slugs = getLaunchProjectSlugs();
  const built: BuiltJob[] = [];
  const projects: ProjectCost[] = [];
  for (const slug of slugs) {
    const job = buildJob(city, slug);
    const project = getProjectCost(slug);
    if (!job || !project) return null;
    built.push(job);
    projects.push(project);
  }
  if (built.length < 4) return null;

  const ranked = built.slice().sort((a, b) => b.allInTypicalNum - a.allInTypicalNum);
  const most = ranked[0];
  const least = ranked[ranked.length - 1];
  if (!most || !least || most.allInTypicalNum === least.allInTypicalNum) return null;

  const wageCallout = wageIndexCalloutForCity(city);
  const national = getProjectCostsFile()?.nationalWageIndex;
  const adjustments = projects.map((project) => project.cityAdjustments?.[city.slug]);
  const means = new Set(adjustments.map((adj) => adj?.blsConstructionMeanHourlyUsd));
  const vintages = new Set(adjustments.map((adj) => (adj?.blsVintage || "").trim()));
  const metros = new Set(adjustments.map((adj) => (adj?.metro || "").trim()));
  const metroUrl = (adjustments[0]?.source || "").trim();
  const nationalUrl = (national?.sourceUrl || "").trim();
  const meanValue = adjustments[0]?.blsConstructionMeanHourlyUsd;
  const nationalMean = national?.nationalMeanHourlyUsd;
  let wage: DenverGuideModel["wage"] = null;
  if (
    wageCallout &&
    means.size === 1 &&
    vintages.size === 1 &&
    metros.size === 1 &&
    typeof meanValue === "number" &&
    typeof nationalMean === "number" &&
    metroUrl &&
    nationalUrl &&
    wageCallout.vintageLabel
  ) {
    const metro = plain(adjustments[0]?.metro || "");
    const vintage = plain(wageCallout.vintageLabel);
    if (metro && vintage) {
      wage = {
        metro,
        mean: wageHourlyLabel(meanValue),
        vintage,
        metroUrl,
        nationalMean: wageHourlyLabel(nationalMean),
        nationalUrl,
        metroLinkLabel: wageCallout.sourceLinkLabel,
        nationalLinkLabel: wageCallout.nationalSourceLinkLabel,
      };
    }
  }

  const laborBits = built.filter((job) => job.laborPct).map((job) => job.laborPct + " on " + shareNoun(job.slug));
  const multBits = built
    .filter((job) => job.multiplier)
    .map((job) => job.multiplier + " for " + shareNoun(job.slug));
  const laborSentence = laborBits.length === built.length ? humanJoin(laborBits) : null;
  const multiplierSentence = multBits.length === built.length ? humanJoin(multBits) : null;

  const groups: { slugs: string[]; names: string[]; name: string; url: string; date: string; dateLabel: string }[] = [];
  for (const job of built) {
    const sourceName = plain(job.sourceName);
    const sourceUrl = job.sourceUrl.trim();
    if (!sourceName || !sourceUrl) continue;
    const found = groups.find(
      (group) => group.name === sourceName && group.url === sourceUrl && group.date === job.retrievedDate,
    );
    if (found) {
      found.slugs.push(job.slug);
      found.names.push(job.inlineName);
    } else {
      groups.push({
        slugs: [job.slug],
        names: [job.inlineName],
        name: sourceName,
        url: sourceUrl,
        date: job.retrievedDate,
        dateLabel: job.dateLabel,
      });
    }
  }
  const citations: DenverGuideCitation[] = groups.map((group, index) => {
    const previous = index > 0 ? groups[index - 1] : null;
    const tail =
      previous && previous.date === group.date
        ? ", retrieved the same day."
        : ", retrieved " + group.dateLabel + ".";
    return {
      lead: citeLead(group.slugs, group.names),
      name: group.name,
      url: group.url,
      tail,
    };
  });

  const sources = projectSourceList(projects);
  const sourceDates = sources.map((source) => source.dateLabel).filter((label): label is string => Boolean(label));
  const projectRetrievedLabel = sourceDates.length && sourceDates.every((label) => label === sourceDates[0]) ? sourceDates[0] : null;

  const kitchenPermit = getPermit(city.slug, "kitchen-remodel");
  const exemptionSource = kitchenPermit?.exemptionSource;
  let exemption: DenverGuideModel["exemption"] = null;
  if (exemptionSource?.what && exemptionSource.name && exemptionSource.url && exemptionSource.retrievedDate) {
    const first = exemptionSource.what.split(/(?<=\.)\s+/)[0] || "";
    const sentence = plain(first);
    const name = plain(exemptionSource.name);
    const dateLabel = plain(formatDate(exemptionSource.retrievedDate));
    if (sentence && name && dateLabel) {
      exemption = { sentence, name, url: exemptionSource.url, dateLabel };
    }
  }

  const peers = statePermitPeers(city).map((peer) => ({
    href: "/permits/" + peer.slug + "/",
    label: peer.name,
  }));

  return {
    heading: "How to read Denver's numbers",
    most: { href: most.href, inlineName: most.inlineName, article: articleFor(most.inlineName) },
    least: { href: least.href, inlineName: least.inlineName, article: articleFor(least.inlineName) },
    jobs: ranked.map((job) => ({
      slug: job.slug,
      inlineName: job.inlineName,
      shortName: job.shortName,
      href: job.href,
      allInTypicalNum: job.allInTypicalNum,
      allInTypical: job.allInTypical,
      permitLabel: job.permitLabel,
      permitRounded: job.permitRounded,
    })),
    feeParagraph: feeSentences(dept, admin, planSentence, quickSentence, built),
    exemption,
    wage,
    laborSentence,
    multiplierSentence,
    citations,
    feeScheduleYear: typeof city.feeScheduleYear === "number" ? String(city.feeScheduleYear) : null,
    projectSources: sources.map((source) => ({ name: source.name, url: source.url })),
    projectRetrievedLabel,
    permitHref: "/permits/" + city.slug + "/",
    peers,
    stateHref: "/permits/#state-" + stateAnchorSlug(city.state),
    stateLinkLabel: city.state + " fee table",
  };
}
