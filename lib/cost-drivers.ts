import { cityLabel } from "@/lib/data-client";
import { usd } from "@/lib/format";
import { moneyExact } from "@/lib/sourcing";
import { projectMeta, shortProjectName } from "@/lib/projects";
import { keepHvac } from "@/lib/seo";
import { typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

const DRIVER_JOBS = new Set(["roof-replacement", "kitchen-remodel", "hvac-replacement", "deck"]);

export type CostDriversModel = {
  heading: string;
  included: string[];
  drivers: string[];
};

function asSentence(s: string): string {
  const t = keepHvac(s.trim());
  if (!t) return t;
  return /[.!?]["']?$/.test(t) ? t : t + ".";
}

function firstSentence(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  return asSentence(m ? m[0] : t);
}

function permitFeeKnown(permit: Permit | null | undefined): boolean {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}

function includedBullets(project: ProjectCost): string[] {
  const out: string[] = [];
  const scope = (project.scopeNote || "").trim();
  const unit = (project.unitNote || "").trim();
  if (scope) out.push(firstSentence(scope));
  if (unit && unit !== scope) out.push(firstSentence(unit));
  const spec = typicalJobSpec(project.projectSlug);
  if (spec) {
    out.push(
      asSentence("Typical job is " + spec.typical + " (" + spec.low + " to " + spec.high + ")"),
    );
  }
  return out.filter(Boolean);
}

function sizeDriver(project: ProjectCost): string {
  const spec = typicalJobSpec(project.projectSlug);
  const meta = projectMeta(project.projectSlug);
  if (project.projectSlug === "roof-replacement") {
    let s =
      "Size is measured in " +
      meta.quantityLabel.toLowerCase() +
      " (100 sf of roof surface each)";
    if (spec) {
      s += ". This page models " + spec.low + " to " + spec.high + ", with a typical of " + spec.typical;
    }
    return asSentence(s);
  }
  if (project.projectSlug === "kitchen-remodel") {
    let s = "Size is the kitchen's affected area, in square feet";
    if (spec) {
      s += ". This page models " + spec.low + " to " + spec.high + ", with a typical of " + spec.typical;
    }
    return asSentence(s);
  }
  if (project.projectSlug === "deck") {
    let s = "Size is the deck surface area, in square feet";
    if (spec) {
      s += ". This page models " + spec.low + " to " + spec.high + ", with a typical of " + spec.typical;
    }
    return asSentence(s);
  }
  if (project.projectSlug === "hvac-replacement") {
    let s =
      "Cost scales with the number of like-for-like systems (the calculator quantity), not tonnage dollars";
    if (spec) {
      s += ". A single system assumes " + spec.typical;
    }
    return asSentence(s);
  }
  return asSentence("Job cost scales with " + meta.quantityLabel.toLowerCase());
}

function wageDriver(project: ProjectCost, city: City): string {
  const adj = project.cityAdjustments?.[city.slug];
  const job = shortProjectName(project.projectSlug);
  const label = cityLabel(city);
  const laborPct = project.laborShare != null ? Math.round(project.laborShare * 100) : null;

  if (adj && (adj.metro || adj.blsConstructionMeanHourlyUsd != null || adj.blsVintage)) {
    let wage =
      "Labor for " +
      job +
      " in " +
      label +
      " is indexed to the BLS construction-and-extraction occupations mean hourly wage";
    if (adj.metro) wage += " for " + adj.metro;
    if (adj.blsConstructionMeanHourlyUsd != null) {
      wage += " of $" + adj.blsConstructionMeanHourlyUsd.toFixed(2);
    }
    if (adj.blsVintage) wage += " (" + adj.blsVintage + ")";
    if (laborPct != null) wage += ", applied to the " + laborPct + "% labor share";
    return asSentence(wage);
  }

  let s =
    "Labor for " + job + " in " + label + " uses the recorded city wage index applied to the labor share only";
  if (laborPct != null) s += " (" + laborPct + "%)";
  return asSentence(s);
}

function materialsDriver(project: ProjectCost, city: City): string {
  const label = cityLabel(city);
  const materialShare = project.materialShare ?? project.materialsShare;
  const materialPct = materialShare != null ? Math.round(materialShare * 100) : null;
  let s = "Materials stay at the national figure";
  if (materialPct != null) s += " (" + materialPct + "% of the typical job)";
  s += " while labor is wage-indexed for " + label;
  return asSentence(s);
}

function permitDriver(city: City, permit: Permit | null | undefined): string {
  const known = permitFeeKnown(permit);
  const fee = permit?.feeTypicalUsd ?? null;
  if (known && fee != null) {
    const portlandRoofExact =
      permit?.citySlug === "portland-or" &&
      permit.projectSlug === "roof-replacement" &&
      permit.feeLowUsd === 81.68 &&
      permit.feeTypicalUsd === 102.69 &&
      permit.feeHighUsd === 155.22;
    const portlandKitchenExact =
      permit?.citySlug === "portland-or" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.feeLowUsd === 118.45 &&
      permit.feeTypicalUsd === 210.07 &&
      permit.feeHighUsd === 334.22;
    const tucsonKitchenExact =
      permit?.citySlug === "tucson-az" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.feeLowUsd === 406.34 &&
      permit.feeTypicalUsd === 804.14 &&
      permit.feeHighUsd === 1297.59;
    const tucsonDeckExact =
      permit?.citySlug === "tucson-az" &&
      permit.projectSlug === "deck" &&
      permit.feeLowUsd === 245.69 &&
      permit.feeTypicalUsd === 337.49 &&
      permit.feeHighUsd === 521.09;
    const portlandDeckExact =
      permit?.citySlug === "portland-or" &&
      permit.projectSlug === "deck" &&
      permit.feeLowUsd === 81.68 &&
      permit.feeTypicalUsd === 102.69 &&
      permit.feeHighUsd === 144.72;
    const denverDeckExact =
      permit?.citySlug === "denver-co" &&
      permit.projectSlug === "deck" &&
      permit.feeLowUsd === 124.5 &&
      permit.feeTypicalUsd === 172.5 &&
      permit.feeHighUsd === 268.5;
    const houstonHvacExact =
      permit?.citySlug === "houston-tx" &&
      permit.projectSlug === "hvac-replacement" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 18056 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 23056 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 40056;
    const minneapolisRoofExact =
      permit?.citySlug === "minneapolis-mn" &&
      permit.projectSlug === "roof-replacement" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 37987 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 51783 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 86273;
    const miamiRoofExact =
      permit?.citySlug === "miami-fl" &&
      permit.projectSlug === "roof-replacement" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 15880 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 16120 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 16720;
    const miamiHvacExact =
      permit?.citySlug === "miami-fl" &&
      permit.projectSlug === "hvac-replacement" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 18300 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 18450 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 19880;
    const chicagoRoofExempt =
      permit?.citySlug === "chicago-il" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === false &&
      permit.feeModel === "none" &&
      permit.feeLowUsd === 0 &&
      permit.feeTypicalUsd === 0 &&
      permit.feeHighUsd === 0;
    if (chicagoRoofExempt) {
      let exempt = "The recorded permit fee is " + usd(0);
      if (permit?.sourceName) exempt += " from " + permit.sourceName;
      exempt +=
        ". The typical path is a Group R building of 4 stories or fewer with pitch at least 2:12 and no structural work. The $450 stand-alone, $175 no-tear-off, and $900 structural lines are extras and are not in that total. We do not invent fees";
      return asSentence(exempt);
    }
    const chicagoHvacExempt =
      permit?.citySlug === "chicago-il" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === false &&
      permit.feeModel === "none" &&
      permit.feeLowUsd === 0 &&
      permit.feeTypicalUsd === 0 &&
      permit.feeHighUsd === 0;
    if (chicagoHvacExempt) {
      let exempt = "The recorded permit fee is " + usd(0);
      if (permit?.sourceName) exempt += " from " + permit.sourceName;
      exempt +=
        ". The typical path is an in-kind furnace, boiler, or AC appliance swap in a Group R building of 4 stories or fewer. The $75 in-kind stand-alone and $150 new AC lines are extras and are not in that total. We do not invent fees";
      return asSentence(exempt);
    }
    const chicagoKitchenExact =
      permit?.citySlug === "chicago-il" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 0 &&
      permit.feeTypicalUsd === 500 &&
      permit.feeHighUsd === 602;
    if (chicagoKitchenExact) {
      let chicago = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) chicago += " from " + permit.sourceName;
      chicago +=
        ". The typical path is the Table 14A-12-1204.2 stand-alone interior alteration of 2,000 sf or less in one unit. The $0 cosmetic path and the $602 plan-based Level 2 minimum are the recorded low and high. The $75 plumbing and $75 electrical lines are extras and are not in that total. We do not invent fees";
      return asSentence(chicago);
    }
    const chicagoDeckExact =
      permit?.citySlug === "chicago-il" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 300 &&
      permit.feeTypicalUsd === 602 &&
      permit.feeHighUsd === 602;
    if (chicagoDeckExact) {
      let chicago = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) chicago += " from " + permit.sourceName;
      chicago +=
        ". The typical path is the plan-based minimum because Express still sends new structures to plan-based review. The $300 stand-alone line is the recorded low. The $66 area product is below the $602 floor and is not a separate total. A zoning fee is not in that total. We do not invent fees";
      return asSentence(chicago);
    }
    const lasVegasRoofExact =
      permit?.citySlug === "las-vegas-nv" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 242 &&
      permit.feeTypicalUsd === 242 &&
      permit.feeHighUsd === 281;
    if (lasVegasRoofExact) {
      let vegas = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) vegas += " from " + permit.sourceName;
      vegas +=
        ". The typical path is Table 3-E #94 tear-off/re-roof: plan check $68 + inspection $119 + Table 3-E #2 issuance $55. The $281 high is Table 3-E #95 roof structure/sheathing replacement ($226 plus $55 issuance) and is not added on top of that total. Valuation is unused. A non-tile covering replacement with no structural work and 64 sf or less of sheathing is exempt and is not in that total. We do not invent fees";
      return asSentence(vegas);
    }
    const bostonRoofExact =
      permit?.citySlug === "boston-ma" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      permit.feeLowUsd === 100 &&
      permit.feeTypicalUsd === 140 &&
      permit.feeHighUsd === 240;
    if (bostonRoofExact) {
      let boston = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) boston += " from " + permit.sourceName;
      boston +=
        ". Covering-only reroof uses the short-form $20 plus $10 per $1,000. Structural sheathing/framing is long-form ($50 + $10 per $1,000) and is not in that total. We do not invent fees";
      return asSentence(boston);
    }
    const bostonHvacExact =
      permit?.citySlug === "boston-ma" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "tiered" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 12040 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 12220 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 12580;
    if (bostonHvacExact) {
      let boston = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) boston += " from " + permit.sourceName;
      boston +=
        ". The total is the gas furnace/heater line plus sheet metal for the first 200 lin/sq ft. Electrical is not dollarized and is not in that total. We do not invent fees";
      return asSentence(boston);
    }
    const bostonKitchenExact =
      permit?.citySlug === "boston-ma" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      permit.feeLowUsd === 170 &&
      permit.feeTypicalUsd === 370 &&
      permit.feeHighUsd === 800;
    if (bostonKitchenExact) {
      let boston = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) boston += " from " + permit.sourceName;
      boston +=
        ". The typical path is short-form building at the recorded $35,000 valuation ($20 plus $10 per $1,000). Long-form building at $75,000 is the recorded high. Plumbing, electrical, gas, and sheet metal are not in that total. We do not invent fees";
      return asSentence(boston);
    }
    const bostonDeckExact =
      permit?.citySlug === "boston-ma" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      permit.feeLowUsd === 130 &&
      permit.feeTypicalUsd === 170 &&
      permit.feeHighUsd === 250;
    if (bostonDeckExact) {
      let boston = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) boston += " from " + permit.sourceName;
      boston +=
        ". The recorded path is long-form ($50 plus $10 per $1,000) for a new or expanded deck. The $19,200 valuation ceils to 20 times $10 plus the $50 primary. Repair with original stamped plans can be short-form, and microfilming at $3 per sheet is not in that total. We do not invent fees";
      return asSentence(boston);
    }
    let s =
      "The recorded permit fee is " +
      (portlandRoofExact ||
      portlandKitchenExact ||
      portlandDeckExact ||
      tucsonKitchenExact ||
      tucsonDeckExact ||
      denverDeckExact ||
      houstonHvacExact ||
      minneapolisRoofExact ||
      miamiRoofExact ||
      miamiHvacExact
        ? moneyExact(fee)
        : usd(fee));
    if (permit?.sourceName) s += " from " + permit.sourceName;
    s += ". We do not invent fees";
    return asSentence(s);
  }
  let s =
    "The permit line is blank because the official fee is not yet recorded. We do not invent a dollar";
  if (permit?.sourceName) s += ". Source on file: " + permit.sourceName;
  return asSentence(s);
}

/**
 * Crawlable "what moves the price" copy for all four money jobs
 * (roof, kitchen, HVAC, deck). Never invents permit dollars.
 */
export function costDrivers(
  project: ProjectCost,
  city: City,
  permit: Permit | null | undefined,
): CostDriversModel | null {
  if (!DRIVER_JOBS.has(project.projectSlug)) return null;

  return {
    heading: "What moves the price",
    included: includedBullets(project),
    drivers: [
      sizeDriver(project),
      wageDriver(project, city),
      materialsDriver(project, city),
      permitDriver(city, permit),
    ].filter(Boolean),
  };
}
