import Link from "next/link";
import { cityHubJobs } from "@/lib/city-hub-jobs";
import { sanitizeRendered } from "@/lib/dashes";
import { usd } from "@/lib/format";
import type { City } from "@/lib/types";

export function CityHubJobsTable({
  city,
  hideHeading = false,
}: {
  city: City;
  /** The parent fold summary already shows the heading. */
  hideHeading?: boolean;
}) {
  const model = sanitizeRendered(cityHubJobs(city));
  if (!model) return null;

  const table = (
    <div className="overflow-x-auto">
      <table className="mt-3 w-full">
        <caption className="caption-bottom mt-3 text-left">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 text-left font-normal">Job</th>
            <th scope="col" className="py-2 text-right font-normal">All-in typical</th>
            <th scope="col" className="py-2 text-right font-normal">Permit</th>
            <th scope="col" className="py-2 text-right font-normal">Open</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.projectSlug} className="border-b border-line last:border-b-0">
              <td className="py-2">
                <Link href={row.href}>
                  {row.jobLabel}
                </Link>
              </td>
              <td className="num py-2 text-right">{usd(row.allInTypicalUsd)}</td>
              <td className="num py-2 text-right">{row.permitLabel}</td>
              <td className="py-2 text-right">
                <Link href={row.href}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (hideHeading) return table;

  return (
    <section className="card mt-8">
      <h2>{model.heading}</h2>
      {table}
    </section>
  );
}
