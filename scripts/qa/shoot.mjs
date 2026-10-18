/**
 * Full-page screenshot after lazy images have decoded.
 *
 *   node scripts/qa/shoot.mjs <url> <out.png> <width>
 *
 * Uses puppeteer-core and Chrome at /usr/bin/google-chrome.
 * Falls back to the puppeteer-core install under
 * /workspace/turbo/baseline-2026-10-18 when the repo has none.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] || 1440);

if (!url || !out || !Number.isFinite(width) || width < 1) {
  console.error("usage: node scripts/qa/shoot.mjs <url> <out.png> <width>");
  process.exit(1);
}

function loadPuppeteer() {
  try {
    return createRequire(import.meta.url)("puppeteer-core");
  } catch {
    return createRequire("/workspace/turbo/baseline-2026-10-18/package.json")("puppeteer-core");
  }
}

const puppeteer = loadPuppeteer();
const browser = await puppeteer.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: "new",
  protocolTimeout: 120000,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    const step = Math.max(240, Math.round(window.innerHeight * 0.8));
    for (let y = 0; y <= height; y += step) {
      window.scrollTo(0, y);
      await wait(80);
    }
    window.scrollTo(0, height);
    await wait(400);
    window.scrollTo(0, 0);
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if (img.loading === "lazy") img.loading = "eager";
      const loaded = new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
        setTimeout(done, 4000);
      });
      const decoded = img.decode().catch(() => undefined);
      return Promise.race([Promise.all([loaded, decoded]), wait(4000)]);
    }));
  });
  const broken = await page.evaluate(() => {
    return Array.from(document.images).filter((img) => !(img.complete && img.naturalWidth > 0)).length;
  });
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  // Size the viewport to the whole document instead of fullPage stitching, which paints sticky layers mid-page.
  const fullH = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewport({ width: page.viewport().width, height: fullH });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: out });
  console.log("broken images: " + broken);
} finally {
  await browser.close();
}
