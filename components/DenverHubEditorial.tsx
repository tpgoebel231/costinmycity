import Link from "next/link";
import type { ReactNode } from "react";
import { denverHubEditorial } from "@/lib/denver-hub-editorial";
import type { City } from "@/lib/types";

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function joinLinks(items: { href: string; label: string }[], internal: boolean) {
  return items.map((item, index) => {
    let separator: string | null = null;
    if (index > 0) {
      const last = index === items.length - 1;
      separator = items.length === 2 ? " and " : last ? ", and " : ", ";
    }
    const link = internal ? (
      <Link href={item.href}>{item.label}</Link>
    ) : (
      <Ext href={item.href}>{item.label}</Ext>
    );
    return (
      <span key={item.href}>
        {separator}
        {link}
      </span>
    );
  });
}

/** Denver hub only. Other cities render nothing. */
export function DenverHubEditorial({ city }: { city: City }) {
  const model = denverHubEditorial(city);
  if (!model) return null;
  const peerVerb = model.peers.length === 1 ? " has its own permit page" : " have their own permit pages";

  return (
    <section id="denver-guide" className="section-gap">
      <h2>{model.heading}</h2>
      <p className="mt-3">
        {model.most.article.charAt(0).toUpperCase() + model.most.article.slice(1) + " "}
        <Link href={model.most.href}>{model.most.inlineName}</Link>
        {" costs the most of the four Denver jobs on this site, and " + model.least.article + " "}
        <Link href={model.least.href}>{model.least.inlineName}</Link>
        {" costs the least."}
      </p>
      <ul className="mt-3 space-y-1">
        {model.jobs.map((job) => (
          <li key={job.slug}>
            <Link href={job.href}>{job.shortName}</Link>
            {job.permitRounded
              ? ": typical " +
                job.allInTypical +
                " including the permit counted as " +
                job.permitRounded +
                " (rounded from " +
                job.permitLabel +
                ")."
              : ": typical " + job.allInTypical + " including the " + job.permitLabel + " permit."}
          </li>
        ))}
      </ul>
      <p className="mt-3">
        {model.feeParagraph}
        {model.exemption ? (
          <>
            {" " + model.exemption.sentence + " Source: "}
            <Ext href={model.exemption.url}>{model.exemption.name}</Ext>
            {", retrieved " + model.exemption.dateLabel + "."}
          </>
        ) : null}
      </p>
      {model.wage && model.laborSentence && model.multiplierSentence ? (
        <p className="mt-3">
          {"The job cost follows the " + model.wage.metro + " construction wage of "}
          <Ext href={model.wage.metroUrl}>{model.wage.mean}</Ext>
          {" (" + model.wage.vintage + "), against a national construction mean of "}
          <Ext href={model.wage.nationalUrl}>{model.wage.nationalMean}</Ext>
          {". Only the labor share is adjusted: " +
            model.laborSentence +
            ". Whole-job multipliers are " +
            model.multiplierSentence +
            ". This is a cost model, not a survey of local bids."}
        </p>
      ) : null}
      <p className="mt-3">
        {model.citations.map((cite) => (
          <span key={cite.name}>
            {cite.lead}
            <Ext href={cite.url}>{cite.name}</Ext>
            {cite.tail + " "}
          </span>
        ))}
        {model.feeScheduleYear ? "The fee schedule year is " + model.feeScheduleYear + ". " : null}
        {model.projectSources.length ? (
          <>
            {"Job costs cite "}
            {joinLinks(
              model.projectSources.map((source) => ({ href: source.url, label: source.name })),
              false,
            )}
            {model.projectRetrievedLabel ? ", retrieved " + model.projectRetrievedLabel + ". " : ". "}
          </>
        ) : null}
        {model.wage ? (
          <>
            {"Wages cite the "}
            <Ext href={model.wage.metroUrl}>{model.wage.metroLinkLabel}</Ext>
            {" and the "}
            <Ext href={model.wage.nationalUrl}>{model.wage.nationalLinkLabel}</Ext>
            {". "}
          </>
        ) : null}
        {"The "}
        <Link href={model.permitHref}>Denver permit page</Link>
        {" lists the four fees. "}
        {model.peers.length ? (
          <>
            {joinLinks(model.peers, true)}
            {peerVerb + ", and the "}
            <Link href={model.stateHref}>{model.stateLinkLabel}</Link>
            {" compares them."}
          </>
        ) : null}
      </p>
    </section>
  );
}
