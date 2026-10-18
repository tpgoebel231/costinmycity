import Link from "next/link";
import { FeaturedCities } from "@/components/FeaturedCities";
import { JumpForm } from "@/components/JumpForm";
import { ProjectCard } from "@/components/ProjectCard";
import { JobPhoto } from "@/components/ui/JobPhoto";
import { uniqueStateCount } from "@/lib/city-groups";
import { sanitizeRendered } from "@/lib/dashes";
import { getCities, getLaunchProjectSlugs, getProjectCostsFile } from "@/lib/data";
import { getFeaturedCities } from "@/lib/featured-cities";
import { formatDate } from "@/lib/format";
import { DEFAULT_DESCRIPTION, HOME_TITLE, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  const cities = getCities();
  const featured = getFeaturedCities(cities);
  const projects = getLaunchProjectSlugs();
  const asOf = getProjectCostsFile()?.asOf;
  const checked = asOf ? formatDate(asOf) : null;

  return (
    <div className="wrap">
      <div className="home-hero">
        <div>
          <h1 className="page-h1">What will your project cost in your city?</h1>
          <section id="estimate" className="card mt-6">
            <h2>Jump to an estimate</h2>
            <div className="mt-4">
              <JumpForm cities={sanitizeRendered(cities)} projects={projects} />
            </div>
          </section>
        </div>
        <JobPhoto id="home" priority />
      </div>

      <div className="trust-strip">
        <p className="trust-pill">{cities.length} cities</p>
        <p className="trust-pill">Official permit fees</p>
        {checked ? <p className="trust-pill">Checked {checked}</p> : null}
        <Link href="/methodology" className="trust-pill">How we price</Link>
      </div>
      <p className="mt-6 max-w-2xl">
        CostInMyCity estimates what a home project typically costs in a specific city. A national average hides local wages and local permit rules; we show typical labor and materials for that city, then the permit as its own line from the city&apos;s published fee schedule, with a source link. If we do not have the official fee, we leave it blank instead of guessing. This is an estimate, not a contractor quote, and we do not send you to contractors.
      </p>

      <section className="section-gap">
        <h2>Projects</h2>
        <div className="job-grid mt-4">
          {projects.map((slug) => (
            <ProjectCard key={slug} slug={slug} href={"/cost/" + slug} />
          ))}
        </div>
      </section>

      <section className="section-gap">
        <h2>Cities we cover</h2>
        <div className="mt-4">
          <FeaturedCities
            featured={featured}
            totalCount={cities.length}
            stateCount={uniqueStateCount(cities)}
          />
        </div>
      </section>

      <section className="card section-gap">
        <h2>Deck materials calculator</h2>
        <p className="mt-2 max-w-xl">Enter the length, width, and height off the ground. The calculator counts boards, joists, and fasteners, and gives a materials total you can overwrite.</p>
        <p className="mt-3">
          <Link href="/tools/deck-materials">Open the calculator</Link>
        </p>
      </section>

      <section className="section-gap max-w-2xl">
        <h2>How we get the number</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Start from a typical national cost for the job.</li>
          <li>Adjust labor for wages in that city. Materials stay at the national figure.</li>
          <li>Add the permit as its own line from the city&apos;s published fee schedule when we have it. If we do not, that line stays blank.</li>
        </ol>
        <p className="mt-3">
          <Link href="/methodology">How the numbers are sourced</Link>
        </p>
      </section>
    </div>
  );
}
