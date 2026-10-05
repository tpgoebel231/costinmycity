const EN = "\u2013";

/**
 * Render-time cleanup for copy that still contains an em dash.
 * A spaced em dash becomes a spaced en dash (" — " → " – ").
 * HTML entity forms are rewritten the same way.
 * Fee matching keeps reading the data files unchanged.
 */
export function replaceEmDashes(text: string): string {
  if (!text) return text;
  return text
    .replace(/&mdash;/gi, EN)
    .replace(/&#8212;/g, EN)
    .replace(/&#x2014;/gi, EN)
    .replace(/\u2014/g, EN)
    .replace(/\\u2014/g, "\\u2013");
}

/** Deep-copy strings so rendered data-file copy does not keep an em dash. */
export function sanitizeRendered<T>(value: T): T {
  if (typeof value === "string") return replaceEmDashes(value) as T;
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeRendered(item)) as T;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = sanitizeRendered(child);
  }
  return out as T;
}
