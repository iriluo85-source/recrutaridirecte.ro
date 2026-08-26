import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const { id } = await params;
  const doc = await prisma.documentAdmin.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "Nu există documentul" }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", "admin", doc.fisierNume);
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(doc.fisierNume).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.eticheta}${ext}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
