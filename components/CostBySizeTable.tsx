import { costBySize } from "@/lib/cost-by-size";
import { sanitizeRendered } from "@/lib/dashes";
import { compactPermitFeeLabel, usd } from "@/lib/format";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CostBySizeTable({
  project,
  city,
  permit,
  nested = false,
  demoteHeading = false,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null | undefined;
  /** When true, render as H3 block inside Cost details (no own section chrome). */
  nested?: boolean;
  /** Omit the inner heading. The summary above already names this table; the caption stays. */
  demoteHeading?: boolean;
}) {
  const model = sanitizeRendered(costBySize(project, city, permit));
  if (!model) return null;

  const Heading = nested ? "h3" : "h2";
  const headingClass = nested ? "font-display text-xl" : "font-display text-2xl";
  const body = (
    <>
      {demoteHeading ? null : (
        <Heading className={headingClass}>
          {model.heading}
        </Heading>
      )}
      <div className="overflow-x-auto"><table className="mt-3 w-full text-sm">
        <caption className="caption-bottom mt-3 text-left text-xs text-muted">{model.note}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 text-left font-normal">Size</th>
            <th scope="col" className="py-2 text-right font-normal">All-in typical</th>
            <th scope="col" className="py-2 text-right font-normal">Permit</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.quantity} className="border-b border-line last:border-b-0">
              <td className="py-2">{row.sizeLabel}</td>
              <td className="num py-2 text-right">{usd(row.allInTypicalUsd)}</td>
              <td className="num py-2 text-right">{row.permitKnown ? compactPermitFeeLabel(permit, usd(row.permitTypicalUsd)) : "Blank"}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="mt-8 max-w-2xl border border-line bg-paper p-4">{body}</section>;
}
