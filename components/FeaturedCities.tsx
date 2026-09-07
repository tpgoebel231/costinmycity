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
      <p className="text-sm text-muted">
        {totalCount} cities in {stateCount} states.{" "}
        <Link href="/cities" className="text-accent underline">
          Browse all {totalCount} cities
        </Link>
      </p>
      <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3">
        {featured.map((c) => (
          <li key={c.slug}>
            <Link
              href={"/city/" + c.slug}
              className="font-medium underline-offset-4 hover:underline"
            >
              {cityLabel(c)}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <Link href="/cities" className="text-accent underline">
          All cities
        </Link>
        <span className="text-muted"> — search by name or jump by state.</span>
      </p>
    </div>
  );
}
