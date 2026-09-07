import { permitExtrasTable } from "@/lib/permit-extras";
import type { Permit } from "@/lib/types";

export function PermitExtrasTable({ permit }: { permit: Permit | null | undefined }) {
  const model = permitExtrasTable(permit);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <table className="mt-3 w-full text-sm">
        <caption className="caption-bottom mt-3 text-left text-xs text-muted">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">Line item</th>
            <th className="py-2 text-right font-normal">Fee</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row, i) => (
            <tr key={row.name + "-" + i} className="border-b border-line last:border-b-0">
              <td className="py-2">{row.name}</td>
              <td className="num py-2 text-right">{row.feeLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
