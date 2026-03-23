import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/", "/portal/", "/admin/", "/api/"],
      },
    ],
    sitemap: "https://edumyles.com/sitemap.xml",
  };
}
