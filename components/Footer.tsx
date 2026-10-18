import Link from "next/link";
import { Wordmark } from "@/components/ui/Wordmark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap" style={{ paddingBlock: "40px 48px" }}>
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-sm">What this job costs in your city. Job cost plus the local permit fee, with citations.</p>
            <p className="mt-2">
              A{" "}
              <a href="https://techtalktobi.com/" target="_blank" rel="noreferrer">
                TechTalkTobi
              </a>{" "}
              production.
            </p>
          </div>
          <div>
            <p className="font-medium">Site</p>
            <ul className="mt-2 space-y-2">
              <li><Link href="/cities">Cities</Link></li>
              <li><Link href="/tools/deck-materials">Deck materials calculator</Link></li>
              <li><Link href="/methodology">Methodology</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Legal</p>
            <p className="mt-2">Estimates, not quotes. Permit fees change. Verify with your city before you pull a permit. Not a contractor and not legal advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
