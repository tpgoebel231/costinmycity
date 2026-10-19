import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { CityFactsCallout } from "@/components/CityFactsCallout";
import { CityHubContext } from "@/components/CityHubContext";
import { WageIndexCallout } from "@/components/WageIndexCallout";
import { CityHubJobsTable } from "@/components/CityHubJobsTable";
import { CityHubLaborSplitTable } from "@/components/CityHubLaborSplitTable";
import { CityHubTypicalJobSpecTable } from "@/components/CityHubTypicalJobSpecTable";
import { CityHubFaq } from "@/components/CityHubFaq";
import { CityHubPermits } from "@/components/CityHubPermits";
import { JsonLd } from "@/components/JsonLd";
import { CityHeroPhoto } from "@/components/ui/CityHeroPhoto";
import { FeesCheckedBadge } from "@/components/ui/FeesCheckedBadge";
import { JobPhoto } from "@/components/ui/JobPhoto";
import { NearbyCityCards } from "@/components/ui/NearbyCityCards";
import { Toc } from "@/components/ui/Toc";
import { sanitizeCopy, sanitizeRendered } from "@/lib/dashes";
import { cityLabel, getCities, getCity, getLaunchProjectSlugs, getPermit, getProjectCost } from "@/lib/data";
import { cityFactsCallout } from "@/lib/city-facts";
import { wageIndexCalloutForCity } from "@/lib/wage-index";
import {
  cityHubFaqItems,
  cityHubFeesChecked,
  cityHubHeroSentence,
  cityHubNearby,
  cityHubNearbyHeading,
  cityHubPermitBullets,
  cityHubRenovationSection,
} from "@/lib/city-hub-deepen";
import { cityHubSeo, cityHubSerpMeta } from "@/lib/city-hub-seo";
import { cityHubJobs } from "@/lib/city-hub-jobs";
import { cityPageLead } from "@/lib/city-intro";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { laborMaterialsSplitForCity } from "@/lib/labor-materials-split";
import { projectMeta } from "@/lib/projects";
import { cityPagesUpdatedIso, updatedLabel } from "@/lib/page-dates";
import { breadcrumbJsonLd, faqPageJsonLd, pageSeo, webPageJsonLd } from "@/lib/seo";
import { recordedHubPermitFeeLabel } from "@/lib/sourcing";
import { typicalJobSpecForCity } from "@/lib/typical-job-spec-callout";

