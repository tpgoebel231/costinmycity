import type { LaborMaterialsSplitModel } from "@/lib/labor-materials-split";

export function LaborMaterialsSplitCallout({
  model,
}: {
  model: LaborMaterialsSplitModel | null;
}) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Labor share</dt>
          <dd className="num">{model.laborPctLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Materials share</dt>
          <dd className="num">{model.materialsPctLabel}</dd>
        </div>
        {model.sourceUrl ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Cost source</dt>
            <dd>
              <a href={model.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                {model.sourceName || "Published cost guide"}
              </a>
            </dd>
          </div>
        ) : model.sourceName ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Cost source</dt>
            <dd>{model.sourceName}</dd>
          </div>
        ) : null}
      </dl>
      {model.note ? <p className="mt-3 text-sm text-muted">{model.note}</p> : null}
      <p className="mt-3 text-xs text-muted">
        Recorded project allocation only. Used for wage-index math on the labor share; not a surveyed local contractor split.
      </p>
    </section>
  );
}
