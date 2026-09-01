import Link from "next/link";
import { CityPicker } from "@/components/CityPicker";
import { JumpForm } from "@/components/JumpForm";
import { ProjectCard } from "@/components/ProjectCard";
import { uniqueStateCount } from "@/lib/city-groups";
import { getCities, getLaunchProjectSlugs } from "@/lib/data";
import { DEFAULT_DESCRIPTION, HOME_TITLE, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  const cities = getCities();
  const projects = getLaunchProjectSlugs();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl leading-tight sm:text-5xl">What this job costs in your city.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">CostInMyCity estimates what a home project typically costs in a specific city. A national average hides local wages and local permit rules; we show typical labor and materials for that city, then the permit as its own line from the city&apos;s published fee schedule, with a source link. If we do not have the official fee, we leave it blank instead of guessing. This is an estimate, not a contractor quote, and we do not send you to contractors.</p>

      <section className="mt-10 border border-line bg-paper p-5">
        <h2 className="font-display text-2xl">Jump to an estimate</h2>
        <div className="mt-4"><JumpForm cities={cities} projects={projects} /></div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Cities we cover</h2>
        <p className="mt-2 text-sm text-muted">
          {cities.length} cities in {uniqueStateCount(cities)} states.{" "}
          <Link href="/cities" className="text-accent underline">All cities</Link>
        </p>
        <div className="mt-4"><CityPicker cities={cities} /></div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Projects</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {projects.map((slug) => (
            <ProjectCard key={slug} slug={slug} href={"/cost/" + slug} />
          ))}
        </div>
      </section>

      <section className="mt-12 border border-line bg-paper p-5">
        <h2 className="font-display text-2xl">Deck materials calculator</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">Enter the length, width, and height off the ground. The calculator counts boards, joists, and fasteners, and gives a materials total you can overwrite.</p>
        <p className="mt-3"><Link href="/tools/deck-materials" className="text-accent underline">Open the calculator</Link></p>
      </section>

      <section className="mt-12 max-w-2xl">
        <h2 className="font-display text-2xl">How we get the number</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>Start from a typical national cost for the job.</li>
          <li>Adjust labor for wages in that city. Materials stay at the national figure.</li>
          <li>Add the permit as its own line from the city&apos;s published fee schedule when we have it. If we do not, that line stays blank.</li>
        </ol>
        <p className="mt-3 text-sm"><Link href="/methodology" className="underline">How the numbers are sourced</Link></p>
      </section>
    </div>
  );
}
