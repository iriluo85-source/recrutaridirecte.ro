import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { limitaCv } from "@/lib/planuri";

const EXT_PERMISE = [".pdf", ".doc", ".docx"];
const MAX_BYTES = 5 * 1024 * 1024;

// GET /api/mobile/cv — lista CV-urilor candidatului
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const profil = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    select: {
      id: true,
      cvFiles: { orderBy: { createdAt: "desc" }, select: { id: true, eticheta: true, createdAt: true } },
      user: { select: { abonamentTip: true } },
    },
  });
  if (!profil) return NextResponse.json({ cvuri: [], limita: 0 });

  return NextResponse.json({
    cvuri: profil.cvFiles,
    limita: limitaCv(profil.user.abonamentTip),
  });
}

// POST /api/mobile/cv — încarcă un CV (multipart: cv=fișier, eticheta=text)
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const formData = await req.formData();
  const eticheta = String(formData.get("eticheta") || "").trim();
  const fisier = formData.get("cv");

  if (!eticheta) return NextResponse.json({ error: "Dă un nume CV-ului." }, { status: 400 });
  if (!(fisier instanceof File) || fisier.size === 0) {
    return NextResponse.json({ error: "Alege un fișier." }, { status: 400 });
  }

  const ext = path.extname(fisier.name).toLowerCase();
  if (!EXT_PERMISE.includes(ext)) {
    return NextResponse.json({ error: "Doar PDF, DOC sau DOCX." }, { status: 400 });
  }
  if (fisier.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fișierul e prea mare (maxim 5MB)." }, { status: 400 });
  }

  const candidate = await prisma.candidateProfile.findUnique({
    where: { userId: u.sub },
    include: { _count: { select: { cvFiles: true } }, user: { select: { abonamentTip: true } } },
  });
  if (!candidate) {
    return NextResponse.json({ error: "Completează întâi profilul." }, { status: 400 });
  }
  const limita = limitaCv(candidate.user.abonamentTip);
  if (candidate._count.cvFiles >= limita) {
    return NextResponse.json({ error: `Ai atins limita de ${limita} CV-uri.` }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "uploads", "cv");
  await mkdir(uploadsDir, { recursive: true });
  const fisierNume = `${u.sub}-${Date.now()}${ext}`;
  const buffer = Buffer.from(await fisier.arrayBuffer());
  await writeFile(path.join(uploadsDir, fisierNume), buffer);

  const cv = await prisma.cvFile.create({
    data: { candidateId: candidate.id, eticheta, fisierNume },
    select: { id: true, eticheta: true, createdAt: true },
  });

  return NextResponse.json({ cv });
}
