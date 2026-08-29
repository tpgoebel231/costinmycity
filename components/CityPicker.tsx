"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";

export function CityPicker({ cities }: { cities: City[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return cities;
    return cities.filter((c) =>
      (c.name + " " + c.state + " " + c.stateAbbr + " " + c.county).toLowerCase().includes(n),
    );
  }, [cities, q]);

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
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filtered.map((c) => (
          <li key={c.slug}>
            <Link href={"/city/" + c.slug} className="block border border-line bg-paper px-3 py-2 hover:border-accent">
              <span className="font-medium">{cityLabel(c)}</span>
              <span className="mt-0.5 block text-xs text-muted">{c.county} County</span>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? <p className="mt-3 text-sm text-muted">No city matches that. We cover ten cities.</p> : null}
    </div>
  );
}
