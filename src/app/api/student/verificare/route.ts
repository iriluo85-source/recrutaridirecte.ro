import path from "node:path";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { campanieActiva, esteTipDocumentValid } from "@/lib/student";

const MAX_BYTES = 8 * 1024 * 1024;
const TIPURI_IMAGINE = ["image/jpeg", "image/png", "image/webp"];

// POST /api/student/verificare — trimite poza legitimației spre validare.
// Poza se salvează în uploads/student/ și se ȘTERGE la decizie (vezi /admin/studenti).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }
  if (session.user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Doar candidații pot cere verificarea." }, { status: 403 });
  }
  if (!campanieActiva()) {
    return NextResponse.json({ error: "Campania s-a încheiat." }, { status: 400 });
  }

  const form = await req.formData();
  const poza = form.get("poza");
  const tipDocument = String(form.get("tipDocument") || "");
  const institutie = String(form.get("institutie") || "").trim().slice(0, 120);
  const declaratie18 = form.get("declaratie18") === "on";

  if (!declaratie18) {
    return NextResponse.json({ error: "Confirmă că ai 18 ani împliniți." }, { status: 400 });
  }
  if (!esteTipDocumentValid(tipDocument)) {
    return NextResponse.json({ error: "Tip de document invalid." }, { status: 400 });
  }
  if (!(poza instanceof File) || poza.size === 0) {
    return NextResponse.json({ error: "Lipsește poza." }, { status: 400 });
  }
  if (poza.size > MAX_BYTES) {
    return NextResponse.json({ error: "Poza e prea mare (maxim 8MB)." }, { status: 400 });
  }
  if (!TIPURI_IMAGINE.includes(poza.type)) {
    return NextResponse.json({ error: "Trimite o imagine (JPG, PNG sau WEBP)." }, { status: 400 });
  }

  const existent = await prisma.studentVerificare.findUnique({
    where: { userId: session.user.id },
    select: { status: true, fisier: true },
  });
  if (existent?.status === "VALIDAT") {
    return NextResponse.json({ error: "Contul e deja validat." }, { status: 400 });
  }
  if (existent?.status === "IN_ASTEPTARE") {
    return NextResponse.json({ error: "Ai deja o cerere în așteptare." }, { status: 400 });
  }

  const ext = poza.type === "image/png" ? ".png" : poza.type === "image/webp" ? ".webp" : ".jpg";
  const numeFisier = `${session.user.id}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "uploads", "student");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, numeFisier), Buffer.from(await poza.arrayBuffer()));

  // O retrimitere după un refuz înlocuiește poza veche — nu păstrăm istoric de imagini.
  if (existent?.fisier) {
    await unlink(path.join(dir, existent.fisier)).catch(() => {});
  }

  await prisma.studentVerificare.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      status: "IN_ASTEPTARE",
      tipDocument,
      institutie: institutie || null,
      fisier: numeFisier,
      declaratie18: true,
    },
    update: {
      status: "IN_ASTEPTARE",
      tipDocument,
      institutie: institutie || null,
      fisier: numeFisier,
      declaratie18: true,
      motivRespingere: null,
      decisLa: null,
      decisDe: null,
    },
  });

  return NextResponse.json({ ok: true });
}
