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
  return (
    <section className="mt-10 max-w-2xl border border-line bg-paper p-4">
      {groups.inCity.length ? (
        <>
          <h2 className="font-display text-2xl">Related in {cityName}</h2>
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
      {groups.sameJob.length && groups.sameJobHeading ? (
        <>
          <h2 className={"font-display text-2xl" + (groups.inCity.length ? " mt-6" : "")}>
            {groups.sameJobHeading}
          </h2>
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
      <p className={groups.inCity.length || groups.sameJob.length ? "mt-4 text-sm" : "text-sm"}>
        <Link href={groups.indexHref} className="underline">
          {keepHvac(groups.indexLabel)}
        </Link>
      </p>
    </section>
  );
}
