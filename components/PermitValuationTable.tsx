import { permitValuationTable } from "@/lib/permit-valuation";
import type { Permit } from "@/lib/types";

export function PermitValuationTable({ permit }: { permit: Permit | null | undefined }) {
  const model = permitValuationTable(permit);
  if (!model) return null;

  return (
    <div className="mt-6 border-t border-line pt-4">
      <h3 className="font-display text-xl">Assumed project value</h3>
      <table className="mt-3 w-full text-sm">
        <caption className="caption-bottom mt-3 text-left text-xs text-muted">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">Band</th>
            <th className="py-2 text-right font-normal">Assumed project value</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.band} className="border-b border-line last:border-b-0">
              <td className="py-2">{row.band}</td>
              <td className="num py-2 text-right">{row.valueLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
