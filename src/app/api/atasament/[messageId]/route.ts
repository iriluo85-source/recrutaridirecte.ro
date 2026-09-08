import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForUser } from "@/lib/chat";
import { esteDeblocata, esteScutitDeCredite } from "@/lib/credite";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { messageId } = await params;
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || !message.atasamentNume) {
    return NextResponse.json({ error: "Nu există atașament" }, { status: 404 });
  }

  const access = await getConversationForUser(message.conversationId, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  // Atașamentele candidatului sunt parte din răspuns: fără deblocare, nu se descarcă.
  // Fără verificarea asta, linkul direct ar fi o portiță prin gating-ul din /api/mesaje.
  // Abonatul Nelimitat și adminul nu consumă credite, deci nu au niciodată rând de
  // deblocare — fără scutirea asta, tocmai clientul care plătește cel mai mult ar
  // primi 402 la CV-ul candidatului.
  if (
    access.isEmployer &&
    message.trimisDe === "CANDIDATE" &&
    !(await esteDeblocata(message.conversationId)) &&
    !(await esteScutitDeCredite(access.conversation.employerId))
  ) {
    return NextResponse.json({ error: "Răspuns neblocat" }, { status: 402 });
  }

  const filePath = path.join(
    process.cwd(),
    "uploads",
    "chat",
    message.conversationId,
    message.atasamentNume
  );

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${message.atasamentNume}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Fișier negăsit" }, { status: 404 });
  }
}
