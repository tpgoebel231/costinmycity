import { numberFmt } from "@/lib/format";

/**
 * Cost-model roof size. One square is 100 sq ft of roof surface, not floor area.
 * Typical matches the roof calculator default (16). Low and high match the
 * cost-by-size bands (10 and 18). 1,500 sq ft of roof surface is 15 squares
 * and is not this typical. Area-based permit notes that name 1,500 sf keep
 * that input; this module does not change fee dollars.
 */
export const SQFT_PER_ROOF_SQUARE = 100;

export const ROOF_SQUARES = {
  low: 10,
  typical: 16,
  high: 18,
} as const;

export function roofSurfaceSqFt(squares: number): number {
  return squares * SQFT_PER_ROOF_SQUARE;
}

/** "1,600 sq ft of roof surface" */
export function roofSurfaceLabel(squares: number): string {
  return numberFmt(roofSurfaceSqFt(squares)) + " sq ft of roof surface";
}

/**
 * "16 squares (1,600 sq ft of roof surface, not floor area)"
 * Pass withFloor: false for low/high rows that sit next to a typical label
 * that already says this is not floor area.
 */
export function roofSquaresPhrase(squares: number, withFloor = true): string {
  const surface = roofSurfaceLabel(squares);
  if (!withFloor) return squares + " squares (" + surface + ")";
  return squares + " squares (" + surface + ", not floor area)";
}
