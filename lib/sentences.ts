/**
 * Sentence boundaries for notes shown to visitors.
 *
 * A period is not the end of a sentence when it sits inside parentheses,
 * finishes a dotted initialism (N.C.G.S., F.S., U.S.), or closes a short
 * citation abbreviation (Ch., Rev., Ord., St., Sec., p.). Those cuts were
 * leaving fee-schedule answers with an unclosed parenthesis.
 */

const CITATION_ABBREV = new Set([
  "ch",
  "sch",
  "ord",
  "rev",
  "res",
  "st",
  "minn",
  "stat",
  "app",
  "no",
  "p",
  "pp",
  "eff",
  "sec",
  "dept",
]);

export function isCitationPeriod(text: string, index: number): boolean {
  if (text[index] !== ".") return false;
  const head = text.slice(0, index + 1);
  if (/(?:^|[^A-Za-z])(?:[A-Z]\.){2,}$/.test(head)) return true;
  const word = head.match(/([A-Za-z]+)\.$/);
  if (!word) return false;
  return CITATION_ABBREV.has(word[1].toLowerCase());
}

/**
 * Split on ". ", "! ", or "? " when the next sentence starts with a capital or a digit.
 * Citation periods and punctuation inside parentheses stay in the current sentence.
 */
export function splitSentences(text: string): string[] {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "(") {
      depth++;
      continue;
    }
    if (ch === ")") {
      if (depth > 0) depth--;
      continue;
    }
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (depth > 0) continue;
    if (ch === "." && isCitationPeriod(t, i)) continue;
    let j = i + 1;
    while (j < t.length && t[j] === " ") j++;
    if (j === i + 1 || j >= t.length) continue;
    if (!/[A-Z0-9]/.test(t[j])) continue;
    const sentence = t.slice(start, i + 1).trim();
    if (sentence) parts.push(sentence);
    start = j;
    i = j - 1;
  }
  const tail = t.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

/**
 * First sentence, including its closing punctuation.
 * A following lowercase word still starts a new sentence. Citation periods
 * and punctuation inside parentheses do not.
 */
export function leadingSentence(text: string): string {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  let depth = 0;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === "(") {
      depth++;
      continue;
    }
    if (ch === ")") {
      if (depth > 0) depth--;
      continue;
    }
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    if (depth > 0) continue;
    if (ch === "." && isCitationPeriod(t, i)) continue;
    const next = t[i + 1];
    if (next == null || /\s/.test(next)) return t.slice(0, i + 1).trim();
  }
  return t;
}
