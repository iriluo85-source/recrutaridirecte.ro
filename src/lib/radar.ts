import { prisma } from "@/lib/prisma";
import { sendEmail, escapeHtml } from "@/lib/email";
import { urlAplicatie } from "@/lib/tokens";
import { createNotification } from "@/lib/notifications";
import { calculeazaScorPotrivire, type MatchCriteria } from "@/lib/matching";

// Radar de joburi (beneficiu Unlimited): când o companie adaugă un post, anunțăm
// candidații Unlimited al căror profil se potrivește cu postul. Contactul rămâne
// inițiat de angajator — radarul e doar un „heads-up" ca profilul lor să fie gata.
const PRAG_POTRIVIRE = 50;

export async function notificaRadarPost(postId: string): Promise<void> {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { employer: true },
    });
    if (!post || !post.activ) return;

    const criterii: MatchCriteria = {
      skills: (post.skills ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      locatie: post.locatie ?? undefined,
      experientaMin: post.experientaMin ?? undefined,
      experientaMax: post.experientaMax ?? undefined,
      bugetMin: post.salariuMin ?? undefined,
      bugetMax: post.salariuMax ?? undefined,
    };

    // candidații Platinum și Unlimited beneficiază de radar
    const candidati = await prisma.candidateProfile.findMany({
      where: { user: { abonamentTip: { in: ["PLATINUM", "UNLIMITED"] } } },
      include: {
        skills: { include: { skill: true } },
        user: { select: { id: true, email: true, notificariEmail: true } },
      },
    });

    const numeCompanie = post.employer.numeCompanie;
    const link = "/candidat/profil";

    for (const c of candidati) {
      const { score } = calculeazaScorPotrivire(criterii, {
        locatie: c.locatie,
        remote: c.remote,
        aniExperienta: c.aniExperienta,
        salariuMinim: c.salariuMinim,
        salariuMaxim: c.salariuMaxim,
        skills: c.skills.map((s) => s.skill.nume),
      });
      if (score < PRAG_POTRIVIRE) continue;

      await createNotification({
        userId: c.user.id,
        tip: "RADAR_POST",
        titlu: "O companie caută profilul tău",
        continut: `${numeCompanie} recrutează pentru „${post.titlu}”. Actualizează-ți profilul ca să fii ales.`,
        link,
        entityId: post.id,
      });

      if (!c.user.notificariEmail) continue;
      await sendEmail({
        to: c.user.email,
        subject: `Radar de joburi: ${numeCompanie} caută un profil ca al tău`,
        html:
          `<p><strong>${escapeHtml(numeCompanie)}</strong> recrutează pentru <strong>${escapeHtml(post.titlu)}</strong>, ` +
          `un rol care se potrivește cu profilul tău.</p>` +
          `<p><a href="${urlAplicatie(link)}">Actualizează-ți profilul</a> ca să fii găsit primul.</p>` +
          `<p style="color:#888;font-size:12px">Primești acest email pentru că ai abonamentul Prestige sau Nelimitat (Radar de joburi). Poți opri notificările din Setări.</p>`,
      });
    }
  } catch (error) {
    console.error("[radar] Notificarea Radar de joburi a eșuat:", error);
  }
}
