"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getConversationForUser,
  notificaMesajNou,
  notificaOfertaNoua,
  notificaOfertaRetrasa,
  notificaRaspunsContraoferta,
} from "@/lib/chat";
import { MARIME_COMPANIE_OPTIONS } from "@/lib/constants";
import { notificaRadarPost } from "@/lib/radar";
import { existaBlocaj } from "@/lib/moderare";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function updateEmployerProfileAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("employer");
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: t("errors.notAuthenticatedEmployer") };
  }
  const userId = session.user.id;

  const schema = z.object({
    numeCompanie: z.string().trim().min(2, t("errors.companyNameRequired")),
    industrie: z.string().trim().optional(),
    locatie: z.string().trim().optional(),
    marimeCompanie: z.enum(MARIME_COMPANIE_OPTIONS).optional(),
    website: z.string().trim().url(t("errors.invalidWebsite")).optional().or(z.literal("")),
    linkedin: z.string().trim().url(t("errors.invalidWebsite")).optional().or(z.literal("")),
    descriere: z.string().trim().optional(),
    cautamGeneral: z.string().trim().optional(),
  });

  const parsed = schema.safeParse({
    numeCompanie: formData.get("numeCompanie"),
    industrie: formData.get("industrie") || undefined,
    locatie: formData.get("locatie") || undefined,
    marimeCompanie: formData.get("marimeCompanie") || undefined,
    website: formData.get("website") || "",
    linkedin: formData.get("linkedin") || "",
    descriere: formData.get("descriere") || undefined,
    cautamGeneral: formData.get("cautamGeneral") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const { website, linkedin, ...rest } = parsed.data;

  // anul înființării (opțional) — validat manual
  const anCurent = new Date().getFullYear();
  const anRaw = String(formData.get("anFondare") || "").trim();
  const anNum = anRaw ? Number(anRaw) : NaN;
  const anFondare =
    Number.isInteger(anNum) && anNum >= 1800 && anNum <= anCurent ? anNum : null;

  const beneficii = String(formData.get("beneficii") || "").trim() || null;

  const domeniiInteres =
    formData.getAll("domenii").map(String).filter(Boolean).join(",") || null;
  const date = {
    ...rest,
    website: website || undefined,
    linkedin: linkedin || undefined,
    anFondare,
    beneficii,
    domeniiInteres,
  };

  await prisma.employerProfile.upsert({
    where: { userId },
    create: { userId, ...date },
    update: { ...date },
  });

  // după salvare, ducem angajatorul direct la pagina „Profil companie" cu datele noi
  revalidatePath("/angajator/profil");
  redirect("/angajator/profil");
}

export async function startConversationAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("employer");
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: t("errors.notAuthenticatedEmployer") };
  }

  const startConversationSchema = z.object({
    candidateId: z.string().min(1),
    mesaj: z.string().trim().min(5, t("errors.messageTooShort")),
  });

  const parsed = startConversationSchema.safeParse({
    candidateId: formData.get("candidateId"),
    mesaj: formData.get("mesaj"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) {
    return { error: t("errors.completeProfileFirst") };
  }

  const candidat = await prisma.candidateProfile.findUnique({
    where: { id: parsed.data.candidateId },
    select: { userId: true },
  });
  if (!candidat) return { error: t("errors.invalidData") };
  if (await existaBlocaj(session.user.id, candidat.userId)) {
    return { error: t("errors.blocked") };
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      employerId_candidateId: {
        employerId: employer.id,
        candidateId: parsed.data.candidateId,
      },
    },
    create: { employerId: employer.id, candidateId: parsed.data.candidateId },
    update: {},
  });

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      trimisDe: "EMPLOYER",
      continut: parsed.data.mesaj,
    },
  });

  await notificaMesajNou(conversation.id, "EMPLOYER", parsed.data.mesaj);

  redirect(`/angajator/mesaje/${conversation.id}`);
}

export async function sendOfferAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("employer");
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: t("errors.notAuthenticatedEmployer") };
  }

  const sendOfferSchema = z.object({
    conversationId: z.string().min(1),
    titluPost: z.string().trim().min(2, t("errors.jobTitleRequired")),
    descriere: z.string().trim().min(5, t("errors.offerDescriptionRequired")),
    salariu: z.coerce.number().int().positive().optional(),
    locatie: z.string().trim().optional(),
  });

  const parsed = sendOfferSchema.safeParse({
    conversationId: formData.get("conversationId"),
    titluPost: formData.get("titluPost"),
    descriere: formData.get("descriere"),
    salariu: formData.get("salariu") || undefined,
    locatie: formData.get("locatie") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const access = await getConversationForUser(parsed.data.conversationId, session.user.id);
  if (!access || !access.isEmployer) {
    return { error: t("errors.conversationNotFound") };
  }

  if (await existaBlocaj(access.conversation.employer.userId, access.conversation.candidate.userId)) {
    return { error: t("errors.blocked") };
  }

  const offer = await prisma.jobOffer.create({
    data: {
      conversationId: parsed.data.conversationId,
      titluPost: parsed.data.titluPost,
      descriere: parsed.data.descriere,
      salariu: parsed.data.salariu ?? null,
      locatie: parsed.data.locatie || null,
    },
  });

  await notificaOfertaNoua(offer.id);

  revalidatePath(`/angajator/mesaje/${parsed.data.conversationId}`);
  return { success: true };
}

export async function recordProfileViewAction(candidateId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;
  if (!candidateId) return;

  const [employer, candidate] = await Promise.all([
    prisma.employerProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.candidateProfile.findUnique({ where: { id: candidateId }, select: { userId: true } }),
  ]);
  if (!employer || !candidate) return;
  if (employer.userId === candidate.userId) return; // fără auto-vizualizare

  await prisma.profileView.upsert({
    where: {
      employerId_candidateId_tip: {
        employerId: employer.id,
        candidateId,
        tip: "PROFIL",
      },
    },
    create: { employerId: employer.id, candidateId, tip: "PROFIL" },
    update: { viewCount: { increment: 1 } },
  });
}

// Angajatorul retrage o ofertă încă în așteptare (candidatul nu a răspuns).
// Marcăm oferta ca REJECTED cu inchisDe = EMPLOYER, ca să apară în istoric drept „retrasă de companie".
export async function retrageOfertaAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  if (!offerId) return;

  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;

  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { conversation: { include: { employer: true } } },
  });
  if (!offer) return;
  if (offer.conversation.employer.userId !== session.user.id) return;
  if (offer.status !== "PENDING") return;

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: { status: "REJECTED", inchisDe: "EMPLOYER", raspunsLa: new Date() },
  });

  await notificaOfertaRetrasa(offerId);

  revalidatePath(`/angajator/mesaje/${offer.conversationId}`);
}

