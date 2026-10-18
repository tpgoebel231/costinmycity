import type { City, Permit, ProjectCost } from "@/lib/types";
import { buildEstimate, permitDisplayUsd } from "@/lib/estimates";
import { highBandFootnote } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { usd } from "@/lib/format";

function attr(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "";
  return String(n);
}

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
  const estimate = buildEstimate(project, city, permit ?? undefined, meta.defaultQuantity);
  const highNote = highBandFootnote(project);
  const permitUsd = permitDisplayUsd(estimate);
  const adj = project.cityAdjustments?.[city.slug];
  const multiplier = adj?.multiplier ?? 1;
  const laborShare = project.laborShare ?? 0.5;

  return (
    <section
      id="calculator"
      className="card"
      aria-label="Calculator"
      data-calc-default={estimate.allInTypical}
      data-qty={meta.defaultQuantity}
      data-pricing={meta.pricing}
      data-default-qty={meta.defaultQuantity}
      data-min={meta.quantityMin}
      data-max={meta.quantityMax}
      data-step={meta.quantityStep}
      data-n-low={project.nationalLow}
      data-n-typ={project.nationalTypical}
      data-n-high={project.nationalHigh}
      data-mult={multiplier}
      data-labor={laborShare}
      data-fee-model={permit?.feeModel || ""}
      data-fee-low={attr(permit?.feeLowUsd)}
      data-fee-typ={attr(permit?.feeTypicalUsd)}
      data-fee-high={attr(permit?.feeHighUsd)}
    >
      <div aria-live="polite" aria-atomic="true">
        <p className="eyebrow">Estimate</p>
        <p className="num calc-estimate" data-calc-mirror="typical">{usd(estimate.allInTypical)}</p>
        <p className="mt-2">
          Most projects <span className="num"><span data-calc-mirror="low">{usd(estimate.allInLow)}</span> to <span data-calc-mirror="high">{usd(estimate.allInHigh)}</span></span>
        </p>
        <p className="meta mt-2">
          {estimate.permitKnown
            ? "Job cost plus the local permit fee at this size."
            : "Job cost only. The city has not published the permit fee, so that line is blank."}
        </p>
        {highNote ? <p className="meta mt-2">{highNote}</p> : null}
        <div className="mt-3">
          <div className="calc-row">
            <span>Labor (allocated)</span>
            <span className="num" data-calc-mirror="labor">{usd(estimate.job.laborTypical)}</span>
          </div>
          <div className="calc-row">
            <span>Materials (allocated)</span>
            <span className="num" data-calc-mirror="materials">{usd(estimate.job.materialsTypical)}</span>
          </div>
          <div className="calc-row">
            <span>Job subtotal</span>
            <span className="num" data-calc-mirror="job">{usd(estimate.job.typical)}</span>
          </div>
          <div className="calc-row">
            <span>Permit</span>
            <span className="num">
              <span data-calc-mirror="permit">{estimate.permitKnown ? usd(permitUsd) : "Blank"}</span>
              {estimate.permitKnown && permit?.sourceUrl ? (
                <>
                  {" "}
                  <a href={permit.sourceUrl} target="_blank" rel="noreferrer">Source</a>
                </>
              ) : null}
            </span>
          </div>
          <div className="calc-total">
            <span>All-in typical</span>
            <span className="num" data-calc-mirror="allin">{usd(estimate.allInTypical)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="qty-num">{meta.quantityLabel}</label>
        <input
          id="qty-range"
          type="range"
          min={meta.quantityMin}
          max={meta.quantityMax}
          step={meta.quantityStep}
          defaultValue={meta.defaultQuantity}
          aria-label={meta.quantityLabel}
          aria-describedby="qty-hint"
        />
        <input
          id="qty-num"
          className="num"
          type="number"
          min={meta.quantityMin}
          max={meta.quantityMax}
          step={meta.quantityStep}
          defaultValue={meta.defaultQuantity}
          aria-describedby="qty-hint"
        />
        <p id="qty-hint" className="meta mt-2">{meta.quantityHint}</p>
      </div>
      <p className="meta mt-3">
        Labor is adjusted for construction wages in this metro. Materials stay at the national figure. This is an estimate, not a contractor quote.
      </p>
      <p className="mt-3">
        <a href="/methodology/">How we calculate</a>
      </p>
    </section>
  );
}
