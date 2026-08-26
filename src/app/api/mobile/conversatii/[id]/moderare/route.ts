import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// POST /api/mobile/conversatii/[id]/moderare
// Body JSON: { actiune: "raporteaza" | "blocheaza" | "deblocheaza", motiv?, detalii? }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;

  let body: { actiune?: string; motiv?: string; detalii?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { employer: { select: { userId: true } } },
  });
  if (!conversation || !profil || conversation.candidateId !== profil.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const targetUserId = conversation.employer.userId;
  if (targetUserId === u.sub) {
    return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
  }

  switch (body.actiune) {
    case "raporteaza": {
      const motiv = String(body.motiv || "").trim();
      if (!motiv) return NextResponse.json({ error: "Alege un motiv." }, { status: 400 });
      const detalii = String(body.detalii || "").trim() || null;
      await prisma.report.create({
        data: { reporterId: u.sub, targetUserId, motiv, detalii },
      });
      return NextResponse.json({ success: true });
    }
    case "blocheaza": {
      await prisma.block.upsert({
        where: { blockerId_blockedId: { blockerId: u.sub, blockedId: targetUserId } },
        create: { blockerId: u.sub, blockedId: targetUserId },
        update: {},
      });
      return NextResponse.json({ success: true, blocat: true });
    }
    case "deblocheaza": {
      await prisma.block.deleteMany({ where: { blockerId: u.sub, blockedId: targetUserId } });
      return NextResponse.json({ success: true, blocat: false });
    }
    default:
      return NextResponse.json({ error: "Acțiune invalidă." }, { status: 400 });
  }
}
