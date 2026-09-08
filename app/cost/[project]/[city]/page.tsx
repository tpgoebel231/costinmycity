import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Assumptions } from "@/components/Assumptions";
import { Citations } from "@/components/Citations";
import { CiteThisPage } from "@/components/CiteThisPage";
import { ClusterCompareTable } from "@/components/ClusterCompareTable";
import { InCityJobsTable } from "@/components/InCityJobsTable";
import { CostBreakdownTable } from "@/components/CostBreakdownTable";
import { CostBySizeTable } from "@/components/CostBySizeTable";
import { CostDrivers } from "@/components/CostDrivers";
import { JsonLd } from "@/components/JsonLd";
import { MoneyCalculator } from "@/components/MoneyCalculator";
import { MoneyFaq } from "@/components/MoneyFaq";
import { CityFactsCallout } from "@/components/CityFactsCallout";
import { FeeScheduleMeta } from "@/components/FeeScheduleMeta";
import { PermitPortalCallout } from "@/components/PermitPortalCallout";
import { WageIndexCallout } from "@/components/WageIndexCallout";
import { PermitCallout } from "@/components/PermitCallout";
import { PermitExtrasTable } from "@/components/PermitExtrasTable";
import { PermitProcessFaq } from "@/components/PermitProcessFaq";
import { PermitScheduleFaq } from "@/components/PermitScheduleFaq";
import { PermitValuationTable } from "@/components/PermitValuationTable";
import { RelatedMoneyLinks } from "@/components/RelatedMoneyLinks";
import { SourcingCopy } from "@/components/SourcingCopy";
import { cityLabel, getCities, getCity, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { moneyFaqItems } from "@/lib/local-copy";
import { permitProcessFaqItems } from "@/lib/permit-process";
import { cityFactsCallout } from "@/lib/city-facts";
import { feeScheduleMeta } from "@/lib/fee-schedule-meta";
import { permitPortalCallout } from "@/lib/permit-portal";
import { wageIndexCallout } from "@/lib/wage-index";
import { permitScheduleFaqItems } from "@/lib/permit-schedule-faq";
import { projectMeta, shortProjectName } from "@/lib/projects";
import { relatedMoneyGroups } from "@/lib/related-links";
import { breadcrumbJsonLd, estimateJsonLd, faqPageJsonLd, keepHvac, pageSeo } from "@/lib/seo";
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

  const processFaqItems = permitProcessFaqItems(city, project, permit);
  const scheduleFaqItems = permitScheduleFaqItems(city, project, permit);
  const factsMeta = cityFactsCallout(city);
  const wageMeta = wageIndexCallout(project, city);
  const scheduleMeta = feeScheduleMeta(city, permit);
  const portalMeta = permitPortalCallout(city);
  const faqItems = moneyFaqItems(city, project, permit);
  const related = relatedMoneyGroups(city, project);
  const jsonLdFaq = [...processFaqItems, ...scheduleFaqItems, ...faqItems];

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
  if (jsonLdFaq.length) jsonLd.push(faqPageJsonLd(jsonLdFaq));

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
          <Assumptions city={city} project={project} permit={permit} />
          <CityFactsCallout model={factsMeta} />
          <div className="mt-8"><MoneyCalculator project={project} city={city} permit={permit} /></div>
          <CostBySizeTable project={project} city={city} permit={permit} />
          <CostBreakdownTable project={project} city={city} permit={permit} />
          <CostDrivers project={project} city={city} permit={permit} />
          <WageIndexCallout model={wageMeta} />
          <ClusterCompareTable project={project} city={city} />
          <InCityJobsTable city={city} project={project} />
          <PermitCallout city={city} project={project} permit={permit} />
          <FeeScheduleMeta model={scheduleMeta} />
          <PermitPortalCallout model={portalMeta} />
          <PermitExtrasTable permit={permit} />
          <PermitValuationTable permit={permit} />
          <PermitProcessFaq cityLabel={cityLabel(city)} items={processFaqItems} />
          <PermitScheduleFaq cityLabel={cityLabel(city)} items={scheduleFaqItems} />
          {faqItems.length ? <MoneyFaq items={faqItems} /> : null}
          <div className="mt-10 flex justify-center lg:hidden"><AdSlot placement="inline" /></div>
          <Citations sources={sources} title="Citations" />
          <CiteThisPage city={city} project={project} permit={permit} path={path} />
          <RelatedMoneyLinks groups={related} cityName={city.name} />
        </div>
        <aside className="hidden lg:block">
          <AdSlot placement="sidebar" />
          <p className="mt-6 text-xs text-muted">Estimates, not quotes. Verify the fee with {city.permitDeptName} before you apply.</p>
        </aside>
      </div>
    </div>
  );
}
