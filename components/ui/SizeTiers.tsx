import { costBySize } from "@/lib/cost-by-size";
import { compactPermitFeeLabel, usd } from "@/lib/format";
import { projectMeta } from "@/lib/projects";
import type { City, Permit, ProjectCost } from "@/lib/types";

/**
 * Name tiers by which side of typical they sit on, nearest first.
 * One tier on a side is Small or Large. Two are Small/Smallest or Large/Largest.
 * Three or more keep the row's own size label.
 */
function tierHeadings(
  rows: { quantity: number; sizeLabel: string }[],
  typicalQty: number,
): string[] {
  const below = rows
    .map((row, index) => ({ row, index }))
    .filter((item) => item.row.quantity < typicalQty)
    .sort((a, b) => b.row.quantity - a.row.quantity);
  const above = rows
    .map((row, index) => ({ row, index }))
    .filter((item) => item.row.quantity > typicalQty)
    .sort((a, b) => a.row.quantity - b.row.quantity);
  const labels = rows.map((row) => (row.quantity === typicalQty ? "Typical" : row.sizeLabel));
  const nameSide = (
    items: { row: { sizeLabel: string }; index: number }[],
    near: string,
    far: string,
  ) => {
    if (items.length >= 3) {
      for (const item of items) labels[item.index] = item.row.sizeLabel;
      return;
    }
    if (items.length === 1) labels[items[0].index] = near;
    if (items.length === 2) {
      labels[items[0].index] = near;
      labels[items[1].index] = far;
    }
  };
  nameSide(below, "Small", "Smallest");
  nameSide(above, "Large", "Largest");
  return labels;
}

export function SizeTiers({
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
  const typicalQty = projectMeta(project.projectSlug).defaultQuantity;
  const bands = tierHeadings(model.rows, typicalQty);

  return (
    <section id="sizes" className="section-gap">
      <h2>{model.heading}</h2>
      <div className="tier-grid mt-4">
        {model.rows.map((row, index) => {
          const isTypical = row.quantity === typicalQty;
          const band = bands[index];
          return (
            <article key={row.quantity + "-" + row.sizeLabel} className={isTypical ? "card tier is-typical" : "card tier"}>
              <h3>{band}</h3>
              <p className="meta mt-1">{row.sizeLabel}</p>
              <p className="num tier-amt">{usd(row.allInTypicalUsd)}</p>
              <p className="meta">Permit {row.permitKnown ? compactPermitFeeLabel(permit, usd(row.permitTypicalUsd)) : "Blank"}</p>
            </article>
          );
        })}
      </div>
      <p className="meta mt-3">{model.note}</p>
    </section>
  );
}
