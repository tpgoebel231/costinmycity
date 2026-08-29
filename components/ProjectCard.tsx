import Link from "next/link";
import { projectMeta } from "@/lib/projects";

export function ProjectCard({ slug, href }: { slug: string; href: string }) {
  const meta = projectMeta(slug);
  return (
    <Link href={href} className="block border border-line bg-paper p-4 hover:border-accent">
      <h3 className="font-display text-xl">{meta.shortName}</h3>
      <p className="mt-2 text-sm text-muted">{meta.blurb}</p>
      <p className="mt-3 text-sm text-accent">See the estimate</p>
    </Link>
  );
}
