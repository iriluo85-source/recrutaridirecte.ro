// Sursă unică de adevăr pentru directorul public de companii.
// Pagina /companii, profilul public /companii/[id], API-ul mobil și sitemap-ul
// folosesc toate regulile de aici — altfel se rupe exact ce s-a rupt înainte:
// pagina spunea „companii active" și lista tot, inclusiv conturi goale.

import { normalizeazaText } from "@/lib/matching";
import { abonamentEfectiv, boostCautare, firmaVerificata } from "@/lib/planuri";

export const SORTARI = ["recent", "nume", "posturi"] as const;
export type Sortare = (typeof SORTARI)[number];

export function esteSortareValida(v: string): v is Sortare {
  return (SORTARI as readonly string[]).includes(v);
}

/** Câmpurile de citit din DB pentru un card de director. */
export const SELECT_DIRECTOR = {
  id: true,
  numeCompanie: true,
  industrie: true,
  locatie: true,
  marimeCompanie: true,
  descriere: true,
  updatedAt: true,
  posturi: { where: { activ: true }, select: { id: true } },
  user: { select: { abonamentTip: true, isAdmin: true, email: true } },
} as const;

function completat(v: string | null | undefined): boolean {
  return typeof v === "string" && v.trim() !== "";
}

type FirmaBruta = {
  id: string;
  numeCompanie: string;
  industrie: string | null;
  locatie: string | null;
  marimeCompanie?: string | null;
  descriere: string | null;
  updatedAt: Date;
  posturi: { id: string }[];
  user: { abonamentTip: string | null; isAdmin: boolean | null; email: string | null } | null;
};

export type FirmaDirector = {
  id: string;
  numeCompanie: string;
  industrie: string | null;
  locatie: string | null;
  marimeCompanie: string | null;
  descriere: string | null;
  updatedAt: Date;
  nrPosturi: number;
  verificat: boolean;
  promovat: boolean;
};

/**
 * O firmă apare în director dacă are un semn de viață: fie un post deschis,
 * fie un profil completat de un om. Un cont creat și abandonat nu apare.
 */
export function esteFirmaActiva(c: FirmaBruta): boolean {
  if (!completat(c.numeCompanie)) return false;
  return (
    c.posturi.length > 0 ||
    completat(c.descriere) ||
    completat(c.industrie) ||
    completat(c.locatie)
  );
}

/** Transformă înregistrarea din DB în forma expusă public — fără email, plan sau CUI. */
export function pentruDirector(c: FirmaBruta): FirmaDirector {
  return {
    id: c.id,
    numeCompanie: c.numeCompanie,
    industrie: c.industrie,
    locatie: c.locatie,
    marimeCompanie: c.marimeCompanie ?? null,
    descriere: c.descriere,
    updatedAt: c.updatedAt,
    nrPosturi: c.posturi.length,
    verificat: firmaVerificata(c.user),
    promovat: boostCautare(abonamentEfectiv(c.user)) > 0,
  };
}

export function companiiActive(brute: FirmaBruta[]): FirmaDirector[] {
  return brute.filter(esteFirmaActiva).map(pentruDirector);
}

export type FiltreDirector = {
  q?: string;
  industrie?: string;
  locatie?: string;
  doarAngajeaza?: boolean;
  sort?: Sortare;
  locale?: string;
};

/**
 * Ordinea: întâi cine chiar angajează — asta a venit candidatul să vadă — iar
 * în interiorul aceleiași grupe firmele cu abonament trec în față. Firmele
 * promovate primesc și un marcaj vizibil, ca rezultatele să rămână oneste.
 */
export function filtreazaCompanii(
  companii: FirmaDirector[],
  f: FiltreDirector
): FirmaDirector[] {
  const qn = normalizeazaText(f.q ?? "");
  const industrien = normalizeazaText(f.industrie ?? "");
  const locatien = normalizeazaText(f.locatie ?? "");
  const sort: Sortare = f.sort ?? "recent";

  return companii
    .filter((c) => !qn || normalizeazaText(c.numeCompanie).includes(qn))
    .filter((c) => !industrien || normalizeazaText(c.industrie ?? "").includes(industrien))
    .filter((c) => !locatien || normalizeazaText(c.locatie ?? "").includes(locatien))
    .filter((c) => !f.doarAngajeaza || c.nrPosturi > 0)
    .sort((a, b) => {
      const aAngajeaza = a.nrPosturi > 0 ? 1 : 0;
      const bAngajeaza = b.nrPosturi > 0 ? 1 : 0;
      if (aAngajeaza !== bAngajeaza) return bAngajeaza - aAngajeaza;
      if (a.promovat !== b.promovat) return a.promovat ? -1 : 1;
      if (sort === "nume") return a.numeCompanie.localeCompare(b.numeCompanie, f.locale ?? "ro");
      if (sort === "posturi") return b.nrPosturi - a.nrPosturi;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
}
