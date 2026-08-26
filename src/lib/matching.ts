// Algoritm de scor pentru potrivirea candidat <-> criterii de căutare angajator.
// Nu e un model AI/ML - e un scor pe reguli, transparent și ușor de ajustat.

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

const WEIGHTS = {
  skills: 50,
  locatie: 15,
  experienta: 15,
  salariu: 20,
};

function scorSkilluri(criterii: MatchCriteria, candidat: CandidateForMatching): number {
  if (criterii.skills.length === 0) return WEIGHTS.skills;
  const candidateSkillsLower = new Set(candidat.skills.map((s) => s.toLowerCase()));
  const potrivite = criterii.skills.filter((s) => candidateSkillsLower.has(s.toLowerCase())).length;
  return (potrivite / criterii.skills.length) * WEIGHTS.skills;
}

function scorLocatie(criterii: MatchCriteria, candidat: CandidateForMatching): number {
  if (!criterii.locatie) return WEIGHTS.locatie;
  const potriveste =
    candidat.remote || candidat.locatie.toLowerCase().includes(criterii.locatie.toLowerCase());
  return potriveste ? WEIGHTS.locatie : 0;
}

function scorExperienta(criterii: MatchCriteria, candidat: CandidateForMatching): number {
  if (criterii.experientaMin === undefined && criterii.experientaMax === undefined) {
    return WEIGHTS.experienta;
  }
  const min = criterii.experientaMin ?? 0;
  const max = criterii.experientaMax ?? Infinity;
  if (candidat.aniExperienta >= min && candidat.aniExperienta <= max) {
    return WEIGHTS.experienta;
  }
  const distanta = candidat.aniExperienta < min ? min - candidat.aniExperienta : candidat.aniExperienta - max;
  return Math.max(0, WEIGHTS.experienta - distanta * 3);
}

function scorSalariu(criterii: MatchCriteria, candidat: CandidateForMatching): number {
  if (criterii.bugetMin === undefined && criterii.bugetMax === undefined) {
    return WEIGHTS.salariu;
  }
  if (candidat.salariuMinim == null && candidat.salariuMaxim == null) {
    return WEIGHTS.salariu * 0.5;
  }
  const bugetMin = criterii.bugetMin ?? 0;
  const bugetMax = criterii.bugetMax ?? Infinity;
  const candMin = candidat.salariuMinim ?? candidat.salariuMaxim ?? 0;
  const candMax = candidat.salariuMaxim ?? candidat.salariuMinim ?? 0;

  const suprapunere = Math.min(bugetMax, candMax) - Math.max(bugetMin, candMin);
  if (suprapunere >= 0) return WEIGHTS.salariu;

  const distantaLeiPerPunct = 500;
  return Math.max(0, WEIGHTS.salariu + suprapunere / distantaLeiPerPunct);
}

export function calculeazaScorPotrivire(
  criterii: MatchCriteria,
  candidat: CandidateForMatching
): MatchResult {
  const skills = scorSkilluri(criterii, candidat);
  const locatie = scorLocatie(criterii, candidat);
  const experienta = scorExperienta(criterii, candidat);
  const salariu = scorSalariu(criterii, candidat);

  const total = skills + locatie + experienta + salariu;

  return {
    score: Math.round(Math.max(0, Math.min(100, total))),
    breakdown: {
      skills: Math.round(skills),
      locatie: Math.round(locatie),
      experienta: Math.round(experienta),
      salariu: Math.round(salariu),
    },
  };
}
