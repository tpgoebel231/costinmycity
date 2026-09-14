import type { ReactNode } from "react";

/**
 * Shared wrapper: one "Local context" H2 with nested H3 callouts
 * (city hubs: facts / wage / labor / typical jobs; money pages: city facts).
 * Soft merge — content unchanged; outline only.
 */
export function CityHubContext({ children }: { children: ReactNode }) {
  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4 [&_>div:first-of-type]:mt-4 [&_>div:first-of-type]:border-t-0 [&_>div:first-of-type]:pt-0">
      <h2 className="font-display text-2xl">Local context</h2>
      {children}
    </section>
  );
}
