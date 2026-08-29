"use client";

import { useMemo, useState } from "react";
import type { City, Permit, ProjectCost } from "@/lib/types";
import { buildEstimate, extraAmount } from "@/lib/estimates";
import { projectMeta } from "@/lib/projects";
import { feeModelLabel, usd, usdRange } from "@/lib/format";

export function MoneyCalculator({
  project,
  city,
  permit,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null;
}) {
  const meta = projectMeta(project.projectSlug);
  const [qty, setQty] = useState(meta.defaultQuantity);
  const estimate = useMemo(() => buildEstimate(project, city, permit ?? undefined, qty), [project, city, permit, qty]);
  const showQty = meta.slug !== "hvac-replacement" || meta.defaultQuantity !== 1;

  return (
    <div className="space-y-8">
      {showQty ? (
        <div className="border border-line bg-paper p-4">
          <label htmlFor="qty" className="text-sm font-medium">{meta.quantityLabel}</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              id="qty"
              type="number"
              min={meta.quantityMin}
              max={meta.quantityMax}
              step={meta.quantityStep}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || meta.defaultQuantity)}
              className="w-28 border border-line bg-canvas px-3 py-2 num"
            />
            <input
              type="range"
              min={meta.quantityMin}
              max={meta.quantityMax}
              step={meta.quantityStep}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="min-w-[160px] flex-1 accent-accent"
              aria-label={meta.quantityLabel}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{meta.quantityHint}</p>
        </div>
      ) : null}

      <div>
        <p className="text-sm uppercase tracking-wider text-muted">Typical all-in</p>
        <p className="num mt-1 text-5xl leading-none sm:text-6xl">{usd(estimate.allInTypical)}</p>
        <p className="mt-3 text-sm text-muted">
          {estimate.permitKnown
            ? "Job cost plus the recorded local permit fee at this size."
            : "Job cost only. We do not have the official permit fee, so that line is blank."}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-y border-line py-4">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Low</dt>
          <dd className="num mt-1 text-xl">{usd(estimate.allInLow)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">Typical</dt>
          <dd className="num mt-1 text-xl">{usd(estimate.allInTypical)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted">High</dt>
          <dd className="num mt-1 text-xl">{usd(estimate.allInHigh)}</dd>
        </div>
      </dl>

      <section>
        <h2 className="font-display text-2xl">Breakdown</h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            <tr className="border-b border-line"><th className="py-2 text-left font-normal">Labor (allocated)</th><td className="num py-2 text-right">{usd(estimate.job.laborTypical)}</td></tr>
            <tr className="border-b border-line"><th className="py-2 text-left font-normal">Materials (allocated)</th><td className="num py-2 text-right">{usd(estimate.job.materialsTypical)}</td></tr>
            <tr className="border-b border-line"><th className="py-2 text-left font-normal">Job subtotal</th><td className="num py-2 text-right">{usd(estimate.job.typical)}</td></tr>
            <tr className="border-b border-line"><th className="py-2 text-left font-normal">Permit</th><td className="num py-2 text-right">{estimate.permitKnown ? usd(estimate.permitTypical) : "Blank"}</td></tr>
            <tr><th className="py-2 text-left font-medium">All-in typical</th><td className="num py-2 text-right font-medium">{usd(estimate.allInTypical)}</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">Labor is adjusted for construction wages in this metro. Materials stay at the national figure. This is an estimate, not a contractor quote.</p>
      </section>

      <PermitBlock permit={permit} estimateKnown={estimate.permitKnown} typical={estimate.permitTypical} low={estimate.permitLow} high={estimate.permitHigh} />
    </div>
  );
}

function PermitBlock({
  permit, estimateKnown, typical, low, high,
}: {
  permit: Permit | null;
  estimateKnown: boolean;
  typical: number | null;
  low: number | null;
  high: number | null;
}) {
  return (
    <section className="border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">Permit fee</h2>
      {!permit ? (
        <p className="mt-3 text-sm">We do not have a permit record for this city and project.</p>
      ) : !estimateKnown ? (
        <p className="mt-3 text-sm">We do not have this city fee from the official schedule, so the line is blank. The schedule is linked below; we will not guess a number.</p>
      ) : (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Fee model</dt><dd>{feeModelLabel(permit.feeModel)}</dd></div>
          <div><dt className="text-muted">Typical fee</dt><dd className="num">{usd(typical)}</dd></div>
          <div><dt className="text-muted">Range</dt><dd className="num">{usdRange(low, high)}</dd></div>
          <div><dt className="text-muted">Retrieved</dt><dd>{permit.retrievedDate || "Date not recorded"}</dd></div>
        </dl>
      )}
      {permit?.extras?.length ? (
        <ul className="mt-4 space-y-1 text-sm text-muted">
          {permit.extras.map((e, i) => (
            <li key={i}>
              {e.name}{extraAmount(e) != null ? " — " + usd(extraAmount(e)) : ""}
              {e.note ? <span className="block text-xs">{e.note}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {permit?.calculationNote ? <p className="mt-3 text-xs text-muted">{permit.calculationNote}</p> : null}
      {permit?.caveat ? <p className="mt-3 text-sm text-warn">{permit.caveat}</p> : null}
      {permit?.sourceUrl ? (
        <p className="mt-3 text-sm">
          <a href={permit.sourceUrl} className="underline" target="_blank" rel="noreferrer">{permit.sourceName || "Official fee schedule"}</a>
        </p>
      ) : null}
    </section>
  );
}
