import type { ProcessFaqItem } from "@/lib/permit-process";

export function PermitProcessFaq({
  cityLabel,
  items,
}: {
  cityLabel: string;
  items: ProcessFaqItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="font-display text-2xl">Permit process in {cityLabel}</h2>
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
