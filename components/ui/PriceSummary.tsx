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
  return (
    <aside className="price-summary card" aria-label="Price summary">
      <p className="eyebrow">Typical</p>
      <p className="hero-num mt-2 text-[40px]" data-calc-mirror="typical">{usd(typical)}</p>
      <p className="mt-3">
        Most projects <span className="chip num"><span data-calc-mirror="low">{usd(low)}</span> to <span data-calc-mirror="high">{usd(high)}</span></span>
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
