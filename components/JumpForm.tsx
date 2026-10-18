import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";
import { shortProjectName } from "@/lib/projects";

export function JumpForm({ cities, projects }: { cities: City[]; projects: string[] }) {
  return (
    <form data-jump-form className="grid gap-3 sm:grid-cols-2" action="/cities/" method="get">
      <div>
        <label htmlFor="jump-city" className="text-sm font-medium">City</label>
        <select id="jump-city" name="city" defaultValue={cities[0]?.slug ?? ""} className="mt-1 w-full border border-line bg-paper px-3 py-2">
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{cityLabel(c)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="jump-project" className="text-sm font-medium">Project</label>
        <select id="jump-project" name="project" defaultValue={projects[0] ?? ""} className="mt-1 w-full border border-line bg-paper px-3 py-2">
          {projects.map((p) => (
            <option key={p} value={p}>{shortProjectName(p)}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn sm:col-span-2">
        See the number
      </button>
      <noscript>
        <p className="sm:col-span-2">
          <a href="/cities/">Browse cities</a>
        </p>
      </noscript>
    </form>
  );
}
