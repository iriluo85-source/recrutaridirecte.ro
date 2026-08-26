import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mobile/companii/[id] — profilul public al unei companii (după EmployerProfile.id)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const c = await prisma.employerProfile.findUnique({
    where: { id },
    select: {
      id: true,
      numeCompanie: true,
      industrie: true,
      locatie: true,
      marimeCompanie: true,
      website: true,
      linkedin: true,
      anFondare: true,
      beneficii: true,
      descriere: true,
      posturi: {
        where: { activ: true },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          titlu: true,
          locatie: true,
          remote: true,
          salariuMin: true,
          salariuMax: true,
          descriere: true,
        },
      },
    },
  });

  if (!c) return NextResponse.json({ error: "Companie inexistentă." }, { status: 404 });

  return NextResponse.json({ companie: c });
}
