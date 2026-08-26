import path from "node:path";
import { readFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForUser } from "@/lib/chat";

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
