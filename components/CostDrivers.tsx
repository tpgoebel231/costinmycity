import { costDrivers } from "@/lib/cost-drivers";
import type { City, Permit, ProjectCost } from "@/lib/types";

export function CostDrivers({
  project,
  city,
  permit,
  nested = false,
}: {
  project: ProjectCost;
  city: City;
  permit: Permit | null | undefined;
  /** When true, render as H3 block inside Cost details (no own section chrome). */
  nested?: boolean;
}) {
  const model = costDrivers(project, city, permit);
  if (!model) return null;

  const Heading = nested ? "h3" : "h2";
  const Sub = nested ? "h4" : "h3";
  const body = (
    <>
      <Heading className={nested ? "font-display text-xl" : "font-display text-2xl"}>
        {model.heading}
      </Heading>
      {model.included.length ? (
        <>
          <Sub className={"font-display " + (nested ? "mt-4 text-base" : "mt-4 text-lg")}>
            Usually included
          </Sub>
          <ul className="mt-2 space-y-1 text-sm">
            {model.included.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </>
      ) : null}
      {model.drivers.length ? (
        <>
          <Sub className={"font-display " + (nested ? "mt-4 text-base" : "mt-4 text-lg")}>
            What changes the total
          </Sub>
          <ul className="mt-2 space-y-1 text-sm">
            {model.drivers.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );

  if (nested) {
    return <div className="mt-6 border-t border-line pt-4">{body}</div>;
  }

  return <section className="mt-8 max-w-2xl border border-line bg-paper p-4">{body}</section>;
}
