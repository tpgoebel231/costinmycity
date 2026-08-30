import type { MetadataRoute } from "next";
import { getCities, getLaunchProjectSlugs } from "@/lib/data";
import { absUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getCities();
  const projects = getLaunchProjectSlugs();
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: absUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absUrl("/cities"), lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: absUrl("/about"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absUrl("/privacy"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absUrl("/methodology"), lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: absUrl("/tools/deck-materials"), lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
  for (const city of cities) {
    pages.push({ url: absUrl("/city/" + city.slug), lastModified, changeFrequency: "weekly", priority: 0.7 });
  }
  for (const project of projects) {
    pages.push({ url: absUrl("/cost/" + project), lastModified, changeFrequency: "weekly", priority: 0.7 });
    for (const city of cities) {
      pages.push({ url: absUrl("/cost/" + project + "/" + city.slug), lastModified, changeFrequency: "weekly", priority: 0.9 });
    }
  }
  const seen = new Set<string>();
  return pages.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}
