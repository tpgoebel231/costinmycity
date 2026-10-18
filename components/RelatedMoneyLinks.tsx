import Link from "next/link";
import { sanitizeCopy, sanitizeRendered } from "@/lib/dashes";
import { keepHvac } from "@/lib/seo";
import type { RelatedMoneyGroups } from "@/lib/related-links";

export function RelatedMoneyLinks({
  groups: incoming,
  cityName,
}: {
  groups: RelatedMoneyGroups;
  cityName: string;
}) {
  const groups = sanitizeRendered(incoming);
  const place = sanitizeCopy(cityName);
  const hasInCity = groups.inCity.length > 0;
  const hasSameJob = Boolean(groups.sameJob.length && groups.sameJobHeading);

  return (
    <section id="related" className="section-gap">
      <h2>Related</h2>
      {hasInCity ? (
        <>
          <h3 className="mt-4">In {place}</h3>
          <ul className="nearby-grid mt-3">
            {groups.inCity.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nearby-card">
                  {keepHvac(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {hasSameJob ? (
        <>
          <h3 className={hasInCity ? "mt-6" : "mt-4"}>{groups.sameJobHeading}</h3>
          <ul className="nearby-grid mt-3">
            {groups.sameJob.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="nearby-card">
                  {keepHvac(item.label)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className={hasInCity || hasSameJob ? "mt-4" : "mt-3"}>
        <Link href={groups.indexHref} className="underline">
          {keepHvac(groups.indexLabel)}
        </Link>
      </p>
    </section>
  );
}
