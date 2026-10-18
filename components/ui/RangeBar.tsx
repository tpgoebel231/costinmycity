import { usd } from "@/lib/format";

export function RangeBar({
  low,
  typical,
  high,
  lowLabel,
  highLabel,
}: {
  low: number;
  typical: number;
  high: number;
  lowLabel: string;
  highLabel: string;
}) {
  const span = high - low;
  const ratio = span > 0 ? (typical - low) / span : 0.5;
  const pct = Math.min(100, Math.max(0, ratio * 100));
  const labelPct = Math.min(84, Math.max(16, pct));
  const typicalLabel = usd(typical);

  return (
    <div className="range">
      <p className="sr-only">
        Low {lowLabel}, typical {typicalLabel}, high {highLabel}.
      </p>
      <div className="range-label num" style={{ left: labelPct + "%" }} aria-hidden="true">
        Typical
      </div>
      <div className="range-track" aria-hidden="true">
        <div className="range-fill" />
        <div className="range-dot" style={{ left: pct + "%" }} />
      </div>
      <div className="range-ends num" aria-hidden="true">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
