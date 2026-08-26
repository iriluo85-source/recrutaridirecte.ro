import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { urlAplicatie } from "@/lib/tokens";
import { calculeazaScorPotrivire } from "@/lib/matching";
import { domeniuDupaSlug, DOMENII } from "@/lib/domenii";

const ZILE_NOI = 7; // fereastra pentru "CV-uri noi"
const SCOR_MINIM = 40; // prag de potrivire ca un candidat să intre în digest

export type DigestRezultat = {
  trimise: number;
  totalOptIn: number;
};

// Trimite fiecărui angajator care a activat `emailuriDigest` un email cu CV-urile
// noi (din ultimele ZILE_NOI) potrivite pe domeniile lui de interes. Fără opt-in
// nu se trimite nimic. Nu aruncă niciodată (sendEmail e no-op fără Gmail).
export async function trimiteDigestAngajatori(): Promise<DigestRezultat> {
  const acum = Date.now();
  const deLa = new Date(acum - ZILE_NOI * 24 * 60 * 60 * 1000);

  const angajatori = await prisma.user.findMany({
    where: { role: "EMPLOYER", emailuriDigest: true },
    include: { employerProfile: true },
  });

  // candidați noi (profil nou SAU CV nou în fereastră), cu skill-urile lor
  const candidatiNoi = await prisma.candidateProfile.findMany({
    where: {
      OR: [{ createdAt: { gte: deLa } }, { cvFiles: { some: { createdAt: { gte: deLa } } } }],
    },
    include: { skills: { include: { skill: true } } },
  });

  let trimise = 0;

  for (const angajator of angajatori) {
    const slugs = (angajator.employerProfile?.domeniiInteres ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // skill-urile de interes = reuniunea skill-urilor domeniilor selectate
    const skillsInteres = slugs
      .map((slug) => domeniuDupaSlug(slug))
      .filter((d): d is (typeof DOMENII)[number] => Boolean(d))
      .flatMap((d) => d.skills);

    let potrivite = candidatiNoi;
    if (skillsInteres.length > 0) {
      potrivite = candidatiNoi.filter((c) => {
        const { score } = calculeazaScorPotrivire(
          { skills: skillsInteres },
          {
            locatie: c.locatie,
            remote: c.remote,
            aniExperienta: c.aniExperienta,
            salariuMinim: c.salariuMinim,
            salariuMaxim: c.salariuMaxim,
            skills: c.skills.map((s) => s.skill.nume),
          }
        );
        return score >= SCOR_MINIM;
      });
    }

    if (potrivite.length === 0) continue;

    const primulSlug = slugs[0];
    const link = urlAplicatie(
      primulSlug ? `/angajator/cautare?domeniu=${primulSlug}` : "/angajator/cautare"
    );

    const areDomenii = skillsInteres.length > 0;
    const subiect = areDomenii
      ? `Am găsit ${potrivite.length} CV-uri care s-ar potrivi cu compania ta`
      : `S-au încărcat ${potrivite.length} CV-uri noi pe Recrutare Directă`;
    const intro = areDomenii
      ? `Am găsit <strong>${potrivite.length}</strong> CV-uri noi care s-ar potrivi cu domeniile tale de interes.`
      : `S-au încărcat <strong>${potrivite.length}</strong> CV-uri noi de la ultima verificare.`;

    await sendEmail({
      to: angajator.email,
      subject: subiect,
      html: `<p>${intro}</p><p><a href="${link}">Vezi CV-urile în aplicație</a></p><p style="color:#888;font-size:12px">Primești acest email pentru că ai activat notificările cu CV-uri noi. Le poți opri oricând din Setări.</p>`,
    });
    trimise++;
  }

  return { trimise, totalOptIn: angajatori.length };
}
