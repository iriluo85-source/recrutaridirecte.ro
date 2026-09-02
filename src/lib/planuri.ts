// Tipuri de abonament pentru candidați și angajatori.
// Prețurile se ajustează din acest fișier.
// Regulile FUNCȚIONALE (limită CV, prioritate în căutare) sunt în helperii de jos
// și sunt aplicate efectiv în cod, nu doar afișate.
//
// NOTĂ: cheile `tip` (FREE/GOLD/PLATINUM/UNLIMITED) rămân fixe — sunt folosite în DB
// și în logică. Numele afișate sunt de brand: RO = Start / Avânt / Prestige / Nelimitat,
// EN = Start / Boost / Prestige / Unlimited (vezi `numePlan`).

import { esteAdminEmail } from "@/lib/admin";

export type PlanTip = "FREE" | "GOLD" | "PLATINUM" | "UNLIMITED";

export type Plan = {
  tip: PlanTip;
  nume: string; // nume afișat în RO (folosit și pe facturi)
  numeEn: string; // nume afișat în EN
  pretLunar: number; // lei / lună (0 = gratuit)
  evidentiat?: boolean; // „cel mai popular”
  clasaAccent: string;
  beneficii: string[];
};

const ACCENT: Record<PlanTip, string> = {
  FREE: "bg-muted/15 text-muted",
  GOLD: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  PLATINUM: "bg-accent-secondary text-accent-secondary-foreground",
  UNLIMITED: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

export const PLANURI_CANDIDAT: Plan[] = [
  {
    tip: "FREE",
    nume: "Start",
    numeEn: "Start",
    pretLunar: 0,
    clasaAccent: ACCENT.FREE,
    beneficii: ["Profil vizibil angajatorilor", "1 CV încărcat", "Primești oferte de la companii"],
  },
  {
    tip: "GOLD",
    nume: "Avânt",
    numeEn: "Boost",
    pretLunar: 29.99,
    clasaAccent: ACCENT.GOLD,
    beneficii: [
      "Tot din Start",
      "Până la 5 CV-uri încărcate",
      "Vezi cine ți-a văzut CV-ul",
      "Suport pe email",
    ],
  },
  {
    tip: "PLATINUM",
    nume: "Prestige",
    numeEn: "Prestige",
    pretLunar: 39.99,
    evidentiat: true,
    clasaAccent: ACCENT.PLATINUM,
    beneficii: [
      "Tot din Avânt",
      "Radar de joburi: afli când o companie caută profilul tău",
      "Apari printre primele CV-uri când te caută un angajator",
      "Profil evidențiat",
      "Statistici detaliate",
    ],
  },
  {
    tip: "UNLIMITED",
    nume: "Nelimitat",
    numeEn: "Unlimited",
    pretLunar: 59.99,
    clasaAccent: ACCENT.UNLIMITED,
    beneficii: [
      "Tot din Prestige",
      "CV-uri nelimitate",
      "Prioritate maximă în căutări",
      "Badge „Verificat”",
    ],
  },
];

export const PLANURI_ANGAJATOR: Plan[] = [
  {
    tip: "FREE",
    nume: "Start",
    numeEn: "Start",
    pretLunar: 0,
    clasaAccent: ACCENT.FREE,
    beneficii: ["Profil de companie", "Căutări limitate", "Câteva oferte pe lună"],
  },
  {
    tip: "GOLD",
    nume: "Avânt",
    numeEn: "Boost",
    pretLunar: 99.99,
    clasaAccent: ACCENT.GOLD,
    beneficii: [
      "Tot din Start",
      "Până la 10 căutări pe zi",
      "Contactezi 20 de candidați / lună",
      "Suport pe email",
    ],
  },
  {
    tip: "PLATINUM",
    nume: "Prestige",
    numeEn: "Prestige",
    pretLunar: 169.99,
    evidentiat: true,
    clasaAccent: ACCENT.PLATINUM,
    beneficii: [
      "Tot din Avânt",
      "Radar de candidați: profiluri potrivite cu posturile tale",
      "Căutări nelimitate",
      "Contacte nelimitate",
      "Companie evidențiată în listă",
    ],
  },
  {
    tip: "UNLIMITED",
    nume: "Nelimitat",
    numeEn: "Unlimited",
    pretLunar: 199.99,
    clasaAccent: ACCENT.UNLIMITED,
    beneficii: [
      "Tot din Prestige",
      "Badge „Verificat”",
      "Suport prioritar dedicat",
      "Acces anticipat la funcții noi",
    ],
  },
];

export function planuriPentruRol(role: string | null | undefined): Plan[] {
  return role === "EMPLOYER" ? PLANURI_ANGAJATOR : PLANURI_CANDIDAT;
}

export function gasestePlan(role: string | null | undefined, tip: string): Plan | undefined {
  return planuriPentruRol(role).find((p) => p.tip === tip);
}

// Numele afișat al unui plan, în funcție de limbă (RO implicit; EN pentru locale "en").
export function numePlan(plan: Plan, locale: string): string {
  return locale === "en" ? plan.numeEn : plan.nume;
}

// ── Reguli funcționale (aplicate în cod) ──────────────────────────────────

// Planul EFECTIV al unui utilizator. Adminii au „Nelimitat" din oficiu, permanent,
// fără plată — indiferent de `abonamentTip` din baza de date. Adminul e recunoscut
// după flagul `isAdmin` sau după email (ADMIN_EMAILS). Folosește acest helper peste tot
// unde contează planul (limite, funcții blocate, badge), NU `abonamentTip` direct.
export function abonamentEfectiv(
  user: { isAdmin?: boolean | null; email?: string | null; abonamentTip?: string | null } | null | undefined
): PlanTip | null {
  if (!user) return null;
  if (user.isAdmin || esteAdminEmail(user.email)) return "UNLIMITED";
  return (user.abonamentTip as PlanTip | null) ?? null;
}

// Câte CV-uri poate încărca un candidat, în funcție de abonament.
export function limitaCv(tip: string | null | undefined): number {
  if (tip === "UNLIMITED") return Infinity;
  if (tip === "GOLD" || tip === "PLATINUM") return 5;
  return 1; // FREE sau fără abonament
}

// Bonus la scorul de căutare pentru vizibilitate (candidatul apare mai sus).
export function boostCautare(tip: string | null | undefined): number {
  if (tip === "UNLIMITED") return 40;
  if (tip === "PLATINUM") return 20;
  return 0;
}

export function esteCautarePrioritara(tip: string | null | undefined): boolean {
  return boostCautare(tip) > 0;
}

// Radarul (candidați potriviți / companii care te caută) e disponibil de la Platinum în sus.
export function areRadar(tip: string | null | undefined): boolean {
  return tip === "PLATINUM" || tip === "UNLIMITED";
}

// ── Perioade de abonament (lunar / trimestrial / anual) cu reduceri ──────────
export type PerioadaAbonament = "lunar" | "trimestrial" | "anual";

export const PERIOADE_ABONAMENT: {
  id: PerioadaAbonament;
  luni: number;
  reducere: number; // 0..1
}[] = [
  { id: "lunar", luni: 1, reducere: 0 },
  { id: "trimestrial", luni: 3, reducere: 0.1 },
  { id: "anual", luni: 12, reducere: 0.25 },
];

export function perioadaValida(v: string | null | undefined): PerioadaAbonament {
  return v === "trimestrial" || v === "anual" ? v : "lunar";
}

// Rotunjire la 2 zecimale (bani) — evită erorile de virgulă mobilă.
function rotunjesteBani(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Prețul total pentru o perioadă + echivalentul pe lună + procentul de reducere.
// Totalul e suma EXACTĂ care se încasează (2 zecimale). `perLuna` e echivalentul
// informativ pe lună (marcat cu „≈” în interfață).
export function pretPerioada(pretLunar: number, perioada: PerioadaAbonament) {
  const p =
    PERIOADE_ABONAMENT.find((x) => x.id === perioada) ?? PERIOADE_ABONAMENT[0];
  const total = rotunjesteBani(pretLunar * p.luni * (1 - p.reducere));
  const perLuna = p.luni > 0 ? rotunjesteBani(total / p.luni) : total;
  return { total, perLuna, luni: p.luni, reducere: Math.round(p.reducere * 100) };
}
