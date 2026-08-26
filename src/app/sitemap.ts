import type { MetadataRoute } from "next";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const rute = [
    "",
    "/companii",
    "/abonamente",
    "/despre",
    "/contact",
    "/faq",
    "/termeni",
    "/confidentialitate",
    "/login",
    "/inregistrare",
  ];
  return rute.map((r) => ({
    url: `${APP_URL}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
