import type { ProjectSlug } from "@/lib/types";

/**
 * Documented typical-job specs from data/SOURCES.md (retrieved 2026-09-01).
 * Published site assumptions for applying official schedules — not invented fees.
 */
export interface TypicalJobSpec {
  typical: string;
  low: string;
  high: string;
  why: string;
}

export const TYPICAL_JOB_SPECS: Record<ProjectSlug, TypicalJobSpec> = {
  "roof-replacement": {
    typical: "1,500 sf of roof surface",
    low: "1,000 sf",
    high: "1,800 sf",
    why: "Typical home roof about 1,300–1,800 sf of surface, matching the project-costs.json scopeNote.",
  },
  "hvac-replacement": {
    typical: "3-ton (36,000 BTU) like-for-like split system",
    low: "2-ton / 60 kBTU furnace or the published sheet-metal / equipment floor",
    high: "5-ton / 120 kBTU or extra equipment lines on the same table",
    why: "An 80,000 BTU mid-efficiency gas furnace is the documented typical 3-ton companion when a furnace line needs BTU.",
  },
  deck: {
    typical: "16×20 = 320 sf",
    low: "200 sf",
    high: "400 sf",
    why: "The dataset already uses the 16×20 table for deck valuations.",
  },
  "kitchen-remodel": {
    typical: "200 sf affected area",
    low: "150 sf",
    high: "400 sf",
    why: "Typical same-footprint kitchen; 400 sf is a large gut of the room.",
  },
};

/**
 * Assumed valuations from data/SOURCES.md, used only to apply official permit formulas.
 * Not city-assessed values.
 */
export interface AssumedValuation {
  low: number;
  typical: number;
  high: number;
  why: string;
}

export const ASSUMED_VALUATIONS: Record<ProjectSlug, AssumedValuation> = {
  "roof-replacement": {
    low: 8000,
    typical: 12000,
    high: 22000,
    why: "2026 asphalt / mid-size roof band",
  },
  "hvac-replacement": {
    low: 5000,
    typical: 7500,
    high: 16000,
    why: "2026 average $7,500; high toward new-duct jobs",
  },
  deck: {
    low: 8000,
    typical: 12000,
    high: 19200,
    why: "2026 job average / 16×20 table",
  },
  "kitchen-remodel": {
    low: 15000,
    typical: 35000,
    high: 75000,
    why: "2026 remodel $14.6k–$41.3k; high = larger gut",
  },
};

export function typicalJobSpec(slug: string): TypicalJobSpec | null {
  return TYPICAL_JOB_SPECS[slug as ProjectSlug] ?? null;
}

export function assumedValuation(slug: string): AssumedValuation | null {
  return ASSUMED_VALUATIONS[slug as ProjectSlug] ?? null;
}
