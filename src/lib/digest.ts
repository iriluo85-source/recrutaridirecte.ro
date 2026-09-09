import { prisma } from "@/lib/prisma";
import { sendEmail, escapeHtml } from "@/lib/email";
import { urlAplicatie } from "@/lib/tokens";
import { calculeazaScorPotrivire, locatiePotriveste } from "@/lib/matching";
import { domeniuDupaSlug, DOMENII } from "@/lib/domenii";
import { linkDezabonare } from "@/lib/newsletter";

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
    where: { role: "EMPLOYER", emailuriDigest: true, emailVerificat: true },
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

// ---------------------------------------------------------------------------
// Digestul candidaților: posturi noi potrivite cu orașul lor + companii noi.
//
// Regula care ține sistemul sănătos: dacă nu e nimic nou pentru cineva, NU
// primește email. Un „n-avem nimic pentru tine" la fiecare două zile produce
// dezabonări și arde reputația domeniului la Resend — adică ajung în spam exact
// emailurile care contează: confirmări, mesaje, oferte.

/** Fereastra pentru cineva care n-a mai primit niciun digest. */
const FEREASTRA_INITIALA_ZILE = 7;

/**
 * O singură companie nouă NU e o știre. Un email care spune doar „o companie s-a
 * alăturat" e conținut gol: îi învață pe oameni să ne ignore și strică rata de
 * deschidere pentru emailurile care chiar contează. Companiile noi merită un email
 * pe cont propriu abia de la acest prag în sus; altfel sunt doar un rând în plus
 * lângă posturi.
 */
const PRAG_FIRME_SINGURE = 3;

export type DigestCandidatiRezultat = {
  optIn: number;
  trimise: number;
  sarite: number;
  esuate: number;
};

export async function trimiteDigestCandidati(
  doarTest = false
): Promise<DigestCandidatiRezultat> {
  const acum = new Date();

  const useri = await prisma.user.findMany({
    where: {
      role: "CANDIDATE",
      emailuriDigest: true,
      emailVerificat: true,
      candidateProfile: { isNot: null },
    },
    select: {
      id: true,
      email: true,
      ultimulDigestLa: true,
      candidateProfile: { select: { locatie: true } },
    },
  });

  const r: DigestCandidatiRezultat = {
    optIn: useri.length,
    trimise: 0,
    sarite: 0,
    esuate: 0,
  };

  for (const u of useri) {
    const de =
      u.ultimulDigestLa ??
      new Date(acum.getTime() - FEREASTRA_INITIALA_ZILE * 24 * 60 * 60 * 1000);

    const [posturi, firmeNoi] = await Promise.all([
      prisma.post.findMany({
        where: { activ: true, createdAt: { gte: de } },
        select: {
          titlu: true,
          locatie: true,
          remote: true,
          salariuMin: true,
          salariuMax: true,
          employer: { select: { numeCompanie: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.employerProfile.count({ where: { createdAt: { gte: de } } }),
    ]);

    // Doar posturile din orașul candidatului (sau remote) — aceeași regulă ca în căutare.
    const alelui = posturi.filter((p) =>
      // Aici remote-ul chiar contează: un post remote e relevant pentru orice candidat.
      locatiePotriveste(p.locatie ?? "", p.remote, u.candidateProfile?.locatie || undefined, true)
    );

    if (alelui.length === 0 && firmeNoi < PRAG_FIRME_SINGURE) {
      r.sarite++;
      continue;
    }

    if (doarTest) {
      r.trimise++;
      continue;
    }

    const listaPosturi = alelui
      .map((p) => {
        const parti: string[] = [];
        if (p.salariuMin != null || p.salariuMax != null) {
          const s =
            p.salariuMin != null && p.salariuMax != null
              ? `${p.salariuMin}–${p.salariuMax}`
              : `${p.salariuMin ?? p.salariuMax}`;
          parti.push(`${s} lei`);
        }
        const loc = [p.locatie, p.remote ? "remote" : null].filter(Boolean).join(" · ");
        if (loc) parti.push(loc);
        return (
          `<li style="margin-bottom:10px"><strong>${escapeHtml(p.titlu)}</strong><br/>` +
          `<span style="color:#555">${escapeHtml(p.employer.numeCompanie)}` +
          (parti.length ? ` — ${escapeHtml(parti.join(" · "))}` : "") +
          `</span></li>`
        );
      })
      .join("");

    const corp =
      (alelui.length > 0
        ? `<p><strong>${alelui.length === 1 ? "Un post nou" : alelui.length + " posturi noi"} pentru tine:</strong></p><ul style="padding-left:18px">${listaPosturi}</ul>`
        : "") +
      (firmeNoi > 0
        ? `<p>${firmeNoi === 1 ? "O companie nouă s-a alăturat" : firmeNoi + " companii noi s-au alăturat"} platformei.</p>`
        : "");

    const titlu =
      alelui.length > 0
        ? alelui.length === 1
          ? "Un post nou pentru tine"
          : `${alelui.length} posturi noi pentru tine`
        : "Companii noi pe platformă";

    const ok = await sendEmail({
      to: u.email,
      subject: `${titlu} — Recrutare Directă`,
      html:
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#111">` +
        corp +
        `<p style="margin:20px 0"><a href="${urlAplicatie("/companii")}" style="background:#16a34a;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">Vezi pe platformă</a></p>` +
        `<hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>` +
        `<p style="color:#888;font-size:12px">Primești acest email pentru că ai activate alertele pe Recrutare Directă. ` +
        `<a href="${linkDezabonare(u.id)}">Dezabonează-te</a> sau schimbă preferințele din Setări.</p>` +
        `</div>`,
    });

    if (ok) {
      r.trimise++;
      await prisma.user.updateMany({ where: { id: u.id }, data: { ultimulDigestLa: acum } });
    } else {
      r.esuate++;
    }
  }

  return r;
}
