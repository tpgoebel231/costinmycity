import { cityLabel } from "@/lib/data-client";
import { usd } from "@/lib/format";
import { moneyExact, moneyExactCents } from "@/lib/sourcing";
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
    const houstonDeckExact =
      permit?.citySlug === "houston-tx" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "area" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 17704 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 25744 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 30568;
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
    const miamiKitchenExact =
      permit?.citySlug === "miami-fl" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 19600 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 31762 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 63438;
    const miamiDeckExact =
      permit?.citySlug === "miami-fl" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 18480 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 18760 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 20776;
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
    const kansasCityRoofExempt =
      permit?.citySlug === "kansas-city-mo" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === false &&
      permit.feeModel === "none" &&
      permit.feeLowUsd === 0 &&
      permit.feeTypicalUsd === 0 &&
      permit.feeHighUsd === 0 &&
      (permit.extras || []).length === 1 &&
      Math.round(((permit.extras || [])[0]?.feeUsd ?? NaN) * 100) === 10130;
    if (kansasCityRoofExempt) {
      let exempt = "The recorded permit fee is " + usd(0);
      if (permit?.sourceName) exempt += " from " + permit.sourceName;
      exempt +=
        ". The typical path is a like-kind one- and two-family light roof covering, which is exempt. The $101.30 section 18-20 line, if sheathing or structural work means the exemption fails, is an extra at the recorded $12,000 and is not in that total. We do not invent fees";
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
    const lasVegasHvacExact =
      permit?.citySlug === "las-vegas-nv" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 238 &&
      permit.feeTypicalUsd === 238 &&
      permit.feeHighUsd === 257;
    if (lasVegasHvacExact) {
      let vegas = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) vegas += " from " + permit.sourceName;
      vegas +=
        ". The typical path is Table 3-D #15 HVAC exact change-out: plan check $83 + inspection $100 + Table 3-D MPE issuance $55. The $257 high is Table 3-D #14 misc appliance/AHU ($202 plus $55 issuance, or non-exact change-out $102 + $100 + $55) and is not added on top of that total. Valuation is unused. A minor part, filter, or portable unit is exempt and is not in that total. We do not invent fees";
      return asSentence(vegas);
    }
    const minneapolisHvacExact =
      permit?.citySlug === "minneapolis-mn" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "tiered" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 13340 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 21760 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 21760;
    if (minneapolisHvacExact) {
      let minneapolis = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) minneapolis += " from " + permit.sourceName;
      minneapolis +=
        ". The typical path is Level 3 entire-system replacement $216.60 plus the $1.00 Minnesota state surcharge. The $133.40 low is Level 2 furnace/boiler $132.40 plus that $1.00 surcharge and is not added on top of that total. The high is the same Level 3 total. Valuation is unused. Level 1 miscellaneous HVAC with no burner is $84.20 and is not a recorded total. Electrical (Minnesota DLI) is extra if new circuits are needed and is not in that total. We do not invent fees";
      return asSentence(minneapolis);
    }
    const minneapolisDeckExact =
      permit?.citySlug === "minneapolis-mn" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 37987 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 51783 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 79335;
    if (minneapolisDeckExact) {
      let minneapolis = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) minneapolis += " from " + permit.sourceName;
      minneapolis +=
        ". The typical path is the $12,000 valuation stack: building permit $310.20 plus 65% plan review $201.63 plus the Minnesota state surcharge $6.00. The $379.87 low is the $8,000 stack ($227.80 + $148.07 + $4.00). The $793.35 high is the $19,200 stack ($475.00 + $308.75 + $9.60) and is not added on top of that total. The detached-garage table does not apply. Ground-level platforms may differ and are not a recorded total. We do not invent fees";
      return asSentence(minneapolis);
    }
    if (miamiKitchenExact) {
      let miami = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) miami += " from " + permit.sourceName;
      miami +=
        ". The typical path is the $35,000 valuation stack: city permit $175 + application $40 + solid waste $77 + state $4.62 + county $21. The $196 low is the $15,000 minimum city-permit stack. The $634.38 high is the $75,000 stack and is not added on top of that total. Cabinets or countertops only in a 1-2 family dwelling with no plumbing, electrical, or load-bearing changes are exempt and are not in that total. We do not invent fees";
      return asSentence(miami);
    }
    if (miamiDeckExact) {
      let miami = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) miami += " from " + permit.sourceName;
      miami +=
        ". The typical path is the $12,000 valuation stack: city permit minimum $110 + application $40 + solid waste $26.40 + state $4 + county $7.20. The $184.80 low is the $8,000 minimum city-permit stack. The $207.76 high is the $19,200 stack (solid waste $42.24 and county $11.52 with the same city minimum, application, and state line) and is not added on top of that total. Decks are not on the city exempt list. Playground equipment is. Energy $0.11/sf is new construction/addition only and is not in that total. We do not invent fees";
      return asSentence(miami);
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
    const dallasKitchenExact =
      permit?.citySlug === "dallas-tx" &&
      permit.projectSlug === "kitchen-remodel" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 296 &&
      permit.feeTypicalUsd === 396 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 135279;
    if (dallasKitchenExact) {
      let dallas = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) dallas += " from " + permit.sourceName;
      dallas +=
        ". The typical path is Table B-II master plus 3 additional trades plus the technology fee ($181 + $200 + $15). The $296 low is the 2-additional-trade Table B-II path. The $1,352.79 high is Table B-I at $75,000 with 3 trades and is not added on top of that total. Cabinets, countertops, paint, or flooring only do not require a building permit and are not in that total. We do not invent fees";
      return asSentence(dallas);
    }
    const dallasDeckExact =
      permit?.citySlug === "dallas-tx" &&
      permit.projectSlug === "deck" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      permit.feeLowUsd === 196 &&
      permit.feeTypicalUsd === 196 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 38647;
    if (dallasDeckExact) {
      let dallas = "The recorded permit fee is " + usd(fee);
      if (permit?.sourceName) dallas += " from " + permit.sourceName;
      dallas +=
        ". The typical attached-deck path is Table B-II plus the technology fee ($181 + $15). The $386.47 high is Table B-I at $19,200 ($246.47 + $125 + $15) and is not added on top of that total. Chapter 52 §301.2.1(13) is not the recorded typical path and is not in that total. We do not invent fees";
      return asSentence(dallas);
    }
    if (houstonDeckExact) {
      let houston = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) houston += " from " + permit.sourceName;
      houston +=
        ". The typical path is Type VB new-construction at 320 sf ($223.88) plus the $33.56 administrative fee. The $177.04 low is the 200 sf path ($143.48 + $33.56). The $305.68 high is the 400 sf path ($272.12 + $33.56) and is not added on top of that total. There is no 20% remodel discount. Valuation is unused. HPC uncovered decks at 30 inches or less, and Houston IRC R105.2, are not the recorded typical path. We do not invent fees";
      return asSentence(houston);
    }
    const philadelphiaRoofExact =
      permit?.citySlug === "philadelphia-pa" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 7650 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 7650 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 7650;
    if (philadelphiaRoofExact) {
      let philadelphia = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) philadelphia += " from " + permit.sourceName;
      philadelphia +=
        ". The typical path is the 1-2 family roof covering replacement $69 plus city $3 and PA state $4.50. Low, typical, and high are the same $76.50. The $25 filing fee is credited and is not added on top. Valuation is unused. Structural roof work billed as Alterations ($76 first 500 sf) is not the recorded typical path. We do not invent fees";
      return asSentence(philadelphia);
    }
    const detroitRoofExact =
      permit?.citySlug === "detroit-mi" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 47597 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 61233 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 95323;
    if (detroitRoofExact) {
      let detroit = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) detroit += " from " + permit.sourceName;
      detroit +=
        ". The typical path is the building/residential band at $12,000 ($271.43 + $34.09 x 10). The $475.97 low is that band at $8,000. The $953.23 high is that band at $22,000 and is not added on top of that total. The 35% plan-review is a deposit credited to the permit, not an add-on. No like-kind reroof exemption was found in this schedule. We do not invent fees";
      return asSentence(detroit);
    }
    const sanAntonioRoofExact =
      permit?.citySlug === "san-antonio-tx" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 2500 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 2500 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 2500;
    if (sanAntonioRoofExact) {
      let sanAntonio = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) sanAntonio += " from " + permit.sourceName;
      sanAntonio +=
        ". The typical path is the FY2026 p. 5 Residential Re-roof Permit at $25. Low, typical, and high are the same $25. The valuation table is not used for covering-only reroof. Structural sheathing/framing uses the \u00a710-38 valuation building-permit table instead and is not the recorded typical path. We do not invent fees";
      return asSentence(sanAntonio);
    }
    const sanAntonioHvacExact =
      permit?.citySlug === "san-antonio-tx" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "tiered" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 5625 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 6585 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 7210;
    if (sanAntonioHvacExact) {
      let sanAntonio = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) sanAntonio += " from " + permit.sourceName;
      sanAntonio +=
        ". The typical path is the FY2026 p. 16 existing-residential mechanical basic $50 plus gas furnace $9.60 plus one condensing unit $6.25. The $56.25 low is one replacement device ($50 + $6.25) and is not added on top of that total. The $72.10 high adds an air handler ($6.25). Valuation is unused. The \u00a710-38 valuation table and the $77 new-system line are not the recorded typical path. A separate electrical permit if a new circuit is not in that total. We do not invent fees";
      return asSentence(sanAntonio);
    }
    const tampaRoofExact =
      permit?.citySlug === "tampa-fl" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 18143 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 18143 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 18143;
    if (tampaRoofExact) {
      let tampa = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) tampa += " from " + permit.sourceName;
      tampa +=
        ". The typical path is the Trade schedule Roofing (1-2 family) $177.00 plus the Florida Building Permit Surcharge $4.43 (max of $4.00 and 2.5% of $177). Low, typical, and high are the same $181.43. The table excludes that surcharge until it is added. Valuation is unused and does not change the trade fee. A later Construction Services increase had not taken effect on the retrieval date. We do not invent fees";
      return asSentence(tampa);
    }
    const orlandoRoofExact =
      permit?.citySlug === "orlando-fl" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 10888 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 12793 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 17594;
    if (orlandoRoofExact) {
      let orlando = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) orlando += " from " + permit.sourceName;
      orlando +=
        ". The typical path is the residential 1 or 2 unit BLD fee at $12,000 ($66.24 + $4.41 x 11 = $114.75) plus AIF $2, trust $2, technology surcharge $3.44, and concurrency surcharge $5.74. The $108.88 low is that stack at $8,000. The $175.94 high is that stack at $22,000 and is not added on top of that total. We do not invent fees";
      return asSentence(orlando);
    }
    const orlandoHvacExact =
      permit?.citySlug === "orlando-fl" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "valuation" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 11367 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 14775 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 23864;
    if (orlandoHvacExact) {
      let orlandoHvac = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) orlandoHvac += " from " + permit.sourceName;
      orlandoHvac +=
        ". The typical path is the residential mechanical fee at $7,500 ($66.24 + $11.03 x 7 = $143.45) plus a technology surcharge of 3% ($4.30). The $113.67 low is that stack at $5,000. The $238.64 high is that stack at $16,000 and is not added on top of that total. AIF, trust, and concurrency are not on this mechanical row. We do not invent fees";
      return asSentence(orlandoHvac);
    }
    const jacksonvilleRoofExact =
      permit?.citySlug === "jacksonville-fl" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "area" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 16750 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 16750 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 16750;
    if (jacksonvilleRoofExact) {
      let jacksonville = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) jacksonville += " from " + permit.sourceName;
      jacksonville +=
        ". The typical path is the BID roofing minimum $150 plus the C&D debris fee $17.50. The schedule is $10 per 1,000 sf. At 1,000 / 1,500 / 1,800 sf that is 1-2 squares ($10-$20), so the $150 inspection minimum applies and low, typical, and high are the same $167.50. Valuation is unused and is not the fee driver. The F.S. 2.5% surcharge is not itemized on the COJ fee page and is not added. We do not invent fees";
      return asSentence(jacksonville);
    }
    const jacksonvilleHvacExact =
      permit?.citySlug === "jacksonville-fl" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "tiered" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 6000 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 6000 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 9400;
    if (jacksonvilleHvacExact) {
      let jacksonvilleHvac = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) jacksonvilleHvac += " from " + permit.sourceName;
      jacksonvilleHvac +=
        ". The typical path is a 3-ton air conditioner at $11 per ton ($33) plus the furnace first-200,000-BTU step ($22), which is $55, then the $60 mechanical minimum. The $60 low is a 2-ton line ($22), then that same minimum. The $94 high is a 5-ton line ($55) plus the furnace step ($22) plus the $17 first-2,000-CFM duct line, and the $60 minimum does not stack on that total. Valuation is unused and is not the fee driver. The Florida 2.5% surcharge is not on the COJ table and is not added. We do not invent fees";
      return asSentence(jacksonvilleHvac);
    }
    const sacramentoRoofExact =
      permit?.citySlug === "sacramento-ca" &&
      permit.projectSlug === "roof-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 21534 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 22626 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 25356;
    if (sacramentoRoofExact) {
      let sacramento = "The recorded permit fee is " + moneyExact(fee);
      if (permit?.sourceName) sacramento += " from " + permit.sourceName;
      sacramento +=
        ". The typical path is the HVAC and Re-roof specific-cost permit $175 plus the 10% technology surcharge $17.50 plus the General Plan fee $31.20 ($2.60 per $1,000 at $12,000) plus the $1 Green Building / CBSC minimum plus Strong Motion (SMIP) $1.56 (0.00013 x $12,000). The $215.34 low is that stack at $8,000. The $253.56 high is that stack at $22,000 and is not added on top of that total. The technology surcharge does not scale with valuation. We do not invent fees";
      return asSentence(sacramento);
    }
    const sacramentoHvacExact =
      permit?.citySlug === "sacramento-ca" &&
      permit.projectSlug === "hvac-replacement" &&
      permit.permitRequired === true &&
      permit.feeModel === "flat" &&
      Math.round((permit.feeLowUsd ?? NaN) * 100) === 20650 &&
      Math.round((permit.feeTypicalUsd ?? NaN) * 100) === 21300 &&
      Math.round((permit.feeHighUsd ?? NaN) * 100) === 23510;
    if (sacramentoHvacExact) {
      let sacramentoHvac = "The recorded permit fee is " + moneyExactCents(fee);
      if (permit?.sourceName) sacramentoHvac += " from " + permit.sourceName;
      sacramentoHvac +=
        ". The typical path is the HVAC specific-cost permit $175.00 plus the 10% technology surcharge $17.50 plus the General Plan fee $19.50 ($2.60 per $1,000 at $7,500) plus the $1.00 Green Building minimum. The $206.50 low is that stack at $5,000. The $235.10 high is that stack at $16,000 and is not added on top of that total. The technology surcharge does not scale with valuation. SMIP is listed on the reroof path and is not in these HVAC totals. We do not invent fees";
      return asSentence(sacramentoHvac);
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
