import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://edumyles.com";
  const page = (path: string, priority: number, freq: MetadataRoute.Sitemap[0]["changeFrequency"] = "monthly") => ({
    url: `${base}${path}`,
    changeFrequency: freq,
    priority,
  });

  return [
    page("/",                                    1.0, "weekly"),
    page("/features",                            0.9, "monthly"),
    page("/pricing",                             0.9, "weekly"),
    page("/contact",                             0.9, "monthly"),
    page("/book-demo",                           0.9, "monthly"),
    page("/waitlist",                            0.9, "weekly"),
    page("/about",                               0.7),
    page("/team",                                0.7),
    page("/privacy",                             0.3, "yearly"),
    page("/terms",                               0.3, "yearly"),
    page("/cookies",                             0.3, "yearly"),
  ];
}
