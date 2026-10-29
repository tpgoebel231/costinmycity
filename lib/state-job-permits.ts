import { jobPermitDetail } from "@/lib/permit-mesh";
import { shortProjectName } from "@/lib/projects";
import { statePermitPeers } from "@/lib/state-permits";
import type { City } from "@/lib/types";

/**
 * Same-state permit pages for this job. Null when the city has no peers.
 * A fee detail uses the permit table's typical label. An exemption carries
 * no dollar. A missing or unknown fee is a name-only link.
 */
export function stateJobPermitsBlock(
  city: City,
  projectSlug: string,
): { heading: string; items: { href: string; label: string; detail?: string }[] } | null {
  const peers = statePermitPeers(city);
  if (!peers.length) return null;
  const job = shortProjectName(projectSlug);
  const items = peers.map((peer) => {
    const found = jobPermitDetail(peer, projectSlug);
    const item: { href: string; label: string; detail?: string } = {
      href: "/permits/" + peer.slug + "/",
      label: peer.name,
    };
    if (found?.kind === "fee") item.detail = job + " permit " + found.label;
    else if (found?.kind === "exempt") item.detail = "usually no city permit needed";
    return item;
  });
  return { heading: job + " permit fees in other " + city.state + " cities", items };
}
