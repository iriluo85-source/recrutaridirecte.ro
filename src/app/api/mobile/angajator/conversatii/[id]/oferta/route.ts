import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaOfertaNoua } from "@/lib/chat";

// POST /api/mobile/angajator/conversatii/[id]/oferta — trimite o ofertă de angajare
// Body JSON: { titluPost, descriere, salariu?, locatie? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  const { id } = await params;
  let body: { titluPost?: string; descriere?: string; salariu?: unknown; locatie?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const titluPost = (body.titluPost || "").trim();
  const descriere = (body.descriere || "").trim();
  if (titluPost.length < 2) return NextResponse.json({ error: "Titlul postului e obligatoriu." }, { status: 400 });
  if (descriere.length < 5) return NextResponse.json({ error: "Adaugă o descriere a ofertei." }, { status: 400 });

  let salariu: number | null = null;
  if (body.salariu !== undefined && body.salariu !== null && String(body.salariu).trim() !== "") {
    const n = Math.trunc(Number(body.salariu));
    if (Number.isFinite(n) && n > 0) salariu = n;
  }
  const locatie = (body.locatie || "").trim() || null;

  // verificăm că angajatorul deține conversația
  const employer = await prisma.employerProfile.findUnique({ where: { userId: u.sub }, select: { id: true } });
  const conversation = await prisma.conversation.findUnique({ where: { id }, select: { employerId: true } });
  if (!employer || !conversation || conversation.employerId !== employer.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const offer = await prisma.jobOffer.create({
    data: { conversationId: id, titluPost, descriere, salariu, locatie },
  });
  await notificaOfertaNoua(offer.id);

  return NextResponse.json({ success: true, offer: { id: offer.id } });
}
