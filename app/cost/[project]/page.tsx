import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cityLabel, getCities, getLaunchProjectSlugs, getPermit, getProjectCost, permitFeeKnown } from "@/lib/data";
import { buildEstimate } from "@/lib/estimates";
import { usd } from "@/lib/format";
import { projectMeta, shortProjectName } from "@/lib/projects";

export function generateStaticParams() {
  return getLaunchProjectSlugs().map((project) => ({ project }));
}

export async function generateMetadata({ params }: { params: Promise<{ project: string }> }): Promise<Metadata> {
  const { project } = await params;
  const p = getProjectCost(project);
  if (!p) return { title: "Project" };
  const name = shortProjectName(project);
  return {
    title: name + " cost by city",
    description: name + " typical cost across CostInMyCity cities, including local permit fees where the official schedule is on file.",
  };
}

export default async function ProjectHubPage({ params }: { params: Promise<{ project: string }> }) {
  const { project: projectSlug } = await params;
  const project = getProjectCost(projectSlug);
  if (!project) notFound();
  const meta = projectMeta(projectSlug);
  const cities = getCities();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm text-muted">Project</p>
      <h1 className="font-display mt-1 text-4xl">{meta.shortName} cost by city</h1>
      <p className="mt-3 max-w-2xl text-muted">{project.scopeNote || project.unitNote}</p>
      <p className="mt-2 text-sm text-muted">National typical {usd(project.nationalTypical)} {project.unit}. Each city page uses local wages for labor and adds the permit when the official schedule is on file.</p>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {cities.map((city) => {
          const permit = getPermit(city.slug, projectSlug);
          const est = buildEstimate(project, city, permit);
          const known = permitFeeKnown(permit);
          return (
            <li key={city.slug} className="py-4 sm:flex sm:items-baseline sm:justify-between">
              <div>
                <Link href={"/cost/" + projectSlug + "/" + city.slug} className="font-display text-2xl hover:underline">{cityLabel(city)}</Link>
                {!known ? <p className="mt-1 text-sm text-warn">Permit fee not on file</p> : null}
              </div>
              <p className="num mt-2 text-2xl sm:mt-0">{usd(est.allInTypical)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
