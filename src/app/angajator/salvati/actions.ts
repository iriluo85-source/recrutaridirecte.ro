"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type NotitaState = { error?: string; success?: boolean } | undefined;

async function getEmployerId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "EMPLOYER") return null;
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return employer?.id ?? null;
}

export async function salveazaCandidatAction(formData: FormData) {
  const employerId = await getEmployerId();
  if (!employerId) return;
  const candidateId = String(formData.get("candidateId") || "");
  const cale = String(formData.get("cale") || "/angajator/salvati");
  if (!candidateId) return;

  await prisma.savedCandidate.upsert({
    where: { employerId_candidateId: { employerId, candidateId } },
    create: { employerId, candidateId },
    update: {},
  });
  revalidatePath(cale);
}

export async function eliminaCandidatSalvatAction(formData: FormData) {
  const employerId = await getEmployerId();
  if (!employerId) return;
  const candidateId = String(formData.get("candidateId") || "");
  const cale = String(formData.get("cale") || "/angajator/salvati");
  if (!candidateId) return;

  await prisma.savedCandidate.deleteMany({
    where: { employerId, candidateId },
  });
  revalidatePath(cale);
}

export async function salveazaNotitaAction(
  _prev: NotitaState,
  formData: FormData
): Promise<NotitaState> {
  const t = await getTranslations("employer");
  const employerId = await getEmployerId();
  if (!employerId) return { error: t("errors.notAuthenticatedEmployer") };
  const candidateId = String(formData.get("candidateId") || "");
  const notita = String(formData.get("notita") || "").trim() || null;
  if (!candidateId) return { error: t("errors.invalidData") };

  // ne asigurăm că există înregistrarea (dacă scrie notă fără să fi apăsat „salvează")
  await prisma.savedCandidate.upsert({
    where: { employerId_candidateId: { employerId, candidateId } },
    create: { employerId, candidateId, notita },
    update: { notita },
  });
  revalidatePath("/angajator/salvati");
  return { success: true };
}
