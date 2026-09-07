import { costDrivers } from "@/lib/cost-drivers";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CostDrivers({
  project,
  city,
  permit,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null | undefined;
}) {
  const model = costDrivers(project, city, permit);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      {model.included.length ? (
        <>
          <h3 className="font-display mt-4 text-lg">Usually included</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {model.included.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </>
      ) : null}
      {model.drivers.length ? (
        <>
          <h3 className="font-display mt-4 text-lg">What changes the total</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {model.drivers.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
