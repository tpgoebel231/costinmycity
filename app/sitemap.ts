import type { MetadataRoute } from "next";
import { getCities, getLaunchProjectSlugs } from "@/lib/data";

export const dynamic = "force-static";

const SITE = "https://tpgoebel231.github.io/costinmycity";

export default function sitemap(): MetadataRoute.Sitemap {
  const cities = getCities();
  const projects = getLaunchProjectSlugs();
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: SITE + "/", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: SITE + "/cities", lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: SITE + "/about", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: SITE + "/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: SITE + "/methodology", lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: SITE + "/tools/deck-materials", lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];
  for (const project of projects) {
    pages.push({ url: SITE + "/cost/" + project, lastModified, changeFrequency: "weekly", priority: 0.7 });
    for (const city of cities) {
      pages.push({ url: SITE + "/city/" + city.slug, lastModified, changeFrequency: "weekly", priority: 0.7 });
      pages.push({ url: SITE + "/cost/" + project + "/" + city.slug, lastModified, changeFrequency: "weekly", priority: 0.9 });
    }
  }
  const seen = new Set<string>();
  return pages.filter((p) => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });
}
