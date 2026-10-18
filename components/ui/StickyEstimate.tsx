"use client";

import { useEffect, useState } from "react";
import { usd } from "@/lib/format";

export function StickyEstimate({
  typical,
  low,
  high,
}: {
  typical: number;
  low: number;
  high: number;
}) {
  const [values, setValues] = useState({ typical, low, high });
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onEstimate(event: Event) {
      const detail = (event as CustomEvent<{ typical: number; low: number; high: number }>).detail;
      if (!detail || typeof detail.typical !== "number") return;
      setValues(detail);
    }
    window.addEventListener("cim-estimate", onEstimate);
    return () => window.removeEventListener("cim-estimate", onEstimate);
  }, []);

  useEffect(() => {
    const el = document.getElementById("calculator");
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      const past = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      setShow(past);
      document.body.classList.toggle("has-sticky-est", past && window.innerWidth < 1100);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      document.body.classList.remove("has-sticky-est");
    };
  }, []);

  if (!show) return null;

  return (
    <div className="sticky-est" role="region" aria-label="Estimate">
      <p>
        Estimate <span className="num">{usd(values.typical)}</span>
      </p>
      <a href="#calculator" className="btn">Edit</a>
    </div>
  );
}
