import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PermitsStateJump, PermitsStateTables } from "@/components/PermitsStateTables";
import { sanitizeCopy } from "@/lib/dashes";
import { permitsIndexModel } from "@/lib/permits-index";
import { breadcrumbJsonLd, collectionPageJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "Building permit fees by city 2026",
  description:
    "Roof, deck, kitchen and HVAC permit fees for 100 US cities, grouped by state. Each city page cites the official fee schedule.",
  path: "/permits",
});

export default function PermitsIndexPage() {
  const model = permitsIndexModel();
  const intro = sanitizeCopy(
    model.total +
      " cities. Each page lists the city's permit fees for roof, deck, kitchen and HVAC jobs, with the official source.",
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Building permit fees by city", path: "/permits" },
          ]),
          collectionPageJsonLd({
            name: "Building permit fees by city",
            path: "/permits",
            items: model.groups.flatMap((group) =>
              group.items.map((item) => ({ name: item.label, path: item.href })),
            ),
          }),
        ]}
      />
      <h1 className="font-display text-4xl">Building permit fees by city</h1>
      <p className="mt-3 max-w-xl text-muted">{intro}</p>
      <PermitsStateJump />
      <section id="permits-index" className="mt-6">
        {model.groups.map((group) => (
          <section key={group.stateAbbr} className="mt-8">
            <h2 className="font-display text-2xl">{sanitizeCopy(group.state)}</h2>
            <ul className="mt-3 space-y-1">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{sanitizeCopy(item.label)}</Link>
                  {item.detail ? <span>{": " + sanitizeCopy(item.detail)}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </section>
      <PermitsStateTables />
    </div>
  );
}
