import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SELECT_DIRECTOR, companiiActive } from "@/lib/companii";
import { DOMENII } from "@/lib/domenii";
import { oraseCuCandidati, slugOras } from "@/lib/disponibili";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Se generează la fiecare cerere, nu la build. Pe Railway `next build` rulează
// ÎNAINTE de `prisma db push`, deci la build baza nu există și interogarea cade
// pe catch — un sitemap prerandat ar rămâne blocat fără nicio companie.
// E citit doar de crawlere, așa că o interogare per cerere nu costă nimic.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rute = [
    "",
    "/companii",
    "/disponibili",
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

  // Paginile publice de disponibilitate: intrarea prin Google a angajatorilor.
  const disponibili: MetadataRoute.Sitemap = DOMENII.map((d) => ({
    url: `${APP_URL}/disponibili/${d.slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Orașele cu masă critică — intrarea din Google pe „candidați disponibili <oraș>".
  let orase: MetadataRoute.Sitemap = [];
  try {
    const profiluri = await prisma.candidateProfile.findMany({
      select: {
        locatie: true,
        remote: true,
        aniExperienta: true,
        salariuMinim: true,
        permisConducere: true,
        dispusDeplasari: true,
        skills: { select: { skill: { select: { nume: true } } } },
      },
    });
    orase = oraseCuCandidati(
      profiluri.map((c) => ({ ...c, skills: c.skills.map((s) => s.skill.nume) }))
    ).map((o) => ({
      url: APP_URL + "/disponibili/oras/" + slugOras(o.oras),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    orase = [];
  }

  return [...statice, ...disponibili, ...orase, ...companii];
}
