import Link from "next/link";
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
  const model = typicalJobSpecForCity(city);
  if (!model) return null;

  const heading = nested ? "Typical jobs" : model.heading;
  const Heading = nested ? "h3" : "h2";
  const body = (
    <>
      <Heading className={nested ? "font-display text-xl" : "font-display text-2xl"}>
        {heading}
      </Heading>
      <table className="mt-3 w-full text-sm">
        <caption className="caption-bottom mt-3 text-left text-xs text-muted">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">Job</th>
            <th className="py-2 text-left font-normal">Typical scope</th>
            <th className="py-2 text-right font-normal">Assumed valuation</th>
            <th className="py-2 text-right font-normal">Open</th>
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
                {row.valuationTypicalLabel ?? "—"}
              </td>
              <td className="py-2 text-right">
                <Link href={row.href} className="underline">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="mt-10 max-w-2xl border border-line bg-paper p-4">{body}</section>;
}
