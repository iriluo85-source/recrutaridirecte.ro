import path from "node:path";
import { rm, unlink } from "node:fs/promises";
import { prisma } from "@/lib/prisma";

export async function stergeFisiereleUtilizatorului(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      candidateProfile: {
        include: {
          cvFiles: true,
          conversations: { select: { id: true } },
        },
      },
      employerProfile: {
        include: {
          conversations: { select: { id: true } },
        },
      },
    },
  });
  if (!user) return;

  for (const cv of user.candidateProfile?.cvFiles ?? []) {
    try {
      await unlink(path.join(process.cwd(), "uploads", "cv", cv.fisierNume));
    } catch (error) {
      console.error(`Nu am putut șterge CV-ul ${cv.fisierNume}:`, error);
    }
  }

  const pozaFisier = user.candidateProfile?.pozaFisier;
  if (pozaFisier) {
    try {
      await unlink(path.join(process.cwd(), "uploads", "poze", pozaFisier));
    } catch (error) {
      console.error(`Nu am putut șterge poza ${pozaFisier}:`, error);
    }
  }

  const conversationIds = [
    ...(user.candidateProfile?.conversations.map((c) => c.id) ?? []),
    ...(user.employerProfile?.conversations.map((c) => c.id) ?? []),
  ];

  for (const conversationId of conversationIds) {
    try {
      await rm(path.join(process.cwd(), "uploads", "chat", conversationId), {
        recursive: true,
        force: true,
      });
    } catch (error) {
      console.error(`Nu am putut șterge atașamentele conversației ${conversationId}:`, error);
    }
  }
}
