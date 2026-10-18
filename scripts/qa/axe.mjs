/**
 * axe-core via Chrome DevTools. Zero violations of any severity is the gate.
 * Resolves axe-core from this repo, the baseline folder, or AXE_CORE.
 *
 *   node scripts/qa/axe.mjs http://127.0.0.1:4173/ /tmp/home.axe.json
 *   node scripts/qa/axe.mjs http://127.0.0.1:4173/cost/roof-replacement/charlotte-nc/ /tmp/charlotte.axe.json
 */
import fs from "fs";
import { createRequire } from "module";

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node scripts/qa/axe.mjs URL OUT.json");
  process.exit(1);
}

function axePath() {
  const candidates = [
    process.env.AXE_CORE,
    "/workspace/turbo/baseline-2026-10-18/package.json",
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (candidate.endsWith("package.json")) {
        return createRequire(candidate).resolve("axe-core/axe.min.js");
      }
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* try the next location */
    }
  }
  try {
    return createRequire(import.meta.url).resolve("axe-core/axe.min.js");
  } catch {
    console.error("axe-core not found. Set AXE_CORE or install axe-core.");
    process.exit(1);
  }
}

const puppeteerPath = "/workspace/turbo/baseline-2026-10-18/package.json";
const puppeteer = createRequire(puppeteerPath)("puppeteer-core");
const axeSrc = fs.readFileSync(axePath(), "utf8");

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await page.evaluate(axeSrc);
const result = await page.evaluate(() =>
  axe.run(document, {
    resultTypes: ["violations"],
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice"],
    },
  }),
);
fs.writeFileSync(out, JSON.stringify(result));
const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
for (const violation of result.violations || []) {
  counts[violation.impact] = (counts[violation.impact] || 0) + violation.nodes.length;
  console.log(violation.impact + " " + violation.id + " x" + violation.nodes.length + " " + violation.help);
}
const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
console.log("axe " + url + " violations=" + total + " " + JSON.stringify(counts));
await browser.close();
if (total > 0) process.exit(1);
