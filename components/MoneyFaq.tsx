import type { FaqItem } from "@/lib/local-copy";

export function MoneyFaq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="font-display text-2xl">Questions about this estimate</h2>
      <dl className="mt-4 space-y-5">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-medium">{item.question}</dt>
            <dd className="mt-2 text-sm text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
