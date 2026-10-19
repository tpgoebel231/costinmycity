import Link from "next/link";
import { PERMIT_FEE_NOT_PUBLISHED, PERMIT_PATH_NO_PERMIT, type PermitFeeRow } from "@/lib/permit-page";

const CAPTION_ID = "permit-fees-caption";

export function PermitFeeTable({
  caption,
  rows,
}: {
  caption: string;
  rows: PermitFeeRow[];
}) {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby={CAPTION_ID}>
      <table className="mt-3 w-full">
        <caption id={CAPTION_ID} className="caption-bottom mt-3 text-left">
          {caption}
        </caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 text-left align-top font-normal">Job</th>
            <th scope="col" className="py-2 pr-3 text-left align-top font-normal">Permit fee</th>
            <th scope="col" className="py-2 pr-3 text-left align-top font-normal">How it is calculated</th>
            <th scope="col" className="py-2 text-left align-top font-normal">Official source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.projectSlug} className="border-b border-line last:border-b-0">
              <th scope="row" className="py-2 pr-3 text-left align-top font-normal">
                <Link href={row.href}>{row.jobLabel}</Link>
              </th>
              <td className="py-2 pr-3 align-top">
                {row.notPublished ? (
                  <>
                    <p>{PERMIT_FEE_NOT_PUBLISHED + "."}</p>
                    {row.caveat ? <p className="mt-2">{row.caveat}</p> : null}
                  </>
                ) : (
                  <>
                    {row.typicalLabel ? <p className="num">Typical {row.typicalLabel}</p> : null}
                    {row.rangeLabel ? <p className="num mt-2">Range {row.rangeLabel}</p> : null}
                    {row.feeLines.map((line) => (
                      <p key={line} className="num mt-2">{line}</p>
                    ))}
                    {row.noPermit ? <p className="mt-2">{PERMIT_PATH_NO_PERMIT + "."}</p> : null}
                  </>
                )}
              </td>
              <td className="py-2 pr-3 align-top">
                {row.shortCalc ? <p>{row.shortCalc}</p> : null}
                <p className={row.shortCalc ? "mt-2" : undefined}>
                  <a href={"#" + row.noteId}>Full calculation</a>
                </p>
              </td>
              <td className="py-2 align-top">
                {row.sourceUrl ? (
                  <a href={row.sourceUrl} rel="noreferrer" target="_blank">
                    {row.sourceName}
                  </a>
                ) : row.sourceName ? (
                  <span>{row.sourceName}</span>
                ) : null}
                {row.retrievedLabel ? <p className="mt-2">Retrieved {row.retrievedLabel}</p> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