export function generateStaticParams() {
  return getCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "City" };
  const hubSeo = cityHubSeo(city);
  const serp = cityHubSerpMeta(city);
  if (serp) return pageSeo({ title: serp.title, description: serp.description, path: "/city/" + slug });
  return pageSeo({
    title: hubSeo ? hubSeo.title : "Home project costs in " + cityLabel(city),
    description: hubSeo
      ? hubSeo.description
      : "Typical job costs and permit fees for roof, HVAC, deck, and kitchen work in " + cityLabel(city) + ".",
    path: "/city/" + slug,
  });
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const projects = getLaunchProjectSlugs();
  const hubSeo = cityHubSeo(city);
  const h1 = sanitizeCopy(hubSeo ? hubSeo.h1 : "Home project costs in " + cityLabel(city));
  const lead = sanitizeRendered(cityPageLead(city));
  const faqItems = sanitizeRendered(cityHubFaqItems(city));
  const heroSentence = sanitizeCopy(cityHubHeroSentence(city));
  const renovation = sanitizeRendered(cityHubRenovationSection(city));
  const permitBullets = cityHubPermitBullets(city);
  const nearby = cityHubNearby(city);
  const feesChecked = cityHubFeesChecked(city);
  const factsMeta = cityFactsCallout(city);
  const wageMeta = wageIndexCalloutForCity(city);
  const jobsModel = cityHubJobs(city);
  const hasLocalContext = Boolean(
    factsMeta || wageMeta || laborMaterialsSplitForCity(city) || typicalJobSpecForCity(city)
  );
  const toc = [
    renovation ? { href: "#renovation", label: "Renovation cost" } : null,
    { href: "#projects", label: "Projects" },
    permitBullets.length ? { href: "#permits", label: "Permits" } : null,
    jobsModel ? { href: "#job-table", label: "Job table" } : null,
    hasLocalContext ? { href: "#context", label: "Local context" } : null,
    lead && lead.compareHeading ? { href: "#compare", label: "Compare" } : null,
    faqItems.length ? { href: "#faq", label: "Questions" } : null,
    nearby.length ? { href: "#nearby", label: "More cities" } : null,
  ].filter((item): item is { href: string; label: string } => item != null);

  const updatedIso = cityPagesUpdatedIso(city.slug);
  const updated = updatedLabel(updatedIso);
  const jsonLd: object[] = [
    webPageJsonLd({ name: h1, path: "/city/" + city.slug, dateModified: updatedIso }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Home project costs by city", path: "/cities" },
      { name: h1, path: "/city/" + city.slug },
    ]),
  ];
  if (faqItems.length) jsonLd.push(faqPageJsonLd(faqItems));

  return (
    <div className="wrap hub">
      {jsonLd.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <p className="crumb"><Link href="/cities">Cities</Link></p>
      <h1 className="page-h1">{h1}</h1>
      {heroSentence ? (
        <div className="city-hero">
          <div className="city-hero-copy">
            <p className="hero-answer">{heroSentence}</p>
            <div className="hero-badge">
              <FeesCheckedBadge label={feesChecked.label} href={feesChecked.href} />
            </div>
          </div>
          {city.heroImage ? (
            <CityHeroPhoto image={city.heroImage} priority />
          ) : null}
        </div>
      ) : null}
      <p className="trust-line">
        {updated ? <>Updated {updated} · </> : null}
        Sources: BLS OEWS, {sanitizeCopy(city.permitDeptName)}
        {city.feeScheduleYear ? " fee schedule " + city.feeScheduleYear : ""}
        {" · "}
        <a href={city.permitPortalUrl} target="_blank" rel="noreferrer">Permit portal</a>
        {" · "}
        <a href={city.feeScheduleUrl} target="_blank" rel="noreferrer">Fee schedule</a>
        {" · "}
        <Link href="/methodology">How we price</Link>
      </p>
      {renovation ? (
        <section id="renovation" className="mt-8">
          <h2>{renovation.heading}</h2>
          <p className="mt-3">{renovation.answer}</p>
          <ul className="mt-3 space-y-1">
            {renovation.lines.map((line) => (
              <li key={line.slug}>{line.text}</li>
            ))}
          </ul>
          <article className="card mt-4">
            <h3>{renovation.kitchen.heading}</h3>
            <p className="mt-2">{renovation.kitchen.line}</p>
            <p className="mt-3">
              <Link href={renovation.kitchen.href} className="inline-flex min-h-[44px] items-center font-semibold">
                {renovation.kitchen.cta}
              </Link>
            </p>
          </article>
        </section>
      ) : null}
      <section id="projects" className="mt-8">
        <h2>Projects</h2>
        <div className="job-grid mt-4">
          {projects.map((projectSlug) => {
            const project = getProjectCost(projectSlug);
            const permit = getPermit(city.slug, projectSlug);
            if (!project) return null;
            const est = buildEstimate(project, city, permit);
            const meta = projectMeta(projectSlug);
            const permitLine =
              permit?.permitRequired === false ? "No permit needed" : permit?.feeTypicalUsd == null ? "Permit not published" : "Permit " + recordedHubPermitFeeLabel(permit);
            return (
              <article key={projectSlug} className="card hub-card" data-typical={est.allInTypical}>
                <JobPhoto id={projectSlug} sizes="(min-width: 800px) 45vw, calc(100vw - 80px)" />
                <h3>
                  <Link href={"/cost/" + projectSlug + "/" + city.slug}>
                    {meta.shortName + " in " + city.name}
                  </Link>
                </h3>
                <p className="eyebrow">Typical</p>
                <p className="hub-price num">{usd(est.allInTypical)}</p>
                <p>
                  Most projects <span className="chip num">{usd(est.bandLow)} to {usd(est.bandHigh)}</span>
                </p>
                <p className="hub-permit">{permitLine}</p>
                {meta.blurb ? <p>{meta.blurb}</p> : null}
              </article>
            );
          })}
        </div>
      </section>
      <CityHubPermits cityName={city.name} bullets={permitBullets} />
      {toc.length >= 3 ? <Toc items={toc} /> : null}
      {jobsModel ? (
        <details id="job-table" className="fold">
          <summary>
            <h2 className="fold-title">{sanitizeCopy(jobsModel.heading)}</h2>
          </summary>
          <CityHubJobsTable city={city} hideHeading />
        </details>
      ) : null}
      {hasLocalContext ? (
        <CityHubContext collapsible>
          <CityFactsCallout model={factsMeta} nested />
          <WageIndexCallout model={wageMeta} nested />
          <CityHubLaborSplitTable city={city} nested />
          <CityHubTypicalJobSpecTable city={city} nested />
        </CityHubContext>
      ) : null}
      {lead ? (
        <section id="guide" className="section-gap">
          {lead.paragraphs.map((text, i) => (
            <p key={i} className="mt-3">
              {text}
            </p>
          ))}
          <ul className="mt-3 space-y-1">
            {lead.featured.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {lead.compareHeading && lead.peerGroups.length ? (
            <section id="compare" className="mt-8">
              <h2>{lead.compareHeading}</h2>
              {lead.peerGroups.map((group) => (
                <Fragment key={group.heading}>
                  <h3 className="mt-4">{group.heading}</h3>
                  <ul className="mt-2 space-y-1">
                    {group.links.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}>
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Fragment>
              ))}
            </section>
          ) : null}
        </section>
      ) : null}
      {faqItems.length ? <CityHubFaq items={faqItems} /> : null}
      {nearby.length ? (
        <section id="nearby" className="section-gap">
          <NearbyCityCards heading={cityHubNearbyHeading(city, nearby)} items={nearby} />
        </section>
      ) : null}
    </div>
  );
}
