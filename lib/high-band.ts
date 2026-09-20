import type { ProjectCost } from "@/lib/types";

/**
 * Short High-column label when nationalHigh is a published broad high
 * (e.g. steep/premium roof), not the everyday asphalt/mid band.
 * Derived only from recorded scopeNote — never invents fees.
 */
export function highBandLabel(project: ProjectCost): string | null {
  const note = (project.scopeNote || "").trim();
  if (!note) return null;
  if (/\b(steep or premium|published broad high)\b/i.test(note)) {
    return "High (steep/premium)";
  }
  return null;
}

/** One-line muted note under Low/Typical/High when High is a broad-scope band. */
export function highBandFootnote(project: ProjectCost): string | null {
  if (!highBandLabel(project)) return null;
  return "High is the wage-indexed published broad high (steep or premium materials), not the asphalt-shingle installed band in the opener.";
}
