import { localSourcingSentences } from "@/lib/sourcing";
import type { City, Permit, ProjectCost } from "@/lib/types";

export { localSourcingSentences };

export function localSourcingCopy(
  city: City,
  project: ProjectCost,
  permit: Permit | null,
): string {
  return localSourcingSentences(city, project, permit).join(" ");
}
