import type { City, Permit, ProjectCost } from "@/lib/types";
import { assumptionParagraphs } from "@/lib/local-copy";

export function Assumptions({
  city,
  project,
  permit,
}: {
  city: City;
  project: ProjectCost;
  permit: Permit | null | undefined;
}) {
  const paragraphs = assumptionParagraphs(city, project, permit);
  if (!paragraphs.length) return null;
  return (
    <section className="mt-8 max-w-2xl">
      <h2 className="font-display text-2xl">What we assumed</h2>
      {paragraphs.map((text, i) => (
        <p key={i} className="mt-3 text-sm text-muted">
          {text}
        </p>
      ))}
    </section>
  );
}
