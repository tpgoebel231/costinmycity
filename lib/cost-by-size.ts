import { buildEstimate } from "@/lib/estimates";
import { numberFmt } from "@/lib/format";
import { typicalJobSpec } from "@/lib/typical-specs";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type SizeBand = "low" | "typical" | "high";

export type CostBySizeRow = {
  sizeLabel: string;
  quantity: number;
  allInTypicalUsd: number;
  permitTypicalUsd: number | null;
  permitKnown: boolean;
};

export type CostBySizeModel = {
  heading: string;
  note: string;
  rows: CostBySizeRow[];
};

const COST_BY_SIZE_NOTE =
  "All-in from our wage-indexed model at this size. Permit line uses the recorded schedule when known; we do not invent fees.";

/** Roof squares, kitchen/deck sf, HVAC system-count. Unknown jobs return null from costBySize. */
const SIZE_BANDS: Record<string, { qty: number; band: SizeBand }[]> = {
  "roof-replacement": [
    { qty: 10, band: "low" },
    { qty: 16, band: "typical" },
    { qty: 18, band: "high" },
  ],
  "kitchen-remodel": [
    { qty: 150, band: "low" },
    { qty: 200, band: "typical" },
    { qty: 400, band: "high" },
  ],
  deck: [
    { qty: 200, band: "low" },
    { qty: 320, band: "typical" },
    { qty: 400, band: "high" },
  ],
  "hvac-replacement": [
    { qty: 1, band: "typical" },
    { qty: 2, band: "high" },
    { qty: 3, band: "high" },
  ],
};

function roofSizeLabel(squares: number, band: SizeBand): string {
  if (band === "typical") return squares + " squares (typical)";
  return squares + " squares (" + numberFmt(squares * 100) + " sf)";
}

function kitchenSizeLabel(qty: number, band: SizeBand): string {
  const spec = typicalJobSpec("kitchen-remodel");
  const fromSpec = spec?.[band];
  if (fromSpec) {
    if (band === "typical" && !/\btypical\b/i.test(fromSpec)) {
      return fromSpec + " (typical)";
    }
    return fromSpec;
  }
  const base = numberFmt(qty) + " sf";
  return band === "typical" ? base + " (typical)" : base;
}

function deckSizeLabel(qty: number, band: SizeBand): string {
  const spec = typicalJobSpec("deck");
  const fromSpec = spec?.[band];
  if (fromSpec) {
    if (band === "typical" && !/\btypical\b/i.test(fromSpec)) {
      return fromSpec + " (typical)";
    }
    return fromSpec;
  }
  const base = numberFmt(qty) + " sf";
  return band === "typical" ? base + " (typical)" : base;
}

function hvacSizeLabel(qty: number, band: SizeBand): string {
  const unit = qty === 1 ? "system" : "systems";
  const base = qty + " " + unit;
  return band === "typical" ? base + " (typical)" : base;
}

function sizeLabel(projectSlug: string, qty: number, band: SizeBand): string {
  if (projectSlug === "roof-replacement") return roofSizeLabel(qty, band);
  if (projectSlug === "kitchen-remodel") return kitchenSizeLabel(qty, band);
  if (projectSlug === "deck") return deckSizeLabel(qty, band);
  if (projectSlug === "hvac-replacement") return hvacSizeLabel(qty, band);
  return numberFmt(qty);
}

/**
 * Three crawlable size rows for roof, kitchen, deck, and HVAC money pages.
 * Always computed via buildEstimate — never hardcodes city dollars.
 * Returns null for any job without size bands.
 */
export function costBySize(project: ProjectCost, city: City, permit: Permit | null | undefined): CostBySizeModel | null {
  const bands = SIZE_BANDS[project.projectSlug];
  if (!bands?.length) return null;

  const rows: CostBySizeRow[] = bands.map(({ qty, band }) => {
    const est = buildEstimate(project, city, permit ?? undefined, qty);
    return {
      sizeLabel: sizeLabel(project.projectSlug, qty, band),
      quantity: qty,
      allInTypicalUsd: est.allInTypical,
      permitTypicalUsd: est.permitTypical,
      permitKnown: est.permitKnown,
    };
  });

  return {
    heading: "Cost by size",
    note: COST_BY_SIZE_NOTE,
    rows,
  };
}
