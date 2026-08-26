import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

const DISPONIBILITATE_TEXT: Record<string, string> = {
  IMEDIATA: "Imediat",
  SUB_O_LUNA: "Sub o lună",
  PESTE_O_LUNA: "Peste o lună",
};

// GET /api/mobile/angajator/candidat/[id] — profilul complet al unui candidat (pentru angajator)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii au acces." }, { status: 403 });
  }

  const { id } = await params;
  const c = await prisma.candidateProfile.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
      cvFiles: { select: { id: true, eticheta: true, fisierNume: true } },
      user: { select: { telefon: true } },
    },
  });
  if (!c) return NextResponse.json({ error: "Candidat inexistent." }, { status: 404 });

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });

  // înregistrăm vizualizarea profilului + verificăm dacă există deja conversație / salvare
  let conversationId: string | null = null;
  let salvat = false;
  if (employer) {
    await prisma.profileView.upsert({
      where: { employerId_candidateId_tip: { employerId: employer.id, candidateId: id, tip: "PROFIL" } },
      create: { employerId: employer.id, candidateId: id, tip: "PROFIL" },
      update: { viewCount: { increment: 1 } },
    });
    const [conv, sav] = await Promise.all([
      prisma.conversation.findUnique({
        where: { employerId_candidateId: { employerId: employer.id, candidateId: id } },
        select: { id: true },
      }),
      prisma.savedCandidate.findUnique({
        where: { employerId_candidateId: { employerId: employer.id, candidateId: id } },
        select: { id: true },
      }),
    ]);
    conversationId = conv?.id ?? null;
    salvat = Boolean(sav);
  }

  return NextResponse.json({
    candidat: {
      id: c.id,
      numeComplet: c.numeComplet,
      titluCurent: c.titluCurent,
      locatie: c.locatie,
      remote: c.remote,
      aniExperienta: c.aniExperienta,
      bio: c.bio,
      varsta: c.varsta,
      sex: c.sex,
      disponibilitate: c.disponibilitate,
      disponibilitateText: DISPONIBILITATE_TEXT[c.disponibilitate] ?? c.disponibilitate,
      salariuMinim: c.salariuMinim,
      salariuMaxim: c.salariuMaxim,
      telefon: c.user.telefon,
      arePoza: Boolean(c.pozaFisier),
      skills: c.skills.map((s) => s.skill.nume),
      cvuri: c.cvFiles.map((cv) => ({
        id: cv.id,
        eticheta: cv.eticheta,
        ext: cv.fisierNume.slice(cv.fisierNume.lastIndexOf(".")).toLowerCase() || ".pdf",
      })),
    },
    conversationId,
    salvat,
  });
}
