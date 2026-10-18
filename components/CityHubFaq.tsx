import { Accordion } from "@/components/ui/Accordion";
import { sanitizeRendered } from "@/lib/dashes";
import type { CityHubFaqItem } from "@/lib/city-hub-seo";

export function CityHubFaq({ items: incoming }: { items: CityHubFaqItem[] }) {
  const items = sanitizeRendered(incoming);
  if (!items.length) return null;
  return (
    <section id="faq" className="section-gap">
      <h2>Questions about home renovation costs</h2>
      <div className="mt-2">
        <Accordion items={items} open />
      </div>
    </section>
  );
}
