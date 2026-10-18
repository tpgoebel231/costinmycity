import { Accordion } from "@/components/ui/Accordion";
import { sanitizeRendered } from "@/lib/dashes";
import type { FaqItem } from "@/lib/local-copy";

export function MoneyFaq({ items: incoming }: { items: FaqItem[] }) {
  const items = sanitizeRendered(incoming);
  if (!items.length) return null;
  return (
    <section id="faq" className="section-gap">
      <h2>Questions about this estimate</h2>
      <div className="mt-2">
        <Accordion items={items} />
      </div>
    </section>
  );
}
