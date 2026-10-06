/**
 * Fail the build when rendered pages show internal fee-field names
 * or a bare null / undefined / NaN.
 *
 * Scans static HTML in out/: visible text, title, meta descriptions,
 * alt / aria-label / title attributes, and JSON-LD. Ignores Next.js
 * flight-data scripts, where framework nulls and prop keys are not copy.
 */
import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "out");
const FIELD = /\b\w+Usd\b/g;
const BARE = /\b(?:null|undefined|NaN)\b/g;
const EM = /\u2014|&mdash;|&#8212;|&#x2014;/gi;

function htmlFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) htmlFiles(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function renderedCopy(html) {
  const chunks = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) chunks.push(title[1]);

  const metaRe = /<meta\b[^>]*>/gi;
  let match;
  while ((match = metaRe.exec(html))) {
    const tag = match[0];
    if (!/description|og:title|twitter:title/i.test(tag)) continue;
    const content = tag.match(/\bcontent="([^"]*)"/i);
    if (content) chunks.push(content[1]);
  }

  const ldRe = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = ldRe.exec(html))) chunks.push(match[1]);

  let visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  visible = visible.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  const attrRe = /\b(?:alt|aria-label|title)="([^"]*)"/gi;
  while ((match = attrRe.exec(visible))) chunks.push(match[1]);
  visible = visible.replace(/<[^>]+>/g, " ");
  chunks.push(visible);
  return chunks.join("\n");
}

function hits(text, pattern) {
  pattern.lastIndex = 0;
  return text.match(pattern) || [];
}

function snippet(text, token) {
  const at = text.indexOf(token);
  if (at < 0) return token;
  return text
    .slice(Math.max(0, at - 60), at + token.length + 60)
    .replace(/\s+/g, " ")
    .trim();
}

if (!fs.existsSync(root)) {
  console.error("check-rendered-copy: missing out/. Run next build first.");
  process.exit(1);
}

const files = htmlFiles(root);
if (!files.length) {
  console.error("check-rendered-copy: no HTML pages in out/.");
  process.exit(1);
}

const failures = [];
const counts = new Map();

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const copy = renderedCopy(html);
  const tokens = [...hits(copy, FIELD), ...hits(copy, BARE)];
  const dashes = hits(copy, EM);
  if (!tokens.length && !dashes.length) continue;
  const rel = path.relative(root, file).split(path.sep).join("/");
  for (const token of tokens) counts.set(token, (counts.get(token) || 0) + 1);
  if (dashes.length) counts.set("emdash", (counts.get("emdash") || 0) + dashes.length);
  failures.push({
    rel,
    tokens: tokens.slice(0, 8),
    dash: dashes.length,
    sample: tokens.length ? snippet(copy, tokens[0]) : snippet(copy, "\u2014"),
  });
}

if (failures.length) {
  console.error(
    "check-rendered-copy: " +
      failures.length +
      " page(s) still expose field names, bare null/undefined/NaN, or an em dash.",
  );
  const summary = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  console.error("counts " + JSON.stringify(summary));
  for (const failure of failures.slice(0, 25)) {
    console.error(failure.rel + " tokens=" + failure.tokens.join(",") + (failure.dash ? " emdash=" + failure.dash : ""));
    console.error("  " + failure.sample);
  }
  process.exit(1);
}

console.log(
  "check-rendered-copy: " +
    files.length +
    " pages, 0 field-name (*Usd) tokens, 0 bare null/undefined/NaN, 0 em dashes.",
);
