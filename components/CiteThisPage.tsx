import { citeThisPageModel } from "@/lib/cite-page";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CiteThisPage({
  city,
  project,
  permit,
  path,
}: {
  city: City;
  project: ProjectCost;
  permit: Permit | null | undefined;
  path: string;
}) {
  const model = citeThisPageModel(city, project, permit, path);

  return (
    <div className="mt-6 max-w-2xl border border-line bg-paper p-4">
      <h3 className="font-display text-xl">Cite this page</h3>
      {model.retrievedLabel ? (
        <p className="mt-3 font-medium">{model.retrievedLabel}</p>
      ) : null}
      <p className="mt-3 whitespace-pre-wrap text-sm">{model.citationText}</p>
      {model.sourceUrl ? (
        <p className="mt-3 text-sm">
          <a href={model.sourceUrl} className="underline" target="_blank" rel="noreferrer">
            {model.sourceName || "Official fee schedule"}
          </a>
        </p>
      ) : null}
    </div>
  );
}
