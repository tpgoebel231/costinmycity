import type { FeeModelCalloutModel } from "@/lib/fee-model-callout";

export function FeeModelCallout({ model }: { model: FeeModelCalloutModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {model.modelLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Fee model</dt>
            <dd>{model.modelLabel}</dd>
          </div>
        ) : null}
        {model.sourceUrl ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Cited schedule</dt>
            <dd>
              <a href={model.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                {model.sourceName || "Official fee source"}
              </a>
            </dd>
          </div>
        ) : model.sourceName ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Cited schedule</dt>
            <dd>{model.sourceName}</dd>
          </div>
        ) : null}
      </dl>
      {model.calculationNote ? (
        <p className="mt-3 text-sm">{model.calculationNote}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        Recorded permit-row fields only. Not a substitute for the live municipal calculator.
      </p>
    </section>
  );
}
