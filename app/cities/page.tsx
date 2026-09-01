import { CitiesDirectory } from "@/components/CitiesDirectory";
import { JsonLd } from "@/components/JsonLd";
import { getCities } from "@/lib/data";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "Home project costs by city",
  description: "Cities on CostInMyCity, with permit department links.",
  path: "/cities",
});

export default function CitiesPage() {
  const cities = getCities();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Home project costs by city", path: "/cities" },
        ])}
      />
      <h1 className="font-display text-4xl">Home project costs by city</h1>
      <p className="mt-3 max-w-xl text-muted">{cities.length} cities. Each page lists the four projects and the permit office.</p>
      <CitiesDirectory cities={cities} />
    </div>
  );
}
