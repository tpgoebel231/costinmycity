import Link from "next/link";
import { sanitizeCopy } from "@/lib/dashes";
import { permitsStateTablesModel } from "@/lib/permits-index";
import { shortProjectName } from "@/lib/projects";

const PROJECTS = ["roof-replacement", "deck", "kitchen-remodel", "hvac-replacement"] as const;

const COL = "py-2 pr-3 text-left align-top font-normal";
const COL_LAST = "py-2 text-left align-top font-normal";

/** In-page links to each state fee table. Plain anchors, same state order as the tables. */
export function PermitsStateJump() {
  const tables = permitsStateTablesModel();
  return (
    <nav id="state-jump" aria-label="Jump to a state" className="mt-6">
      <p>{sanitizeCopy("Compare permit fees by state:")}</p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {tables.map((table) => (
          <li key={table.id}>
            <a href={"#" + table.id}>{sanitizeCopy(table.state)}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One fee table per state. The scroll container is the table region, not the page. */
export function PermitsStateTables() {
  const tables = permitsStateTablesModel();
  return (
    <section id="permit-fee-tables" className="mt-12">
      {tables.map((table) => {
        const captionId = table.id + "-caption";
        return (
          <section key={table.id} id={table.id} className="mt-8">
            <h2 className="font-display text-2xl">{sanitizeCopy(table.heading)}</h2>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby={captionId}>
              <table className="mt-3 w-full">
                <caption id={captionId} className="caption-bottom mt-3 text-left">
                  {sanitizeCopy(table.caption)}
                </caption>
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className={COL}>
                      City
                    </th>
                    {PROJECTS.map((slug, index) => (
                      <th key={slug} scope="col" className={index === PROJECTS.length - 1 ? COL_LAST : COL}>
                        {sanitizeCopy(shortProjectName(slug))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row) => (
                    <tr key={row.href} className="border-b border-line last:border-b-0">
                      <th scope="row" className={COL}>
                        <Link href={row.href}>{sanitizeCopy(row.label)}</Link>
                      </th>
                      {row.cells.map((cell, index) => (
                        <td
                          key={cell.projectSlug}
                          className={
                            (cell.kind === "fee" ? "num " : "") +
                            (index === row.cells.length - 1 ? "py-2 align-top" : "py-2 pr-3 align-top")
                          }
                        >
                          {sanitizeCopy(cell.text)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </section>
  );
}
