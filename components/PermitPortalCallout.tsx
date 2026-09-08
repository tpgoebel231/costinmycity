import type { PermitPortalModel } from "@/lib/permit-portal";

export function PermitPortalCallout({ model }: { model: PermitPortalModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Department</dt>
          <dd>{model.dept}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="font-medium text-muted">Apply online</dt>
          <dd>
            <a href={model.portalUrl} className="underline" target="_blank" rel="noreferrer">
              {model.portalLinkLabel}
            </a>
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted">
        Recorded municipal fields only. Confirm current requirements with {model.dept} before you
        apply.
      </p>
    </section>
  );
}
