import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const cv = await prisma.cvFile.findUnique({
    where: { id },
    include: { candidate: true },
  });
  if (!cv) {
    return NextResponse.json({ error: "Nu există CV" }, { status: 404 });
  }

  const isOwner = cv.candidate.userId === session.user.id;
  const isEmployer = session.user.role === "EMPLOYER";
  if (!isOwner && !isEmployer) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  // înregistrăm vizualizarea CV-ului doar când un angajator (nu proprietarul) îl deschide
  if (!isOwner && isEmployer) {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (employer) {
      await prisma.profileView.upsert({
        where: {
          employerId_candidateId_tip: {
            employerId: employer.id,
            candidateId: cv.candidateId,
            tip: "CV",
          },
        },
        create: { employerId: employer.id, candidateId: cv.candidateId, tip: "CV" },
        update: { viewCount: { increment: 1 } },
      });
    }
  }

  const filePath = path.join(process.cwd(), "uploads", "cv", cv.fisierNume);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(cv.fisierNume).toLowerCase();
    // Numele fișierului poate conține diacritice (ș/ț/ă) — codăm corect (RFC 5987)
    // + variantă ASCII de rezervă, altfel header-ul aruncă „ByteString" (500).
    const numeAscii = (cv.eticheta.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim() || "cv") + ext;
    const numeUtf8 = encodeURIComponent(`${cv.eticheta}${ext}`);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${numeAscii}"; filename*=UTF-8''${numeUtf8}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
