import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/notificari — lista notificărilor + numărul celor necitite (+ heartbeat)
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const [count, items] = await Promise.all([
    prisma.notification.count({ where: { userId: u.sub, citit: false } }),
    prisma.notification.findMany({
      where: { userId: u.sub },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.user.update({ where: { id: u.sub }, data: { ultimaActivitate: new Date() } }),
  ]);

  return NextResponse.json({ count, items });
}

// POST /api/mobile/notificari — marchează citit
// Body JSON: { all: true } sau { id } sau { entityId }
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, entityId, all } = body as { id?: string; entityId?: string; all?: boolean };

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: u.sub, citit: false },
      data: { citit: true },
    });
  } else if (id) {
    await prisma.notification.updateMany({ where: { id, userId: u.sub }, data: { citit: true } });
  } else if (entityId) {
    await prisma.notification.updateMany({
      where: { userId: u.sub, entityId, citit: false },
      data: { citit: true },
    });
  }

  return NextResponse.json({ ok: true });
}
