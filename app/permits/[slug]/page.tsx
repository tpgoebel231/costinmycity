import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PermitFeeTable } from "@/components/PermitFeeTable";
import { Accordion } from "@/components/ui/Accordion";
import { getCities, getCity } from "@/lib/data";
import { cityPagesUpdatedIso, updatedLabel } from "@/lib/page-dates";
import { permitDatasetJsonLd, permitPageModel, permitPageSlugs } from "@/lib/permit-page";
import { breadcrumbJsonLd, faqPageJsonLd, pageSeo, webPageJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return permitPageSlugs(getCities()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "Permit fees" };
  const model = permitPageModel(city);
  if (!model) return { title: "Permit fees" };
  return pageSeo({
    title: model.title,
    description: model.description,
    path: "/permits/" + slug,
  });
}

export default async function PermitFeesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const model = permitPageModel(city);
  if (!model) notFound();

  const path = "/permits/" + city.slug;
  const updatedIso = cityPagesUpdatedIso(city.slug);
  const updated = updatedLabel(updatedIso);
  const jsonLd = [
    webPageJsonLd({ name: model.title, path, dateModified: updatedIso }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: model.cityName, path: "/city/" + city.slug },
      { name: "Permit fees", path },
    ]),
    faqPageJsonLd(model.faq),
    permitDatasetJsonLd(city, model, updatedIso),
  ];

  return (
    <div className="wrap">
      <JsonLd data={jsonLd} />
      <p className="crumb">
        <Link href="/">Home</Link>
        {" / "}
        <Link href={"/city/" + city.slug + "/"}>{model.cityName}</Link>
        {" / "}
        Permit fees
      </p>
      <h1 className="page-h1">{model.title}</h1>
      <p className="mt-4">{model.intro}</p>
      <p className="trust-line mt-3">
        {updated ? <>Updated {updated} · </> : null}
        {model.feesChecked}
      </p>
      <section className="section-gap">
        <h2>Permit fees by job</h2>
        <PermitFeeTable caption={model.caption} rows={model.rows} />
      </section>
      <section id="calculations" className="section-gap">
        <h2>How each fee is calculated</h2>
        {model.rows.map((row) => (
          <article key={row.projectSlug} className="mt-6">
            <h3 id={row.noteId}>{row.jobLabel}</h3>
            {row.feeBasis ? <p className="mt-3">{"Fee basis: " + row.feeBasis + "."}</p> : null}
            {row.valuationBasis ? <p className="mt-3">{row.valuationBasis}</p> : null}
            {row.calculationNote ? <p className="mt-3">{row.calculationNote}</p> : null}
            {row.caveat ? <p className="mt-3">{row.caveat}</p> : null}
            {row.sourceUrl ? (
              <p className="mt-3">
                <a href={row.sourceUrl} rel="noreferrer" target="_blank">
                  {row.sourceName}
                </a>
                {row.retrievedLabel ? <span>{" Retrieved " + row.retrievedLabel + "."}</span> : null}
              </p>
            ) : null}
            {row.exemptionSource?.url ? (
              <p className="mt-3">
                <a href={row.exemptionSource.url} rel="noreferrer" target="_blank">
                  {row.exemptionSource.name}
                </a>
                {row.exemptionSource.retrievedLabel ? (
                  <span>{" Retrieved " + row.exemptionSource.retrievedLabel + "."}</span>
                ) : null}
                {row.exemptionSource.what ? <span> {row.exemptionSource.what}</span> : null}
              </p>
            ) : null}
          </article>
        ))}
      </section>
      <section id="faq" className="section-gap">
        <h2>Questions about these permit fees</h2>
        <div className="mt-2">
          <Accordion items={model.faq} />
        </div>
      </section>
      <section className="section-gap">
        <h2>Related pages</h2>
        <ul className="mt-3 space-y-1">
          {model.rows.map((row) => (
            <li key={row.projectSlug}>
              <Link href={row.href}>{row.jobLabel + " cost in " + model.cityName}</Link>
            </li>
          ))}
          <li>
            <Link href={"/city/" + city.slug + "/"}>{model.cityName + " project costs"}</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
