import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://unconventional-framing.local/",
      lastModified: new Date()
    },
    {
      url: "https://unconventional-framing.local/admin",
      lastModified: new Date()
    }
  ];
}
