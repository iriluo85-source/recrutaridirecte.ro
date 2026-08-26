import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

async function employerId(userId: string): Promise<string | null> {
  const e = await prisma.employerProfile.findUnique({ where: { userId }, select: { id: true } });
  return e?.id ?? null;
}

// POST /api/mobile/angajator/candidat/[id]/salveaza — adaugă la shortlist (Body opțional: { notita })
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const { id } = await params;
  const eid = await employerId(u.sub);
  if (!eid) return NextResponse.json({ error: "Completează profilul companiei." }, { status: 400 });

  let notita: string | null = null;
  try {
    const b = await req.json();
    notita = typeof b?.notita === "string" ? b.notita.trim() || null : null;
  } catch {
    // fără notiță
  }

  await prisma.savedCandidate.upsert({
    where: { employerId_candidateId: { employerId: eid, candidateId: id } },
    create: { employerId: eid, candidateId: id, notita },
    update: { notita },
  });
  return NextResponse.json({ success: true, salvat: true });
}

// DELETE /api/mobile/angajator/candidat/[id]/salveaza — scoate din shortlist
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  const { id } = await params;
  const eid = await employerId(u.sub);
  if (!eid) return NextResponse.json({ error: "Neautorizat" }, { status: 400 });

  await prisma.savedCandidate.deleteMany({ where: { employerId: eid, candidateId: id } });
  return NextResponse.json({ success: true, salvat: false });
}
