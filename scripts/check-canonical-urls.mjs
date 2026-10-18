// Fails the build if any page lacks a self-referencing trailing-slash canonical,
// links internally to a non-slash page URL, or the sitemap lists a non-canonical URL.
import fs from "node:fs";
import path from "node:path";
const OUT = "out";
const SITE = "https://costinmycity.com";
const ASSET = /\.(js|css|woff2?|png|jpe?g|avif|webp|gif|ico|svg|xml|txt|webmanifest|json|pdf|html)$/i;
const errors = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== "_next") walk(p); }
    else if (e.name === "index.html") check(p);
  }
}
let pages = 0;
function check(file) {
  pages++;
  const rel = "/" + path.relative(OUT, path.dirname(file)).split(path.sep).join("/");
  const want = SITE + (rel === "/" ? "/" : rel + "/");
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (!m) errors.push(file + ": no canonical");
  else if (m[1] !== want) errors.push(file + ": canonical " + m[1] + " != " + want);
  for (const h of html.matchAll(/href="(\/[^"#?\\]*)"/g)) {
    const u = h[1].replace(/[.,;:)]+$/, "");
    if (!u.endsWith("/") && !ASSET.test(u)) errors.push(file + ": non-slash link " + u);
  }
  for (const h of html.matchAll(/https:\/\/costinmycity\.com(\/[^"'<\s#?\\]*)/g)) {
    const u = h[1].replace(/[.,;:)]+$/, "");
    if (!u.endsWith("/") && !ASSET.test(u)) errors.push(file + ": non-slash absolute URL " + u);
  }
}
walk(OUT);
const sm = fs.readFileSync(path.join(OUT, "sitemap.xml"), "utf8");
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
for (const l of locs) {
  if (!l.startsWith(SITE + "/") || !l.endsWith("/")) errors.push("sitemap: non-canonical " + l);
  const f = path.join(OUT, l.slice(SITE.length), "index.html");
  if (!fs.existsSync(f)) errors.push("sitemap: no page for " + l);
}
if (new Set(locs).size !== locs.length) errors.push("sitemap: duplicate URLs");
console.log(`check-canonical-urls: ${pages} pages, ${locs.length} sitemap URLs, ${errors.length} problems.`);
if (errors.length) { console.error(errors.slice(0, 50).join("\n")); process.exit(1); }
