import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cityLabel, getCities, getCity, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd, usdRange } from "@/lib/format";
import { projectMeta } from "@/lib/projects";

export function generateStaticParams() {
  return getCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) return { title: "City" };
  return {
    title: "Home project costs in " + cityLabel(city),
    description: "Typical job costs and permit fees for roof, HVAC, deck, and kitchen work in " + cityLabel(city) + ".",
  };
}

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const projects = getLaunchProjectSlugs();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted"><Link href="/cities" className="underline">Cities</Link></p>
      <h1 className="font-display mt-2 text-4xl">{cityLabel(city)}</h1>
      <p className="mt-3 max-w-2xl text-muted">{city.permitDeptName}{city.feeScheduleYear ? " · fee schedule " + city.feeScheduleYear : ""}</p>
      <p className="mt-2 text-sm">
        <a href={city.permitPortalUrl} className="underline" target="_blank" rel="noreferrer">Permit portal</a>
        {" · "}
        <a href={city.feeScheduleUrl} className="underline" target="_blank" rel="noreferrer">Fee schedule</a>
      </p>
      {city.notes ? <p className="mt-4 max-w-3xl text-sm text-muted">{city.notes}</p> : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl">Projects</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {projects.map((projectSlug) => {
            const project = getProjectCost(projectSlug);
            const permit = getPermit(city.slug, projectSlug);
            if (!project) return null;
            const est = buildEstimate(project, city, permit);
            const known = permitFeeKnown(permit);
            return (
              <li key={projectSlug} className="py-5 sm:flex sm:items-baseline sm:justify-between">
                <div>
                  <Link href={"/cost/" + projectSlug + "/" + city.slug} className="font-display text-2xl hover:underline">{projectMeta(projectSlug).shortName}</Link>
                  <p className="mt-1 text-sm text-muted">{projectMeta(projectSlug).blurb}</p>
                  {!known ? <p className="mt-2 text-sm text-warn">We do not have the official permit fee, so that line is blank. Job cost is still shown.</p> : null}
                </div>
                <div className="mt-3 text-right sm:mt-0">
                  <p className="num text-2xl">{usd(est.allInTypical)}</p>
                  <p className="text-xs text-muted">{usdRange(est.allInLow, est.allInHigh)} all-in typical range</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
