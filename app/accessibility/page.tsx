import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "Accessibility",
  description: "How CostInMyCity works toward WCAG 2.2 Level AA, what is in place, and the limits we know about.",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Accessibility", path: "/accessibility" },
        ])}
      />
      <h1 className="font-display text-4xl">Accessibility</h1>
      <p className="mt-4">
        CostInMyCity targets WCAG 2.2 Level AA on the homepage, the cost estimate pages, and this page.
      </p>

      <h2 className="mt-8 text-2xl">What we do</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li>Body text is at least 16px. Muted text uses a darker ink so it clears a 7:1 contrast ratio on the page background.</li>
        <li>Prices, ranges, and the labor and materials split include text. Color is not the only cue.</li>
        <li>Pages reflow down to a 320px width without a horizontal page scroll. Wide tables scroll inside their own box.</li>
        <li>Browser zoom to 200% keeps the content available.</li>
        <li>A skip link moves focus to the main content.</li>
        <li>Focus is a 2px teal ring. On small screens the sticky estimate bar leaves room with scroll padding, and it moves aside when it would cover the focused control.</li>
        <li>Buttons, fields, and navigation targets are at least 44 by 44 pixels.</li>
        <li>The calculator result uses a polite live region.</li>
        <li>The range graphic has a hidden text equivalent with the low, typical, and high figures. The labor and materials split has a text summary.</li>
        <li>Data tables have a caption, and header cells set a scope.</li>
        <li>Questions use the native details and summary elements.</li>
        <li>The city search has a label and works from the keyboard.</li>
        <li>These pages do not load third party advertising or analytics scripts.</li>
      </ul>

      <h2 className="mt-8 text-2xl">Known limits</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5">
        <li>This page is a plain statement of the work, not a certificate and not a third party audit.</li>
        <li>City hub pages use the same header, footer, and colors. Their inner layout was not rebuilt in this pass.</li>
        <li>The amber price chip is the brand highlight. It meets WCAG AA contrast. It can sit under the 7:1 AAA ratio.</li>
        <li>A link inside a sentence can be shorter than 44 pixels. That is the usual exception when the line has to wrap.</li>
        <li>The calculator, city suggestions, and sticky estimate bar need JavaScript. The estimate, the tables, and the city links are in the HTML without it.</li>
        <li>We checked the keyboard path with scripted Tab presses. We did not run a full desktop screen reader session.</li>
      </ul>

      <h2 className="mt-8 text-2xl">Contact</h2>
      <p className="mt-4">
        Questions about access go through the <Link href="/contact">contact page</Link>.
      </p>
    </article>
  );
}
