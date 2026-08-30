import type { Metadata } from "next";

export const SITE = "https://costinmycity.com";
export const SITE_NAME = "CostInMyCity";
export const HOME_TITLE = "CostInMyCity — What this job costs in your city";
export const DEFAULT_DESCRIPTION =
  "Typical roof, HVAC, deck, and kitchen costs by city, with local wages and the official permit fee when it is on file.";

// Homepage canonical is the slash URL (https://costinmycity.com/), not index.html.

const OG_IMAGE_ABS = SITE + "/og.png";

export const OG_IMAGE = {
  url: OG_IMAGE_ABS,
  width: 1200,
  height: 630,
  alt: "CostInMyCity",
} as const;

/** Never emit user-facing lowercase "hvac" as a word. */
export function keepHvac(text: string): string {
  return (text || "").replace(/\bhvac\b/gi, "HVAC");
}

/**
 * Trailing-slash https://costinmycity.com URL for this page.
 * Never github.io. Never /costinmycity prefix.
 */
export function absUrl(path: string): string {
  let p = (path || "/").trim();
  p = p.replace(/^https?:\/\/(www\.)?costinmycity\.github\.io(\/costinmycity)?/i, "");
  p = p.replace(/^https?:\/\/(www\.)?costinmycity\.com/i, "");
  if (p === "/costinmycity" || p.startsWith("/costinmycity/")) {
    p = p.slice("/costinmycity".length) || "/";
  }
  if (!p.startsWith("/")) p = "/" + p;
  const hashAt = p.indexOf("#");
  if (hashAt !== -1) p = p.slice(0, hashAt);
  const queryAt = p.indexOf("?");
  if (queryAt !== -1) p = p.slice(0, queryAt);
  p = p.replace(/\/{2,}/g, "/");
  if (!p.endsWith("/")) p += "/";
  return SITE + p;
}

export const canonicalUrl = absUrl;

export function displayTitle(pageTitle: string): string {
  const t = keepHvac((pageTitle || "").trim());
  if (t.includes("CostInMyCity")) return t;
  return t + " — CostInMyCity";
}

export function pageSeo({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const canonical = absUrl(path);
  const fullTitle = displayTitle(title);
  const desc = keepHvac(description);
  const meta: Metadata = {
    title: { absolute: fullTitle },
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description: desc,
      url: canonical,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: OG_IMAGE_ABS, width: 1200, height: 630, alt: "CostInMyCity" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [OG_IMAGE_ABS],
    },
    other: {
      "twitter:url": canonical,
    },
  };
  if (index === false) {
    meta.robots = { index: false, follow: false };
  }
  return meta;
}

export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  return pageSeo({ path, title, description });
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: keepHvac(crumb.name),
      item: absUrl(crumb.path),
    })),
  };
}

export function aggregateOfferJsonLd({
  name,
  description,
  path,
  allInLow,
  allInTypical,
  allInHigh,
}: {
  name: string;
  description: string;
  path: string;
  allInLow: number;
  allInTypical: number;
  allInHigh: number;
}) {
  const url = absUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "AggregateOffer",
    name: keepHvac(name),
    description: keepHvac(description),
    url,
    priceCurrency: "USD",
    lowPrice: allInLow,
    highPrice: allInHigh,
    offerCount: 1,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: allInTypical,
      url,
    },
  };
}

/** Only call when feeTypicalUsd is a real recorded fee, not null or zero. */
export function permitQuantitativeValueJsonLd(feeTypicalUsd: number) {
  return {
    "@context": "https://schema.org",
    "@type": "QuantitativeValue",
    name: "Permit fee",
    value: feeTypicalUsd,
    unitText: "USD",
  };
}

export function estimateJsonLd({
  name,
  description,
  path,
  allInLow,
  allInTypical,
  allInHigh,
  permitKnown,
  permitTypical,
}: {
  name: string;
  description: string;
  path: string;
  allInLow: number;
  allInTypical: number;
  allInHigh: number;
  permitKnown: boolean;
  permitTypical: number | null;
}) {
  const url = absUrl(path);
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: keepHvac(name),
    description: keepHvac(description),
    url,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: allInLow,
      highPrice: allInHigh,
      offerCount: 1,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: allInTypical,
        url,
      },
    },
  };
  if (permitKnown && permitTypical != null && permitTypical > 0) {
    page.additionalProperty = permitQuantitativeValueJsonLd(permitTypical);
  }
  return page;
}
