import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const [count, items] = await Promise.all([
    prisma.notification.count({ where: { userId: session.user.id, citit: false } }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // heartbeat pentru statusul online („activ acum"). updateMany ca să NU arunce
    // eroare dacă user-ul nu mai există (sesiune veche a unui cont șters).
    prisma.user.updateMany({
      where: { id: session.user.id },
      data: { ultimaActivitate: new Date() },
    }),
  ]);

  return NextResponse.json({ count, items });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { id, entityId, all } = body as {
    id?: string;
    entityId?: string;
    all?: boolean;
  };

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, citit: false },
      data: { citit: true },
    });
  } else if (id) {
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { citit: true },
    });
  } else if (entityId) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, entityId, citit: false },
      data: { citit: true },
    });
  }

  return NextResponse.json({ ok: true });
}
