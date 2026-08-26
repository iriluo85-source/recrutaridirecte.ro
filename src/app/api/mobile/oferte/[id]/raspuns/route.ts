import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaRaspunsOferta } from "@/lib/chat";

// POST /api/mobile/oferte/[id]/raspuns — candidatul acceptă sau refuză o ofertă
// Body JSON: { actiune: "accept" | "refuz" }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  let body: { actiune?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const status =
    body.actiune === "accept" ? "ACCEPTED" : body.actiune === "refuz" ? "REJECTED" : null;
  if (!status) {
    return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
  }

  const offer = await prisma.jobOffer.findUnique({
    where: { id },
    include: { conversation: { include: { candidate: { select: { userId: true } } } } },
  });
  if (!offer) {
    return NextResponse.json({ error: "Oferta nu există." }, { status: 404 });
  }
  if (offer.conversation.candidate.userId !== u.sub) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Ai răspuns deja la această ofertă." }, { status: 400 });
  }

  await prisma.jobOffer.update({
    where: { id },
    data: { status, inchisDe: "CANDIDATE", raspunsLa: new Date() },
  });

  await notificaRaspunsOferta(id);

  return NextResponse.json({ success: true, status });
}
