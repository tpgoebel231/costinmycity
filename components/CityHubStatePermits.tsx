import Link from "next/link";
import { sanitizeCopy } from "@/lib/dashes";
import { statePermitsBlock } from "@/lib/state-permits";
import type { City } from "@/lib/types";

export function CityHubStatePermits({ city }: { city: City }) {
  const block = statePermitsBlock(city);
  if (!block) return null;
  return (
    <section id="state-permits" className="section-gap">
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
