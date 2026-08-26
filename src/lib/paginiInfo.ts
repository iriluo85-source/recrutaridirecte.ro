// Conținut pentru paginile informative (Despre, FAQ), în RO și EN.
// Ținut separat de messages.json fiindcă e text lung (ca și legal.ts).
import { LEGAL_CONFIG as C } from "@/lib/legal";

type Sectiune = { titlu: string; text: string };
type QA = { q: string; a: string };

export type DesprePage = { title: string; subtitle: string; sectiuni: Sectiune[] };
export type FaqPage = { title: string; subtitle: string; items: QA[] };

export function getDespre(locale: string): DesprePage {
  if (locale === "en") {
    return {
      title: "About us",
      subtitle: `${C.numeSite} connects employers and candidates directly — no middlemen, no job ads.`,
      sectiuni: [
        {
          titlu: "Our mission",
          text: "We make recruiting simpler and more honest: employers search for the right people by clear criteria and contact them directly, while candidates publish their profile and CV to be found. No recruitment agencies, no job-board ads.",
        },
        {
          titlu: "For candidates",
          text: "You create a profile, upload your CV, and become visible to employers. When someone is interested, they reach out to you directly and can send you a structured job offer that you accept, decline, or counter.",
        },
        {
          titlu: "For employers",
          text: "You search candidates by skills, experience, location, and budget, and get a list sorted automatically by match score. You contact the right people directly and manage everything — offers, conversations, positions — in one place.",
        },
        {
          titlu: "Trust and transparency",
          text: "We only host profiles and facilitate contact; we are not a recruitment or placement agency. Your data is protected under GDPR, you control your notifications, and you can export or delete your data anytime.",
        },
      ],
    };
  }
  return {
    title: "Despre noi",
    subtitle: `${C.numeSite} conectează angajatorii și candidații direct — fără intermediari, fără anunțuri.`,
    sectiuni: [
      {
        titlu: "Misiunea noastră",
        text: "Facem recrutarea mai simplă și mai cinstită: angajatorii caută oamenii potriviți după criterii clare și îi contactează direct, iar candidații își publică profilul și CV-ul ca să fie găsiți. Fără agenții de recrutare, fără anunțuri de tip job-board.",
      },
      {
        titlu: "Pentru candidați",
        text: "Îți creezi un profil, îți încarci CV-ul și devii vizibil pentru angajatori. Când cineva e interesat, te contactează direct și îți poate trimite o ofertă de angajare structurată, pe care o accepți, o refuzi sau o contraoferti.",
      },
      {
        titlu: "Pentru angajatori",
        text: "Cauți candidați după skill-uri, experiență, locație și buget și primești o listă sortată automat după scorul de potrivire. Contactezi direct oamenii potriviți și gestionezi tot — oferte, conversații, posturi — într-un singur loc.",
      },
      {
        titlu: "Încredere și transparență",
        text: "Doar găzduim profilurile și facilităm contactul; nu suntem agenție de recrutare sau de plasare. Datele tale sunt protejate conform GDPR, îți controlezi notificările și îți poți exporta sau șterge datele oricând.",
      },
    ],
  };
}

export function getFaq(locale: string): FaqPage {
  if (locale === "en") {
    return {
      title: "Frequently asked questions",
      subtitle: "Answers to the most common questions.",
      items: [
        { q: `What is ${C.numeSite}?`, a: "An online platform where employers search for candidates directly and contact them, and candidates publish their profile and CV to be found — without middlemen or job ads." },
        { q: "How does it work for candidates?", a: "Create your profile, upload your CV, and you become visible to employers. Interested employers contact you and can send you structured job offers." },
        { q: "How does it work for employers?", a: "Search candidates by criteria, get results sorted by match score, and contact the right ones directly. You can also add the positions you're recruiting for." },
        { q: "Is it free?", a: "Yes, there is a free plan. Paid plans (Avânt, Prestige, Nelimitat) add extra features like more CVs, higher visibility, and tools such as CV Pilot." },
        { q: "Who can see my CV?", a: "Only authenticated employers can view candidate profiles and CVs. Your CV is not public." },
        { q: "How is my data protected?", a: "We comply with GDPR. You control your notifications and can export or permanently delete your data anytime from Settings." },
        { q: "How do I delete my account?", a: "Go to Settings → Danger zone → Delete account. This permanently removes your data and files." },
        { q: "How can I contact you?", a: `Write to us at ${C.emailContact} or use the Contact page.` },
      ],
    };
  }
  return {
    title: "Întrebări frecvente",
    subtitle: "Răspunsuri la cele mai comune întrebări.",
    items: [
      { q: `Ce este ${C.numeSite}?`, a: "O platformă online unde angajatorii caută direct candidați și îi contactează, iar candidații își publică profilul și CV-ul ca să fie găsiți — fără intermediari și fără anunțuri." },
      { q: "Cum funcționează pentru candidați?", a: "Îți creezi profilul, îți încarci CV-ul și devii vizibil pentru angajatori. Cei interesați te contactează și îți pot trimite oferte de angajare structurate." },
      { q: "Cum funcționează pentru angajatori?", a: "Cauți candidați după criterii, primești rezultate ordonate după scorul de potrivire și îi contactezi direct pe cei potriviți. Poți adăuga și posturile pe care recrutezi." },
      { q: "Este gratuit?", a: "Da, există un plan gratuit. Abonamentele plătite (Avânt, Prestige, Nelimitat) adaugă funcții suplimentare: mai multe CV-uri, vizibilitate mai mare și unelte precum CV Pilot." },
      { q: "Cine îmi poate vedea CV-ul?", a: "Doar angajatorii autentificați pot vedea profilurile și CV-urile candidaților. CV-ul tău nu este public." },
      { q: "Cum îmi sunt protejate datele?", a: "Respectăm GDPR. Îți controlezi notificările și îți poți exporta sau șterge definitiv datele oricând, din Setări." },
      { q: "Cum îmi șterg contul?", a: "Din Setări → Zonă periculoasă → Șterge contul. Se șterg definitiv datele și fișierele tale." },
      { q: "Cum vă pot contacta?", a: `Scrie-ne la ${C.emailContact} sau folosește pagina de Contact.` },
    ],
  };
}
