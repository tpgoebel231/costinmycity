import { formatDate, usd } from "@/lib/format";
import { permitCalloutModel } from "@/lib/local-copy";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function PermitCallout({
  city,
  project,
  permit,
}: {
  city: City;
  project: ProjectCost;
  permit: Permit | null | undefined;
}) {
  const model = permitCalloutModel(city, project, permit);

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">Permit in {city.name}</h2>
      {model.kind === "known" ? (
        <>
          <p className="mt-3 text-sm">
            {model.dept} records a typical permit fee of{" "}
            <span className="num text-ink">{usd(model.typicalUsd)}</span> for this {model.job} in{" "}
            {model.city}
            {model.rangeLabel ? (
              <>
                {" "}
                (recorded range {model.rangeLabel})
              </>
            ) : null}
            . Source: {model.sourceName}
            {model.retrievedDate ? ", retrieved " + formatDate(model.retrievedDate) : ""}.
          </p>
          {model.caveat ? <p className="mt-3 text-sm text-warn">{model.caveat}</p> : null}
        </>
      ) : null}
      {model.kind === "unknown" ? (
        <>
          <p className="mt-3 text-sm">
            The permit line for {model.job} in {model.city} is blank because the official schedule
            still needs extraction or is not yet recorded. We do not invent a dollar.
          </p>
          {model.caveat ? <p className="mt-3 text-sm text-warn">{model.caveat}</p> : null}
          {model.calculationNote && model.calculationNote !== model.caveat ? (
            <p className="mt-3 text-xs text-muted">{model.calculationNote}</p>
          ) : null}
          {model.sourceName ? (
            <p className="mt-3 text-xs text-muted">
              Source on file: {model.sourceName}
              {model.retrievedDate ? ", retrieved " + formatDate(model.retrievedDate) : ""}.
            </p>
          ) : null}
        </>
      ) : null}
      {model.kind === "zero" ? (
        <>
          <p className="mt-3 text-sm">
            The recorded typical permit fee is <span className="num text-ink">{usd(0)}</span>
            {model.permitRequired === false
              ? ". The typical path does not require a permit"
              : ""}
            {" "}for this {model.job} in {model.city}.
          </p>
          {model.caveat ? <p className="mt-3 text-sm text-warn">{model.caveat}</p> : null}
          {model.extraNotes.length ? (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {model.extraNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : null}
          {model.sourceName ? (
            <p className="mt-3 text-xs text-muted">
              Source: {model.sourceName}
              {model.retrievedDate ? ", retrieved " + formatDate(model.retrievedDate) : ""}.
            </p>
          ) : null}
        </>
      ) : null}
      {model.kind === "missing" ? (
        <p className="mt-3 text-sm">
          We do not have a permit record for {model.job} in {model.city}, so the permit line is
          blank. Confirm with {model.dept} before you apply.
        </p>
      ) : null}
    </section>
  );
}
