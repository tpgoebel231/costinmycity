import { sanitizeRendered } from "@/lib/dashes";
import type { WageIndexModel } from "@/lib/wage-index";

export function WageIndexCallout({
  model: incoming,
  nested = false,
  demoteHeading = false,
}: {
  model: WageIndexModel | null;
  /** When true, render as H3 block inside Cost details (no own section chrome). */
  nested?: boolean;
  /** Demote the heading to h3 and keep the h2 type size and full heading text. */
  demoteHeading?: boolean;
}) {
  const model = sanitizeRendered(incoming);
  if (!model) return null;

  const heading = nested ? "Metro wage index" : model.heading;
  const Heading = demoteHeading || nested ? "h3" : "h2";
  const headingClass = demoteHeading
    ? "font-display text-2xl h2-size"
    : nested
      ? "font-display text-xl"
      : "font-display text-2xl";
  const body = (
    <>
      <Heading className={headingClass}>
        {heading}
      </Heading>
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
        {model.jobMultiplierSentence ||
          "Labor uses local construction wages for this metro. Materials stay at the national figure."}
      </p>
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="mt-8 max-w-2xl border border-line bg-paper p-4">{body}</section>;
}
