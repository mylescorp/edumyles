import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/auth/", "/api/", "/portal/", "/platform"],
      },
    ],
    sitemap: "https://edumyles.com/sitemap.xml",
  };
}
