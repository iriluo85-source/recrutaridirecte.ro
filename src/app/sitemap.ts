import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SELECT_DIRECTOR, companiiActive } from "@/lib/companii";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Se regenerează din oră în oră: altfel sitemap-ul rămâne înghețat la starea
// bazei de date din momentul build-ului și firmele noi nu ajung niciodată în Google.
// La build baza poate lipsi (Railway rulează `prisma db push` abia la start),
// caz în care rămân doar rutele statice până la prima revalidare.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  const statice: MetadataRoute.Sitemap = rute.map((r) => ({
    url: `${APP_URL}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.7,
  }));

  // Profilurile publice de companie. Doar firmele care apar și în director:
  // cele cu un post deschis sau cu profil completat. Dacă baza nu e accesibilă
  // la build, sitemap-ul rămâne cel static în loc să pice tot.
  let companii: MetadataRoute.Sitemap = [];
  try {
    const firme = await prisma.employerProfile.findMany({
      orderBy: { updatedAt: "desc" },
      select: SELECT_DIRECTOR,
      take: 5000,
    });
    companii = companiiActive(firme).map((f) => ({
      url: `${APP_URL}/companii/${f.id}`,
      lastModified: f.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    companii = [];
  }

  return [...statice, ...companii];
}
