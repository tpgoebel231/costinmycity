import type { Metadata } from "next";
import Link from "next/link";
import { pageSeo } from "@/lib/seo";

export const metadata: Metadata = pageSeo({
  title: "Page not found — CostInMyCity",
  description: "That city or project is not one we cover.",
  path: "/404",
  index: false,
});

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl">Page not found</h1>
      <p className="mt-3 text-muted">That city or project is not one we cover.</p>
      <p className="mt-4"><Link href="/" className="underline">Back to CostInMyCity</Link></p>
    </div>
  );
}
