import Link from "next/link";
import { CitySearch } from "@/components/ui/CitySearch";
import { IconMenu } from "@/components/ui/icons";
import { Wordmark } from "@/components/ui/Wordmark";
import { getCities } from "@/lib/data";

const LINKS = [
  { href: "/cities", label: "Cities" },
  { href: "/cost/roof-replacement", label: "Projects" },
  { href: "/tools/deck-materials", label: "Deck calculator" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const cities = getCities().map((city) => ({
    slug: city.slug,
    name: city.name,
    state: city.state,
    stateAbbr: city.stateAbbr,
    county: city.county || "",
  }));

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Wordmark />
        <div className="desk-search">
          <CitySearch cities={cities} id="city-search" />
        </div>
        <nav className="desk-nav" aria-label="Primary">
          <Link href="/cities">Cities</Link>
          <Link href="/cost/roof-replacement">Projects</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/#estimate" className="btn">Estimate</Link>
        </nav>
        <details className="mob-nav">
          <summary aria-label="Open menu">
            <IconMenu />
          </summary>
          <div className="mob-panel">
            <CitySearch cities={cities} id="city-search-mobile" />
            <nav aria-label="Mobile">
              {LINKS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/#estimate">Estimate</Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
