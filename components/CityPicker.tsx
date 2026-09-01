"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";
import { filterCities, groupCitiesByState } from "@/lib/city-groups";

export function CityPicker({ cities }: { cities: City[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterCities(cities, q), [cities, q]);
  const groups = useMemo(() => groupCitiesByState(filtered), [filtered]);

  return (
    <div>
      <label htmlFor="city-search" className="text-sm font-medium">Find a city</label>
      <input
        id="city-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Seattle, Austin, Raleigh..."
        className="mt-2 w-full border border-line bg-paper px-3 py-2 text-base text-ink placeholder:text-muted/70"
      />
      {groups.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {groups.map((g) => (
            <section key={g.stateAbbr}>
              <h3 className="text-sm font-medium text-muted">{g.stateAbbr}</h3>
              <ul className="mt-1">
                {g.cities.map((c) => (
                  <li key={c.slug}>
                    <Link href={"/city/" + c.slug} className="font-medium underline-offset-4 hover:underline">
                      {cityLabel(c)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : null}
      {filtered.length === 0 ? <p className="mt-3 text-sm text-muted">No city matches. We cover {cities.length} cities.</p> : null}
    </div>
  );
}
