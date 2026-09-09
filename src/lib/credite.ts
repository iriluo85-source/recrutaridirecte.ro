// Modelul de plată pentru angajatori: nu plătești pentru tăcere.
//
// Firma caută gratis și trimite câte mesaje vrea, gratis. Un credit se consumă
// abia când un candidat i-a răspuns ȘI firma alege să deblocheze răspunsul.
// Deblocarea e explicită (un click), ca să nu existe taxare accidentală, și e
// definitivă: odată deblocată o conversație, tot ce urmează în ea e gratuit.
//
// Soldul e suma tranzacțiilor din registru, nu un contor mutabil — așa nu poate
// ieși din sincron și orice consum se poate justifica în fața firmei.

import { prisma } from "@/lib/prisma";
import { abonamentEfectiv } from "@/lib/planuri";

/** Răspunsuri deblocate gratuit în fiecare lună calendaristică, pentru orice firmă. */
export const RASPUNSURI_GRATUITE_LUNAR = 2;

export type PachetCredite = {
  id: string;
  credite: number;
  pret: number; // lei, preț final (firmă neplătitoare de TVA)
  evidentiat?: boolean;
};

export const PACHETE_CREDITE: PachetCredite[] = [
  { id: "CREDITE_5", credite: 5, pret: 149 },
  { id: "CREDITE_15", credite: 15, pret: 349, evidentiat: true },
  { id: "CREDITE_40", credite: 40, pret: 796 },
];

export function gasestePachet(id: string): PachetCredite | undefined {
  return PACHETE_CREDITE.find((p) => p.id === id);
}

export function estePachetCredite(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith("CREDITE_");
}

/** Preț per răspuns, pentru afișare. */
export function pretPerRaspuns(p: PachetCredite): number {
  return Math.round((p.pret / p.credite) * 100) / 100;
}

// ---------------------------------------------------------------------------

/** Soldul de credite al unei firme. Poate fi 0, niciodată negativ în practică. */
export async function soldCredite(employerId: string): Promise<number> {
  const r = await prisma.creditTranzactie.aggregate({
    where: { employerId },
    _sum: { cantitate: true },
  });
  return r._sum.cantitate ?? 0;
}

function inceputulLunii(acum: Date): Date {
  return new Date(acum.getFullYear(), acum.getMonth(), 1);
}

/** Câte răspunsuri gratuite a folosit firma în luna curentă. */
export async function raspunsuriGratuiteFolosite(employerId: string): Promise<number> {
  return prisma.creditTranzactie.count({
    where: { employerId, tip: "GRATUIT", createdAt: { gte: inceputulLunii(new Date()) } },
  });
}

export async function raspunsuriGratuiteRamase(employerId: string): Promise<number> {
  const folosite = await raspunsuriGratuiteFolosite(employerId);
  return Math.max(0, RASPUNSURI_GRATUITE_LUNAR - folosite);
}

/**
 * Firma are răspunsuri nelimitate fără să consume credite: abonament Nelimitat
 * activ, sau cont de admin. Verificat într-un singur loc, ca gating-ul din API
 * și deblocarea propriu-zisă să nu poată ajunge la concluzii diferite.
 */
export async function esteScutitDeCredite(employerId: string): Promise<boolean> {
  const firma = await prisma.employerProfile.findUnique({
    where: { id: employerId },
    select: { user: { select: { abonamentTip: true, isAdmin: true, email: true } } },
  });
  return abonamentEfectiv(firma?.user) === "UNLIMITED";
}

/** O conversație e deblocată dacă există deja o tranzacție legată de ea. */
export async function esteDeblocata(conversationId: string): Promise<boolean> {
  const t = await prisma.creditTranzactie.findUnique({
    where: { conversationId },
    select: { id: true },
  });
  return t !== null;
}

/** Deblocările existente dintr-un set de conversații — o singură interogare pentru liste. */
export async function conversatiiDeblocate(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const r = await prisma.creditTranzactie.findMany({
    where: { conversationId: { in: ids } },
    select: { conversationId: true },
  });
  return new Set(r.map((t) => t.conversationId!).filter(Boolean));
}

export async function adaugaCredite(
  employerId: string,
  cantitate: number,
  descriere: string
): Promise<void> {
  if (cantitate <= 0) return;
  await prisma.creditTranzactie.create({
    data: { employerId, tip: "CUMPARARE", cantitate, descriere },
  });
}

export type RezultatDeblocare =
  | { ok: true; cost: "GRATUIT" | "CREDIT"; soldRamas: number }
  | { ok: false; motiv: "FARA_CREDITE" };

/**
 * Deblochează răspunsurile dintr-o conversație. Idempotentă: dacă e deja
 * deblocată, nu mai consumă nimic. Întâi se consumă cota gratuită lunară,
 * abia apoi creditele cumpărate.
 */
export async function deblocheazaConversatie(
  employerId: string,
  conversationId: string
): Promise<RezultatDeblocare> {
  if (await esteDeblocata(conversationId)) {
    return { ok: true, cost: "GRATUIT", soldRamas: await soldCredite(employerId) };
  }

  // Firmele cu abonament Nelimitat (și adminii) nu consumă credite: au plătit deja
  // pentru răspunsuri nelimitate. Înregistrăm oricum deblocarea, ca istoricul să fie
  // complet și ca gating-ul să știe că e deschisă.
  if (await esteScutitDeCredite(employerId)) {
    try {
      await prisma.creditTranzactie.create({
        data: {
          employerId,
          conversationId,
          tip: "GRATUIT",
          cantitate: 0,
          descriere: "Răspuns deblocat prin abonamentul Nelimitat",
        },
      });
    } catch {
      // deblocată deja de o cerere paralelă
    }
    return { ok: true, cost: "GRATUIT", soldRamas: await soldCredite(employerId) };
  }

  const gratuiteRamase = await raspunsuriGratuiteRamase(employerId);

  if (gratuiteRamase > 0) {
    try {
      await prisma.creditTranzactie.create({
        data: {
          employerId,
          conversationId,
          tip: "GRATUIT",
          cantitate: 0,
          descriere: "Răspuns deblocat din cota gratuită lunară",
        },
      });
    } catch {
      // Cursă între două cereri simultane pe aceeași conversație: unicitatea pe
      // conversationId a câștigat deja, deci e deblocată. Nu e o eroare.
    }
    return { ok: true, cost: "GRATUIT", soldRamas: await soldCredite(employerId) };
  }

  const sold = await soldCredite(employerId);
  if (sold <= 0) return { ok: false, motiv: "FARA_CREDITE" };

  try {
    await prisma.creditTranzactie.create({
      data: {
        employerId,
        conversationId,
        tip: "CONSUM",
        cantitate: -1,
        descriere: "Răspuns deblocat",
      },
    });
  } catch {
    // Vezi mai sus: deblocată deja de o cerere paralelă.
    return { ok: true, cost: "CREDIT", soldRamas: await soldCredite(employerId) };
  }

  return { ok: true, cost: "CREDIT", soldRamas: sold - 1 };
}

/** Conversația are un răspuns de la candidat (deci ceva de deblocat)? */
export async function areRaspunsDeLaCandidat(conversationId: string): Promise<boolean> {
  const m = await prisma.message.findFirst({
    where: { conversationId, trimisDe: "CANDIDATE" },
    select: { id: true },
  });
  return m !== null;
}
