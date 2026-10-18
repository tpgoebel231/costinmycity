import { usd } from "@/lib/format";
import type { ProjectCost } from "@/lib/types";

export type CommonBandSource = {
  low: number;
  high: number;
  /**
   * True when the figures are a whole-job total on a per-unit project
   * (deck nationalJobLow / nationalJobHigh). Scale by quantity / default
   * quantity, not by multiplying the job total by square feet.
   */
  asJobTotal: boolean;
};

function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/**
 * Everyday band already written in the project file. No new figures.
 * Roof and HVAC use commonLow/commonHigh. Deck uses the recorded national job range.
 * Kitchen has no tighter common band, so it stays on low..high.
 */
export function commonBandSource(project: ProjectCost): CommonBandSource | null {
  if (isNum(project.commonLow) && isNum(project.commonHigh)) {
    return { low: project.commonLow, high: project.commonHigh, asJobTotal: false };
  }
  // Deck job range ($4,340-$12,652) is a different basis than the per-sq-ft typical,
  // so the typical would sit outside it. Keep the full low..high band for deck.
  return null;
}

/**
 * Short High-column label when nationalHigh is a published broad high
 * (e.g. steep/premium roof), not the everyday asphalt/mid band.
 * Derived only from recorded scopeNote. Never invents fees.
 */
export function highBandLabel(project: ProjectCost): string | null {
  const note = (project.scopeNote || "").trim();
  if (!note) return null;
  if (/\b(steep or premium|published broad high)\b/i.test(note)) {
    return "High (steep/premium)";
  }
  return null;
}

/** Sentence stem for the broad high. The dollar is the adjusted nationalHigh, filled in by the caller. */
export function highBandReachPrefix(project: ProjectCost): string | null {
  if (!commonBandSource(project)) return null;
  const note = project.scopeNote || "";
  if (project.projectSlug === "roof-replacement") return "Premium or steep roofs can reach ";
  if (/\bnew ductwork\b/i.test(note)) return "Jobs with new ductwork can reach ";
  return "Premium jobs can reach ";
}

/** One sentence. Replaces the old two-sentence broad-high footnote. */
export function highBandFootnote(project: ProjectCost, adjustedHigh: number): string | null {
  const prefix = highBandReachPrefix(project);
  if (!prefix) return null;
  return prefix + usd(adjustedHigh) + ".";
}
