import { sanitizeRendered } from "@/lib/dashes";
import type { ProcessFaqItem } from "@/lib/permit-process";

export function PermitProcessFaq({
  cityLabel: _cityLabel,
  items: incoming,
}: {
  cityLabel: string;
  items: ProcessFaqItem[];
}) {
  const items = sanitizeRendered(incoming);
  if (!items.length) return null;
  return (
    <div className="mt-6 border-t border-line pt-4">
      <h3 className="font-display text-xl">Process</h3>
      <dl className="mt-3 space-y-4">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-medium">{item.question}</dt>
            <dd className="mt-2 text-sm text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
