import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// DELETE /api/mobile/angajator/posturi/[id] — șterge un post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  const existing = await prisma.post.findUnique({ where: { id }, select: { employerId: true } });
  if (!employer || !existing || existing.employerId !== employer.id) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
