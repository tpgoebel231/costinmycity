import type { WhyCostsDifferModel } from "@/lib/why-costs-differ";

export function WhyCostsDiffer({ model }: { model: WhyCostsDifferModel | null }) {
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      {model.paragraphs.map((text, i) => (
        <p key={i} className="mt-3 text-sm">
          {text}
        </p>
      ))}
      <p className="mt-3 text-xs text-muted">{model.footnote}</p>
    </section>
  );
}
