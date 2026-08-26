import { prisma } from "@/lib/prisma";
import { sendEmail, escapeHtml } from "@/lib/email";
import { urlAplicatie } from "@/lib/tokens";
import { createNotification } from "@/lib/notifications";

export async function getConversationForUser(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { employer: true, candidate: true },
  });
  if (!conversation) return null;

  const isEmployer = conversation.employer.userId === userId;
  const isCandidate = conversation.candidate.userId === userId;
  if (!isEmployer && !isCandidate) return null;

  return { conversation, isEmployer, isCandidate };
}

export const ATASAMENT_EXTENSII_PERMISE = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"];
export const ATASAMENT_MAX_BYTES = 10 * 1024 * 1024;

export async function notificaMesajNou(
  conversationId: string,
  trimisDe: "CANDIDATE" | "EMPLOYER",
  continut: string | null
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        employer: { include: { user: true } },
        candidate: { include: { user: true } },
      },
    });
    if (!conversation) return;

    const fragment = continut ? continut.slice(0, 200) : "📎 Atașament";

    if (trimisDe === "EMPLOYER") {
      const link = `/candidat/oferte/${conversationId}`;
      await createNotification({
        userId: conversation.candidate.user.id,
        tip: "MESAJ_NOU",
        titlu: `Mesaj nou de la ${conversation.employer.numeCompanie}`,
        continut: fragment,
        link,
        entityId: conversationId,
      });
      if (!conversation.candidate.user.notificariEmail) return;
      await sendEmail({
        to: conversation.candidate.user.email,
        subject: `Mesaj nou de la ${conversation.employer.numeCompanie}`,
        html: `<p><strong>${escapeHtml(conversation.employer.numeCompanie)}</strong> ți-a trimis un mesaj:</p><p>${escapeHtml(fragment)}</p><p><a href="${urlAplicatie(link)}">Vezi conversația</a></p>`,
      });
    } else {
      const link = `/angajator/mesaje/${conversationId}`;
      await createNotification({
        userId: conversation.employer.user.id,
        tip: "MESAJ_NOU",
        titlu: `Mesaj nou de la ${conversation.candidate.numeComplet}`,
        continut: fragment,
        link,
        entityId: conversationId,
      });
      if (!conversation.employer.user.notificariEmail) return;
      await sendEmail({
        to: conversation.employer.user.email,
        subject: `Mesaj nou de la ${conversation.candidate.numeComplet}`,
        html: `<p><strong>${escapeHtml(conversation.candidate.numeComplet)}</strong> ți-a trimis un mesaj:</p><p>${escapeHtml(fragment)}</p><p><a href="${urlAplicatie(link)}">Vezi conversația</a></p>`,
      });
    }
  } catch (error) {
    console.error("[email] Notificarea de mesaj nou a eșuat:", error);
  }
}

export async function notificaOfertaNoua(offerId: string) {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        conversation: {
          include: {
            employer: true,
            candidate: { include: { user: true } },
          },
        },
      },
    });
    if (!offer) return;

    const { conversation } = offer;
    const link = `/candidat/oferte/${conversation.id}`;

    await createNotification({
      userId: conversation.candidate.user.id,
      tip: "OFERTA_NOUA",
      titlu: `Ofertă de angajare de la ${conversation.employer.numeCompanie}`,
      continut: offer.titluPost,
      link,
      entityId: conversation.id,
    });

    if (!conversation.candidate.user.notificariEmail) return;
    await sendEmail({
      to: conversation.candidate.user.email,
      subject: `Ofertă de angajare de la ${conversation.employer.numeCompanie}`,
      html: `<p><strong>${escapeHtml(conversation.employer.numeCompanie)}</strong> ți-a trimis o ofertă de angajare: <strong>${escapeHtml(offer.titluPost)}</strong>.</p><p><a href="${urlAplicatie(link)}">Vezi oferta și răspunde</a></p>`,
    });
  } catch (error) {
    console.error("[email] Notificarea de ofertă nouă a eșuat:", error);
  }
}

export async function notificaRaspunsOferta(offerId: string) {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        conversation: {
          include: {
            employer: { include: { user: true } },
            candidate: true,
          },
        },
      },
    });
    if (!offer) return;

    const { conversation } = offer;
    const link = `/angajator/mesaje/${conversation.id}`;
    const raspuns = offer.status === "ACCEPTED" ? "acceptat" : "refuzat";

    await createNotification({
      userId: conversation.employer.user.id,
      tip: "OFERTA_RASPUNS",
      titlu: `${conversation.candidate.numeComplet} a ${raspuns} oferta`,
      continut: offer.titluPost,
      link,
      entityId: conversation.id,
    });

    if (!conversation.employer.user.notificariEmail) return;
    await sendEmail({
      to: conversation.employer.user.email,
      subject: `${conversation.candidate.numeComplet} a ${raspuns} oferta`,
      html: `<p><strong>${escapeHtml(conversation.candidate.numeComplet)}</strong> a ${raspuns} oferta ta <strong>${escapeHtml(offer.titluPost)}</strong>.</p><p><a href="${urlAplicatie(link)}">Vezi conversația</a></p>`,
    });
  } catch (error) {
    console.error("[email] Notificarea de răspuns la ofertă a eșuat:", error);
  }
}

