import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { conversatiiDeblocate, esteScutitDeCredite } from "@/lib/credite";

// GET /api/mobile/angajator/conversatii — conversațiile angajatorului
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii au acces." }, { status: 403 });
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  if (!employer) return NextResponse.json({ conversatii: [] });

  const convs = await prisma.conversation.findMany({
    where: { employerId: employer.id },
    include: {
      candidate: { select: { id: true, numeComplet: true, titluCurent: true, locatie: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      offers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // Aceeași regulă ca pe web: fără deblocare, textul răspunsului nu pleacă spre client.
  const scutit = await esteScutitDeCredite(employer.id);
  const deblocate = scutit
    ? new Set(convs.map((c) => c.id))
    : await conversatiiDeblocate(convs.map((c) => c.id));

  const conversatii = convs
    .map((c) => {
      const ultim = c.messages[0] ?? null;
      const oferta = c.offers[0] ?? null;
      const blocat = !deblocate.has(c.id) && ultim?.trimisDe === "CANDIDATE";
      const necitit =
        !!ultim &&
        ultim.trimisDe === "CANDIDATE" &&
        (!c.employerCititLa || ultim.createdAt > c.employerCititLa);
      return {
        id: c.id,
        candidat: {
          id: c.candidate.id,
          nume: c.candidate.numeComplet,
          titlu: c.candidate.titluCurent,
          locatie: c.candidate.locatie,
        },
        blocat,
        ultimulMesaj: ultim
          ? {
              text: blocat ? null : ultim.continut ?? "📎 Atașament",
              trimisDe: ultim.trimisDe,
              createdAt: ultim.createdAt,
            }
          : null,
        oferta: oferta
          ? { id: oferta.id, titlu: oferta.titluPost, status: oferta.status, salariu: oferta.salariu }
          : null,
        necitit,
        _sort: (ultim?.createdAt ?? c.createdAt).getTime(),
      };
    })
    .sort((a, b) => b._sort - a._sort)
    .map(({ _sort, ...rest }) => rest);

  return NextResponse.json({ conversatii });
}
