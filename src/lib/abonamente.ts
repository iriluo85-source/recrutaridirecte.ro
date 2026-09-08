import { prisma } from "@/lib/prisma";

// Durata unui ciclu de abonament (o lună).
export const DURATA_ABONAMENT_ZILE = 30;

/**
 * Activează (sau prelungește) abonamentul unui utilizator.
 * Sursă unică de adevăr — folosită de checkout-ul demo și de confirmarea Netopia.
 *
 * `luni` vine din perioada aleasă la cumpărare (1, 3 sau 12). Fără ea, cine
 * plătea un an primea 30 de zile.
 *
 * Dacă abonamentul curent e încă valabil, se PRELUNGEȘTE de la data expirării,
 * nu de la azi — altfel o reînnoire făcută mai devreme ar arde zilele rămase.
 */
export async function activeazaAbonament(
  userId: string,
  planTip: string,
  luni: number = 1
): Promise<void> {
  const cicluri = Number.isFinite(luni) && luni > 0 ? Math.floor(luni) : 1;
  const durataMs = cicluri * DURATA_ABONAMENT_ZILE * 24 * 60 * 60 * 1000;

  const acum = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { abonamentExpira: true },
  });
  const bazaMs =
    user?.abonamentExpira && user.abonamentExpira > acum
      ? user.abonamentExpira.getTime()
      : acum.getTime();

  const expira = new Date(bazaMs + durataMs);

  // updateMany (nu update) ca să NU arunce dacă user-ul nu există — altfel un IPN
  // pentru un cont șters ar da 500 și Netopia ar reîncerca notificarea la infinit.
  const r = await prisma.user.updateMany({
    where: { id: userId },
    data: { abonamentTip: planTip, abonamentExpira: expira },
  });
  if (r.count === 0) {
    console.error(`[abonament] activeazaAbonament: user inexistent ${userId} (plan ${planTip})`);
  }
}
