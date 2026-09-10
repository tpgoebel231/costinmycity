import type { ReactNode } from "react";

/**
 * Money-page wrapper: one "Cost details" H2 with nested H3 callouts
 * (size / breakdown / labor-materials / drivers / wage index).
 */
export function CostDetails({ children }: { children: ReactNode }) {
  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4 [&_>div:first-of-type]:mt-4 [&_>div:first-of-type]:border-t-0 [&_>div:first-of-type]:pt-0">
      <h2 className="font-display text-2xl">Cost details</h2>
      {children}
    </section>
  );
}
