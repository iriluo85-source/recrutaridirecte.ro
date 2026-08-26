import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaMesajNou } from "@/lib/chat";
import { existaBlocaj } from "@/lib/moderare";
import { esteActiv } from "@/lib/prezenta";

async function acces(userId: string, conversationId: string) {
  const employer = await prisma.employerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!employer) return null;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      candidate: {
        include: { user: { select: { id: true, ultimaActivitate: true } } },
      },
    },
  });
  if (!conversation || conversation.employerId !== employer.id) return null;
  return conversation;
}

// GET /api/mobile/angajator/conversatii/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  const { id } = await params;
  const conversation = await acces(u.sub, id);
  if (!conversation) return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

  const acum = new Date();
  const [messages, offers] = await Promise.all([
    prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } }),
    prisma.jobOffer.findMany({ where: { conversationId: id }, orderBy: { createdAt: "desc" } }),
    prisma.conversation.update({ where: { id }, data: { employerCititLa: acum } }),
    prisma.user.update({ where: { id: u.sub }, data: { ultimaActivitate: acum } }),
    prisma.notification.updateMany({
      where: { userId: u.sub, entityId: id, citit: false },
      data: { citit: true },
    }),
  ]);

  const blocaj = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: u.sub, blockedId: conversation.candidate.user.id } },
    select: { id: true },
  });

  return NextResponse.json({
    candidat: {
      id: conversation.candidate.id,
      nume: conversation.candidate.numeComplet,
      titlu: conversation.candidate.titluCurent,
    },
    messages,
    offers,
    prezenta: {
      activ: esteActiv(conversation.candidate.user.ultimaActivitate),
      ultimaActivitate: conversation.candidate.user.ultimaActivitate ?? null,
    },
    seenLa: conversation.candidatCititLa,
    amBlocat: Boolean(blocaj),
  });
}

// POST /api/mobile/angajator/conversatii/[id] — trimite mesaj (Body JSON: { continut })
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 403 });

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
  if (!continut) return NextResponse.json({ error: "Mesajul e gol." }, { status: 400 });

  if (await existaBlocaj(u.sub, conversation.candidate.user.id)) {
    return NextResponse.json({ error: "Conversație blocată." }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: { conversationId: id, trimisDe: "EMPLOYER", continut },
  });
  await notificaMesajNou(id, "EMPLOYER", continut);

  return NextResponse.json({ message });
}
