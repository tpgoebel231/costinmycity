import Link from "next/link";
import { cityLabel } from "@/lib/data-client";
import { sanitizeRendered } from "@/lib/dashes";
import { inlineProjectName } from "@/lib/projects";
import { typicalJobSpecForCity } from "@/lib/typical-job-spec-callout";
import type { City } from "@/lib/types";

export function CityHubTypicalJobSpecTable({
  city,
  nested = false,
}: {
  city: City;
  /** When true, render as H3 block inside Local context (no own section chrome). */
  nested?: boolean;
}) {
  const model = sanitizeRendered(typicalJobSpecForCity(city));
  if (!model) return null;

  const heading = nested ? "Typical jobs" : model.heading;
  const Heading = nested ? "h3" : "h2";
  const body = (
    <>
      <Heading>
        {heading}
      </Heading>
      <div className="overflow-x-auto"><table className="mt-3 w-full">
        <caption className="caption-bottom mt-3 text-left">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 text-left font-normal">Job</th>
            <th scope="col" className="py-2 text-left font-normal">Typical scope</th>
            <th scope="col" className="py-2 text-right font-normal">Assumed valuation</th>
            <th scope="col" className="py-2 text-right font-normal">Open</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.projectSlug} className="border-b border-line last:border-b-0">
              <td className="py-2">
                <Link href={row.href} className="underline">
                  {row.jobLabel}
                </Link>
              </td>
              <td className="py-2">{row.typicalLabel}</td>
              <td className="num py-2 text-right">
                {row.valuationTypicalLabel ?? "\u2013"}
              </td>
              <td className="py-2 text-right">
                <Link href={row.href} className="underline">
                  Open
                  <span className="sr-only">
                    {" " + inlineProjectName(row.projectSlug) + " cost in " + cityLabel(city)}
                  </span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="card mt-8">{body}</section>;
}
