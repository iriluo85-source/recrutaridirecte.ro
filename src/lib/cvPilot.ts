// „CV Pilot" — asistentul de CV pentru candidații Unlimited.
// Nivelul 1 (acum): analiză pe reguli + sugestii concrete + generare PDF din profil.
// Nivelul 2 (la deploy): un „creier" AI (ex. Claude API) care rescrie textele.
// Punctul de conectare pentru Nivelul 2 este funcția `optimizeazaText` de mai jos.

export const CV_PILOT_NUME = "CV Pilot";

export type SugestieCv = {
  cheie: string;
  text: string;
  important: boolean; // sugestiile importante apar primele / evidențiate
};

export type AnalizaCv = {
  scor: number; // 0–100, cât de bine e completat profilul pentru a fi găsit
  sugestii: SugestieCv[];
};

export type ProfilPentruAnaliza = {
  bio: string | null;
  aniExperienta: number;
  salariuMinim: number | null;
  salariuMaxim: number | null;
  telefon: string | null;
  nrSkills: number;
  nrCvFiles: number;
};

const MIN_SKILLS = 5;
const MIN_BIO_LEN = 150;

export function analizeazaProfil(p: ProfilPentruAnaliza): AnalizaCv {
  const areBio = Boolean(p.bio && p.bio.trim().length > 0);
  const bioLunga = Boolean(p.bio && p.bio.trim().length >= MIN_BIO_LEN);
  const bioCuCifre = Boolean(p.bio && /\d/.test(p.bio));
  const areSalariu = p.salariuMinim != null || p.salariuMaxim != null;
  const areTelefon = Boolean(p.telefon && p.telefon.trim().length > 0);

  let scor = 10; // titlul și locația sunt obligatorii la profil → punctaj de bază
  if (areBio) scor += 15;
  if (bioLunga) scor += 10;
  if (bioCuCifre) scor += 10;
  scor += Math.round(Math.min(p.nrSkills, MIN_SKILLS) / MIN_SKILLS * 20);
  if (areSalariu) scor += 10;
  if (areTelefon) scor += 10;
  if (p.aniExperienta >= 1) scor += 5;
  if (p.nrCvFiles >= 1) scor += 10;
  scor = Math.min(100, Math.round(scor));

  const sugestii: SugestieCv[] = [];
  if (!areBio) {
    sugestii.push({
      cheie: "bio",
      text: "Adaugă un rezumat profesional (2–3 fraze). E prima impresie pe care o vede angajatorul.",
      important: true,
    });
  } else if (!bioLunga) {
    sugestii.push({
      cheie: "bioLen",
      text: "Extinde-ți rezumatul — ideal 2–3 fraze cu realizări concrete.",
      important: false,
    });
  }
  if (areBio && !bioCuCifre) {
    sugestii.push({
      cheie: "bioCifre",
      text: "Adaugă cifre în rezumat (ex. „am crescut vânzările cu 30%”). Rezultatele măsurabile ies în evidență.",
      important: false,
    });
  }
  if (p.nrSkills < MIN_SKILLS) {
    sugestii.push({
      cheie: "skills",
      text: `Adaugă mai multe skill-uri (ai ${p.nrSkills}, recomandat minim ${MIN_SKILLS}) — apari în mai multe căutări.`,
      important: p.nrSkills === 0,
    });
  }
  if (!areSalariu) {
    sugestii.push({
      cheie: "salariu",
      text: "Specifică-ți așteptările salariale — profilurile cu salariu primesc mai multe oferte.",
      important: false,
    });
  }
  if (!areTelefon) {
    sugestii.push({
      cheie: "telefon",
      text: "Adaugă un număr de telefon ca angajatorii să te contacteze rapid.",
      important: false,
    });
  }
  if (p.aniExperienta === 0) {
    sugestii.push({
      cheie: "experienta",
      text: "Completează anii de experiență în profil.",
      important: false,
    });
  }
  if (p.nrCvFiles === 0) {
    sugestii.push({
      cheie: "cv",
      text: "Încarcă cel puțin un CV — profilurile cu CV sunt găsite mult mai des.",
      important: true,
    });
  }

  // sugestiile importante primele
  sugestii.sort((a, b) => Number(b.important) - Number(a.important));
  return { scor, sugestii };
}

// Punct de conectare pentru creierul AI (Nivelul 2, la deploy).
// Acum returnează textul curățat (rule-based). La deploy, aici se apelează
// modelul de limbaj (ex. Claude API) pentru rescriere profesională.
export function optimizeazaText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}
