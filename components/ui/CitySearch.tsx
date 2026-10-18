"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type SearchCity = {
  slug: string;
  name: string;
  state: string;
  stateAbbr: string;
  county: string;
};

export function CitySearch({ cities, id }: { cities: SearchCity[]; id: string }) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return cities
      .filter((city) =>
        (city.name + " " + city.state + " " + city.stateAbbr + " " + city.county).toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [cities, query]);

  return (
    <div className="search-pop">
      <label className="sr-only" htmlFor={id}>
        Search cities
      </label>
      <input
        id={id}
        type="search"
        value={query}
        placeholder="Search cities"
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      {matches.length ? (
        <ul>
          {matches.map((city) => (
            <li key={city.slug}>
              <Link href={"/city/" + city.slug}>
                {city.name}, {city.stateAbbr}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
