import type { CityFactsModel } from "@/lib/city-facts";

export function CityFactsCallout({
  model,
  nested = false,
}: {
  model: CityFactsModel | null;
  /** When true, render as H3 block inside Local context (no own section chrome). */
  nested?: boolean;
}) {
  if (!model) return null;

  const heading = nested ? "City facts" : model.heading;
  const Heading = nested ? "h3" : "h2";
  const body = (
    <>
      <Heading className={nested ? "font-display text-xl" : "font-display text-2xl"}>
        {heading}
      </Heading>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">County</dt>
          <dd>{model.countyLabel}</dd>
        </div>
        {model.populationLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Population</dt>
            <dd className="num">{model.populationLabel}</dd>
          </div>
        ) : null}
        {model.yearLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Estimate year</dt>
            <dd className="num">{model.yearLabel}</dd>
          </div>
        ) : null}
        {model.sourceLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Source</dt>
            <dd>{model.sourceLabel}</dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs text-muted">
        Recorded Census and county fields only. Figures are estimates, not a permit requirement.
      </p>
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="mt-8 max-w-2xl border border-line bg-paper p-4">{body}</section>;
}
