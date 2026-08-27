import { NextResponse } from "next/server";
import { importaNoutati } from "@/lib/noutatiAuto";

// Rută apelată zilnic de un planificator extern (GitHub Actions) ca să importe
// 2-3 noutăți din fluxurile RSS oficiale.
// Protejată cu CRON_SECRET: cererea trebuie să vină cu antetul
//   Authorization: Bearer <CRON_SECRET>
// Dacă CRON_SECRET nu e setat, ruta e dezactivată (răspunde 401).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rezultat = await importaNoutati(3);
  return NextResponse.json({ ok: true, ...rezultat });
}
