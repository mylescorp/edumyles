import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://edumyles.com";
  const now = new Date("2026-03-23");

  const page = (path: string, priority: number, freq: MetadataRoute.Sitemap[0]["changeFrequency"] = "monthly") => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  });

  return [
    page("/",                                    1.0, "weekly"),
    page("/features",                            0.9, "monthly"),
    page("/pricing",                             0.9, "weekly"),
    page("/contact",                             0.9, "monthly"),
    page("/solutions/primary-schools",           0.8),
    page("/solutions/secondary-schools",         0.8),
    page("/solutions/international-schools",     0.8),
    page("/solutions/school-groups",             0.8),
    page("/about",                               0.7),
    page("/team",                                0.7),
    page("/careers",                             0.7, "weekly"),
    page("/blog",                                0.8, "weekly"),
    page("/case-studies",                        0.8),
    page("/customers",                           0.7),
    page("/partners",                            0.7),
    page("/integrations",                        0.7),
    page("/roadmap",                             0.6),
    page("/security",                            0.6),
    page("/status",                              0.5, "daily"),
    page("/changelog",                           0.5, "weekly"),
    page("/blog/edumyles-2026-launch",           0.8),
    page("/blog/mpesa-fee-collection-guide",     0.8),
    page("/blog/cbc-grading-guide-2026",         0.8),
    page("/blog/excel-alternatives-school-management", 0.8),
    page("/blog/parent-portal-communication",        0.8),
    page("/blog/automatic-timetable-generation",     0.8),
    page("/blog/school-management-uganda",          0.8),
    page("/blog/how-kenyan-schools-manage-payroll",  0.8),
    page("/case-studies/nairobi-green-academy",  0.8),
    page("/case-studies/st-francis-kisumu",      0.8),
    page("/case-studies/brookside-prep",         0.8),
    page("/privacy",                             0.3, "yearly"),
    page("/terms",                               0.3, "yearly"),
    page("/cookies",                             0.3, "yearly"),
  ];
}
