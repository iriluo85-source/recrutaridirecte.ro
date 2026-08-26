import { NextResponse } from "next/server";
import { trimiteNewsletter } from "@/lib/newsletter";

// Rută pentru un planificator extern (ex. Vercel Cron) care rulează o dată la 2 zile.
// Protejată cu CRON_SECRET: cererea trebuie să vină cu antetul
//   Authorization: Bearer <CRON_SECRET>
// Dacă CRON_SECRET nu e setat, ruta e dezactivată (răspunde 401).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rezultat = await trimiteNewsletter();
  return NextResponse.json({ ok: true, ...rezultat });
}
