import Link from "next/link";
import { projectHubCluster } from "@/lib/project-hub-cluster";
import { usd } from "@/lib/format";
import type { ProjectCost } from "@/lib/types";

export function ProjectHubClusterTable({ project }: { project: ProjectCost }) {
  const model = projectHubCluster(project);
  if (!model) return null;

  return (
    <section className="mt-8 max-w-2xl border border-line bg-paper p-4">
      <h2 className="font-display text-2xl">{model.heading}</h2>
      <table className="mt-3 w-full text-sm">
        <caption className="caption-bottom mt-3 text-left text-xs text-muted">
          {model.caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th className="py-2 text-left font-normal">City</th>
            <th className="py-2 text-right font-normal">All-in typical</th>
            <th className="py-2 text-right font-normal">Permit</th>
            <th className="py-2 text-right font-normal">Open</th>
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.citySlug} className="border-b border-line last:border-b-0">
              <td className="py-2">
                <Link href={row.href} className="underline">
                  {row.cityLabel}
                </Link>
              </td>
              <td className="num py-2 text-right">{usd(row.allInTypicalUsd)}</td>
              <td className="num py-2 text-right">{row.permitLabel}</td>
              <td className="py-2 text-right">
                <Link href={row.href} className="underline">
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
