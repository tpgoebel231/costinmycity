import Link from "next/link";
import { keepHvac } from "@/lib/seo";
import type { RelatedMoneyGroups } from "@/lib/related-links";

export function RelatedMoneyLinks({
  groups,
  cityName,
}: {
  groups: RelatedMoneyGroups;
  cityName: string;
}) {
  const hasInCity = groups.inCity.length > 0;
  const hasSameJob = Boolean(groups.sameJob.length && groups.sameJobHeading);

  return (
    <section className="mt-10 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">Related</h2>
      {hasInCity ? (
        <>
          <h3 className="mt-4 font-display text-xl">In {cityName}</h3>
          <ul className="mt-3 space-y-1 text-sm">
            {groups.inCity.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline">
                  {keepHvac(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {hasSameJob ? (
        <>
          <h3 className={"font-display text-xl" + (hasInCity ? " mt-6" : " mt-4")}>
            {groups.sameJobHeading}
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            {groups.sameJob.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline">
                  {keepHvac(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className={hasInCity || hasSameJob ? "mt-4 text-sm" : "mt-3 text-sm"}>
        <Link href={groups.indexHref} className="underline">
          {keepHvac(groups.indexLabel)}
        </Link>
      </p>
    </section>
  );
}
