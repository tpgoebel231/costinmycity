import { costBreakdown } from "@/lib/cost-breakdown";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CostBreakdownTable({
  project,
  city,
  permit,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null | undefined;
}) {
  const model = costBreakdown(project, city, permit);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">Line</th>
            <th className="py-2 text-right font-normal">Typical</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr
              key={row.label}
              className={"border-b border-line last:border-b-0" + (row.emphasis ? " font-medium" : "")}
            >
              <td className="py-2">{row.label}</td>
              <td className="num py-2 text-right">{row.amountLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">{model.caption}</p>
      {model.noteLine ? <p className="mt-1 text-xs text-muted">{model.noteLine}</p> : null}
    </section>
  );
}
