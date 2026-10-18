/**
 * WCAG 1.4.4 / 1.4.10 / 2.4.11 checks.
 * - 200% zoom: 1280x800 window at zoom 2 equals a 640 CSS px viewport at DPR 2.
 *   Asserts no horizontal scroll and no clipped text blocks.
 * - Focus not obscured: on a cost page at 390x844, Tab through every focusable
 *   and assert none is fully covered by the sticky estimate bar.
 *
 *   node scripts/qa/zoom-focus.mjs http://localhost:4310
 */
import { createRequire } from "module";
const base = (process.argv[2] || "http://localhost:4310").replace(/\/$/, "");
const puppeteer = createRequire("/workspace/turbo/baseline-2026-10-18/package.json")("puppeteer-core");
const pages = ["/", "/cost/roof-replacement/charlotte-nc/", "/cost/roof-replacement/denver-co/", "/cost/roof-replacement/chicago-il/", "/cost/hvac-replacement/indianapolis-in/", "/city/denver-co/", "/accessibility/"];
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox"], headless: true });
let fails = 0;
for (const p of pages) {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 640, height: 400, deviceScaleFactor: 2 });
  const r = await pg.goto(base + p, { waitUntil: "networkidle0", timeout: 60000 });
  const res = await pg.evaluate(() => {
    const de = document.documentElement;
    const clipped = [...document.querySelectorAll("p,h1,h2,h3,li,td,th,a,button,label,summary")]
      .filter((el) => { const cs = getComputedStyle(el); return el.offsetParent && !el.closest(".sr-only") && el.clientWidth > 2 && cs.overflowX !== "visible" && cs.overflowX !== "auto" && cs.overflowX !== "scroll" && el.scrollWidth > el.clientWidth + 1; })
      .map((el) => el.tagName + ":" + (el.textContent || "").trim().slice(0, 40));
    return { sw: de.scrollWidth, cw: de.clientWidth, clipped };
  });
  const ok = r.status() === 200 && res.sw <= res.cw && res.clipped.length === 0;
  if (!ok) fails++;
  console.log("zoom200", p, r.status(), JSON.stringify(res), ok ? "ok" : "FAIL");
  await pg.close();
}
const cost = await browser.newPage();
await cost.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await cost.goto(base + "/cost/roof-replacement/charlotte-nc/", { waitUntil: "networkidle0", timeout: 60000 });
const total = await cost.evaluate(() => document.querySelectorAll("a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex='-1'])").length);
let covered = [];
for (let i = 0; i < total + 5; i++) {
  await cost.keyboard.press("Tab");
  const c = await cost.evaluate(() => {
    const el = document.activeElement; const bar = document.querySelector(".sticky-est");
    if (!el || el === document.body || !bar || bar.hidden || bar.contains(el)) return null;
    const bs = getComputedStyle(bar); if (bs.display === "none" || bs.visibility === "hidden") return null;
    const a = el.getBoundingClientRect(), b = bar.getBoundingClientRect();
    const fully = a.top >= b.top && a.bottom <= b.bottom && a.left >= b.left && a.right <= b.right && a.height > 0;
    return fully ? (el.tagName + ":" + (el.textContent || el.id || "").trim().slice(0, 40)) : null;
  });
  if (c) covered.push(c);
}
console.log("focus-obscured", total, "focusables;", covered.length ? "FAIL " + JSON.stringify(covered) : "ok");
if (covered.length) fails++;
await browser.close();
console.log(fails ? `zoom-focus: ${fails} failure(s)` : "zoom-focus: all checks passed");
process.exit(fails ? 1 : 0);
