import type { ReactNode } from "react";
import { sanitizeRendered } from "@/lib/dashes";
import type { CostSource } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function Citations({
  sources: incoming,
  title = "Citations",
  children,
}: {
  sources: CostSource[];
  title?: string;
  children?: ReactNode;
}) {
  const sources = sanitizeRendered(incoming);
  if (!sources?.length && !children) return null;
  return (
    <details id="citations" className="fold">
      <summary>
        <h2 className="fold-title">{title}</h2>
      </summary>
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
    </details>
  );
}
