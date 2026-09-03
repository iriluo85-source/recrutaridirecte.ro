import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trimiteEmailProfilIncomplet } from "@/lib/email";

// Trimite emailul „completează-ți profilul" candidaților cu cont, dar FĂRĂ profil completat.
// Protejat cu CRON_SECRET (Authorization: Bearer <CRON_SECRET>).
//
// Siguranță:
//  - implicit e DRY-RUN (doar arată cine ar primi); trimite efectiv doar cu ?trimite=1
//  - trimite doar celor cu email verificat, cu notificări active și care NU au primit deja
//    (marcăm relansareProfilLa), ca nimeni să nu primească de 2 ori
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trimite = new URL(request.url).searchParams.get("trimite") === "1";

  const candidati = await prisma.user.findMany({
    where: {
      role: "CANDIDATE",
      candidateProfile: { is: null },
      emailVerificat: true,
      notificariEmail: true,
      relansareProfilLa: null,
    },
    select: { id: true, email: true },
  });

  if (!trimite) {
    return NextResponse.json({
      dryRun: true,
      gasiti: candidati.length,
      emails: candidati.map((c) => c.email),
    });
  }

  let trimise = 0;
  let esuate = 0;
  for (const u of candidati) {
    const ok = await trimiteEmailProfilIncomplet(u.email);
    if (ok) {
      trimise++;
      await prisma.user.update({ where: { id: u.id }, data: { relansareProfilLa: new Date() } });
    } else {
      esuate++;
    }
  }

  return NextResponse.json({ gasiti: candidati.length, trimise, esuate });
}
