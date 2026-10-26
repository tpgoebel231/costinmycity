import { splitSentences } from "@/lib/sentences";

/**
 * Display blocks for an already-sanitized calculation note.
 * Money, dates, and parenthesized URLs are display-only: the dollar value
 * stays exact, and sentence splitting still uses splitSentences.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STEP_RE = /^Step \d+:/;
const BAND_RE = /^(?:Low|Typical|High) (?:\$|\d)/;
const URL_RE = /\(\s*(https?:\/\/[^\s)]+)\s*\)|https?:\/\/[^\s)\]"'<>]+/g;

export type CalcNoteInline =
  | { type: "text"; text: string }
  | { type: "link"; href: string; text: string };

export type CalcNoteBlock =
  | { type: "p"; sentences: CalcNoteInline[][] }
  | { type: "ol"; items: CalcNoteInline[][] }
  | { type: "ul"; items: CalcNoteInline[][] };

function bareHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

/** One decimal, or 4+ digits with no thousands separator, in standard US form. */
export function formatCalcMoney(text: string): string {
  return text.replace(/\$\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$\d+(?:\.\d+)?/g, (token) => {
    const body = token.slice(1);
    const dot = body.indexOf(".");
    const intRaw = dot === -1 ? body : body.slice(0, dot);
    const frac = dot === -1 ? "" : body.slice(dot + 1);
    const intDigits = intRaw.replace(/,/g, "");
    const needsSep = intDigits.length >= 4 && !intRaw.includes(",");
    const oneDec = frac.length === 1;
    if (!needsSep && !oneDec) return token;
    const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (frac.length === 0) return "$" + grouped;
    if (frac.length === 1) {
      if (frac === "0") return "$" + grouped;
      return "$" + grouped + "." + frac + "0";
    }
    return "$" + grouped + "." + frac;
  });
}

/** ISO dates (2026-10-18) become the same short form as formatDate. */
export function formatCalcDates(text: string): string {
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (full, year: string, month: string, day: string) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (m < 1 || m > 12 || d < 1 || d > 31) return full;
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return full;
    return MONTHS[m - 1] + " " + d + ", " + y;
  });
}

function maskUrls(text: string): { text: string; urls: string[] } {
  const urls: string[] = [];
  const masked = text.replace(/https?:\/\/[^\s)\]"'<>]+/g, (raw) => {
    urls.push(raw);
    return "\u0000U" + (urls.length - 1) + "U\u0000";
  });
  return { text: masked, urls };
}

function restoreUrls(text: string, urls: string[]): string {
  return text.replace(/\u0000U(\d+)U\u0000/g, (_, index: string) => urls[Number(index)] ?? "");
}

function applyDisplayFormatting(text: string): string {
  const masked = maskUrls(text);
  return restoreUrls(formatCalcDates(formatCalcMoney(masked.text)), masked.urls);
}

function parseInlines(sentence: string): CalcNoteInline[] {
  const out: CalcNoteInline[] = [];
  let last = 0;
  for (const match of sentence.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ type: "text", text: sentence.slice(last, index) });
    if (match[1]) {
      const href = match[1].replace(/[.,;:]+$/, "");
      out.push({ type: "link", href, text: "(" + bareHost(href) + ")" });
    } else {
      const raw = match[0];
      const href = raw.replace(/[.,;:]+$/, "");
      const trail = raw.slice(href.length);
      out.push({ type: "link", href, text: bareHost(href) });
      if (trail) out.push({ type: "text", text: trail });
    }
    last = index + match[0].length;
  }
  if (last < sentence.length) out.push({ type: "text", text: sentence.slice(last) });
  if (!out.length) out.push({ type: "text", text: sentence });
  return out;
}

function inlineText(parts: CalcNoteInline[]): string {
  return parts.map((part) => part.text).join("");
}

type GroupKind = "step" | "band" | "prose";

function groupKind(sentence: string): GroupKind {
  if (STEP_RE.test(sentence)) return "step";
  if (BAND_RE.test(sentence)) return "band";
  return "prose";
}

export function calcNoteBlocks(note: string): CalcNoteBlock[] {
  const collapsed = (note || "").replace(/\s+/g, " ").trim();
  if (!collapsed) return [];
  const sentences = splitSentences(applyDisplayFormatting(collapsed));
  const groups: { kind: GroupKind; sentences: string[] }[] = [];
  for (const sentence of sentences) {
    const kind = groupKind(sentence);
    const prev = groups[groups.length - 1];
    if (prev && prev.kind === kind) prev.sentences.push(sentence);
    else groups.push({ kind, sentences: [sentence] });
  }
  const blocks: CalcNoteBlock[] = [];
  for (const group of groups) {
    if (group.kind === "step") {
      blocks.push({ type: "ol", items: group.sentences.map(parseInlines) });
      continue;
    }
    if (group.kind === "band") {
      blocks.push({ type: "ul", items: group.sentences.map(parseInlines) });
      continue;
    }
    for (let i = 0; i < group.sentences.length; i += 2) {
      blocks.push({ type: "p", sentences: group.sentences.slice(i, i + 2).map(parseInlines) });
    }
  }
  return blocks;
}

/** Visible text of the blocks, used to confirm display formatting did not drop a sentence. */
export function calcNotePlainText(note: string): string {
  const parts: string[] = [];
  for (const block of calcNoteBlocks(note)) {
    if (block.type === "p") parts.push(block.sentences.map(inlineText).join(" "));
    else parts.push(block.items.map(inlineText).join(" "));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
