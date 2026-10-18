import { sanitizeRendered } from "@/lib/dashes";
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
  const paragraphs = sanitizeRendered(assumptionParagraphs(city, project, permit));
  if (!paragraphs.length) return null;
  return (
    <details id="assumptions" className="fold">
      <summary>
        <h2 className="fold-title">What we assumed</h2>
      </summary>
      {paragraphs.map((text, i) => (
        <p key={i} className="mt-3">
          {text}
        </p>
      ))}
    </details>
  );
}
