"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { City } from "@/lib/types";
import { cityLabel } from "@/lib/data-client";
import { shortProjectName } from "@/lib/projects";

export function JumpForm({ cities, projects }: { cities: City[]; projects: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState(cities[0]?.slug ?? "");
  const [project, setProject] = useState(projects[0] ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (city && project) router.push("/cost/" + project + "/" + city);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="jump-city" className="text-sm font-medium">City</label>
        <select id="jump-city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full border border-line bg-paper px-3 py-2">
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>{cityLabel(c)}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="jump-project" className="text-sm font-medium">Project</label>
        <select id="jump-project" value={project} onChange={(e) => setProject(e.target.value)} className="mt-1 w-full border border-line bg-paper px-3 py-2">
          {projects.map((p) => (
            <option key={p} value={p}>{shortProjectName(p)}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
        See the number
      </button>
    </form>
  );
}
