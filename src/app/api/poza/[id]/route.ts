import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Servește poza de profil a unui candidat (după id-ul profilului).
// Acces: proprietarul sau orice angajator autentificat.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const profile = await prisma.candidateProfile.findUnique({
    where: { id },
    select: { userId: true, pozaFisier: true },
  });
  if (!profile || !profile.pozaFisier) {
    return NextResponse.json({ error: "Fără poză" }, { status: 404 });
  }

  const isOwner = profile.userId === session.user.id;
  const isEmployer = session.user.role === "EMPLOYER";
  if (!isOwner && !isEmployer) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const filePath = path.join(process.cwd(), "uploads", "poze", profile.pozaFisier);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(profile.pozaFisier).toLowerCase();
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
