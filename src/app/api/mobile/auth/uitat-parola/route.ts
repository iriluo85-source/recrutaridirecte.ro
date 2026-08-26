import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creazaToken, urlAplicatie } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

// POST /api/mobile/auth/uitat-parola — trimite email cu link de resetare a parolei
// Body JSON: { email }. Răspuns generic (nu dezvăluim dacă emailul există).
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresă de email invalidă." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    try {
      const token = await creazaToken(user.id, "RESET_PAROLA", 1);
      await sendEmail({
        to: email,
        subject: "Resetează-ți parola — Recrutare Directă",
        html: `<p>Ai cerut resetarea parolei.</p><p><a href="${urlAplicatie(`/reseteaza-parola?token=${token}`)}">Setează o parolă nouă</a> (linkul expiră în 1 oră).</p><p>Dacă nu ai cerut tu asta, ignoră acest email.</p>`,
      });
    } catch {
      // mesaj generic indiferent de rezultat
    }
  }

  return NextResponse.json({ success: true });
}
