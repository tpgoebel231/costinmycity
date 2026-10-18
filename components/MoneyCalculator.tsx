"use client";

import { useEffect, useMemo, useState } from "react";
import type { City, Permit, ProjectCost } from "@/lib/types";
import { buildEstimate, permitDisplayUsd } from "@/lib/estimates";
import { highBandFootnote } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import { usd } from "@/lib/format";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
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
  const [qty, setQty] = useState(meta.defaultQuantity);
  const estimate = useMemo(
    () => buildEstimate(project, city, permit ?? undefined, qty),
    [project, city, permit, qty],
  );
  const highNote = highBandFootnote(project);
  const permitUsd = permitDisplayUsd(estimate);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("qty") ?? params.get("sf");
    if (raw == null || raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    setQty(clamp(n, meta.quantityMin, meta.quantityMax));
  }, [meta.quantityMin, meta.quantityMax]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("cim-estimate", {
        detail: {
          typical: estimate.allInTypical,
          low: estimate.allInLow,
          high: estimate.allInHigh,
        },
      }),
    );
  }, [estimate.allInTypical, estimate.allInLow, estimate.allInHigh]);

  function commit(n: number) {
    if (!Number.isFinite(n)) return;
    const next = clamp(n, meta.quantityMin, meta.quantityMax);
    setQty(next);
    const url = new URL(window.location.href);
    url.searchParams.set("qty", String(next));
    if (meta.pricing === "per-unit") url.searchParams.set("sf", String(next));
    url.searchParams.delete("finish");
    const query = url.searchParams.toString();
    window.history.replaceState(null, "", url.pathname + (query ? "?" + query : "") + url.hash);
  }

  function onNumber(raw: string) {
    if (raw.trim() === "") return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    commit(n);
  }

  return (
    <section
      id="calculator"
      className="card"
      aria-label="Calculator"
      data-calc-default={estimate.allInTypical}
      data-qty={meta.defaultQuantity}
    >
      <div aria-live="polite" aria-atomic="true">
        <p className="eyebrow">Estimate</p>
        <p className="num calc-estimate">{usd(estimate.allInTypical)}</p>
        <p className="mt-2">
          Most projects <span className="num">{usd(estimate.allInLow)} to {usd(estimate.allInHigh)}</span>
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
            <span className="num">{usd(estimate.job.laborTypical)}</span>
          </div>
          <div className="calc-row">
            <span>Materials (allocated)</span>
            <span className="num">{usd(estimate.job.materialsTypical)}</span>
          </div>
          <div className="calc-row">
            <span>Job subtotal</span>
            <span className="num">{usd(estimate.job.typical)}</span>
          </div>
          <div className="calc-row">
            <span>Permit</span>
            <span className="num">
              {estimate.permitKnown ? usd(permitUsd) : "Blank"}
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
            <span className="num">{usd(estimate.allInTypical)}</span>
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
          value={qty}
          aria-label={meta.quantityLabel}
          onChange={(event) => commit(Number(event.target.value))}
        />
        <input
          id="qty-num"
          className="num"
          type="number"
          min={meta.quantityMin}
          max={meta.quantityMax}
          step={meta.quantityStep}
          value={qty}
          onChange={(event) => onNumber(event.target.value)}
        />
        <p className="meta mt-2">{meta.quantityHint}</p>
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
