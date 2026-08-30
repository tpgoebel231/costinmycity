import { DeckCalculator } from "@/components/DeckCalculator";
import { JsonLd } from "@/components/JsonLd";
import { getDeckMaterials } from "@/lib/data";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "Deck materials calculator",
  description: "Length times width, height off grade, material tier, and waste percent. Board count, joists, fasteners, material dollars.",
  path: "/tools/deck-materials",
});

export default function DeckMaterialsPage() {
  const data = getDeckMaterials();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Deck materials calculator", path: "/tools/deck-materials" },
        ])}
      />
      <h1 className="font-display text-4xl">Deck materials calculator</h1>
      <p className="mt-3 max-w-2xl text-muted">Enter length, width, and height off the ground. Change every input. Prices start as labeled defaults; overwrite them with a current lumberyard quote. This is a materials count, not a contractor quote.</p>
      <div className="mt-8"><DeckCalculator data={data} /></div>
    </div>
  );
}
