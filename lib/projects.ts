export type PricingMode = "job" | "per-unit";

export interface ProjectMeta {
  slug: string;
  shortName: string;
  blurb: string;
  quantityLabel: string;
  quantityHint: string;
  defaultQuantity: number;
  quantityStep: number;
  quantityMin: number;
  quantityMax: number;
  pricing: PricingMode;
}

const META: Record<string, ProjectMeta> = {
  "roof-replacement": {
    slug: "roof-replacement",
    shortName: "Roof replacement",
    blurb: "Asphalt-shingle tear-off and reroof, typical house.",
    quantityLabel: "Roof squares",
    quantityHint: "1 square = 100 sq ft of roof surface. A typical house is about 13 to 18 squares.",
    defaultQuantity: 16,
    quantityStep: 1,
    quantityMin: 8,
    quantityMax: 60,
    pricing: "job",
  },
  "hvac-replacement": {
    slug: "hvac-replacement",
    shortName: "HVAC replacement",
    blurb: "Like-for-like furnace plus AC or a heat pump, existing ducts.",
    quantityLabel: "Systems",
    quantityHint: "Most single-family houses are one system. Count a second zone separately.",
    defaultQuantity: 1,
    quantityStep: 1,
    quantityMin: 1,
    quantityMax: 4,
    pricing: "job",
  },
  "deck": {
    slug: "deck",
    shortName: "Deck",
    blurb: "New attached deck, ground-level to one story.",
    quantityLabel: "Deck square feet",
    quantityHint: "Walking surface only. A 16 by 20 deck is 320 sqft.",
    defaultQuantity: 320,
    quantityStep: 10,
    quantityMin: 80,
    quantityMax: 1200,
    pricing: "per-unit",
  },
  "kitchen-remodel": {
    slug: "kitchen-remodel",
    shortName: "Kitchen remodel",
    blurb: "Mid-range remodel on the same footprint. Not a luxury gut.",
    quantityLabel: "Kitchen square feet",
    quantityHint: "Room area. 150 to 250 sqft is a common mid-range kitchen.",
    defaultQuantity: 200,
    quantityStep: 10,
    quantityMin: 80,
    quantityMax: 500,
    pricing: "per-unit",
  },
};

export function projectMeta(slug: string): ProjectMeta {
  return META[slug] ?? {
    slug,
    shortName: slug.replace(/-/g, " "),
    blurb: "",
    quantityLabel: "Quantity",
    quantityHint: "",
    defaultQuantity: 1,
    quantityStep: 1,
    quantityMin: 1,
    quantityMax: 100,
    pricing: "job",
  };
}

export function shortProjectName(slug: string): string {
  return projectMeta(slug).shortName;
}
