import { getCities } from "@/lib/data";
import { cityHasPermitPage } from "@/lib/permit-page";
import { roofPermitDetail } from "@/lib/permit-mesh";
import type { City } from "@/lib/types";

/**
 * Other cities in the same state that have a permit page.
 * Alphabetical by city name, first 6.
 */
export function statePermitPeers(city: City): City[] {
  return getCities()
    .filter(cityHasPermitPage)
    .filter((peer) => peer.state === city.state && peer.slug !== city.slug)
    .sort((a, b) => a.name.localeCompare(b.name, "en"))
    .slice(0, 6);
}

/**
 * Null when this city has no peers, so the hub does not render an empty block.
 */
export function statePermitsBlock(
  city: City,
): { heading: string; items: { href: string; label: string; detail?: string }[] } | null {
  const peers = statePermitPeers(city);
  if (!peers.length) return null;
  const items = peers.map((peer) => {
    const detail = roofPermitDetail(peer);
    const item: { href: string; label: string; detail?: string } = {
      href: "/permits/" + peer.slug + "/",
      label: peer.name,
    };
    if (detail) item.detail = detail;
    return item;
  });
  return { heading: "Permit fees in other " + city.state + " cities", items };
}
