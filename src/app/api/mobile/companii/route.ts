import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mobile/companii — director public de firme active
export async function GET() {
  const companii = await prisma.employerProfile.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      numeCompanie: true,
      industrie: true,
      locatie: true,
      marimeCompanie: true,
      descriere: true,
      posturi: { where: { activ: true }, select: { id: true } },
    },
  });

  return NextResponse.json({
    companii: companii.map((c) => ({
      id: c.id,
      numeCompanie: c.numeCompanie,
      industrie: c.industrie,
      locatie: c.locatie,
      marimeCompanie: c.marimeCompanie,
      descriere: c.descriere,
      nrPosturi: c.posturi.length,
    })),
  });
}
