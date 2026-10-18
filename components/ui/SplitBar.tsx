export function SplitBar({ laborPct, materialsPct }: { laborPct: number; materialsPct: number }) {
  return (
    <div className="mt-4">
      <div className="split-track" aria-hidden="true">
        <div className="split-labor" style={{ width: laborPct + "%" }} />
      </div>
      <p className="meta num mt-2">
        Labor is {laborPct} percent of the job cost. Materials are {materialsPct} percent.
      </p>
    </div>
  );
}
