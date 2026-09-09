import { NextResponse } from "next/server";
import { trimiteDigestCandidati, trimiteDigestAngajatori } from "@/lib/digest";

// Digestul proactiv, rulat automat o dată la 2 zile (GitHub Actions → această rută).
// Protejat cu CRON_SECRET: Authorization: Bearer <CRON_SECRET>.
//
// Implicit e DRY-RUN — arată câți ar primi, fără să trimită. Trimite doar cu ?trimite=1,
// ca o rulare din greșeală să nu ajungă în inboxul nimănui.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trimite = new URL(request.url).searchParams.get("trimite") === "1";

  const candidati = await trimiteDigestCandidati(!trimite);
  // Digestul de angajatori nu are mod de test; îl rulăm doar la trimitere reală.
  const angajatori = trimite
    ? await trimiteDigestAngajatori()
    : { trimise: 0, totalOptIn: 0 };

  return NextResponse.json({
    dryRun: !trimite,
    candidati,
    angajatori,
  });
}
