// Pagini publice de disponibilitate: câți candidați sunt disponibili pe un domeniu
// și într-un oraș, în cifre agregate.
//
// Sunt trei lucruri deodată: un link pe care proprietarul îl trimite direct unei
// firme, o pagină pe care Google o indexează („șoferi disponibili Timișoara"), și
// dovada că platforma e vie — vizibilă ÎNAINTE ca firma să-și facă cont.
//
// REGULA DE CONFIDENȚIALITATE: aici nu iese niciodată un candidat identificabil.
// Doar numere, intervale de salariu și procente. Numele, CV-ul și contactul rămân
// în spatele contului de angajator, ca până acum.

import { normalizeazaText } from "@/lib/matching";
import { DOMENII, type Domeniu } from "@/lib/domenii";

/** Sub pragul ăsta nu publicăm o defalcare pe oraș: cifrele mici identifică oameni. */
export const PRAG_MINIM_ORAS = 3;

export type CandidatAgregat = {
  locatie: string;
  remote: boolean;
  aniExperienta: number;
  salariuMinim: number | null;
  permisConducere: boolean;
  dispusDeplasari: boolean;
  skills: string[];
};

export type OrasDisponibil = {
  oras: string;
  candidati: number;
};

export type Disponibilitate = {
  total: number;
  orase: OrasDisponibil[];
  remote: number;
  cuPermis: number;
  dispusiDeplasari: number;
  /** Intervalul de salariu cerut, ca [minim, maxim]. null dacă nimeni nu l-a declarat. */
  intervalSalariu: [number, number] | null;
  medianaSalariu: number | null;
  experientaMedie: number | null;
};

function potrivesteDomeniu(skillsCandidat: string[], domeniu: Domeniu): boolean {
  const ale = skillsCandidat.map(normalizeazaText).filter(Boolean);
  if (ale.length === 0) return false;
  return domeniu.skills
    .map(normalizeazaText)
    .some((cerut) => ale.some((a) => a.includes(cerut) || cerut.includes(a)));
}

export function candidatiInDomeniu(
  candidati: CandidatAgregat[],
  domeniu: Domeniu
): CandidatAgregat[] {
  return candidati.filter((c) => potrivesteDomeniu(c.skills, domeniu));
}

/** Numele orașului, normalizat pentru grupare (Timisoara și Timișoara sunt același oraș). */
function cheieOras(loc: string): string {
  return normalizeazaText(loc).trim();
}

export function agregheaza(candidati: CandidatAgregat[]): Disponibilitate {
  const total = candidati.length;

  // Grupăm insensibil la diacritice, dar afișăm forma cea mai frecventă scrisă de oameni.
  const grupe = new Map<string, { eticheta: string; n: number; scrieri: Map<string, number> }>();
  for (const c of candidati) {
    const loc = c.locatie?.trim();
    if (!loc) continue;
    const k = cheieOras(loc);
    if (!k) continue;
    const g = grupe.get(k) ?? { eticheta: loc, n: 0, scrieri: new Map() };
    g.n++;
    g.scrieri.set(loc, (g.scrieri.get(loc) ?? 0) + 1);
    grupe.set(k, g);
  }

  const orase: OrasDisponibil[] = Array.from(grupe.values())
    .map((g) => {
      let eticheta = g.eticheta;
      let max = 0;
      g.scrieri.forEach((n, scriere) => {
        if (n > max) {
          max = n;
          eticheta = scriere;
        }
      });
      return { oras: eticheta, candidati: g.n };
    })
    .filter((o) => o.candidati >= PRAG_MINIM_ORAS)
    .sort((a, b) => b.candidati - a.candidati);

  const salarii = candidati
    .map((c) => c.salariuMinim)
    .filter((s): s is number => s != null && s > 0)
    .sort((a, b) => a - b);

  const intervalSalariu: [number, number] | null =
    salarii.length > 0 ? [salarii[0], salarii[salarii.length - 1]] : null;

  const medianaSalariu =
    salarii.length > 0
      ? salarii.length % 2 === 1
        ? salarii[(salarii.length - 1) / 2]
        : Math.round((salarii[salarii.length / 2 - 1] + salarii[salarii.length / 2]) / 2)
      : null;

  const experientaMedie =
    total > 0
      ? Math.round((candidati.reduce((s, c) => s + (c.aniExperienta ?? 0), 0) / total) * 10) / 10
      : null;

  return {
    total,
    orase,
    remote: candidati.filter((c) => c.remote).length,
    cuPermis: candidati.filter((c) => c.permisConducere).length,
    dispusiDeplasari: candidati.filter((c) => c.dispusDeplasari).length,
    intervalSalariu,
    medianaSalariu,
    experientaMedie,
  };
}

/** Domeniile care au destui oameni ca să merite o pagină publică. */
export function domeniiCuCandidati(
  candidati: CandidatAgregat[],
  pragMinim = PRAG_MINIM_ORAS
): { domeniu: Domeniu; total: number }[] {
  return DOMENII.map((d) => ({ domeniu: d, total: candidatiInDomeniu(candidati, d).length }))
    .filter((x) => x.total >= pragMinim)
    .sort((a, b) => b.total - a.total);
}

/** Slug de oraș pentru URL: „Timișoara” -> „timisoara”. */
export function slugOras(oras: string): string {
  return normalizeazaText(oras).trim().replace(/\s+/g, "-");
}

/** Toate orașele cu destui candidați ca să merite o pagină publică. */
export function oraseCuCandidati(
  candidati: CandidatAgregat[],
  pragMinim = PRAG_MINIM_ORAS
): OrasDisponibil[] {
  return agregheaza(candidati).orase.filter((o) => o.candidati >= pragMinim);
}

export function candidatiDinOras(
  candidati: CandidatAgregat[],
  slug: string
): CandidatAgregat[] {
  const tinta = slug.toLowerCase();
  return candidati.filter((c) => c.locatie && slugOras(c.locatie) === tinta);
}

/** Defalcarea pe domenii a unui set de candidați (pentru pagina unui oraș). */
export function domeniiDinSet(
  candidati: CandidatAgregat[],
  pragMinim = 1
): { domeniu: Domeniu; total: number }[] {
  return DOMENII.map((d) => ({ domeniu: d, total: candidatiInDomeniu(candidati, d).length }))
    .filter((x) => x.total >= pragMinim)
    .sort((a, b) => b.total - a.total);
}
