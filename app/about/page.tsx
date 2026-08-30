import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "About these city cost estimates",
  description: "CostInMyCity estimates what a home project typically costs in a specific city, including the permit when the official schedule is on file.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About these city cost estimates", path: "/about" },
        ])}
      />
      <h1 className="font-display text-4xl">About CostInMyCity</h1>
      <p className="mt-4">CostInMyCity estimates what a home project typically costs in a specific city. A national average hides local wages and local permit rules. We show typical labor and materials for that city, then the permit as its own line from the city&apos;s published fee schedule, with a source link.</p>
      <p className="mt-4">If we cannot cite the official fee, that line is blank. We do not guess. We also do not send people to contractors.</p>
      <p className="mt-4">This is an estimate, not a contractor quote. Permit fees change. Verify with your city before you pull a permit. We are not a contractor and this is not legal advice.</p>
      <p className="mt-6 text-sm"><Link href="/methodology" className="underline">How the numbers are sourced</Link></p>
    </article>
  );
}
