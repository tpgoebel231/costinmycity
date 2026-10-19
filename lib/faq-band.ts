import { buildEstimate, type Estimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { highBandReachPrefix } from "@/lib/high-band";
import { projectMeta } from "@/lib/projects";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type BudgetFaqItem = { question: string; answer: string };

const TRIPLE =
  /(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) low, (\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) typical, and (\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) high/g;

const BUDGET_QUESTION = /too much|enough|how much|\bcost\b|typical|average|budget/i;

/**
 * Hero broad-high label, lowercased, without the trailing "can reach".
 * "Premium or steep roofs can reach " becomes "premium or steep roofs".
 */
export function broadHighLabel(project: ProjectCost): string | null {
  const prefix = highBandReachPrefix(project);
  if (!prefix) return null;
  const label = prefix.replace(/\s*can reach\s*$/i, "").trim().toLowerCase();
  return label || null;
}

/**
 * Band sentence for a budget FAQ. Null when the hero chip is already the
 * full low-to-high band, so that copy stays as written.
 */
export function mostProjectsRunClause(est: Estimate, project: ProjectCost): string | null {
  if (est.bandLow === est.allInLow && est.bandHigh === est.allInHigh) return null;
  const label = broadHighLabel(project);
  if (!label) return null;
  return (
    usd(est.allInTypical) +
    " typical, most projects run " +
    usd(est.bandLow) +
    " to " +
    usd(est.bandHigh) +
    ", and " +
    label +
    " can reach " +
    usd(est.allInHigh)
  );
}

function isBudgetQuestion(question: string): boolean {
  return BUDGET_QUESTION.test(question);
}

function moneyNumber(token: string): number {
  return Number(token.replace(/[$,]/g, ""));
}

function estimatesByTriple(project: ProjectCost, city: City, permit: Permit | null | undefined): Map<string, Estimate> {
  const meta = projectMeta(project.projectSlug);
  const quantities: number[] = [];
  if (meta.quantityStep > 0 && meta.quantityMax >= meta.quantityMin) {
    for (let qty = meta.quantityMin; qty <= meta.quantityMax + 1e-9; qty += meta.quantityStep) {
      quantities.push(Math.round(qty * 1000) / 1000);
    }
  }
  if (!quantities.includes(meta.defaultQuantity)) quantities.unshift(meta.defaultQuantity);
  const map = new Map<string, Estimate>();
  const ordered = [meta.defaultQuantity, ...quantities.filter((qty) => qty !== meta.defaultQuantity)];
  for (const qty of ordered) {
    const est = buildEstimate(project, city, permit ?? undefined, qty);
    const key = usd(est.allInLow) + "\n" + usd(est.allInTypical) + "\n" + usd(est.allInHigh);
    if (!map.has(key)) map.set(key, est);
  }
  return map;
}

function rewriteTriples(
  answer: string,
  project: ProjectCost,
  byTriple: Map<string, Estimate>,
): { text: string; used: Estimate[] } {
  const used: Estimate[] = [];
  let cursor = 0;
  let out = "";
  const re = new RegExp(TRIPLE.source, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(answer))) {
    const key = match[1] + "\n" + match[2] + "\n" + match[3];
    const est = byTriple.get(key);
    const clause = est ? mostProjectsRunClause(est, project) : null;
    if (!est || !clause) continue;
    out += answer.slice(cursor, match.index) + clause;
    cursor = match.index + match[0].length;
    used.push(est);
  }
  out += answer.slice(cursor);
  return { text: out, used };
}

/**
 * Comparisons that named the old low-to-high span. Keep them when they are
 * still true against the band and the broad high. Rewrite them when they are not.
 */
function fixComparisons(answer: string, used: Estimate[]): string {
  let text = answer.replace(
    /(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) sits inside it/g,
    (full, money: string, offset: number) => {
      const amount = moneyNumber(money);
      const before = answer.slice(0, offset);
      let est = used[used.length - 1];
      let bestAt = -1;
      for (const candidate of used) {
        const at = before.lastIndexOf(usd(candidate.allInHigh));
        if (at >= bestAt) {
          bestAt = at;
          est = candidate;
        }
      }
      if (!est) return full;
      if (amount > est.bandHigh && amount <= est.allInHigh) {
        return money + " is above the range for most projects and below that broad high";
      }
      if (amount > est.allInHigh) {
        return money + " is above that broad high";
      }
      if (amount < est.bandLow) {
        return money + " is below the range for most projects";
      }
      return full;
    },
  );

  text = text.replace(
    /(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) is above that typical of (\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    (full, budgetMoney: string, typicalMoney: string) => {
      const budget = moneyNumber(budgetMoney);
      const typical = moneyNumber(typicalMoney);
      if (budget > typical) return full;
      if (budget === typical) return budgetMoney + " matches that typical of " + typicalMoney;
      return budgetMoney + " is below that typical of " + typicalMoney;
    },
  );

  const bandSource = text;
  text = bandSource.replace(
    /(\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?) is above that band/g,
    (full, money: string, offset: number) => {
      const amount = moneyNumber(money);
      const before = bandSource.slice(Math.max(0, offset - 280), offset);
      const ranges = [...before.matchAll(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?) to \$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)];
      if (!ranges.length) return full;
      const last = ranges[ranges.length - 1];
      const low = moneyNumber("$" + last[1]);
      const high = moneyNumber("$" + last[2]);
      if (amount > high) return full;
      if (amount >= low) return money + " is inside that band";
      return money + " is below that band";
    },
  );

  return text;
}

/**
 * Rewrite budget, too much, enough, how much, and other answers that quote
 * an all-in low/high different from the hero band at that size.
 */
export function alignBudgetFaqItems(
  items: BudgetFaqItem[],
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
): BudgetFaqItem[] {
  if (!highBandReachPrefix(project)) return items;
  const needs = items.some(
    (item) => item.answer.includes(" low, ") && (isBudgetQuestion(item.question) || item.answer.includes("the all-in is")),
  );
  if (!needs) return items;
  const byTriple = estimatesByTriple(project, city, permit);
  return items.map((item) => {
    const quoted =
      item.answer.includes(" low, ") &&
      (isBudgetQuestion(item.question) || item.answer.includes("the all-in is") || / low, .+ typical, and .+ high/.test(item.answer));
    if (!quoted) return item;
    const rewritten = rewriteTriples(item.answer, project, byTriple);
    if (!rewritten.used.length) return item;
    const answer = fixComparisons(rewritten.text, rewritten.used);
    if (answer === item.answer) return item;
    return { question: item.question, answer };
  });
}
