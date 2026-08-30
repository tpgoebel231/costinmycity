import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg">CostInMyCity</p>
            <p className="mt-2 max-w-sm text-sm text-muted">What this job costs in your city. Job cost plus the local permit fee, with citations.</p>
          </div>
          <div className="text-sm">
            <p className="font-medium">Site</p>
            <ul className="mt-2 space-y-1">
              <li><Link href="/cities" className="underline-offset-2 hover:underline">Cities</Link></li>
              <li><Link href="/tools/deck-materials" className="underline-offset-2 hover:underline">Deck materials calculator</Link></li>
              <li><Link href="/methodology" className="underline-offset-2 hover:underline">Methodology</Link></li>
              <li><Link href="/about" className="underline-offset-2 hover:underline">About</Link></li>
              <li><Link href="/privacy" className="underline-offset-2 hover:underline">Privacy</Link></li>
            </ul>
          </div>
          <div className="text-sm text-muted">
            <p className="font-medium text-ink">Legal</p>
            <p className="mt-2">Estimates, not quotes. Permit fees change. Verify with your city before you pull a permit. Not a contractor and not legal advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
