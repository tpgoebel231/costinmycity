/**
 * Keyboard walkthrough with CDP Tab presses.
 * Records focus order on the homepage, calculator, accordion, and city search.
 *
 *   node scripts/qa/keyboard.mjs http://127.0.0.1:4173 /tmp/keyboard.json
 */
import fs from "fs";
import { createRequire } from "module";

const base = (process.argv[2] || "http://127.0.0.1:4173").replace(/\/$/, "");
const out = process.argv[3] || "/tmp/keyboard.json";
const puppeteer = createRequire("/workspace/turbo/baseline-2026-10-18/package.json")("puppeteer-core");

function describe(info) {
  if (!info) return "(none)";
  const bits = [info.tag];
  if (info.id) bits.push("#" + info.id);
  if (info.type) bits.push("[" + info.type + "]");
  if (info.name) bits.push(JSON.stringify(info.name.slice(0, 80)));
  return bits.join(" ");
}

async function focusInfo(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    const text = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || "",
      type: el.getAttribute("type") || "",
      name: text.slice(0, 120),
      href: el.getAttribute("href") || "",
    };
  });
}

async function tab(page, times, shift) {
  const steps = [];
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(shift ? "Shift+Tab" : "Tab");
    steps.push(await focusInfo(page));
  }
  return steps;
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const report = {};

const home = await browser.newPage();
await home.setViewport({ width: 390, height: 844 });
await home.goto(base + "/", { waitUntil: "networkidle0", timeout: 60000 });
report.home = { viewport: "390x844", steps: await tab(home, 12) };
report.home.skipFirst = report.home.steps[0] && report.home.steps[0].name.indexOf("Skip") === 0;

const desk = await browser.newPage();
await desk.setViewport({ width: 1280, height: 900 });
await desk.goto(base + "/", { waitUntil: "networkidle0", timeout: 60000 });
report.homeDesktop = { viewport: "1280x900", steps: await tab(desk, 8) };
await desk.focus("#city-search");
await desk.keyboard.type("den");
await desk.waitForSelector("#city-search-list a", { timeout: 3000 });
await desk.keyboard.press("ArrowDown");
report.citySearch = {
  afterArrow: await focusInfo(desk),
  status: await desk.$eval("[data-city-status]", (el) => el.textContent),
  linkCount: await desk.$$eval("#city-search-list a", (nodes) => nodes.length),
};

const cost = await browser.newPage();
await cost.setViewport({ width: 390, height: 844 });
await cost.goto(base + "/cost/roof-replacement/charlotte-nc/", { waitUntil: "networkidle0", timeout: 60000 });
await cost.focus("#qty-range");
const before = await cost.$eval("[data-calc-mirror='typical']", (el) => el.textContent);
await cost.keyboard.press("ArrowRight");
await new Promise((resolve) => setTimeout(resolve, 100));
const after = await cost.$eval("[data-calc-mirror='typical']", (el) => el.textContent);
report.calculator = {
  focused: await focusInfo(cost),
  before,
  after,
  changed: before !== after,
  live: await cost.$eval("#calculator [aria-live]", (el) => el.getAttribute("aria-live")),
};
const summary = await cost.$("#faq summary");
if (summary) {
  await summary.focus();
  const wasOpen = await cost.$eval("#faq details", (el) => el.open);
  await cost.keyboard.press("Enter");
  const nowOpen = await cost.$eval("#faq details", (el) => el.open);
  report.accordion = { wasOpen, nowOpen, toggled: wasOpen !== nowOpen, focused: await focusInfo(cost) };
} else {
  report.accordion = { missing: true };
}

await cost.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise((resolve) => setTimeout(resolve, 300));
const barHidden = await cost.$eval(".sticky-est", (el) => el.hidden);
report.sticky = { hiddenAfterScrollToEnd: barHidden };

console.log("HOME 390");
for (const step of report.home.steps) console.log("  " + describe(step));
console.log("HOME desktop");
for (const step of report.homeDesktop.steps) console.log("  " + describe(step));
console.log("CITY", JSON.stringify(report.citySearch));
console.log("CALC", JSON.stringify(report.calculator));
console.log("FAQ", JSON.stringify(report.accordion));
console.log("STICKY", JSON.stringify(report.sticky));

fs.writeFileSync(out, JSON.stringify(report, null, 2));
await browser.close();

const ok = report.home.skipFirst && report.citySearch.linkCount > 0 && report.calculator.changed && report.calculator.live === "polite" && report.accordion.toggled;
if (!ok) {
  console.error("keyboard: a check failed");
  process.exit(1);
}
console.log("keyboard: walkthrough checks passed");
