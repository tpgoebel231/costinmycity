import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Assumptions } from "@/components/Assumptions";
import { Citations } from "@/components/Citations";
import { CiteThisPage } from "@/components/CiteThisPage";
import { ClusterCompareTable } from "@/components/ClusterCompareTable";
import { InCityJobsTable } from "@/components/InCityJobsTable";
import { CostBySizeTable } from "@/components/CostBySizeTable";
import { CostDrivers } from "@/components/CostDrivers";
import { JsonLd } from "@/components/JsonLd";
import { MoneyCalculator } from "@/components/MoneyCalculator";
import { MoneyFaq } from "@/components/MoneyFaq";
import { CityFactsCallout } from "@/components/CityFactsCallout";
import { CityHubContext } from "@/components/CityHubContext";
import { WhyCostsDiffer } from "@/components/WhyCostsDiffer";
import { FeeScheduleMeta } from "@/components/FeeScheduleMeta";
import { PermitPortalCallout } from "@/components/PermitPortalCallout";
import { WageIndexCallout } from "@/components/WageIndexCallout";
import { LaborMaterialsSplitCallout } from "@/components/LaborMaterialsSplitCallout";
import { FeeModelCallout } from "@/components/FeeModelCallout";
import { TypicalJobSpecCallout } from "@/components/TypicalJobSpecCallout";
import { PermitCallout } from "@/components/PermitCallout";
import { PermitExtrasTable } from "@/components/PermitExtrasTable";
import { PermitProcessFaq } from "@/components/PermitProcessFaq";
import { PermitScheduleFaq } from "@/components/PermitScheduleFaq";
import { PermitValuationTable } from "@/components/PermitValuationTable";
import { RelatedMoneyLinks } from "@/components/RelatedMoneyLinks";
import { SourcingCopy } from "@/components/SourcingCopy";
import { IconCard } from "@/components/ui/IconCard";
import { IconHammer, IconHouse, IconReceipt } from "@/components/ui/icons";
import { JobPhoto } from "@/components/ui/JobPhoto";
import { PriceSummary } from "@/components/ui/PriceSummary";
import { SizeTiers } from "@/components/ui/SizeTiers";
import { SplitBar } from "@/components/ui/SplitBar";
import { StickyEstimate } from "@/components/ui/StickyEstimate";
import { Toc } from "@/components/ui/Toc";
import { sanitizeCopy, sanitizeRendered } from "@/lib/dashes";
import { cityLabel, getCities, getCity, getLaunchProjectSlugs, getPermit, getProjectCost, getProjectCostsFile, permitFeeKnown } from "@/lib/data";
import { buildEstimate, permitDisplayUsd } from "@/lib/estimates";
import { formatDate, usd } from "@/lib/format";
import { costBySize } from "@/lib/cost-by-size";
import { moneyPageSeo } from "@/lib/money-page-seo";
import { moneyPageSerpMeta } from "@/lib/money-serp-retitle";
import { denverRoofHailSources, moneyFaqItems, phoenixRoofPermitSources } from "@/lib/local-copy";
import { permitProcessFaqItems } from "@/lib/permit-process";
import { cityFactsCallout } from "@/lib/city-facts";
import { whyCostsDiffer } from "@/lib/why-costs-differ";
import { feeScheduleMeta } from "@/lib/fee-schedule-meta";
import { permitPortalCallout } from "@/lib/permit-portal";
import { wageIndexCallout } from "@/lib/wage-index";
import { laborMaterialsSplit } from "@/lib/labor-materials-split";
import { feeModelCallout } from "@/lib/fee-model-callout";
import { typicalJobSpecCallout } from "@/lib/typical-job-spec-callout";
import { permitScheduleFaqItems } from "@/lib/permit-schedule-faq";
import { projectMeta } from "@/lib/projects";
import { relatedMoneyGroups } from "@/lib/related-links";
import { breadcrumbJsonLd, estimateJsonLd, faqPageJsonLd, pageSeo } from "@/lib/seo";
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
  const permit = getPermit(citySlug, projectSlug);
  const seo = moneyPageSeo(city, project, permit);
  const serp = moneyPageSerpMeta(city, project, permit);
  return pageSeo({
    title: serp ? serp.title : seo.title,
    description: serp ? serp.description : seo.description,
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
  const seo = moneyPageSeo(city, project, permit);
  const h1 = sanitizeCopy(seo.h1);
  const path = "/cost/" + projectSlug + "/" + city.slug;
  const known = permitFeeKnown(permit);
  const desc = seo.description;

  const sources: CostSource[] = [...(project.sources ?? [])];
  if (permit?.sourceUrl) {
    sources.push({ name: permit.sourceName, url: permit.sourceUrl, retrievedDate: permit.retrievedDate });
  }
  if (permit?.exemptionSource?.url) {
    sources.push(permit.exemptionSource);
  }
  const adj = project.cityAdjustments?.[city.slug];
  if (adj?.source) {
    sources.push({ name: "BLS OEWS construction wages – " + (adj.metro || cityLabel(city)), url: adj.source, note: adj.method });
  }
  sources.push(...denverRoofHailSources(city, project, permit));
  sources.push(...phoenixRoofPermitSources(city, project, permit));

  const processFaqItems = permitProcessFaqItems(city, project, permit);
  const scheduleFaqItems = permitScheduleFaqItems(city, project, permit);
  const factsMeta = cityFactsCallout(city);
  const whyDifferMeta = whyCostsDiffer(city, project, permit);
  const wageMeta = wageIndexCallout(project, city);
  const laborSplitMeta = laborMaterialsSplit(project, city);
  const scheduleMeta = feeScheduleMeta(city, permit);
  const portalMeta = permitPortalCallout(city);
  const feeModelMeta = feeModelCallout(city, projectSlug, permit);
  const typicalSpecMeta = typicalJobSpecCallout(city, projectSlug);
  const faqItems = moneyFaqItems(city, project, permit);
  const related = relatedMoneyGroups(city, project);
  const jsonLdFaq = [...faqItems, ...processFaqItems, ...scheduleFaqItems];
  const sizes = costBySize(project, city, permit);
  const shownPermit = permitDisplayUsd(est);
  const checkedDate = permit?.retrievedDate
    ? formatDate(permit.retrievedDate)
    : city.feeScheduleYear != null
      ? String(city.feeScheduleYear)
      : null;
  const asOf = getProjectCostsFile()?.asOf;
  const updated = permit?.retrievedDate
    ? formatDate(permit.retrievedDate)
    : asOf
      ? formatDate(asOf)
      : null;
  const badgeHref = (permit?.sourceUrl || "").trim() || (city.feeScheduleUrl || "").trim() || "#permit";
  const dept = sanitizeCopy(city.permitDeptName);
  const cityName = sanitizeCopy(city.name);
  const materialRaw = project.materialShare ?? project.materialsShare;
  const split = project.laborShare != null && Number.isFinite(project.laborShare)
    ? {
        labor: Math.round(project.laborShare * 100),
        materials: Math.round((materialRaw != null && Number.isFinite(materialRaw) ? materialRaw : Math.max(0, 1 - project.laborShare)) * 100),
      }
    : null;

  const toc = [
    { href: "#calculator", label: "Calculator" },
    { href: "#breakdown", label: "Cost breakdown" },
    sizes ? { href: "#sizes", label: "Cost by size" } : null,
    { href: "#permit", label: "Permit" },
    faqItems.length ? { href: "#faq", label: "Questions" } : null,
    { href: "#related", label: "Nearby" },
    { href: "#citations", label: "Sources" },
  ].filter((item): item is { href: string; label: string } => item != null);

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
    <div className="wrap">
      <JsonLd data={jsonLd} />
      <p className="crumb">
        <Link href={"/city/" + city.slug}>{cityLabel(city)}</Link>
        {" / "}
        <Link href={"/cost/" + projectSlug}>{meta.shortName}</Link>
      </p>
      <h1 className="page-h1">{h1}</h1>
      <p className="trust-line">
        {updated ? <>Updated {updated} · </> : null}
        Sources: BLS OEWS, {cityName} fee schedule · <Link href="/methodology">How we price</Link>
      </p>
      <div className="hero-grid">
        <MoneyCalculator
          project={sanitizeRendered(project)}
          city={sanitizeRendered(city)}
          permit={permit ? sanitizeRendered(permit) : null}
          badgeLabel={checkedDate ? "Fees checked " + checkedDate : "Fees checked"}
          badgeHref={badgeHref}
        />
        <JobPhoto id={projectSlug} sizes="(min-width: 960px) 40vw, 720px" />
      </div>
      <Toc items={toc} />
      <div className="body-grid">
        <div>
          <SourcingCopy city={city} project={project} permit={permit} />
          <section id="breakdown" className="section-gap">
            <h2>Cost breakdown</h2>
            <div className="icon-grid mt-4">
              <IconCard
                icon={<IconHammer />}
                label="Labor"
                amount={usd(est.job.laborTypical)}
                note="Allocated share, adjusted for local construction wages."
              />
              <IconCard
                icon={<IconHouse />}
                label="Materials"
                amount={usd(est.job.materialsTypical)}
                note="Materials stay at the national figure."
              />
              <IconCard
                icon={<IconReceipt />}
                label="Permit"
                amount={est.permitKnown ? usd(shownPermit) : "Blank"}
                note={est.permitKnown ? "City fee for this typical job." : "Not published, so this line is blank."}
              />
            </div>
            <p className="mt-4">
              Job subtotal <span className="num">{usd(est.job.typical)}</span>
            </p>
            {split ? <SplitBar laborPct={split.labor} materialsPct={split.materials} /> : null}
          </section>
          <SizeTiers project={project} city={city} permit={permit} />
          {sizes ? (
            <details className="fold">
              <summary>
                <h2 className="fold-title">Cost by size table</h2>
              </summary>
              <CostBySizeTable project={project} city={city} permit={permit} demoteHeading />
            </details>
          ) : null}
          <LaborMaterialsSplitCallout model={laborSplitMeta} />
          <div id="permit">
            <PermitCallout
              city={city}
              project={project}
              permit={permit}
              noteShownBelow={Boolean(
                feeModelMeta?.calculationNote &&
                  feeModelMeta.calculationNote === (permit?.calculationNote || "").trim(),
              )}
            >
              <FeeModelCallout model={feeModelMeta} />
              <FeeScheduleMeta model={scheduleMeta} />
              <PermitPortalCallout model={portalMeta} />
              <PermitExtrasTable permit={permit} />
              <PermitValuationTable permit={permit} />
              <PermitProcessFaq cityLabel={cityLabel(city)} items={processFaqItems} />
              <PermitScheduleFaq cityLabel={cityLabel(city)} items={scheduleFaqItems} />
            </PermitCallout>
          </div>
          <WhyCostsDiffer model={whyDifferMeta} />
          <Assumptions city={city} project={project} permit={permit} />
          <TypicalJobSpecCallout model={typicalSpecMeta} />
          {factsMeta ? (
            <CityHubContext collapsible>
              <CityFactsCallout model={factsMeta} nested />
            </CityHubContext>
          ) : null}
          <CostDrivers project={project} city={city} permit={permit} />
          {wageMeta ? (
            <details id="wages" className="fold">
              <summary>
                <h2 className="fold-title">Metro wage index</h2>
              </summary>
              <WageIndexCallout model={wageMeta} demoteHeading />
            </details>
          ) : null}
          <ClusterCompareTable project={project} city={city} folded />
          <InCityJobsTable city={city} project={project} folded />
          {faqItems.length ? <MoneyFaq items={faqItems} /> : null}
          <RelatedMoneyLinks groups={related} cityName={city.name} />
          <Citations sources={sources} title="Citations">
            <CiteThisPage city={city} project={project} permit={permit} path={path} />
          </Citations>
        </div>
        <PriceSummary typical={est.allInTypical} low={est.bandLow} high={est.bandHigh} dept={dept} />
      </div>
      <StickyEstimate typical={est.allInTypical} />
    </div>
  );
}
