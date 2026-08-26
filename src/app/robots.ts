import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/setari", "/candidat", "/angajator", "/api", "/dezabonare"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