// Helper: găsește o ofertă în status COUNTERED deținută de angajatorul curent.
async function getCounteredOfferForEmployer(offerId: string, userId: string) {
  const offer = await prisma.jobOffer.findUnique({
    where: { id: offerId },
    include: { conversation: { include: { employer: true } } },
  });
  if (!offer) return null;
  if (offer.conversation.employer.userId !== userId) return null;
  if (offer.status !== "COUNTERED") return null;
  return offer;
}

// Angajatorul acceptă contraoferta candidatului → salariul agreat devine cel propus de candidat.
export async function acceptaContraofertaAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  if (!offerId) return;
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;

  const offer = await getCounteredOfferForEmployer(offerId, session.user.id);
  if (!offer) return;

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: {
      status: "ACCEPTED",
      salariu: offer.salariuContra ?? offer.salariu,
      salariuContra: null,
      inchisDe: "EMPLOYER",
      raspunsLa: new Date(),
    },
  });

  await notificaRaspunsContraoferta(offerId);
  revalidatePath(`/angajator/mesaje/${offer.conversationId}`);
}

// Angajatorul refuză contraoferta.
export async function respingeContraofertaAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  if (!offerId) return;
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;

  const offer = await getCounteredOfferForEmployer(offerId, session.user.id);
  if (!offer) return;

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: { status: "REJECTED", inchisDe: "EMPLOYER", raspunsLa: new Date() },
  });

  await notificaRaspunsContraoferta(offerId);
  revalidatePath(`/angajator/mesaje/${offer.conversationId}`);
}

// Angajatorul propune un alt salariu (re-contraofertă) → oferta revine la candidat (PENDING) cu noul salariu.
export async function recontraofertaAction(formData: FormData) {
  const offerId = String(formData.get("offerId") || "");
  const salariu = Number(String(formData.get("salariu") || "").trim());
  if (!offerId || !Number.isFinite(salariu) || salariu <= 0) return;
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;

  const offer = await getCounteredOfferForEmployer(offerId, session.user.id);
  if (!offer) return;

  await prisma.jobOffer.update({
    where: { id: offerId },
    data: { status: "PENDING", salariu: Math.round(salariu), salariuContra: null },
  });

  await notificaRaspunsContraoferta(offerId);
  revalidatePath(`/angajator/mesaje/${offer.conversationId}`);
}

// ── Posturi (poziții deschise ale companiei) ─────────────────────────────

// Creează sau actualizează un post. Dacă formData conține postId, e editare.
export async function salvezaPostAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("posts");
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: t("errorNotFound") };
  }
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) return { error: t("errorNotFound") };

  const titlu = String(formData.get("titlu") || "").trim();
  if (titlu.length < 2) return { error: t("errorTitleRequired") };

  const num = (k: string): number | null => {
    const v = String(formData.get(k) || "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };
  const str = (k: string): string | null => {
    const v = String(formData.get(k) || "").trim();
    return v || null;
  };

  const data = {
    titlu,
    domeniuSlug: str("domeniuSlug"),
    skills: str("skills"),
    experientaMin: num("experientaMin"),
    experientaMax: num("experientaMax"),
    salariuMin: num("salariuMin"),
    salariuMax: num("salariuMax"),
    locatie: str("locatie"),
    remote: formData.get("remote") === "on",
    descriere: str("descriere"),
    activ: formData.get("activ") === "on",
  };

  const postId = String(formData.get("postId") || "").trim();
  if (postId) {
    const existing = await prisma.post.findUnique({
      where: { id: postId },
      select: { employerId: true },
    });
    if (!existing || existing.employerId !== employer.id) {
      return { error: t("errorNotFound") };
    }
    await prisma.post.update({ where: { id: postId }, data });
  } else {
    const postNou = await prisma.post.create({
      data: { ...data, employerId: employer.id },
    });
    // Radar de joburi: anunțăm candidații Unlimited potriviți (doar la postul nou activ).
    if (postNou.activ) await notificaRadarPost(postNou.id);
  }

  revalidatePath("/angajator/posturi");
  revalidatePath("/angajator/profil");
  redirect("/angajator/posturi");
}

export async function stergePostAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "EMPLOYER") return;
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) return;

  const postId = String(formData.get("postId") || "").trim();
  if (!postId) return;
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { employerId: true },
  });
  if (!existing || existing.employerId !== employer.id) return;

  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/angajator/posturi");
  revalidatePath("/angajator/profil");
  redirect("/angajator/posturi");
}
