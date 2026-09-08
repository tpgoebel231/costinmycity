import type { FeeScheduleMetaModel } from "@/lib/fee-schedule-meta";

export function FeeScheduleMeta({ model }: { model: FeeScheduleMetaModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {model.yearLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Schedule year</dt>
            <dd className="num">{model.yearLabel}</dd>
          </div>
        ) : null}
        {model.scheduleUrl ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Official schedule</dt>
            <dd>
              <a href={model.scheduleUrl} className="underline" target="_blank" rel="noreferrer">
                {model.scheduleLinkLabel}
              </a>
            </dd>
          </div>
        ) : null}
        {model.sourceName ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Cited source</dt>
            <dd>{model.sourceName}</dd>
          </div>
        ) : null}
        {model.retrievedLabel ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-muted">Retrieved</dt>
            <dd>{model.retrievedLabel}</dd>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Department</dt>
          <dd>{model.dept}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Recorded municipal fields only. Confirm current fees with {model.dept} before you apply.
      </p>
    </section>
  );
}
