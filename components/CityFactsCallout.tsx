import type { CityFactsModel } from "@/lib/city-facts";

export function CityFactsCallout({ model }: { model: CityFactsModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
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
    </section>
  );
}
