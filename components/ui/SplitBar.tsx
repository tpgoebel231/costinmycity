export function SplitBar({ laborPct, materialsPct }: { laborPct: number; materialsPct: number }) {
  return (
    <div className="mt-4">
      <div
        className="split-track"
        role="img"
        aria-label={"Labor " + laborPct + " percent, materials " + materialsPct + " percent"}
      >
        <div className="split-labor" style={{ width: laborPct + "%" }} />
      </div>
      <p className="meta num mt-2">
        Labor {laborPct}% · Materials {materialsPct}%
      </p>
    </div>
  );
}
