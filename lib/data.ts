import fs from "fs";
import path from "path";
import { cityLabel } from "./data-client";
import type { City, DeckMaterialsData, Permit, ProjectCost, ProjectCostsFile, ProjectSlug } from "./types";
import { LAUNCH_PROJECTS } from "./types";

export { cityLabel };

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("Missing data file: data/" + filename);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getCities(): City[] {
  return readJson<City[]>("cities.json").filter((c) => c?.slug && c?.name);
}

export function getCity(slug: string): City | undefined {
  return getCities().find((c) => c.slug === slug);
}

export function getProjectCosts(): ProjectCost[] {
  const file = readJson<ProjectCostsFile | ProjectCost[]>("project-costs.json");
  const list = Array.isArray(file) ? file : file.projects;
  return (list ?? []).filter((p) => p?.projectSlug && p?.name);
}

export function getProjectCostsFile(): ProjectCostsFile | null {
  const file = readJson<ProjectCostsFile | ProjectCost[]>("project-costs.json");
  if (Array.isArray(file)) return { projects: file };
  return file;
}

export function getProjectCost(slug: string): ProjectCost | undefined {
  return getProjectCosts().find((p) => p.projectSlug === slug);
}

export function getPermits(): Permit[] {
  return readJson<Permit[]>("permits.json").filter((p) => p?.citySlug && p?.projectSlug);
}

export function getPermit(citySlug: string, projectSlug: string): Permit | undefined {
  return getPermits().find((p) => p.citySlug === citySlug && p.projectSlug === projectSlug);
}

export function getDeckMaterials(): DeckMaterialsData {
  return readJson<DeckMaterialsData>("deck-materials.json");
}

export function getLaunchProjectSlugs(): string[] {
  const fromData = getProjectCosts().map((p) => p.projectSlug);
  const ordered = LAUNCH_PROJECTS.filter((s) => fromData.includes(s));
  const extra = fromData.filter((s) => !LAUNCH_PROJECTS.includes(s as ProjectSlug));
  return [...ordered, ...extra];
}

export function permitFeeKnown(permit: Permit | undefined | null): boolean {
  if (!permit) return false;
  return permit.feeTypicalUsd != null || permit.feeLowUsd != null || permit.feeHighUsd != null;
}
