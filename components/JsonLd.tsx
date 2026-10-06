import { replaceEmDashes, sanitizeRendered } from "@/lib/dashes";

/** Drop null and undefined so JSON-LD does not emit a bare null token. */
function omitNulls(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => omitNulls(item)).filter((item) => item !== undefined);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child == null) continue;
      const next = omitNulls(child);
      if (next !== undefined) out[key] = next;
    }
    return out;
  }
  return value;
}

export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: replaceEmDashes(JSON.stringify(omitNulls(sanitizeRendered(item)))),
          }}
        />
      ))}
    </>
  );
}
