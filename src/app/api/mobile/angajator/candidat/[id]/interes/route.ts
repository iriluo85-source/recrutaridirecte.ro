import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaMesajNou } from "@/lib/chat";
import { existaBlocaj } from "@/lib/moderare";

// POST /api/mobile/angajator/candidat/[id]/interes — pornește o conversație cu un candidat
// Body JSON: { mesaj }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii pot trimite interes." }, { status: 403 });
  }

  const { id } = await params;
  let body: { mesaj?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const mesaj = (body.mesaj || "").trim();
  if (mesaj.length < 5) {
    return NextResponse.json({ error: "Scrie un mesaj de cel puțin 5 caractere." }, { status: 400 });
  }

  const employer = await prisma.employerProfile.findUnique({ where: { userId: u.sub } });
  if (!employer) {
    return NextResponse.json({ error: "Completează întâi profilul companiei." }, { status: 400 });
  }

  const candidat = await prisma.candidateProfile.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!candidat) return NextResponse.json({ error: "Candidat inexistent." }, { status: 404 });

  if (await existaBlocaj(u.sub, candidat.userId)) {
    return NextResponse.json({ error: "Conversație blocată." }, { status: 403 });
  }

  const conversation = await prisma.conversation.upsert({
    where: { employerId_candidateId: { employerId: employer.id, candidateId: id } },
    create: { employerId: employer.id, candidateId: id },
    update: {},
  });

  await prisma.message.create({
    data: { conversationId: conversation.id, trimisDe: "EMPLOYER", continut: mesaj },
  });

  await notificaMesajNou(conversation.id, "EMPLOYER", mesaj);

  return NextResponse.json({ conversationId: conversation.id });
}
