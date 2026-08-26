"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function raporteazaUtilizatorAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("moderare");
  const session = await auth();
  if (!session?.user) return { error: t("errorAuth") };

  const targetUserId = String(formData.get("targetUserId") || "");
  const motiv = String(formData.get("motiv") || "").trim();
  const detalii = String(formData.get("detalii") || "").trim() || null;
  if (!targetUserId || targetUserId === session.user.id || !motiv) {
    return { error: t("errorInvalid") };
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });
  if (!target) return { error: t("errorInvalid") };

  await prisma.report.create({
    data: { reporterId: session.user.id, targetUserId, motiv, detalii },
  });
  return { success: true };
}

export async function blocheazaUtilizatorAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  const targetUserId = String(formData.get("targetUserId") || "");
  const cale = String(formData.get("cale") || "/");
  if (!targetUserId || targetUserId === session.user.id) return;

  await prisma.block.upsert({
    where: { blockerId_blockedId: { blockerId: session.user.id, blockedId: targetUserId } },
    create: { blockerId: session.user.id, blockedId: targetUserId },
    update: {},
  });
  revalidatePath(cale);
}

export async function deblocheazaUtilizatorAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  const targetUserId = String(formData.get("targetUserId") || "");
  const cale = String(formData.get("cale") || "/");
  await prisma.block.deleteMany({
    where: { blockerId: session.user.id, blockedId: targetUserId },
  });
  revalidatePath(cale);
}
