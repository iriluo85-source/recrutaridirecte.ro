import path from "node:path";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

const EXT_PERMISE = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const dir = () => path.join(process.cwd(), "uploads", "poze");

// GET /api/mobile/poza — servește poza candidatului autentificat
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: { pozaFisier: true },
  });
  if (!profil?.pozaFisier) return NextResponse.json({ error: "Fără poză" }, { status: 404 });

  try {
    const buffer = await readFile(path.join(dir(), profil.pozaFisier));
    const ext = path.extname(profil.pozaFisier).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}

// POST /api/mobile/poza — încarcă/înlocuiește poza (multipart: poza=imagine)
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const formData = await req.formData();
  const fisier = formData.get("poza");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return NextResponse.json({ error: "Alege o imagine." }, { status: 400 });
  }
  const ext = path.extname(fisier.name).toLowerCase();
  if (!EXT_PERMISE.includes(ext)) {
    return NextResponse.json({ error: "Doar JPG, PNG sau WEBP." }, { status: 400 });
  }
  if (fisier.size > MAX_BYTES) {
    return NextResponse.json({ error: "Imaginea e prea mare (maxim 5MB)." }, { status: 400 });
  }

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true, pozaFisier: true },
  });
  if (!profil) return NextResponse.json({ error: "Completează întâi profilul." }, { status: 400 });

  await mkdir(dir(), { recursive: true });
  const fisierNume = `${u.sub}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await fisier.arrayBuffer());
  await writeFile(path.join(dir(), fisierNume), buffer);

  // ștergem poza veche
  if (profil.pozaFisier) {
    try {
      await unlink(path.join(dir(), profil.pozaFisier));
    } catch {
      // poate lipsi
    }
  }

  await prisma.candidateProfile.update({ where: { id: profil.id }, data: { pozaFisier: fisierNume } });
  return NextResponse.json({ success: true });
}

// DELETE /api/mobile/poza — șterge poza
export async function DELETE(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true, pozaFisier: true },
  });
  if (!profil) return NextResponse.json({ error: "Profil inexistent." }, { status: 404 });

  if (profil.pozaFisier) {
    try {
      await unlink(path.join(dir(), profil.pozaFisier));
    } catch {
      // poate lipsi
    }
    await prisma.candidateProfile.update({ where: { id: profil.id }, data: { pozaFisier: null } });
  }
  return NextResponse.json({ success: true });
}
