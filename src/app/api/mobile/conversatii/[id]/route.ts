import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaMesajNou } from "@/lib/chat";
import { existaBlocaj } from "@/lib/moderare";
import { esteActiv } from "@/lib/prezenta";

// Verifică accesul candidatului la conversație și întoarce conversația + profilul.
async function acces(userId: string, conversationId: string) {
  const profil = await prisma.candidateProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!profil) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      employer: { include: { user: { select: { id: true, ultimaActivitate: true } } } },
      candidate: { select: { id: true, userId: true } },
    },
  });
  if (!conversation || conversation.candidateId !== profil.id) return null;
  return conversation;
}

// GET /api/mobile/conversatii/[id] — mesaje + ofertă + prezența angajatorului + „văzut"
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const conversation = await acces(u.sub, id);
  if (!conversation) return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  const acum = new Date();
  const [messages, offers] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.jobOffer.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
    }),
    // marchez conversația drept citită de candidat (pentru „văzut" la angajator) + heartbeat
    prisma.conversation.update({
      where: { id },
      data: { candidatCititLa: acum },
    }),
    prisma.user.update({
      where: { id: u.sub },
      data: { ultimaActivitate: acum },
    }),
    // deschiderea conversației golește notificările legate de ea
    prisma.notification.updateMany({
      where: { userId: u.sub, entityId: id, citit: false },
      data: { citit: true },
    }),
  ]);

  const blocaj = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: { blockerId: u.sub, blockedId: conversation.employer.user.id },
    },
    select: { id: true },
  });

  return NextResponse.json({
    employer: {
      id: conversation.employer.id,
      nume: conversation.employer.numeCompanie,
      industrie: conversation.employer.industrie,
      locatie: conversation.employer.locatie,
    },
    messages,
    offers,
    prezenta: {
      activ: esteActiv(conversation.employer.user.ultimaActivitate),
      ultimaActivitate: conversation.employer.user.ultimaActivitate ?? null,
    },
    // „văzut": când a citit angajatorul ultima dată (valoarea de dinainte de acest request)
    seenLa: conversation.employerCititLa,
    amBlocat: Boolean(blocaj),
  });
}

// POST /api/mobile/conversatii/[id] — trimite un mesaj text
// Body JSON: { continut }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const conversation = await acces(u.sub, id);
  if (!conversation) return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  let body: { continut?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const continut = (body.continut || "").trim();
  if (!continut) {
    return NextResponse.json({ error: "Mesajul e gol." }, { status: 400 });
  }

  if (await existaBlocaj(conversation.employer.user.id, conversation.candidate.userId)) {
    return NextResponse.json({ error: "Conversație blocată." }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, trimisDe: "CANDIDATE", continut },
  });

  await notificaMesajNou(id, "CANDIDATE", continut);

  return NextResponse.json({ message });
}
