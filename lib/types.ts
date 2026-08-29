export type ProjectSlug =
  | "roof-replacement"
  | "hvac-replacement"
  | "deck"
  | "kitchen-remodel";

export const LAUNCH_PROJECTS: ProjectSlug[] = [
  "roof-replacement",
  "hvac-replacement",
  "deck",
  "kitchen-remodel",
];

export interface City {
  slug: string;
  name: string;
  state: string;
  stateAbbr: string;
  county: string;
  population?: number;
  populationYear?: number;
  populationSource?: string;
  permitDeptName: string;
  permitPortalUrl: string;
  feeScheduleUrl: string;
  feeScheduleYear: number | null;
  notes?: string;
}

export interface PermitExtra {
  name: string;
  feeUsd?: number | null;
  amountUsd?: number | null;
  note?: string;
}

export interface Permit {
  citySlug: string;
  projectSlug: string;
  permitRequired: boolean | null;
  feeModel: string;
  feeLowUsd: number | null;
  feeHighUsd: number | null;
  feeTypicalUsd: number | null;
  typicalProjectValueUsd: number | null;
  extras: PermitExtra[];
  sourceUrl: string;
  sourceName: string;
  retrievedDate: string;
  caveat: string;
  assumedValuationUsd?: { low?: number; typical?: number; high?: number } | null;
  calculationNote?: string;
}

export interface CostSource {
  name: string;
  url: string;
  retrievedDate?: string;
  note?: string;
  what?: string;
}

export interface CityAdjustment {
  multiplier?: number;
  laborWageMultiplier?: number;
  laborMultiplier?: number;
  materialsMultiplier?: number;
  blsConstructionMeanHourlyUsd?: number;
  blsVintage?: string;
  metro?: string;
  source?: string;
  method?: string;
  note?: string;
  lowUsd?: number;
  typicalUsd?: number;
  highUsd?: number;
}

export type CityAdjustmentMap = Record<string, CityAdjustment>;

export interface ProjectCost {
  projectSlug: string;
  name: string;
  unit: string;
  unitNote: string;
  nationalLow: number;
  nationalTypical: number;
  nationalHigh: number;
  nationalPerSqftLow?: number;
  nationalPerSqftHigh?: number;
  nationalJobLow?: number;
  nationalJobTypical?: number;
  nationalJobHigh?: number;
  scopeNote?: string;
  laborShare?: number;
  materialShare?: number;
  materialsShare?: number;
  laborShareNote?: string;
  sources: CostSource[];
  cityAdjustments: CityAdjustmentMap;
}

export interface ProjectCostsFile {
  currency?: string;
  asOf?: string;
  nationalWageIndex?: {
    occupationGroup?: string;
    nationalMeanHourlyUsd?: number;
    vintage?: string;
    sourceUrl?: string;
    method?: string;
  };
  projects: ProjectCost[];
}

export interface PricedItem {
  id: string;
  name: string;
  tier?: string;
  use?: string[];
  defaultPriceUsd?: number | null;
  defaultPriceUnit?: string;
  priceLabel?: string;
  priceSource?: string | null;
  notes?: string;
  qtyRule?: string;
  approxCountPerSqft?: number;
}

export interface DeckMaterialsData {
  asOf?: string;
  currency?: string;
  priceDisclaimer?: string;
  assumptions?: {
    joistSpacingIn?: number;
    wastePctDecking?: number;
    wastePctFraming?: number;
    wastePctNote?: string;
    beamSpacingNote?: string;
    deckingOrientation?: string;
    fastenerAllowanceNote?: string;
  };
  coverage?: Record<string, { linealFeetPerSqft?: number; actualWidthIn?: number; note?: string; nominal?: string }>;
  lumberTypes: PricedItem[];
  fasteners: PricedItem[];
  otherAllowances?: PricedItem[];
  calculatorRecipe?: Record<string, string>;
}
