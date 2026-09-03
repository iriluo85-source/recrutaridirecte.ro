import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORAR — diagnostic plăți. Protejat cu Bearer CRON_SECRET. De șters după.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const user = email
    ? await prisma.user.findFirst({
        where: { email: { contains: email } },
        select: { id: true, email: true, role: true, abonamentTip: true, abonamentExpira: true, createdAt: true },
      })
    : null;

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { orderID: true, userId: true, planTip: true, suma: true, status: true, ntpID: true, createdAt: true },
  });
  const userIds = [...new Set(payments.map((p) => p.userId))];
  const existing = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const map = new Map(existing.map((u) => [u.id, u.email]));
  const paymentsChecked = payments.map((p) => ({
    ...p,
    userExists: map.has(p.userId),
    userEmail: map.get(p.userId) ?? null,
  }));

  return NextResponse.json({ user, totalUsers: await prisma.user.count(), payments: paymentsChecked });
}
