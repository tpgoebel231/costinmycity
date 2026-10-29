import Link from "next/link";
import { sanitizeCopy } from "@/lib/dashes";
import { stateJobPermitsBlock } from "@/lib/state-job-permits";
import type { City } from "@/lib/types";

export function CostStateJobPermits({ city, projectSlug }: { city: City; projectSlug: string }) {
  const block = stateJobPermitsBlock(city, projectSlug);
  if (!block) return null;
  return (
    <section id="state-job-permits" className="section-gap">
      <h2>{sanitizeCopy(block.heading)}</h2>
      <ul className="mt-3 space-y-1">
        {block.items.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{sanitizeCopy(item.label)}</Link>
            {item.detail ? <span>{": " + sanitizeCopy(item.detail)}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
