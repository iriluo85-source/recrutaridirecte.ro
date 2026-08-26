import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// GET /api/mobile/angajator/candidat/[id]/poza — poza unui candidat, vizibilă angajatorilor autentificați
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const c = await prisma.candidateProfile.findUnique({
    where: { id },
    select: { pozaFisier: true },
  });
  if (!c?.pozaFisier) return NextResponse.json({ error: "Fără poză" }, { status: 404 });

  try {
    const buffer = await readFile(path.join(process.cwd(), "uploads", "poze", c.pozaFisier));
    const ext = path.extname(c.pozaFisier).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
