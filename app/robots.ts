import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/ads.txt", "/"],
      disallow: ["/index.txt", "/*/index.txt"],
    },
    sitemap: SITE + "/sitemap.xml",
  };
}
