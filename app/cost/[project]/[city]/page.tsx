import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Citations } from "@/components/Citations";
import { JsonLd } from "@/components/JsonLd";
import { MoneyCalculator } from "@/components/MoneyCalculator";
import { SourcingCopy } from "@/components/SourcingCopy";
import { cityLabel, getCities, getCity, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { projectMeta, shortProjectName } from "@/lib/projects";
import { breadcrumbJsonLd, estimateJsonLd, keepHvac, pageSeo } from "@/lib/seo";
import type { CostSource } from "@/lib/types";

export function generateStaticParams() {
  const params: { project: string; city: string }[] = [];
  for (const project of getLaunchProjectSlugs()) {
    for (const city of getCities()) {
      params.push({ project, city: city.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ project: string; city: string }> }): Promise<Metadata> {
  const { project: projectSlug, city: citySlug } = await params;
  const city = getCity(citySlug);
  const project = getProjectCost(projectSlug);
  if (!city || !project) return { title: "Estimate" };
  const name = shortProjectName(projectSlug);
  const title = name + " cost in " + cityLabel(city);
  const permit = getPermit(citySlug, projectSlug);
  const est = buildEstimate(project, city, permit);
  const desc = permitFeeKnown(permit)
    ? "Typical all-in " + usd(est.allInTypical) + " for " + name + " in " + cityLabel(city) + ", including the recorded local permit fee."
    : "Typical job cost for " + name + " in " + cityLabel(city) + ". Local permit fee not yet recorded from the official schedule.";
  return pageSeo({
    title,
    description: keepHvac(desc),
    path: "/cost/" + projectSlug + "/" + citySlug,
  });
}

export default async function MoneyPage({ params }: { params: Promise<{ project: string; city: string }> }) {
  const { project: projectSlug, city: citySlug } = await params;
  const city = getCity(citySlug);
  const project = getProjectCost(projectSlug);
  if (!city || !project) notFound();
  const permit = getPermit(citySlug, projectSlug) ?? null;
  const est = buildEstimate(project, city, permit ?? undefined);
  const meta = projectMeta(projectSlug);
  const h1 = meta.shortName + " cost in " + cityLabel(city);
  const path = "/cost/" + projectSlug + "/" + city.slug;
  const known = permitFeeKnown(permit);
  const desc = known
    ? "Typical all-in " + usd(est.allInTypical) + " for " + meta.shortName + " in " + cityLabel(city) + ", including the recorded local permit fee."
    : "Typical job cost for " + meta.shortName + " in " + cityLabel(city) + ". Local permit fee not yet recorded from the official schedule.";

  const sources: CostSource[] = [...(project.sources ?? [])];
  if (permit?.sourceUrl) {
    sources.push({ name: permit.sourceName, url: permit.sourceUrl, retrievedDate: permit.retrievedDate, note: permit.caveat });
  }
  const adj = project.cityAdjustments?.[city.slug];
  if (adj?.source) {
    sources.push({ name: "BLS OEWS construction wages — " + (adj.metro || cityLabel(city)), url: adj.source, note: adj.method });
  }

  const otherProjects = getLaunchProjectSlugs().filter((s) => s !== projectSlug);
  const otherCities = getCities().filter((c) => c.slug !== city.slug);

  const jsonLd: object[] = [
    estimateJsonLd({
      name: h1,
      description: desc,
      path,
      allInLow: est.allInLow,
      allInTypical: est.allInTypical,
      allInHigh: est.allInHigh,
      permitKnown: known && permit?.feeTypicalUsd != null && permit.feeTypicalUsd > 0,
      permitTypical: permit?.feeTypicalUsd != null && permit.feeTypicalUsd > 0 ? permit.feeTypicalUsd : null,
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: meta.shortName + " cost by city", path: "/cost/" + projectSlug },
      { name: h1, path },
    ]),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd data={jsonLd} />
      <p className="text-sm text-muted">
        <Link href={"/city/" + city.slug} className="underline">{cityLabel(city)}</Link>
        {" / "}
        <Link href={"/cost/" + projectSlug} className="underline">{meta.shortName}</Link>
      </p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">{h1}</h1>
          <p className="mt-3 max-w-2xl text-muted">{project.scopeNote || project.unitNote}</p>
          <SourcingCopy city={city} project={project} permit={permit} />
          <div className="mt-8"><MoneyCalculator project={project} city={city} permit={permit} /></div>
          <div className="mt-10 flex justify-center lg:hidden"><AdSlot placement="inline" /></div>
          <Citations sources={sources} title="Citations" />
          <section className="mt-10">
            <h2 className="font-display text-2xl">Other projects in {city.name}</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {otherProjects.map((s) => (
                <li key={s}><Link href={"/cost/" + s + "/" + city.slug} className="underline">{shortProjectName(s)} in {cityLabel(city)}</Link></li>
              ))}
            </ul>
          </section>
          <section className="mt-8">
            <h2 className="font-display text-2xl">{meta.shortName} in other cities</h2>
            <ul className="mt-3 columns-1 gap-x-8 text-sm sm:columns-2">
              {otherCities.map((c) => (
                <li key={c.slug} className="mb-1"><Link href={"/cost/" + projectSlug + "/" + c.slug} className="underline">{cityLabel(c)}</Link></li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="hidden lg:block">
          <AdSlot placement="sidebar" />
          <p className="mt-6 text-xs text-muted">Estimates, not quotes. Verify the fee with {city.permitDeptName} before you apply.</p>
        </aside>
      </div>
    </div>
  );
}
