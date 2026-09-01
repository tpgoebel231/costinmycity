"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";
import { filterCities, groupCitiesByState, stateAnchorId } from "@/lib/city-groups";

export function CitiesDirectory({ cities }: { cities: City[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterCities(cities, q), [cities, q]);
  const groups = useMemo(() => groupCitiesByState(filtered), [filtered]);

  return (
    <div className="mt-6">
      <label htmlFor="cities-search" className="text-sm font-medium">Find a city</label>
      <input
        id="cities-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="City, state, or county"
        className="mt-2 w-full border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-muted/70"
      />
      {groups.length > 0 ? (
        <nav aria-label="Jump to state" className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {groups.map((g) => (
            <a
              key={g.stateAbbr}
              href={"#" + stateAnchorId(g.stateAbbr)}
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              {g.stateAbbr}
            </a>
          ))}
        </nav>
      ) : null}
      {groups.map((g) => (
        <section key={g.stateAbbr} id={stateAnchorId(g.stateAbbr)} className="mt-8 scroll-mt-4">
          <h2 className="font-display text-2xl">{g.state}</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {g.cities.map((c) => (
              <li key={c.slug} className="flex flex-col py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <Link href={"/city/" + c.slug} className="font-medium underline-offset-4 hover:underline">
                  {cityLabel(c)}
                </Link>
                <p className="text-sm text-muted">{c.county} County</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {filtered.length === 0 ? <p className="mt-6 text-sm text-muted">No city matches. We cover {cities.length} cities.</p> : null}
    </div>
  );
}
