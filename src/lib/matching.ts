// Algoritm de scor pentru potrivirea candidat <-> criterii de căutare angajator.
// Nu e un model AI/ML - e un scor pe reguli, transparent și ușor de ajustat.
//
// Principiu cheie: scorul se calculează DOAR pe criteriile pe care angajatorul le-a
// completat efectiv (ponderare dinamică, normalizată la 100%). Astfel, „% potrivire"
// reflectă exact cât de bine se potrivește candidatul cu ce s-a căutat — nu primește
// nimeni puncte „gratis" pentru criterii necompletate.

export type MatchCriteria = {
  skills: string[];
  locatie?: string;
  experientaMin?: number;
  experientaMax?: number;
  bugetMin?: number;
  bugetMax?: number;
};

export type CandidateForMatching = {
  locatie: string;
  remote: boolean;
  aniExperienta: number;
  salariuMinim: number | null;
  salariuMaxim: number | null;
  skills: string[];
};

export type MatchResult = {
  score: number;
  breakdown: {
    skills: number;
    locatie: number;
    experienta: number;
    salariu: number;
  };
};

// Ponderi relative (importanța fiecărui criteriu când e completat). Se normalizează
// dinamic peste criteriile prezente, deci contează doar raportul dintre ele.
const WEIGHTS = {
  skills: 55,
  experienta: 20,
  salariu: 20,
  locatie: 8,
};

// Normalizează text pentru comparații: fără diacritice, litere mici, fără spații la capete.
// Astfel „Timisoara" == „Timișoara" == „TIMIȘOARA".
export function normalizeazaText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .trim();
}

// Locația candidatului se potrivește cu cea căutată dacă e remote sau orașul coincide
// (insensibil la diacritice). Folosit atât la scor, cât și la filtrarea din căutare.
export function locatiePotriveste(candidatLocatie: string, remote: boolean, cautat?: string): boolean {
  if (!cautat || !cautat.trim()) return true;
  return remote || normalizeazaText(candidatLocatie).includes(normalizeazaText(cautat));
}

// Filtre „dure": candidatul e EXCLUS din rezultate dacă nu respectă criteriile explicite
// și precise — locație, interval de experiență, buget. Skill-urile NU exclud pe nimeni
// (numele sunt fuzzy), ele contează doar la scor. Folosit în căutarea angajatorului.
export function treceFiltrele(
  criterii: MatchCriteria,
  candidat: Pick<CandidateForMatching, "locatie" | "remote" | "aniExperienta" | "salariuMinim" | "salariuMaxim">
): boolean {
  // Locație: doar orașul căutat sau candidați remote.
  if (!locatiePotriveste(candidat.locatie, candidat.remote, criterii.locatie)) return false;
  // Experiență: strict în intervalul cerut (dacă e setat).
  if (criterii.experientaMin !== undefined && candidat.aniExperienta < criterii.experientaMin) return false;
  if (criterii.experientaMax !== undefined && candidat.aniExperienta > criterii.experientaMax) return false;
  // Buget: excludem doar candidații a căror pretenție MINIMĂ depășește bugetul maxim
  // (nu-i putem plăti). Cei fără salariu declarat sau cu pretenții mai mici rămân.
  if (
    criterii.bugetMax !== undefined &&
    candidat.salariuMinim != null &&
    candidat.salariuMinim > criterii.bugetMax
  ) {
    return false;
  }
  return true;
}

// Un skill căutat se potrivește dacă e identic (normalizat) sau unul e conținut în
// celălalt, pentru tokenuri suficient de lungi („react" ↔ „react.js", „sql" ↔ „mysql").
function skillSePotriveste(cautat: string, alCandidatului: string): boolean {
  if (cautat === alCandidatului) return true;
  if (cautat.length >= 3 && alCandidatului.length >= 3) {
    return alCandidatului.includes(cautat) || cautat.includes(alCandidatului);
  }
  return false;
}

