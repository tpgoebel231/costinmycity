import Link from "next/link";
import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";

export function FeaturedCities({
  featured,
  totalCount,
  stateCount,
}: {
  featured: City[];
  totalCount: number;
  stateCount: number;
}) {
  return (
    <div>
      <p>
        {totalCount} cities in {stateCount} states.{" "}
        <Link href="/cities">Browse all {totalCount} cities</Link>
      </p>
      <ul className="city-grid mt-4">
        {featured.map((city) => (
          <li key={city.slug}>
            <Link href={"/city/" + city.slug} className="city-card">
              {cityLabel(city)}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <Link href="/cities">All cities</Link>
        <span className="meta">; search by name or jump by state.</span>
      </p>
    </div>
  );
}
