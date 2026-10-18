"use client";

import { useEffect, useState } from "react";
import { usd } from "@/lib/format";

export function PriceSummary({
  typical,
  low,
  high,
  dept,
}: {
  typical: number;
  low: number;
  high: number;
  dept: string;
}) {
  const [values, setValues] = useState({ typical, low, high });

  useEffect(() => {
    function onEstimate(event: Event) {
      const detail = (event as CustomEvent<{ typical: number; low: number; high: number }>).detail;
      if (!detail || typeof detail.typical !== "number") return;
      setValues(detail);
    }
    window.addEventListener("cim-estimate", onEstimate);
    return () => window.removeEventListener("cim-estimate", onEstimate);
  }, []);

  return (
    <aside className="price-summary card" aria-label="Price summary">
      <p className="eyebrow">Typical</p>
      <p className="hero-num mt-2 text-[40px]">{usd(values.typical)}</p>
      <p className="mt-3">
        Most projects <span className="chip num">{usd(values.low)} to {usd(values.high)}</span>
      </p>
      <p className="mt-4">
        <a href="#calculator">Edit in the calculator</a>
      </p>
      <p className="mt-2">
        <a href="#permit">Check your permit</a>
      </p>
      <p className="meta mt-4">Estimates, not quotes. Verify the fee with {dept} before you apply.</p>
    </aside>
  );
}
