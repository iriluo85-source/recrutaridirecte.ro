// Estimatorul de audiență: câți candidați poate atinge o firmă, în funcție de
// salariul pe care e dispusă să-l ofere.
//
// Nu e o statistică de piață — e o numărătoare a oamenilor pe care firma îi poate
// contacta efectiv, azi, cu filtrele ei. Rămâne adevărat la orice dimensiune a
// bazei: „la 4.000 de lei ajungi la 2 candidați" e corect și util și cu 7 oameni
// în bază, spre deosebire de o „mediană a pieței" calculată din trei salarii.
//
// Pragurile NU sunt cifre rotunde inventate: sunt exact salariile cerute de
// candidații care trec filtrele, adică punctele în care numărul chiar se schimbă.

export type PragAudienta = {
  salariu: number;
  candidati: number;
};

export type Audienta = {
  praguri: PragAudienta[];
  /** Câți candidați trec filtrele indiferent de buget. */
  total: number;
  /** Câți dintre ei nu și-au declarat salariul — intră la orice prag. */
  faraSalariu: number;
};

const MAX_PRAGURI = 6;

type CuSalariu = { salariuMinim: number | null };

/**
 * `eligibili` = candidații care trec deja TOATE filtrele în afară de buget.
 * Filtrarea rămâne la apelant, ca estimarea să reflecte exact căutarea făcută.
 */
export function estimeazaAudienta(eligibili: CuSalariu[]): Audienta {
  const total = eligibili.length;
  const faraSalariu = eligibili.filter((c) => c.salariuMinim == null).length;

  const cerute = eligibili
    .map((c) => c.salariuMinim)
    .filter((s): s is number => s != null && Number.isFinite(s) && s > 0);

  if (cerute.length === 0) {
    return { praguri: [], total, faraSalariu };
  }

  const distincte = Array.from(new Set(cerute)).sort((a, b) => a - b);
  const alese = alegePraguri(distincte, MAX_PRAGURI);

  const praguri = alese.map((salariu) => ({
    salariu,
    // Un candidat e accesibil la un buget dacă pretenția lui minimă încape în el.
    // Cei fără salariu declarat intră peste tot — aceeași regulă ca în treceFiltrele.
    candidati: eligibili.filter((c) => c.salariuMinim == null || c.salariuMinim <= salariu).length,
  }));

  return { praguri, total, faraSalariu };
}

/** Păstrează primul și ultimul prag, iar restul le distribuie uniform între ele. */
function alegePraguri(distincte: number[], maxim: number): number[] {
  if (distincte.length <= maxim) return distincte;
  const alese: number[] = [];
  for (let i = 0; i < maxim; i++) {
    const idx = Math.round((i * (distincte.length - 1)) / (maxim - 1));
    const v = distincte[idx];
    if (!alese.includes(v)) alese.push(v);
  }
  return alese;
}

/**
 * Saltul cel mai util de comunicat: pragul care aduce cei mai mulți candidați noi
 * față de cel dinaintea lui. Ăsta e argumentul cu care un manager merge la patron.
 */
export function celMaiBunSalt(a: Audienta): { de: PragAudienta; la: PragAudienta } | null {
  if (a.praguri.length < 2) return null;
  let cel: { de: PragAudienta; la: PragAudienta } | null = null;
  let maxim = 0;
  for (let i = 1; i < a.praguri.length; i++) {
    const castig = a.praguri[i].candidati - a.praguri[i - 1].candidati;
    if (castig > maxim) {
      maxim = castig;
      cel = { de: a.praguri[i - 1], la: a.praguri[i] };
    }
  }
  return cel;
}
