import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/conversatii — lista conversațiilor/ofertelor primite de candidat
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  if (!profil) {
    return NextResponse.json({ conversatii: [] });
  }

  const convs = await prisma.conversation.findMany({
    where: { candidateId: profil.id },
    include: {
      employer: {
        select: { numeCompanie: true, industrie: true, locatie: true },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      offers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const conversatii = convs
    .map((c) => {
      const ultim = c.messages[0] ?? null;
      const oferta = c.offers[0] ?? null;
      const necitit =
        !!ultim &&
        ultim.trimisDe === "EMPLOYER" &&
        (!c.candidatCititLa || ultim.createdAt > c.candidatCititLa);
      const ultimaActivitate = ultim?.createdAt ?? c.createdAt;

      return {
        id: c.id,
        employer: {
          nume: c.employer.numeCompanie,
          industrie: c.employer.industrie,
          locatie: c.employer.locatie,
        },
        ultimulMesaj: ultim
          ? {
              text: ultim.continut ?? "📎 Atașament",
              trimisDe: ultim.trimisDe,
              createdAt: ultim.createdAt,
            }
          : null,
        oferta: oferta
          ? {
              id: oferta.id,
              titlu: oferta.titluPost,
              status: oferta.status,
              salariu: oferta.salariu,
            }
          : null,
        necitit,
        _sort: ultimaActivitate.getTime(),
      };
    })
    // cele mai recente conversații primele
    .sort((a, b) => b._sort - a._sort)
    .map(({ _sort, ...rest }) => rest);

  return NextResponse.json({ conversatii });
}
