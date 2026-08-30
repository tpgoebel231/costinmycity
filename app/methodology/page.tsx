import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getProjectCostsFile } from "@/lib/data";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "How we estimate home project costs by city",
  description: "How CostInMyCity builds a city estimate: national job cost, local wage adjustment, official permit schedule.",
  path: "/methodology",
});

export default function MethodologyPage() {
  const file = getProjectCostsFile();
  const wage = file?.nationalWageIndex;

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "How we estimate home project costs by city", path: "/methodology" },
        ])}
      />
      <h1 className="font-display text-4xl">Methodology</h1>
      <p className="mt-4">Three pieces, kept separate on purpose: a national job-cost range, a city labor adjustment, and a permit fee copied or computed from the official schedule.</p>

      <h2 className="font-display mt-8 text-2xl">Why the city number</h2>
      <p className="mt-3">A national average hides both wage differences and permit rules. Seattle and Nashville do not charge the same fee for the same deck. The useful number is the city number.</p>

      <h2 className="font-display mt-8 text-2xl">Job cost</h2>
      <p className="mt-3">National low / typical / high come from published 2026 industry ranges (cited on each project page). We do not invent a local bid survey. City adjustment is a BLS construction-and-extraction wage index applied to the labor share only. Materials stay at national.</p>
      {wage ? (
        <p className="mt-3 text-sm text-muted">{wage.method} National mean {wage.nationalMeanHourlyUsd != null ? "$" + wage.nationalMeanHourlyUsd.toFixed(2) : "n/a"}/hr ({wage.vintage}). {wage.sourceUrl ? <a href={wage.sourceUrl} className="underline" target="_blank" rel="noreferrer">BLS OEWS</a> : null}</p>
      ) : null}

      <h2 className="font-display mt-8 text-2xl">Permit fees</h2>
      <p className="mt-3">Fees are either copied from an official schedule or computed from an official formula at a documented assumed valuation. Assumed valuations are not city-assessed values. We cite the city&apos;s published schedule, not a third-party calculator.</p>
      <p className="mt-3">If the official table could not be extracted, the fee is left blank. We show that we do not have this city fee yet and link the portal. We do not fill the gap with a guess. Charlotte and Minneapolis permit fees were filled from official schedules as of 2026-08-29.</p>

      <h2 className="font-display mt-8 text-2xl">Limitations</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
        <li>Ranges are typical, not a bid. Site conditions, access, and material grade move the number.</li>
        <li>Permit extras (plan review, tech fees, state surcharges) are included only when the source record says they are.</li>
        <li>Fee schedules change. The retrieved date is on the money page. Confirm with the city before you apply.</li>
        <li>Deck board prices in the calculator are user-enterable defaults, not a cited 2026 SKU survey.</li>
      </ul>
      <p className="mt-6 text-sm"><Link href="/about" className="underline">About</Link></p>
    </article>
  );
}
