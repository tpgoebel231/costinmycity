import type { WageIndexModel } from "@/lib/wage-index";

export function WageIndexCallout({ model }: { model: WageIndexModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {model.metroLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Metro</dt>
            <dd>{model.metroLabel}</dd>
          </div>
        ) : null}
        {model.meanHourlyLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Metro construction mean hourly</dt>
            <dd className="num">{model.meanHourlyLabel}</dd>
          </div>
        ) : null}
        {model.vintageLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Metro OEWS vintage</dt>
            <dd>{model.vintageLabel}</dd>
          </div>
        ) : null}
        {model.nationalMeanHourlyLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">National construction mean hourly</dt>
            <dd className="num">{model.nationalMeanHourlyLabel}</dd>
          </div>
        ) : null}
        {model.nationalVintageLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">National OEWS vintage</dt>
            <dd>{model.nationalVintageLabel}</dd>
          </div>
        ) : null}
        {model.laborWageMultiplierLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Labor wage multiplier</dt>
            <dd className="num">{model.laborWageMultiplierLabel}</dd>
          </div>
        ) : null}
        {model.methodLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Method</dt>
            <dd>{model.methodLabel}</dd>
          </div>
        ) : null}
        {model.sourceUrl ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Metro source</dt>
            <dd>
              <a href={model.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                {model.sourceLinkLabel}
              </a>
            </dd>
          </div>
        ) : null}
        {model.nationalSourceUrl ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">National source</dt>
            <dd>
              <a href={model.nationalSourceUrl} className="underline" target="_blank" rel="noreferrer">
                {model.nationalSourceLinkLabel}
              </a>
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="mt-3 text-xs text-muted">
        Recorded BLS OEWS fields only. Labor is wage-indexed for this metro; materials stay at the national figure.
      </p>
    </section>
  );
}
