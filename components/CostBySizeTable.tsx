import { costBySize } from "@/lib/cost-by-size";
import { usd } from "@/lib/format";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CostBySizeTable({
  project,
  city,
  permit,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null | undefined;
}) {
  const model = costBySize(project, city, permit);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">Size</th>
            <th className="py-2 text-right font-normal">All-in typical</th>
            <th className="py-2 text-right font-normal">Permit</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.quantity} className="border-b border-line last:border-b-0">
              <td className="py-2">{row.sizeLabel}</td>
              <td className="num py-2 text-right">{usd(row.allInTypicalUsd)}</td>
              <td className="num py-2 text-right">{row.permitKnown ? usd(row.permitTypicalUsd) : "Blank"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">{model.note}</p>
    </section>
  );
}
