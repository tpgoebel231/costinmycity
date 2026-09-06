import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageSeo } from "@/lib/seo";

export const metadata = pageSeo({
  title: "Contact",
  description: "How to get in touch with CostInMyCity about the estimates and sources on the site.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <h1 className="font-display text-4xl">Contact</h1>
      <p className="mt-4 text-muted">
        Use this page to reach CostInMyCity about the estimates or sources on the site.
      </p>
      <p className="mt-4">Email: [set address]</p>
      <p className="mt-4 text-muted">
        There is no contact form here, and the site does not send mail. The address is a placeholder
        until the site owner fills it in.
      </p>
      <p className="mt-4 text-muted">
        This is an estimate, not a contractor quote. Permit fees change. Verify with your city before
        you pull a permit. We are not a contractor and this is not legal advice.
      </p>
    </article>
  );
}
