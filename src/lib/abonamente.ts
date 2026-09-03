import { prisma } from "@/lib/prisma";

// Durata unui ciclu de abonament (o lună). La plăți recurente reale, Netopia
// reînnoiește automat, iar noi prelungim la fiecare confirmare de plată.
export const DURATA_ABONAMENT_ZILE = 30;

// Activează (sau prelungește) abonamentul unui utilizator. Sursă unică de adevăr —
// folosită atât de checkout-ul demo, cât și de confirmarea reală a plății (Netopia).
export async function activeazaAbonament(userId: string, planTip: string): Promise<void> {
  const expira = new Date(Date.now() + DURATA_ABONAMENT_ZILE * 24 * 60 * 60 * 1000);
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
