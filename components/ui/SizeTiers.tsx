import { costBySize } from "@/lib/cost-by-size";
import { compactPermitFeeLabel, usd } from "@/lib/format";
import { projectMeta } from "@/lib/projects";
import type { City, Permit, ProjectCost } from "@/lib/types";

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

  return (
    <section id="sizes" className="section-gap">
      <h2>{model.heading}</h2>
      <div className="tier-grid mt-4">
        {model.rows.map((row) => {
          const isTypical = row.quantity === typicalQty;
          const band = isTypical ? "Typical" : row.quantity < typicalQty ? "Small" : "Large";
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
