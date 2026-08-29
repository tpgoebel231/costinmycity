import Link from "next/link";

const NAV = [
  { href: "/cities", label: "Cities" },
  { href: "/cost/roof-replacement", label: "Projects" },
  { href: "/tools/deck-materials", label: "Deck calculator" },
  { href: "/methodology", label: "Methodology" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2 no-underline">
          <span className="font-display text-xl tracking-tight text-ink sm:text-2xl">CostInMyCity</span>
          <span className="hidden text-xs tracking-wide text-muted sm:inline">what this job costs in your city</span>
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-ink underline-offset-4 hover:underline">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
