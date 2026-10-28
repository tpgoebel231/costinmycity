/**
 * Permit pages must show the data-file fee in the matching table row,
 * match visible FAQ text to FAQPage JSON-LD, and link from each cost page
 * and city hub. Does not import the page helper.
 *
 * usd() rounds amounts at $1,000. A page keeps the official cent label when
 * the permit callout already shows it, so either that label or usd() counts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(import.meta.dirname, "../..");
const outDir = path.join(root, "out");
const SITE = "https://costinmycity.com";
const NOT_PUBLISHED = "The city has not published a fee for this job";
const ORDER = ["roof-replacement", "hvac-replacement", "deck", "kitchen-remodel"];
const EM = /\u2014|&mdash;|&#8212;|&#x2014;/i;

const cities = JSON.parse(fs.readFileSync(path.join(root, "data/cities.json"), "utf8"));
const permits = JSON.parse(fs.readFileSync(path.join(root, "data/permits.json"), "utf8"));
const costsFile = JSON.parse(fs.readFileSync(path.join(root, "data/project-costs.json"), "utf8"));
const projects = (Array.isArray(costsFile) ? costsFile : costsFile.projects).filter((item) => item?.projectSlug);

function launchSlugs() {
  const fromData = projects.map((item) => item.projectSlug);
  const ordered = ORDER.filter((slug) => fromData.includes(slug));
  const extra = fromData.filter((slug) => !ORDER.includes(slug));
  return [...ordered, ...extra];
}

function usd(n) {
  if (n == null || Number.isNaN(n)) return "\u2013";
  const cents = Math.round(n * 100);
  if (Math.abs(n) < 1000 && cents % 100 !== 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function moneyExact(n) {
  const cents = Math.round(n * 100);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const rem = abs % 100;
  const body = rem === 0 ? dollars : dollars + "." + String(rem).padStart(2, "0");
  return (negative ? "-$" : "$") + body;
}

function containsMoney(text, formatted) {
  if (!formatted) return false;
  const escaped = formatted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped + "(?!\\d)").test(text);
}

function hasFee(text, amount) {
  return containsMoney(text, usd(amount)) || containsMoney(text, moneyExact(amount));
}

function permitFor(citySlug, projectSlug) {
  return permits.find((item) => item.citySlug === citySlug && item.projectSlug === projectSlug);
}

function jobUsable(permit) {
  if (!permit) return false;
  if (permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null) return true;
  if (permit.permitRequired === true || permit.permitRequired === false) return true;
  const model = String(permit.feeModel || "").trim().toLowerCase();
  return Boolean(model && model !== "unknown");
}

function cityHasPage(city) {
  return launchSlugs().some((slug) => jobUsable(permitFor(city.slug, slug)));
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

function norm(text) {
  return decode(String(text || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(html, re) {
  const match = html.match(re);
  return match ? norm(match[1]) : "";
}

function canonical(html) {
  const match = html.match(/<link\b[^>]*rel="canonical"[^>]*>/i);
  if (!match) return "";
  const href = match[0].match(/\bhref="([^"]+)"/i);
  return href ? href[1] : "";
}

function renderedCopy(html) {
  const chunks = [];
  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title) chunks.push(title[1]);
  const metaRe = /<meta\b[^>]*>/gi;
  let match;
  while ((match = metaRe.exec(html))) {
    const meta = match[0];
    if (!/description|og:title|twitter:title/i.test(meta)) continue;
    const content = meta.match(/\bcontent="([^"]*)"/i);
    if (content) chunks.push(content[1]);
  }
  const ldRe = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = ldRe.exec(html))) chunks.push(match[1]);
  let visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");
  visible = visible.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  chunks.push(visible);
  return chunks.join("\n");
}

function jsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      blocks.push(null);
    }
  }
  return blocks;
}

function tableRows(html) {
  const table = html.match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);
  if (!table) return [];
  const rows = [];
  const re = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = re.exec(table[1]))) rows.push(match[1]);
  return rows;
}

function rowForJob(rows, projectSlug, citySlug) {
  const needle = "/cost/" + projectSlug + "/" + citySlug + "/";
  return rows.find((row) => row.includes(needle)) || "";
}

function visibleFaq(html) {
  const items = [];
  const re = /<details\b[^>]*class="[^"]*faq-item[^"]*"[^>]*>[\s\S]*?<summary>([\s\S]*?)<\/summary>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/details>/gi;
  let match;
  while ((match = re.exec(html))) {
    items.push({ question: norm(match[1]), answer: norm(match[2]) });
  }
  return items;
}

function faqFromLd(blocks) {
  const pages = blocks.filter((block) => block && block["@type"] === "FAQPage");
  const items = [];
  for (const page of pages) {
    const main = Array.isArray(page.mainEntity) ? page.mainEntity : [];
    for (const entity of main) {
      items.push({
        question: norm(entity?.name || ""),
        answer: norm(entity?.acceptedAnswer?.text || ""),
      });
    }
  }
  return { pages: pages.length, items };
}

function permitLinkOk(html, slug, cityName) {
  const want = "/permits/" + slug + "/";
  const phrase = "All building permit fees in " + cityName;
  const re = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html))) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/\bhref="([^"]+)"/i);
    if (!hrefMatch) continue;
    let href = hrefMatch[1];
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || "/";
    href = href.split("#")[0].split("?")[0];
    if (href !== want) continue;
    if (/\btarget=/i.test(attrs)) return "target";
    if (norm(match[2]) !== phrase) return "text";
    return "";
  }
  return "missing";
}

function main() {
  const failures = [];
  const slugs = launchSlugs();
  const sitemap = fs.existsSync(path.join(outDir, "sitemap.xml"))
    ? fs.readFileSync(path.join(outDir, "sitemap.xml"), "utf8")
    : "";
  const locs = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
  let pages = 0;

  for (const city of cities) {
    if (!city?.slug) continue;
    const file = path.join(outDir, "permits", city.slug, "index.html");
    const pageUrl = SITE + "/permits/" + city.slug + "/";
    const wantPage = cityHasPage(city);
    const exists = fs.existsSync(file);

    if (!wantPage) {
      if (exists) failures.push(city.slug + " skipped city still has a permit page");
      if (locs.has(pageUrl)) failures.push(city.slug + " skipped city is in the sitemap");
      for (const projectSlug of slugs) {
        const costFile = path.join(outDir, "cost", projectSlug, city.slug, "index.html");
        if (!fs.existsSync(costFile)) continue;
        const costHtml = fs.readFileSync(costFile, "utf8");
        if (costHtml.includes("/permits/" + city.slug + "/")) {
          failures.push(city.slug + " skipped city is linked from " + projectSlug);
        }
      }
      const hubFile = path.join(outDir, "city", city.slug, "index.html");
      if (fs.existsSync(hubFile) && fs.readFileSync(hubFile, "utf8").includes("/permits/" + city.slug + "/")) {
        failures.push(city.slug + " skipped city is linked from the hub");
      }
      continue;
    }

    pages += 1;
    if (!exists) {
      failures.push(city.slug + " missing permit page");
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const title = tag(html, /<title>([\s\S]*?)<\/title>/i);
    const h1 = tag(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (!title.includes("(2026)")) failures.push(city.slug + " title missing (2026): " + title);
    if (!h1.includes("(2026)")) failures.push(city.slug + " H1 missing (2026): " + h1);
    const canon = canonical(html);
    if (canon !== pageUrl) failures.push(city.slug + " canonical " + canon + " != " + pageUrl);
    if (EM.test(renderedCopy(html))) failures.push(city.slug + " em dash");
    if (!locs.has(pageUrl)) failures.push(city.slug + " missing from sitemap");

    const rows = tableRows(html);
    for (const projectSlug of slugs) {
      const row = rowForJob(rows, projectSlug, city.slug);
      if (!row) {
        failures.push(city.slug + " " + projectSlug + " missing table row");
        continue;
      }
      const text = norm(row);
      const permit = permitFor(city.slug, projectSlug);
      if (!permit || permit.feeTypicalUsd == null) {
        if (!text.includes(NOT_PUBLISHED)) {
          failures.push(city.slug + " " + projectSlug + " null fee missing not-published wording");
        }
        continue;
      }
      const amounts = [
        ["typical", permit.feeTypicalUsd],
        ["low", permit.feeLowUsd],
        ["high", permit.feeHighUsd],
      ];
      for (const [label, amount] of amounts) {
        if (typeof amount !== "number" || Number.isNaN(amount)) continue;
        if (!hasFee(text, amount)) {
          failures.push(city.slug + " " + projectSlug + " " + label + " " + amount + " not in row");
        }
      }
    }

    const blocks = jsonLdBlocks(html);
    const faqLd = faqFromLd(blocks);
    const crumbs = blocks.filter((block) => block && block["@type"] === "BreadcrumbList");
    if (faqLd.pages !== 1) failures.push(city.slug + " FAQPage count " + faqLd.pages);
    if (crumbs.length !== 1) failures.push(city.slug + " BreadcrumbList count " + crumbs.length);
    const visible = visibleFaq(html);
    const dept = String(city.permitDeptName || "").trim();
    const portal = String(city.permitPortalUrl || "").trim();
    if (dept && portal) {
      const apply = visible.find((item) => item.question.indexOf("Where do I apply") === 0);
      if (!apply) failures.push(city.slug + " missing apply FAQ");
      else if (!apply.answer.includes(portal)) failures.push(city.slug + " apply FAQ missing portal URL");
    }
    if (visible.length !== faqLd.items.length) {
      failures.push(city.slug + " FAQ length visible " + visible.length + " jsonld " + faqLd.items.length);
    } else {
      for (let i = 0; i < visible.length; i++) {
        if (visible[i].question !== faqLd.items[i].question || visible[i].answer !== faqLd.items[i].answer) {
          failures.push(city.slug + " FAQ mismatch at " + i);
          break;
        }
      }
    }

    for (const projectSlug of slugs) {
      const costFile = path.join(outDir, "cost", projectSlug, city.slug, "index.html");
      if (!fs.existsSync(costFile)) {
        failures.push(city.slug + " missing cost page " + projectSlug);
        continue;
      }
      const problem = permitLinkOk(fs.readFileSync(costFile, "utf8"), city.slug, city.name);
      if (problem) failures.push(city.slug + " cost " + projectSlug + " permit link " + problem);
    }
    const hubFile = path.join(outDir, "city", city.slug, "index.html");
    if (!fs.existsSync(hubFile)) {
      failures.push(city.slug + " missing hub");
    } else {
      const problem = permitLinkOk(fs.readFileSync(hubFile, "utf8"), city.slug, city.name);
      if (problem) failures.push(city.slug + " hub permit link " + problem);
    }
  }

  const permitLocs = [...locs].filter((loc) => /\/permits\/[^/]+\/$/.test(loc));
  if (permitLocs.length !== pages) {
    failures.push("sitemap permit URLs " + permitLocs.length + " != pages " + pages);
  }

  if (failures.length) {
    console.error("permits-page-check: " + failures.length + " problem(s).");
    for (const failure of failures.slice(0, 40)) console.error(failure);
    process.exit(1);
  }
  console.log("permits-page-check: " + pages + " permit pages match the data-file fees.");
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (entry === fileURLToPath(import.meta.url)) main();
