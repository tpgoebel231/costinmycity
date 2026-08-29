import type { MetadataRoute } from "next";
import { getCities, getLaunchProjectSlugs } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getCities();
  const projects = getLaunchProjectSlugs();
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: "/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "/cities", lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: "/about", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "/methodology", lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: "/tools/deck-materials", lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
  for (const project of projects) {
    pages.push({ url: "/cost/" + project, lastModified, changeFrequency: "weekly", priority: 0.7 });
    for (const city of cities) {
      pages.push({ url: "/city/" + city.slug, lastModified, changeFrequency: "weekly", priority: 0.7 });
      pages.push({ url: "/cost/" + project + "/" + city.slug, lastModified, changeFrequency: "weekly", priority: 0.9 });
    }
  }
  const seen = new Set<string>();
  return pages.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}
