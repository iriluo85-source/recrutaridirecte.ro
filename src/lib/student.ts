// Campania „Back to School": elevii majori și studenții care își verifică
// legitimația primesc 50% reducere la orice abonament de candidat.
//
// Sursă unică de adevăr pentru: fereastra campaniei, procentul de reducere și
// dreptul unui cont la reducere. Pagina de prețuri și checkout-ul citesc de aici,
// ca prețul afișat să fie exact cel încasat.

import { prisma } from "@/lib/prisma";

/** Fereastra campaniei. Se modifică de aici dacă se prelungește. */
export const CAMPANIE_START = new Date("2026-09-01T00:00:00+03:00");
export const CAMPANIE_FINAL = new Date("2026-10-01T00:00:00+03:00"); // exclusiv

/** 50% din prețul oricărui abonament de candidat. */
export const REDUCERE_STUDENT = 0.5;

export const TIPURI_DOCUMENT = ["CARNET_ELEV", "LEGITIMATIE_STUDENT"] as const;
export type TipDocument = (typeof TIPURI_DOCUMENT)[number];

export function esteTipDocumentValid(v: string): v is TipDocument {
  return (TIPURI_DOCUMENT as readonly string[]).includes(v);
}

export function campanieActiva(acum: Date = new Date()): boolean {
  return acum >= CAMPANIE_START && acum < CAMPANIE_FINAL;
}

/** Câte zile mai sunt din campanie (0 dacă s-a încheiat). Pentru bannere. */
export function zileRamaseCampanie(acum: Date = new Date()): number {
  if (!campanieActiva(acum)) return 0;
  const ms = CAMPANIE_FINAL.getTime() - acum.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export type StareStudent = "LIPSA" | "IN_ASTEPTARE" | "VALIDAT" | "RESPINS";

export async function stareStudent(userId: string): Promise<{
  stare: StareStudent;
  motivRespingere: string | null;
}> {
  const v = await prisma.studentVerificare.findUnique({
    where: { userId },
    select: { status: true, motivRespingere: true },
  });
  if (!v) return { stare: "LIPSA", motivRespingere: null };
  return { stare: v.status as StareStudent, motivRespingere: v.motivRespingere };
}

/**
 * Reducerea aplicabilă unui cont: 50% dacă e student validat ȘI campania e activă.
 * Validarea rămâne pe cont după campanie, dar reducerea nu — altfel prețul afișat
 * și cel încasat ar diverge în octombrie.
 */
export async function reducereStudent(
  userId: string | null | undefined,
  acum: Date = new Date()
): Promise<number> {
  if (!userId || !campanieActiva(acum)) return 0;
  const v = await prisma.studentVerificare.findUnique({
    where: { userId },
    select: { status: true },
  });
  return v?.status === "VALIDAT" ? REDUCERE_STUDENT : 0;
}

/** Aplică reducerea pe un preț și rotunjește la bani. */
export function cuReducereStudent(pret: number, reducere: number): number {
  if (reducere <= 0) return pret;
  return Math.round(pret * (1 - reducere) * 100) / 100;
}
