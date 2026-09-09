import type { ReactNode } from "react";
import type { CostSource } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function Citations({
  sources,
  title = "Citations",
  children,
}: {
  sources: CostSource[];
  title?: string;
  children?: ReactNode;
}) {
  if (!sources?.length && !children) return null;
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="font-display text-2xl">{title}</h2>
      {sources?.length ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          {sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a href={s.url} className="text-ink underline" target="_blank" rel="noreferrer">
                  {s.name}
                </a>
              ) : (
                <span className="text-ink">{s.name}</span>
              )}
              {s.retrievedDate ? <span> Retrieved {formatDate(s.retrievedDate)}.</span> : null}
              {s.what || s.note ? <span> {s.what || s.note}</span> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {children}
    </section>
  );
}
