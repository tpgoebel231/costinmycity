import { sanitizeRendered } from "@/lib/dashes";
import type { TypicalJobSpecCalloutModel } from "@/lib/typical-job-spec-callout";

export function TypicalJobSpecCallout({
  model: incoming,
}: {
  model: TypicalJobSpecCalloutModel | null;
}) {
  const model = sanitizeRendered(incoming);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Typical scope</dt>
          <dd>{model.typicalLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Low scope</dt>
          <dd>{model.lowLabel}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">High scope</dt>
          <dd>{model.highLabel}</dd>
        </div>
        {model.valuationTypicalLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Project value for permit formula (typical)</dt>
            <dd className="num">{model.valuationTypicalLabel}</dd>
          </div>
        ) : null}
        {model.valuationLowLabel && model.valuationHighLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Project value range for permit formula</dt>
            <dd className="num">
              {model.valuationLowLabel} to {model.valuationHighLabel}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-sm">{model.why}</p>
      {model.valuationWhy && !model.valuationOmittedNote ? (
        <p className="mt-2 text-sm text-muted">{model.valuationWhy}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {model.valuationOmittedNote
          ? model.valuationOmittedNote
          : "Typical job sizes and assumed values from our published sources. Assumed values feed the permit formula. They are not the city's assessed value."}
      </p>
    </section>
  );
}
