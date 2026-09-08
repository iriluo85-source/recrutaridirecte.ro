import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ATASAMENT_EXTENSII_PERMISE,
  ATASAMENT_MAX_BYTES,
  getConversationForUser,
  notificaMesajNou,
} from "@/lib/chat";
import { existaBlocaj } from "@/lib/moderare";
import { esteActiv } from "@/lib/prezenta";
import {
  esteDeblocata,
  esteScutitDeCredite,
  soldCredite,
  raspunsuriGratuiteRamase,
} from "@/lib/credite";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getConversationForUser(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const acum = new Date();
  const { isEmployer, conversation } = access;
  const celalaltUserId = isEmployer
    ? conversation.candidate.userId
    : conversation.employer.userId;

  const [messages, celalalt] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    }),
    // ultima activitate a celuilalt participant → statusul lui online
    prisma.user.findUnique({
      where: { id: celalaltUserId },
      select: { ultimaActivitate: true },
    }),
    // marchez conversația drept citită de MINE (pentru „văzut" la celălalt) + heartbeat
    prisma.conversation.update({
      where: { id },
      data: isEmployer ? { employerCititLa: acum } : { candidatCititLa: acum },
    }),
    prisma.user.updateMany({
      where: { id: session.user.id },
      data: { ultimaActivitate: acum },
    }),
    // deschiderea conversației golește notificările legate de ea (mesaje + oferte)
    prisma.notification.updateMany({
      where: { userId: session.user.id, entityId: id, citit: false },
      data: { citit: true },
    }),
  ]);

  // Gating pe plată: angajatorul vede răspunsurile candidatului doar după ce a
  // deblocat conversația. Redactarea se face AICI, pe server — conținutul nu
  // pleacă spre browser deloc. Candidatul nu e afectat în niciun fel.
  let blocat = false;
  let raspunsuriBlocate = 0;
  let sold = 0;
  let gratuiteRamase = 0;
  let mesajeVizibile = messages;

  if (isEmployer) {
    // Abonatul Nelimitat nu vede lacătul deloc — a plătit pentru răspunsuri nelimitate.
    const deblocata =
      (await esteDeblocata(id)) || (await esteScutitDeCredite(conversation.employerId));
    const raspunsuri = messages.filter((m) => m.trimisDe === "CANDIDATE");
    if (!deblocata && raspunsuri.length > 0) {
      blocat = true;
      raspunsuriBlocate = raspunsuri.length;
      mesajeVizibile = messages.map((m) =>
        m.trimisDe === "CANDIDATE" ? { ...m, continut: null, atasamentNume: null } : m
      );
    }
    if (blocat) {
      [sold, gratuiteRamase] = await Promise.all([
        soldCredite(conversation.employerId),
        raspunsuriGratuiteRamase(conversation.employerId),
      ]);
    }
  }

  // „văzut": momentul în care celălalt participant a citit ultima dată conversația
  // (valoarea de dinainte de acest request — eu tocmai mi-am actualizat doar pointerul meu)
  const seenLa = isEmployer
    ? conversation.candidatCititLa
    : conversation.employerCititLa;

  return NextResponse.json({
    messages: mesajeVizibile,
    blocat,
    raspunsuriBlocate,
    soldCredite: sold,
    gratuiteRamase,
    prezenta: {
      activ: esteActiv(celalalt?.ultimaActivitate),
      ultimaActivitate: celalalt?.ultimaActivitate ?? null,
    },
    seenLa,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getConversationForUser(id, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  const formData = await req.formData();
  const continutRaw = formData.get("continut");
  const continut = typeof continutRaw === "string" ? continutRaw.trim() : "";
  const fisier = formData.get("fisier");

  let atasamentNume: string | undefined;

  if (fisier instanceof File && fisier.size > 0) {
    const ext = path.extname(fisier.name).toLowerCase();
    if (!ATASAMENT_EXTENSII_PERMISE.includes(ext)) {
      return NextResponse.json(
        { error: "Tip de fișier neacceptat (doar PDF, DOC, DOCX, JPG, PNG, WEBP)." },
        { status: 400 }
      );
    }
    if (fisier.size > ATASAMENT_MAX_BYTES) {
      return NextResponse.json({ error: "Fișierul este prea mare (maxim 10MB)." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "uploads", "chat", id);
    await mkdir(uploadsDir, { recursive: true });
    const numeSanitizat = path.basename(fisier.name).replace(/[^a-zA-Z0-9._-]/g, "_");
    atasamentNume = `${Date.now()}-${numeSanitizat}`;
    const buffer = Buffer.from(await fisier.arrayBuffer());
    await writeFile(path.join(uploadsDir, atasamentNume), buffer);
  }

  if (!continut && !atasamentNume) {
    return NextResponse.json({ error: "Mesajul e gol." }, { status: 400 });
  }

  if (
    await existaBlocaj(
      access.conversation.employer.userId,
      access.conversation.candidate.userId
    )
  ) {
    return NextResponse.json(
      { error: "Conversație blocată." },
      { status: 403 }
    );
  }

  const trimisDe = access.isEmployer ? "EMPLOYER" : "CANDIDATE";

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      trimisDe,
      continut: continut || undefined,
      atasamentNume,
    },
  });

  await notificaMesajNou(id, trimisDe, continut || null);

  return NextResponse.json({ message });
}
