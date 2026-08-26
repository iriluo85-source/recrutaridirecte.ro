import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      candidateProfile: {
        include: {
          skills: { include: { skill: true } },
          cvFiles: { select: { id: true, eticheta: true, createdAt: true } },
          conversations: {
            include: {
              employer: { select: { numeCompanie: true } },
              messages: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
      employerProfile: {
        include: {
          conversations: {
            include: {
              candidate: { select: { numeComplet: true } },
              messages: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Contul nu a fost găsit." }, { status: 404 });
  }

  const { passwordHash: _passwordHash, ...cont } = user;

  const exportDate = {
    generatLa: new Date().toISOString(),
    cont,
  };

  return new NextResponse(JSON.stringify(exportDate, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="datele-mele.json"`,
    },
  });
}