// Angajatorul retrage o ofertă încă nerăspunsă → anunțăm candidatul.
export async function notificaOfertaRetrasa(offerId: string) {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        conversation: {
          include: {
            employer: true,
            candidate: { include: { user: true } },
          },
        },
      },
    });
    if (!offer) return;

    const { conversation } = offer;
    const link = `/candidat/oferte/${conversation.id}`;

    await createNotification({
      userId: conversation.candidate.user.id,
      tip: "OFERTA_RASPUNS",
      titlu: `${conversation.employer.numeCompanie} a retras oferta`,
      continut: offer.titluPost,
      link,
      entityId: conversation.id,
    });

    if (!conversation.candidate.user.notificariEmail) return;
    await sendEmail({
      to: conversation.candidate.user.email,
      subject: `${conversation.employer.numeCompanie} a retras oferta`,
      html: `<p><strong>${escapeHtml(conversation.employer.numeCompanie)}</strong> a retras oferta <strong>${escapeHtml(offer.titluPost)}</strong>.</p><p><a href="${urlAplicatie(link)}">Vezi detaliile</a></p>`,
    });
  } catch (error) {
    console.error("[email] Notificarea de retragere a ofertei a eșuat:", error);
  }
}

// Candidatul trimite o contraofertă (alt salariu) → anunțăm angajatorul.
export async function notificaContraoferta(offerId: string) {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        conversation: {
          include: { employer: { include: { user: true } }, candidate: true },
        },
      },
    });
    if (!offer) return;

    const { conversation } = offer;
    const link = `/angajator/mesaje/${conversation.id}`;
    const salariu = offer.salariuContra ?? offer.salariu;

    await createNotification({
      userId: conversation.employer.user.id,
      tip: "OFERTA_RASPUNS",
      titlu: `${conversation.candidate.numeComplet} a trimis o contraofertă`,
      continut: salariu ? `Salariu propus: ${salariu} lei/lună` : offer.titluPost,
      link,
      entityId: conversation.id,
    });

    if (!conversation.employer.user.notificariEmail) return;
    await sendEmail({
      to: conversation.employer.user.email,
      subject: `${conversation.candidate.numeComplet} a trimis o contraofertă`,
      html: `<p><strong>${escapeHtml(conversation.candidate.numeComplet)}</strong> a propus un alt salariu pentru <strong>${escapeHtml(offer.titluPost)}</strong>${salariu ? `: <strong>${salariu} lei/lună</strong>` : ""}.</p><p><a href="${urlAplicatie(link)}">Vezi și răspunde</a></p>`,
    });
  } catch (error) {
    console.error("[email] Notificarea de contraofertă a eșuat:", error);
  }
}

// Angajatorul răspunde la contraofertă (acceptă / refuză / propune alt salariu) → anunțăm candidatul.
export async function notificaRaspunsContraoferta(offerId: string) {
  try {
    const offer = await prisma.jobOffer.findUnique({
      where: { id: offerId },
      include: {
        conversation: {
          include: { employer: true, candidate: { include: { user: true } } },
        },
      },
    });
    if (!offer) return;

    const { conversation } = offer;
    const link = `/candidat/oferte/${conversation.id}`;
    const titlu =
      offer.status === "ACCEPTED"
        ? `${conversation.employer.numeCompanie} a acceptat contraoferta`
        : offer.status === "REJECTED"
          ? `${conversation.employer.numeCompanie} a refuzat contraoferta`
          : `${conversation.employer.numeCompanie} a propus un alt salariu`;

    await createNotification({
      userId: conversation.candidate.user.id,
      tip: "OFERTA_RASPUNS",
      titlu,
      continut: offer.titluPost,
      link,
      entityId: conversation.id,
    });

    if (!conversation.candidate.user.notificariEmail) return;
    await sendEmail({
      to: conversation.candidate.user.email,
      subject: titlu,
      html: `<p><strong>${escapeHtml(conversation.employer.numeCompanie)}</strong> — ${escapeHtml(titlu.toLowerCase())} pentru <strong>${escapeHtml(offer.titluPost)}</strong>.</p><p><a href="${urlAplicatie(link)}">Vezi detaliile</a></p>`,
    });
  } catch (error) {
    console.error("[email] Notificarea de răspuns la contraofertă a eșuat:", error);
  }
}
