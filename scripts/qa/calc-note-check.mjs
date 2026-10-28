/**
 * Calculation notes, breadcrumbs, and size-tier headings on the static export.
 * Display formatting is mirrored here in plain JS. sanitizeCopy and
 * splitSentences are the page helpers (not lib/calc-note).
 *
 *   node scripts/qa/calc-note-check.mjs
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import Module from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "out");

const SHORT = {
  "roof-replacement": "Roof replacement",
  "hvac-replacement": "HVAC replacement",
  deck: "Deck",
  "kitchen-remodel": "Kitchen remodel",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

let tsHooked = false;
function hookTs() {
  if (tsHooked) return;
  tsHooked = true;
  const orig = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, isMain, options) {
    let target = request;
    if (target.startsWith("@/")) target = path.join(root, target.slice(2));
    if ((target.startsWith(".") || target.startsWith("/")) && parent && parent.filename) {
      const abs = target.startsWith(".") ? path.resolve(path.dirname(parent.filename), target) : target;
      if (fs.existsSync(abs + ".ts")) return abs + ".ts";
      if (fs.existsSync(abs + ".tsx")) return abs + ".tsx";
      if (fs.existsSync(path.join(abs, "index.ts"))) return path.join(abs, "index.ts");
    }
    if (target.endsWith(".ts") || target.endsWith(".tsx")) return target;
    return orig.call(this, request, parent, isMain, options);
  };
  Module._extensions[".ts"] = function (module, filename) {
    const src = fs.readFileSync(filename, "utf8");
    const out = ts.transpileModule(src, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText;
    module._compile(out, filename);
  };
  Module._extensions[".tsx"] = Module._extensions[".ts"];
}

function loadTs(rel) {
  hookTs();
  return require(path.join(root, rel));
}

const { sanitizeCopy } = loadTs("lib/dashes.ts");
const { splitSentences } = loadTs("lib/sentences.ts");

function bareHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function formatCalcMoney(text) {
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

function formatCalcDates(text) {
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (full, year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (m < 1 || m > 12 || d < 1 || d > 31) return full;
    const dt = new Date(Date.UTC(y, m - 1, d, 12));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return full;
    return MONTHS[m - 1] + " " + d + ", " + y;
  });
}

function displayVisible(text) {
  const collapsed = (text || "").replace(/\s+/g, " ").trim();
  if (!collapsed) return "";
  const urls = [];
  const masked = collapsed.replace(/https?:\/\/[^\s)\]"'<>]+/g, (raw) => {
    urls.push(raw);
    return "\u0000U" + (urls.length - 1) + "U\u0000";
  });
  let formatted = formatCalcDates(formatCalcMoney(masked));
  formatted = formatted.replace(/\u0000U(\d+)U\u0000/g, (_, index) => urls[Number(index)] ?? "");
  formatted = formatted.replace(/\(\s*(https?:\/\/[^\s)]+)\s*\)|https?:\/\/[^\s)\]"'<>]+/g, (full, parenUrl) => {
    if (parenUrl) {
      const href = parenUrl.replace(/[.,;:]+$/, "");
      return "(" + bareHost(href) + ")";
    }
    const href = full.replace(/[.,;:]+$/, "");
    const trail = full.slice(href.length);
    return bareHost(href) + trail;
  });
  return formatted.replace(/\s+/g, " ").trim();
}

function expectedNote(raw) {
  return displayVisible(sanitizeCopy((raw || "").trim()));
}

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function normSpace(text) {
  return decode(text).replace(/\s+/g, " ").trim();
}

function stripTags(html) {
  return normSpace(html.replace(/<[^>]+>/g, ""));
}

function balanced(html, from, tag) {
  const re = new RegExp("<" + tag + "\\b[^>]*>|</" + tag + ">", "gi");
  re.lastIndex = from;
  let depth = 1;
  let match;
  while ((match = re.exec(html))) {
    if (match[0].startsWith("</")) depth--;
    else depth++;
    if (depth === 0) return { inner: html.slice(from, match.index), end: match.index + match[0].length };
  }
  return null;
}

function calcNotes(html) {
  const notes = [];
  const re = /<div\b[^>]*\bdata-calc-note="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const found = balanced(html, match.index + match[0].length, "div");
    if (!found) {
      notes.push({ id: decode(match[1]), html: "", broken: true });
      continue;
    }
    notes.push({ id: decode(match[1]), html: found.inner, broken: false });
    re.lastIndex = found.end;
  }
  return notes;
}

function noteVisible(inner) {
  const withoutSummary = inner.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "");
  return stripTags(withoutSummary);
}

function paragraphs(inner) {
  const withoutSummary = inner.replace(/<summary\b[^>]*>[\s\S]*?<\/summary>/gi, "");
  return [...withoutSummary.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) => stripTags(match[1]));
}

function badMoney(text) {
  const found = [];
  const re = /\$\d[\d,]*(?:\.\d+)?/g;
  let match;
  while ((match = re.exec(text))) {
    const body = match[0].slice(1);
    const dot = body.indexOf(".");
    const intRaw = dot === -1 ? body : body.slice(0, dot);
    const frac = dot === -1 ? "" : body.slice(dot + 1);
    const intDigits = intRaw.replace(/,/g, "");
    if (frac.length === 1 || (intDigits.length >= 4 && !intRaw.includes(","))) found.push(match[0]);
  }
  return found;
}

function normHref(href) {
  if (!href) return "";
  const clean = decode(href).split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return "/";
  return clean.endsWith("/") ? clean : clean + "/";
}

function breadcrumbNavs(html) {
  const navs = [];
  const re = /<nav\b[^>]*\baria-label="Breadcrumb"[^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const found = balanced(html, match.index + match[0].length, "nav");
    if (!found) {
      navs.push(null);
      continue;
    }
    navs.push(found.inner);
    re.lastIndex = found.end;
  }
  return navs;
}

function crumbItems(navInner) {
  const items = [];
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = re.exec(navInner))) {
    const li = match[1];
    const link = li.match(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    const current = /aria-current="page"/.test(li);
    const hidden = li.replace(/<span\b[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/gi, "");
    const label = stripTags(hidden);
    items.push({
      href: link ? normHref(link[1]) : "",
      label,
      current,
      linked: Boolean(link),
    });
  }
  return items;
}

function headingTexts(html, tag) {
  return [...html.matchAll(new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)</" + tag + ">", "gi"))].map((match) =>
    stripTags(match[1]),
  );
}

function sectionInner(html, id) {
  const re = new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>', "i");
  const match = re.exec(html);
  if (!match) return null;
  const found = balanced(html, match.index + match[0].length, "section");
  return found ? found.inner : null;
}

function walkHtml(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkHtml(full, acc);
    else if (name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function main() {
const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
const permitByKey = new Map(permits.map((permit) => [permit.citySlug + "/" + permit.projectSlug, permit]));

const failures = [];
function fail(message) {
  failures.push(message);
}

if (!fs.existsSync(outDir)) {
  console.error("calc-note-check: missing out/");
  process.exit(1);
}

const costPages = walkHtml(path.join(outDir, "cost")).filter((file) => {
  const rel = path.relative(path.join(outDir, "cost"), file);
  return rel.split(path.sep).length === 3 && rel.endsWith(path.sep + "index.html");
});
const permitPages = walkHtml(path.join(outDir, "permits")).filter((file) => {
  const rel = path.relative(path.join(outDir, "permits"), file);
  return rel.split(path.sep).length === 2 && rel.endsWith(path.sep + "index.html");
});

let noteCount = 0;

function checkNotes(file, html, limitOne) {
  const rel = path.relative(outDir, file);
  const notes = calcNotes(html);
  if (limitOne && notes.length > 1) fail(rel + " prints the calculation note " + notes.length + " times");
  const seen = new Set();
  for (const note of notes) {
    noteCount++;
    if (note.broken) {
      fail(rel + " unclosed calc note " + note.id);
      continue;
    }
    if (seen.has(note.id)) fail(rel + " duplicate data-calc-note " + note.id);
    seen.add(note.id);
    const permit = permitByKey.get(note.id);
    if (!permit) {
      fail(rel + " unknown data-calc-note " + note.id);
      continue;
    }
    const visible = noteVisible(note.html);
    const expected = expectedNote(permit.calculationNote || "");
    if (visible !== expected) {
      let i = 0;
      while (i < visible.length && i < expected.length && visible[i] === expected[i]) i++;
      fail(
        rel +
          " " +
          note.id +
          " text mismatch at " +
          i +
          " got " +
          JSON.stringify(visible.slice(Math.max(0, i - 40), i + 80)) +
          " expected " +
          JSON.stringify(expected.slice(Math.max(0, i - 40), i + 80)),
      );
    }
    if (/http/i.test(visible)) fail(rel + " " + note.id + " visible http");
    const money = badMoney(visible);
    if (money.length) fail(rel + " " + note.id + " money tokens " + money.slice(0, 6).join(", "));
    for (const paragraph of paragraphs(note.html)) {
      if (splitSentences(paragraph).length > 2) {
        fail(rel + " " + note.id + " paragraph over 2 sentences: " + paragraph.slice(0, 80));
      }
    }
  }
}

function checkCrumbs(file, html, expected) {
  const rel = path.relative(outDir, file);
  const navs = breadcrumbNavs(html);
  if (navs.length !== 1) {
    fail(rel + " breadcrumb nav count " + navs.length);
    return;
  }
  if (!navs[0]) {
    fail(rel + " unclosed breadcrumb nav");
    return;
  }
  const items = crumbItems(navs[0]);
  if (items.length !== expected.length) {
    fail(rel + " breadcrumb length " + items.length + " != " + expected.length);
    return;
  }
  for (let i = 0; i < expected.length; i++) {
    const item = items[i];
    const want = expected[i];
    const last = i === expected.length - 1;
    if (item.label !== want.label) fail(rel + " breadcrumb " + i + " label " + JSON.stringify(item.label) + " != " + JSON.stringify(want.label));
    if (normHref(item.href) !== normHref(want.href || "")) {
      fail(rel + " breadcrumb " + i + " href " + JSON.stringify(item.href) + " != " + JSON.stringify(want.href || ""));
    }
    if (last) {
      if (!item.current) fail(rel + " breadcrumb last item missing aria-current");
      if (item.linked) fail(rel + " breadcrumb last item is a link");
    } else if (!item.linked) {
      fail(rel + " breadcrumb item " + i + " is not a link");
    }
  }
}

for (const file of costPages) {
  const rel = path.relative(outDir, file);
  const parts = rel.split(path.sep);
  const project = parts[1];
  const citySlug = parts[2];
  const html = fs.readFileSync(file, "utf8");
  const city = cityBySlug.get(citySlug);
  if (!city) {
    fail(rel + " unknown city");
    continue;
  }
  checkNotes(file, html, true);
  checkCrumbs(file, html, [
    { label: "Home", href: "/" },
    { label: city.name + ", " + city.stateAbbr, href: "/city/" + citySlug + "/" },
    { label: SHORT[project] || project, href: "" },
  ]);
  const hub = "/cost/" + project + "/";
  if (!html.includes('href="' + hub + '"') && !html.includes('href="' + "/cost/" + project + '"')) {
    fail(rel + " missing project hub link " + hub);
  }
  const sizes = sectionInner(html, "sizes");
  if (sizes) {
    const h3 = headingTexts(sizes, "h3");
    const seen = new Set();
    for (const text of h3) {
      if (seen.has(text)) fail(rel + " duplicate h3 in #sizes: " + text);
      seen.add(text);
    }
  }
  const h2 = new Set(headingTexts(html, "h2"));
  for (const text of headingTexts(html, "h3")) {
    if (h2.has(text)) fail(rel + " h3 equals an h2: " + text);
  }
}

for (const file of permitPages) {
  const rel = path.relative(outDir, file);
  const citySlug = rel.split(path.sep)[1];
  const html = fs.readFileSync(file, "utf8");
  const city = cityBySlug.get(citySlug);
  if (!city) {
    fail(rel + " unknown city");
    continue;
  }
  checkNotes(file, html, false);
  checkCrumbs(file, html, [
    { label: "Home", href: "/" },
    { label: city.name, href: "/city/" + citySlug + "/" },
    { label: "Permit fees", href: "" },
  ]);
  const h2 = new Set(headingTexts(html, "h2"));
  for (const text of headingTexts(html, "h3")) {
    if (h2.has(text)) fail(rel + " h3 equals an h2: " + text);
  }
}

const summary =
  "calc-note-check: " +
  costPages.length +
  " cost pages, " +
  permitPages.length +
  " permit pages, " +
  noteCount +
  " notes";
if (failures.length) {
  console.error(summary + " FAIL " + failures.length);
  for (const line of failures.slice(0, 40)) console.error("  " + line);
  if (failures.length > 40) console.error("  … " + (failures.length - 40) + " more");
  process.exit(1);
}
console.log(summary + " OK");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

export { expectedNote, displayVisible, badMoney, stripTags, paragraphs, noteVisible };
