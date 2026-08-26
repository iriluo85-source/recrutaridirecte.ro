import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaOfertaRetrasa, notificaRaspunsContraoferta } from "@/lib/chat";

// POST /api/mobile/angajator/oferte/[id]/actiune
// Body JSON: { actiune: "retrage" | "accepta-contra" | "respinge-contra" | "recontra", salariu? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  const { id } = await params;
  let body: { actiune?: string; salariu?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const offer = await prisma.jobOffer.findUnique({
    where: { id },
    include: { conversation: { include: { employer: { select: { userId: true } } } } },
  });
  if (!offer) return NextResponse.json({ error: "Oferta nu există." }, { status: 404 });
  if (offer.conversation.employer.userId !== u.sub) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  switch (body.actiune) {
    case "retrage": {
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "Oferta nu mai poate fi retrasă." }, { status: 400 });
      }
      await prisma.jobOffer.update({
        where: { id },
        data: { status: "REJECTED", inchisDe: "EMPLOYER", raspunsLa: new Date() },
      });
      await notificaOfertaRetrasa(id);
      return NextResponse.json({ success: true });
    }
    case "accepta-contra": {
      if (offer.status !== "COUNTERED") {
        return NextResponse.json({ error: "Nu există o contraofertă activă." }, { status: 400 });
      }
      await prisma.jobOffer.update({
        where: { id },
        data: {
          status: "ACCEPTED",
          salariu: offer.salariuContra ?? offer.salariu,
          salariuContra: null,
          inchisDe: "EMPLOYER",
          raspunsLa: new Date(),
        },
      });
      await notificaRaspunsContraoferta(id);
      return NextResponse.json({ success: true });
    }
    case "respinge-contra": {
      if (offer.status !== "COUNTERED") {
        return NextResponse.json({ error: "Nu există o contraofertă activă." }, { status: 400 });
      }
      await prisma.jobOffer.update({
        where: { id },
        data: { status: "REJECTED", inchisDe: "EMPLOYER", raspunsLa: new Date() },
      });
      await notificaRaspunsContraoferta(id);
      return NextResponse.json({ success: true });
    }
    case "recontra": {
      if (offer.status !== "COUNTERED") {
        return NextResponse.json({ error: "Nu există o contraofertă activă." }, { status: 400 });
      }
      const salariu = Math.round(Number(body.salariu));
      if (!Number.isFinite(salariu) || salariu <= 0) {
        return NextResponse.json({ error: "Salariul propus e invalid." }, { status: 400 });
      }
      await prisma.jobOffer.update({
        where: { id },
        data: { status: "PENDING", salariu, salariuContra: null },
      });
      await notificaRaspunsContraoferta(id);
      return NextResponse.json({ success: true });
    }
    default:
      return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
  }
}
