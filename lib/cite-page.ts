import { cityLabel } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { shortProjectName } from "@/lib/projects";
import { absUrl, SITE_NAME } from "@/lib/seo";
import type { City, Permit, ProjectCost } from "@/lib/types";

export type CiteThisPageModel = {
  pageTitle: string;
  pageUrl: string;
  retrievedLabel: string | null;
  citationText: string;
  sourceName: string | null;
  sourceUrl: string | null;
};

/** Crawlable cite-this-page copy for money pages. Never invents retrieved dates. */
export function citeThisPageModel(
  city: City,
  project: ProjectCost,
  permit: Permit | null | undefined,
  path: string,
): CiteThisPageModel {
  const pageTitle = shortProjectName(project.projectSlug) + " cost in " + cityLabel(city);
  const pageUrl = absUrl(path);
  const retrievedDate = permit?.retrievedDate?.trim() || "";
  const retrievedLabel = retrievedDate ? "Fee schedule retrieved " + formatDate(retrievedDate) : null;
  const sourceName = permit?.sourceName?.trim() || null;
  const sourceUrl = permit?.sourceUrl?.trim() || null;

  const lines = [SITE_NAME + '. "' + pageTitle + '." ' + pageUrl + "."];
  const extra: string[] = [];
  if (retrievedLabel) extra.push(retrievedLabel);
  if (sourceName) extra.push("Source: " + sourceName);
  if (extra.length) lines.push(extra.join(". ") + ".");

  return {
    pageTitle,
    pageUrl,
    retrievedLabel,
    citationText: lines.join("\n"),
    sourceName,
    sourceUrl,
  };
}
