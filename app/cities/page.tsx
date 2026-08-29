import type { Metadata } from "next";
import Link from "next/link";
import { cityLabel, getCities } from "@/lib/data";

export const metadata: Metadata = {
  title: "Cities",
  description: "Cities on CostInMyCity, with permit department links.",
};

export default function CitiesPage() {
  const cities = getCities();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl">Cities</h1>
      <p className="mt-3 max-w-xl text-muted">Ten cities. Each page lists the four projects and the permit office.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {cities.map((c) => (
          <li key={c.slug} className="py-4 sm:flex sm:items-baseline sm:justify-between">
            <div>
              <Link href={"/city/" + c.slug} className="font-display text-2xl underline-offset-4 hover:underline">{cityLabel(c)}</Link>
              <p className="mt-1 text-sm text-muted">{c.permitDeptName}</p>
            </div>
            <p className="mt-2 text-sm text-muted sm:mt-0">{c.county} County</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
