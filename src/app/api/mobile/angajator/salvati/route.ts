import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/angajator/salvati — candidații salvați (shortlist)
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  if (!employer) return NextResponse.json({ salvati: [] });

  const salvati = await prisma.savedCandidate.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: "desc" },
    include: {
      candidate: {
        select: { id: true, numeComplet: true, titluCurent: true, locatie: true, remote: true, aniExperienta: true },
      },
    },
  });

  return NextResponse.json({
    salvati: salvati.map((s) => ({
      candidateId: s.candidateId,
      nume: s.candidate.numeComplet,
      titlu: s.candidate.titluCurent,
      locatie: s.candidate.locatie,
      remote: s.candidate.remote,
      aniExperienta: s.candidate.aniExperienta,
      notita: s.notita,
    })),
  });
}
