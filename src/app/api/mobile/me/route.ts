import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

const DISPONIBILITATE_TEXT: Record<string, string> = {
  IMEDIATA: "Imediat",
  SUB_O_LUNA: "Sub o lună",
  PESTE_O_LUNA: "Peste o lună",
};

// GET /api/mobile/me — profilul candidatului autentificat
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const [user, profil] = await Promise.all([
    prisma.user.findUnique({
      where: { id: u.sub },
      select: { email: true, telefon: true },
    }),
    prisma.candidateProfile.findUnique({
      where: { userId: u.sub },
      include: {
        skills: { include: { skill: true } },
        cvFiles: { select: { id: true } },
      },
    }),
  ]);

  return NextResponse.json({
    email: user?.email ?? null,
    telefon: user?.telefon ?? null,
    profil: profil
      ? {
          numeComplet: profil.numeComplet,
          titluCurent: profil.titluCurent,
          locatie: profil.locatie,
          remote: profil.remote,
          aniExperienta: profil.aniExperienta,
          bio: profil.bio,
          varsta: profil.varsta,
          salariuMinim: profil.salariuMinim,
          salariuMaxim: profil.salariuMaxim,
          disponibilitate: profil.disponibilitate,
          disponibilitateText:
            DISPONIBILITATE_TEXT[profil.disponibilitate] ?? profil.disponibilitate,
          skills: profil.skills.map((s) => s.skill.nume),
          nrCvuri: profil.cvFiles.length,
          arePoza: Boolean(profil.pozaFisier),
        }
      : null,
  });
}
