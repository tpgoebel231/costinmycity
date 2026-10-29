import { cityHubNearbyHeading } from "@/lib/city-hub-deepen";
import { cityLabel, getCities } from "@/lib/data";
import { cityHasPermitPage, permitPageModel } from "@/lib/permit-page";
import { selectSameJobPeers } from "@/lib/same-job";
import type { City } from "@/lib/types";

export type PermitMeshItem = {
  href: string;
  label: string;
  detail?: string;
  stateAbbr: string;
};

const NO_CITY_PERMIT = "Roof: usually no city permit needed";

let permitCities: City[] | undefined;

function citiesWithPermitPages(): City[] {
  if (!permitCities) permitCities = getCities().filter((item) => cityHasPermitPage(item));
  return permitCities;
}

/**
 * One job row, and only the label that row already prints.
 * An exemption (noPermit, or permitRequired false, including a $0 no-permit row) never carries a dollar.
 * Unknown, missing, and a fee that is not a known typical label get no detail.
 */
export function jobPermitDetail(
  peer: City,
  projectSlug: string,
): { kind: "fee"; label: string } | { kind: "exempt" } | undefined {
  const row = permitPageModel(peer)?.rows.find((item) => item.projectSlug === projectSlug);
  if (!row) return undefined;
  if (row.noPermit || row.permitRequired === false) return { kind: "exempt" };
  if (row.status === "known" && row.typicalLabel) return { kind: "fee", label: row.typicalLabel };
  return undefined;
}

/** Same roof string the hub, mesh, and permits index already print. */
export function roofPermitDetail(peer: City): string | undefined {
  const detail = jobPermitDetail(peer, "roof-replacement");
  if (!detail) return undefined;
  if (detail.kind === "exempt") return NO_CITY_PERMIT;
  return "Roof permit " + detail.label;
}

function permitMeshHeading(city: City, items: PermitMeshItem[]): string {
  const base = cityHubNearbyHeading(
    city,
    items.map((item) => ({
      href: item.href,
      label: item.label,
      detail: item.detail || "",
      stateAbbr: item.stateAbbr,
    })),
  );
  return "Permit fees in " + base.charAt(0).toLowerCase() + base.slice(1);
}

export function permitMeshBlock(city: City): { heading: string; items: PermitMeshItem[] } {
  const others = citiesWithPermitPages().filter((item) => item.slug !== city.slug);
  const items = selectSameJobPeers(city, others).map((peer) => {
    const detail = roofPermitDetail(peer);
    const item: PermitMeshItem = {
      href: "/permits/" + peer.slug + "/",
      label: cityLabel(peer),
      stateAbbr: peer.stateAbbr,
    };
    if (detail) item.detail = detail;
    return item;
  });
  return { heading: permitMeshHeading(city, items), items };
}
