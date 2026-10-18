/**
 * Static export still emits the App Router runtime and a __next_f flight
 * payload on every page. Cost pages and home do not hydrate React.
 * Calculator, city search, and the jump form run from /ui.js.
 *
 * /cities and /tools/deck-materials keep the runtime for CitiesDirectory
 * and DeckCalculator. Canonical links, JSON-LD, and the city index stay.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "../out");
const KEEP = new Set(["cities/index.html", "tools/deck-materials/index.html"]);

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "_next") continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function relOf(file) {
  return path.relative(OUT, file).split(path.sep).join("/");
}

function strip(html) {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const scriptAt = html.indexOf("<script", i);
    const linkAt = html.indexOf("<link", i);
    let next = -1;
    let kind = "";
    if (scriptAt >= 0 && (linkAt < 0 || scriptAt < linkAt)) {
      next = scriptAt;
      kind = "script";
    } else if (linkAt >= 0) {
      next = linkAt;
      kind = "link";
    }
    if (next < 0) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, next);
    if (kind === "script") {
      const openEnd = html.indexOf(">", next);
      if (openEnd < 0) {
        out += html.slice(next);
        break;
      }
      const open = html.slice(next, openEnd + 1);
      const close = html.indexOf("</script>", openEnd);
      if (close < 0) {
        out += html.slice(next);
        break;
      }
      const full = html.slice(next, close + "</script>".length);
      const body = html.slice(openEnd + 1, close);
      const src = open.match(/\bsrc="([^"]*)"/);
      const drop =
        (src && src[1].startsWith("/_next/")) ||
        body.includes("__next_f") ||
        body.includes("webpackChunk_N_E");
      if (!drop) out += full;
      i = close + "</script>".length;
    } else {
      const end = html.indexOf(">", next);
      if (end < 0) {
        out += html.slice(next);
        break;
      }
      const tag = html.slice(next, end + 1);
      const isScriptPreload = /\brel="preload"/.test(tag) && /\bas="script"/.test(tag);
      if (!isScriptPreload) out += tag;
      i = end + 1;
    }
  }
  return out;
}

if (!fs.existsSync(OUT)) {
  console.error("strip-next-runtime: missing out/. Run next build first.");
  process.exit(1);
}

const files = walk(OUT);
let stripped = 0;
let kept = 0;
for (const file of files) {
  const rel = relOf(file);
  const html = fs.readFileSync(file, "utf8");
  if (KEEP.has(rel)) {
    kept += 1;
    if (!html.includes("/_next/static/chunks/")) {
      console.error("strip-next-runtime: " + rel + " is missing the Next runtime");
      process.exit(1);
    }
    continue;
  }
  const nextHtml = strip(html);
  if (nextHtml !== html) {
    fs.writeFileSync(file, nextHtml);
    stripped += 1;
  }
  if (nextHtml.includes("__next_f") || /<script\b[^>]*\bsrc="\/_next\//.test(nextHtml)) {
    console.error("strip-next-runtime: runtime remains in " + rel);
    process.exit(1);
  }
  if (rel.endsWith("index.html") && !nextHtml.includes('src="/ui.js"')) {
    console.error("strip-next-runtime: ui.js missing from " + rel);
    process.exit(1);
  }
  if (rel.endsWith("index.html") && !/<link rel="canonical" href="https:\/\/costinmycity\.com\//.test(nextHtml)) {
    console.error("strip-next-runtime: canonical missing from " + rel);
    process.exit(1);
  }
}

const sample = path.join(OUT, "cost/roof-replacement/charlotte-nc/index.html");
if (fs.existsSync(sample)) {
  const html = fs.readFileSync(sample, "utf8");
  if (!html.includes('data-calc-mirror="typical"') || !html.includes('type="application/ld+json"')) {
    console.error("strip-next-runtime: cost page lost calculator mirrors or JSON-LD");
    process.exit(1);
  }
  if (!/<link rel="preload" href="\/_next\/static\/media\/[^"]+\.woff2" as="font"/.test(html)) {
    console.error("strip-next-runtime: cost page lost the font preload");
    process.exit(1);
  }
}

console.log("strip-next-runtime: stripped " + stripped + " HTML files, kept runtime on " + kept + ".");
