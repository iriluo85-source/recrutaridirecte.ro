import path from "node:path";
import { unlink } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// DELETE /api/mobile/cv/[id] — șterge un CV al candidatului
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const { id } = await params;
  const cv = await prisma.cvFile.findUnique({
    where: { id },
    include: { candidate: { select: { userId: true } } },
  });
  if (!cv || cv.candidate.userId !== u.sub) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  await prisma.cvFile.delete({ where: { id } });
  try {
    await unlink(path.join(process.cwd(), "uploads", "cv", cv.fisierNume));
  } catch {
    // fișierul poate lipsi deja
  }

  return NextResponse.json({ success: true });
}
