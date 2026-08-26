import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { urlAplicatie } from "@/lib/tokens";

// Newsletter cu „noutăți / sfaturi" pe email, pe rol. Trimis doar celor care au
// activat `newsletterEmail` (opt-in) și au emailul confirmat. Fiecare email are
// link către site + link de dezabonare cu un click (fără login).

const INTERVAL_ZILE = 2; // la fiecare 2 zile schimbăm „ediția" (mesajul afișat)

type MesajNewsletter = {
  subiect: string;
  corp: string;
  ctaText: string;
  ctaCale: string;
};

const POOL_CANDIDAT: MesajNewsletter[] = [
  {
    subiect: "Nu uita să-ți încarci CV-ul",
    corp: "Nu uita să-ți încarci CV-ul, ca un angajator să-ți remarce potențialul. Profilurile cu CV sunt găsite mult mai des.",
    ctaText: "Încarcă-ți CV-ul",
    ctaCale: "/candidat/profil",
  },
  {
    subiect: "Un profil complet e găsit de mai multe ori",
    corp: "Angajatorii caută candidați după criterii clare. Un profil complet, cu experiență și disponibilitate, apare mai sus în rezultate.",
    ctaText: "Completează-ți profilul",
    ctaCale: "/candidat/profil/editeaza",
  },
  {
    subiect: "Adaugă-ți skill-urile",
    corp: "Companiile caută după skill-uri. Adaugă-le pe ale tale ca să apari atunci când te caută cineva.",
    ctaText: "Adaugă skill-uri",
    ctaCale: "/candidat/profil/editeaza",
  },
  {
    subiect: "Ai oferte de verificat?",
    corp: "Verifică-ți ofertele primite și răspunde rapid — angajatorii apreciază candidații activi.",
    ctaText: "Vezi ofertele mele",
    ctaCale: "/candidat/oferte",
  },
  {
    subiect: "Companii noi recrutează pe platformă",
    corp: "Companii noi se alătură platformei în fiecare săptămână. Vezi cine recrutează chiar acum.",
    ctaText: "Vezi companiile",
    ctaCale: "/companii",
  },
  {
    subiect: "Ține-ți profilul proaspăt",
    corp: "Un profil actualizat recent inspiră mai multă încredere angajatorilor. Aruncă-i o privire și adaugă ce e nou.",
    ctaText: "Actualizează-ți profilul",
    ctaCale: "/candidat/profil",
  },
];

const POOL_ANGAJATOR: MesajNewsletter[] = [
  {
    subiect: "Vezi CV-urile potrivite cu posturile tale",
    corp: "Uită-te la ce CV-uri s-au potrivit cu posturile tale deschise. Poate viitorul tău angajat e deja aici.",
    ctaText: "Caută candidați",
    ctaCale: "/angajator/cautare",
  },
  {
    subiect: "Adaugă un post și caută direct candidați",
    corp: "Adaugă poziția pe care recrutezi și caută direct candidații potriviți, cu criteriile precompletate.",
    ctaText: "Adaugă un post",
    ctaCale: "/angajator/posturi/nou",
  },
  {
    subiect: "Candidați noi și-au încărcat CV-urile",
    corp: "Candidați noi și-au încărcat CV-urile. Caută-i după domeniu și contactează-i primul.",
    ctaText: "Caută după domeniu",
    ctaCale: "/angajator/cautare",
  },
  {
    subiect: "Un profil de companie complet atrage candidați",
    corp: "Un profil de companie complet și posturi bine descrise atrag candidați mai potriviți. Aruncă-i o privire.",
    ctaText: "Actualizează profilul companiei",
    ctaCale: "/angajator/profil/editeaza",
  },
  {
    subiect: "Ai găsit pe cineva potrivit?",
    corp: "Ai găsit un candidat potrivit? Trimite-i o ofertă direct din platformă — fără intermediari.",
    ctaText: "Vezi conversațiile",
    ctaCale: "/angajator/mesaje",
  },
  {
    subiect: "Nu rata talentele din domeniul tău",
    corp: "Verifică regulat candidații noi din domeniul tău — cei mai buni sunt contactați repede.",
    ctaText: "Caută candidați",
    ctaCale: "/angajator/cautare",
  },
];

function editieCurenta(): number {
  return Math.floor(Date.now() / (INTERVAL_ZILE * 24 * 60 * 60 * 1000));
}

function alegeMesaj(pool: MesajNewsletter[], editie: number): MesajNewsletter {
  return pool[((editie % pool.length) + pool.length) % pool.length];
}

// ── Dezabonare cu un click (semnătură HMAC, fără stare în DB) ──────────────
function secretDezabonare(): string {
  return process.env.AUTH_SECRET || "dev-secret-schimba-in-productie";
}

export function semnaturaDezabonare(userId: string): string {
  return crypto
    .createHmac("sha256", secretDezabonare())
    .update(`newsletter:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verificaSemnaturaDezabonare(userId: string, semnatura: string): boolean {
  const asteptat = semnaturaDezabonare(userId);
  const a = Buffer.from(semnatura || "", "utf8");
  const b = Buffer.from(asteptat, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function linkDezabonare(userId: string): string {
  return urlAplicatie(`/dezabonare?u=${userId}&s=${semnaturaDezabonare(userId)}`);
}

export type NewsletterRezultat = { trimise: number; totalOptIn: number };

export async function trimiteNewsletter(editie?: number): Promise<NewsletterRezultat> {
  const ed = editie ?? editieCurenta();

  const useri = await prisma.user.findMany({
    where: { newsletterEmail: true, emailVerificat: true },
    select: { id: true, email: true, role: true },
  });

  let trimise = 0;
  for (const u of useri) {
    const pool = u.role === "EMPLOYER" ? POOL_ANGAJATOR : POOL_CANDIDAT;
    const mesaj = alegeMesaj(pool, ed);
    const linkSite = urlAplicatie(mesaj.ctaCale);
    const linkOff = linkDezabonare(u.id);

    await sendEmail({
      to: u.email,
      subject: `${mesaj.subiect} — Recrutare Directă`,
      html:
        `<p>${mesaj.corp}</p>` +
        `<p><a href="${linkSite}">${mesaj.ctaText}</a></p>` +
        `<hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>` +
        `<p style="color:#888;font-size:12px">Primești acest email pentru că ai activat noutățile pe Recrutare Directă. ` +
        `<a href="${linkOff}">Dezabonează-te</a> sau schimbă preferințele din Setări.</p>`,
    });
    trimise++;
  }

  return { trimise, totalOptIn: useri.length };
}
