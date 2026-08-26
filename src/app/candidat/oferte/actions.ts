"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notificaRaspunsOferta, notificaContraoferta } from "@/lib/chat";
import { existaBlocaj } from "@/lib/moderare";
import type { OfferStatus } from "@/generated/prisma/client";

async function raspundeOferta(offerId: string, status: OfferStatus) {
  const t = await getTranslations("candidate");
  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") {
    return { error: t("errorMustBeCandidate") };
  }

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { conversation: { include: { candidate: true } } },
  });
  if (!offer) {
    return { error: t("errorOfferNotFound") };
  }
  if (offer.conversation.candidate.userId !== session.user.id) {
    return { error: t("errorNoOfferAccess") };
  }
  if (offer.status !== "PENDING") {
    return { error: t("errorAlreadyResponded") };
  }

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: { status, inchisDe: "CANDIDATE", raspunsLa: new Date() },
  });

  await notificaRaspunsOferta(offerId);

  revalidatePath(`/candidat/oferte/${offer.conversationId}`);
  return { success: true };
}

export async function acceptOfferAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  if (!offerId) return;
  await raspundeOferta(offerId, "ACCEPTED");
}

export async function rejectOfferAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  if (!offerId) return;
  await raspundeOferta(offerId, "REJECTED");
}

// Candidatul trimite o contraofertă: propune alt salariu la o ofertă în așteptare.
export async function contraofertaAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  const salariuBrut = String(formData.get("salariu") || "").trim();
  const salariu = Number(salariuBrut);
  if (!offerId || !Number.isFinite(salariu) || salariu <= 0) return;

  const session = await auth();
  if (!session?.user || session.user.role !== "CANDIDATE") return;

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { conversation: { include: { candidate: true, employer: true } } },
  });
  if (!offer) return;
  if (offer.conversation.candidate.userId !== session.user.id) return;
  if (offer.status !== "PENDING") return;
  if (await existaBlocaj(offer.conversation.candidate.userId, offer.conversation.employer.userId)) return;

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: { status: "COUNTERED", salariuContra: Math.round(salariu) },
  });

  await notificaContraoferta(offerId);

  revalidatePath(`/candidat/oferte/${offer.conversationId}`);
}
