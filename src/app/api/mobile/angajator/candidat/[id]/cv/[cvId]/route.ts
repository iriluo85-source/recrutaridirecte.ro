import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

// GET /api/mobile/angajator/candidat/[id]/cv/[cvId] — descarcă un CV al candidatului (angajator autentificat)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; cvId: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id, cvId } = await params;
  const cv = await prisma.cvFile.findUnique({
    where: { id: cvId },
    select: { fisierNume: true, candidateId: true },
  });
  if (!cv || cv.candidateId !== id) {
    return NextResponse.json({ error: "CV inexistent" }, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(process.cwd(), "uploads", "cv", cv.fisierNume));
    const ext = path.extname(cv.fisierNume).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${cv.fisierNume}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
