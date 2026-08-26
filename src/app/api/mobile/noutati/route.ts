import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mobile/noutati — articole educative / noutăți din piața muncii (public)
export async function GET() {
  const items = await prisma.articol.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      titlu: true,
      rezumat: true,
      sursaNume: true,
      sursaUrl: true,
      categorie: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ noutati: items });
}
