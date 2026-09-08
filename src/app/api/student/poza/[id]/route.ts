import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { esteAdminEmail } from "@/lib/admin";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

// Servește poza legitimației unei cereri de verificare — DOAR pentru admin,
// doar cât cererea e în așteptare. După decizie fișierul e șters de pe disc.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const esteAdmin = session?.user?.isAdmin || esteAdminEmail(session?.user?.email);
  if (!esteAdmin) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const { id } = await params;
  const cerere = await prisma.studentVerificare.findUnique({
    where: { id },
    select: { fisier: true },
  });
  if (!cerere?.fisier) {
    return NextResponse.json({ error: "Poza nu mai există" }, { status: 404 });
  }

  const ext = path.extname(cerere.fisier).toLowerCase();
  try {
    const buffer = await readFile(
      path.join(process.cwd(), "uploads", "student", cerere.fisier)
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
