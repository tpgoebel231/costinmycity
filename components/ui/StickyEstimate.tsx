import { usd } from "@/lib/format";

export function StickyEstimate({ typical }: { typical: number }) {
  return (
    <div className="sticky-est" role="region" aria-label="Estimate" hidden>
      <p>
        Estimate <span className="num" data-calc-mirror="typical">{usd(typical)}</span>
      </p>
      <a href="#calculator" className="btn">Edit</a>
    </div>
  );
}
