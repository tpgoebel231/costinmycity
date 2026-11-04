import Link from "next/link";
import type { ReactNode } from "react";
import { stPaulRoofEditorial } from "@/lib/stpaul-roof-editorial";
import type { City, ProjectCost } from "@/lib/types";

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

function MaybeExt({ href, children }: { href: string; children: ReactNode }) {
  if (!href) return <>{children}</>;
  return <Ext href={href}>{children}</Ext>;
}

/** St. Paul roof cost page only. Other pages render nothing. */
export function StPaulRoofEditorial({ city, project }: { city: City; project: ProjectCost }) {
  const model = stPaulRoofEditorial(city, project);
  if (!model) return null;

  return (
    <section id="stpaul-roof-guide" className="section-gap">
      <h2>{model.heading}</h2>
      <p className="mt-3">
        {model.jobSentence + " "}
        {model.laborSentence ? model.laborSentence + " " : null}
        {model.wage ? (
          <>
            {"The " + model.wage.metro + " construction wage is "}
            <MaybeExt href={model.wage.metroUrl}>{model.wage.mean}</MaybeExt>
            {" (" + model.wage.vintage + "), against a national construction mean of "}
            <MaybeExt href={model.wage.nationalUrl}>{model.wage.nationalMean}</MaybeExt>
            {" (" +
              model.wage.nationalVintage +
              "), so labor is multiplied by " +
              model.wage.laborMult +
              " and materials stay at the national figure, which makes the whole job " +
              model.wage.multiplier +
              " times the national typical. "}
            {model.wage.surveySentence ? model.wage.surveySentence + " " : null}
          </>
        ) : null}
        {model.allInSentence}
      </p>
      {model.permitIntro ? <p className="mt-3">{model.permitIntro}</p> : null}
      {model.lineItems.length ? (
        <ul className="mt-3 space-y-1">
          {model.lineItems.map((item) => (
            <li key={item.name}>{item.name + ": " + item.amount}</li>
          ))}
        </ul>
      ) : null}
      {model.rangeSentence || model.driverSentence || model.caveatSentence ? (
        <p className="mt-3">
          {model.rangeSentence ? model.rangeSentence + " " : null}
          {model.driverSentence ? model.driverSentence + " " : null}
          {model.caveatSentence}
        </p>
      ) : null}
      <p className="mt-3">
        {model.feeScheduleYear ? "The fee schedule year is " + model.feeScheduleYear + ". " : null}
        {model.permitSource ? (
          <>
            {"The fee is cited to "}
            <Ext href={model.permitSource.url}>{model.permitSource.name}</Ext>
            {model.permitSource.dateLabel ? ", retrieved " + model.permitSource.dateLabel + ". " : ". "}
          </>
        ) : null}
        {model.projectSource ? (
          <>
            {"Job costs cite "}
            <Ext href={model.projectSource.url}>{model.projectSource.name}</Ext>
            {model.projectSource.dateLabel ? ", retrieved " + model.projectSource.dateLabel + ". " : ". "}
          </>
        ) : null}
        {"The "}
        <Link href={model.permitHref}>{model.cityName + " permit page"}</Link>
        {" lists the fee, and the "}
        <Link href={model.cityHref}>{model.cityName + " city page"}</Link>
        {" is the local hub. "}
        {model.jobs.length ? (
          <>
            {"Other " + model.cityName + " jobs are "}
            {model.jobs.map((job, index) => {
              const sep = index === 0 ? "" : index === model.jobs.length - 1 ? ", and " : ", ";
              return (
                <span key={job.href}>
                  {sep}
                  {job.article + " "}
                  <Link href={job.href}>{job.label}</Link>
                </span>
              );
            })}
            {". "}
          </>
        ) : null}
        {model.peers.map((peer) => (
          <span key={peer.permitHref}>
            {peer.name + " has a "}
            <Link href={peer.roofHref}>{model.jobInline + " page"}</Link>
            {" and a "}
            <Link href={peer.permitHref}>permit page</Link>
            {". "}
          </span>
        ))}
        {"The "}
        <Link href={model.stateHref}>{model.stateLinkLabel}</Link>
        {model.peers.length ? " compares them." : " compares city permit fees."}
      </p>
    </section>
  );
}
