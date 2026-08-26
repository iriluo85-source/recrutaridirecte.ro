import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaContraoferta } from "@/lib/chat";

// POST /api/mobile/oferte/[id]/contraoferta — candidatul propune alt salariu la o ofertă PENDING
// Body JSON: { salariu }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  let body: { salariu?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const salariu = Math.round(Number(body.salariu));
  if (!Number.isFinite(salariu) || salariu <= 0) {
    return NextResponse.json({ error: "Salariul propus este invalid." }, { status: 400 });
  }

  const offer = await prisma.jobOffer.findUnique({
    where: { id },
    include: { conversation: { include: { candidate: { select: { userId: true } } } } },
  });
  if (!offer) return NextResponse.json({ error: "Oferta nu există." }, { status: 404 });
  if (offer.conversation.candidate.userId !== u.sub) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }
  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Nu mai poți trimite o contraofertă la această ofertă." }, { status: 400 });
  }

  await prisma.jobOffer.update({
    where: { id },
    data: { status: "COUNTERED", salariuContra: salariu },
  });

  await notificaContraoferta(id);

  return NextResponse.json({ success: true, status: "COUNTERED", salariuContra: salariu });
}
