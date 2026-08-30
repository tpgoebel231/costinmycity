import { localSourcingSentences } from "@/lib/sourcing";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function SourcingCopy({
  city,
  project,
  permit,
}: {
  city: City;
  project: ProjectCost;
  permit: Permit | null | undefined;
}) {
  const sentences = localSourcingSentences(city, project, permit);
  if (!sentences.length) return null;
  return (
    <section className="mt-6 max-w-2xl">
      {sentences.map((text, i) => (
        <p key={i} className="mt-3 text-sm">
          {text}
        </p>
      ))}
    </section>
  );
}
