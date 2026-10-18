import Link from "next/link";
import { JobPhoto } from "@/components/ui/JobPhoto";
import { projectMeta } from "@/lib/projects";

export function ProjectCard({ slug, href }: { slug: string; href: string }) {
  const meta = projectMeta(slug);
  return (
    <article className="job-card">
      <JobPhoto id={slug} />
      <h3 className="mt-3">{meta.shortName}</h3>
      <p className="mt-2">{meta.blurb}</p>
      <p className="mt-3">
        <Link href={href}>See the estimate</Link>
      </p>
    </article>
  );
}
