import Link from "next/link";
import { sanitizeNumbersText, type NumbersSourceStep } from "@/lib/numbers-source";

export function NumbersSource({ steps: incoming }: { steps: NumbersSourceStep[] }) {
  const steps = incoming
    .map((step) =>
      step
        .map((part) =>
          typeof part === "string"
            ? sanitizeNumbersText(part)
            : { href: part.href, label: sanitizeNumbersText(part.label) },
        )
        .filter((part) => (typeof part === "string" ? part.length > 0 : part.label.length > 0 && part.href.length > 0)),
    )
    .filter((step) => step.length > 0);
  if (!steps.length) return null;
  return (
    <section id="numbers-source" className="section-gap">
      <h2>Where these numbers come from</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
        {steps.map((step, i) => (
          <li key={i}>
            {step.map((part, j) =>
              typeof part === "string" ? (
                <span key={j}>{part}</span>
              ) : part.href.startsWith("/") ? (
                <Link key={j} href={part.href} className="text-ink underline">
                  {part.label}
                </Link>
              ) : (
                <a key={j} href={part.href} className="text-ink underline" target="_blank" rel="noreferrer">
                  {part.label}
                </a>
              ),
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