// Fiecare fracțiune întoarce 0..1, sau null dacă criteriul NU a fost completat (nu se punctează).
function fractiuneSkills(ceruteRaw: string[], aleCandidatuluiRaw: string[]): number | null {
  const cerute = ceruteRaw.map(normalizeazaText).filter(Boolean);
  if (cerute.length === 0) return null;
  const aleCandidatului = aleCandidatuluiRaw.map(normalizeazaText).filter(Boolean);
  let potrivite = 0;
  for (const c of cerute) {
    if (aleCandidatului.some((cand) => skillSePotriveste(c, cand))) potrivite++;
  }
  return potrivite / cerute.length;
}

function fractiuneExperienta(criterii: MatchCriteria, candidat: CandidateForMatching): number | null {
  if (criterii.experientaMin === undefined && criterii.experientaMax === undefined) return null;
  const min = criterii.experientaMin ?? 0;
  const max = criterii.experientaMax ?? Infinity;
  if (candidat.aniExperienta >= min && candidat.aniExperienta <= max) return 1;
  const distanta =
    candidat.aniExperienta < min ? min - candidat.aniExperienta : candidat.aniExperienta - max;
  return Math.max(0, 1 - distanta * 0.2); // fiecare an în afara intervalului: -20%
}

function fractiuneSalariu(criterii: MatchCriteria, candidat: CandidateForMatching): number | null {
  if (criterii.bugetMin === undefined && criterii.bugetMax === undefined) return null;
  // candidat fără pretenție salarială declarată: necunoscut, penalizare ușoară
  if (candidat.salariuMinim == null && candidat.salariuMaxim == null) return 0.6;
  const bugetMin = criterii.bugetMin ?? 0;
  const bugetMax = criterii.bugetMax ?? Infinity;
  const candMin = candidat.salariuMinim ?? candidat.salariuMaxim ?? 0;
  const candMax = candidat.salariuMaxim ?? candidat.salariuMinim ?? 0;
  const suprapunere = Math.min(bugetMax, candMax) - Math.max(bugetMin, candMin);
  if (suprapunere >= 0) return 1;
  return Math.max(0, 1 - -suprapunere / 3000); // fiecare 3000 lei diferență: -100%
}

function fractiuneLocatie(criterii: MatchCriteria, candidat: CandidateForMatching): number | null {
  if (!criterii.locatie || !criterii.locatie.trim()) return null;
  const acelasiOras = normalizeazaText(candidat.locatie).includes(normalizeazaText(criterii.locatie));
  if (acelasiOras) return 1; // exact în orașul căutat
  if (candidat.remote) return 0.8; // remote (poate lucra de acolo), dar din alt oraș
  return 0;
}

export function calculeazaScorPotrivire(
  criterii: MatchCriteria,
  candidat: CandidateForMatching
): MatchResult {
  const componente: Array<{ cheie: keyof MatchResult["breakdown"]; pondere: number; fractiune: number }> = [];

  const push = (cheie: keyof MatchResult["breakdown"], pondere: number, fractiune: number | null) => {
    if (fractiune !== null) componente.push({ cheie, pondere, fractiune });
  };

  push("skills", WEIGHTS.skills, fractiuneSkills(criterii.skills, candidat.skills));
  push("experienta", WEIGHTS.experienta, fractiuneExperienta(criterii, candidat));
  push("salariu", WEIGHTS.salariu, fractiuneSalariu(criterii, candidat));
  push("locatie", WEIGHTS.locatie, fractiuneLocatie(criterii, candidat));

  const pondereTotala = componente.reduce((s, c) => s + c.pondere, 0);

  const breakdown = { skills: 0, locatie: 0, experienta: 0, salariu: 0 };
  let scor = 100; // fără niciun criteriu completat, toți se potrivesc la fel
  if (pondereTotala > 0) {
    let acumulat = 0;
    for (const c of componente) {
      const contributie = (c.pondere * c.fractiune) / pondereTotala; // 0..1 din scorul final
      breakdown[c.cheie] = Math.round(contributie * 100);
      acumulat += contributie;
    }
    scor = Math.round(acumulat * 100);
  }

  return {
    score: Math.max(0, Math.min(100, scor)),
    breakdown,
  };
}
