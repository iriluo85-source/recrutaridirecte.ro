import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { calculeazaScorPotrivire, treceFiltrele, type MatchCriteria } from "@/lib/matching";

// GET /api/mobile/angajator/cauta?skills=..&locatie=..&experientaMin=..&experientaMax=..&bugetMin=..&bugetMax=..&q=..
// Întoarce candidații cu profil completat, ordonați după scorul de potrivire.
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii pot căuta." }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const numar = (k: string): number | undefined => {
    const v = sp.get(k);
    if (v == null || v.trim() === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const skills = (sp.get("skills") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const locatie = (sp.get("locatie") || "").trim() || undefined;
  const q = (sp.get("q") || "").trim().toLowerCase();

  const criterii: MatchCriteria = {
    skills,
    locatie,
    experientaMin: numar("experientaMin"),
    experientaMax: numar("experientaMax"),
    bugetMin: numar("bugetMin"),
    bugetMax: numar("bugetMax"),
  };

  const candidati = await prisma.candidateProfile.findMany({
    include: { skills: { include: { skill: true } }, cvFiles: { select: { id: true } } },
  });

  const rezultate = candidati
    .map((c) => {
      const numeSkills = c.skills.map((s) => s.skill.nume);
      const potrivire = calculeazaScorPotrivire(criterii, {
        locatie: c.locatie,
        remote: c.remote,
        aniExperienta: c.aniExperienta,
        salariuMinim: c.salariuMinim,
        salariuMaxim: c.salariuMaxim,
        skills: numeSkills,
      });
      return {
        id: c.id,
        numeComplet: c.numeComplet,
        titluCurent: c.titluCurent,
        locatie: c.locatie,
        remote: c.remote,
        aniExperienta: c.aniExperienta,
        salariuMinim: c.salariuMinim,
        salariuMaxim: c.salariuMaxim,
        disponibilitate: c.disponibilitate,
        skills: numeSkills,
        nrCvuri: c.cvFiles.length,
        arePoza: Boolean(c.pozaFisier),
        scor: potrivire.score,
      };
    })
    .filter((c) => {
      // Filtre dure: locație (oraș sau remote), interval de experiență, buget.
      if (!treceFiltrele(criterii, c)) return false;
      if (!q) return true;
      const hay = `${c.numeComplet} ${c.titluCurent} ${c.skills.join(" ")} ${c.locatie}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => b.scor - a.scor)
    .slice(0, 60);

  return NextResponse.json({ candidati: rezultate });
}
