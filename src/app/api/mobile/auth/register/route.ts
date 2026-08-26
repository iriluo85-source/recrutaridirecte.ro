import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { semneazaTokenMobil } from "@/lib/mobileAuth";
import { creazaToken, urlAplicatie } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";

// POST /api/mobile/auth/register — creează un cont de candidat
// Body JSON: { email, password, acceptaTermeni, newsletter? }
export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    password?: string;
    acceptaTermeni?: boolean;
    newsletter?: boolean;
    rol?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const rol = body.rol === "EMPLOYER" ? "EMPLOYER" : "CANDIDATE";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Adresă de email invalidă." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Parola trebuie să aibă cel puțin 6 caractere." }, { status: 400 });
  }
  if (body.acceptaTermeni !== true) {
    return NextResponse.json(
      { error: "Trebuie să accepți Termenii și Politica de confidențialitate." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Există deja un cont cu acest email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: rol,
      termeniAcceptatiLa: new Date(),
      newsletterEmail: body.newsletter === true,
    },
  });

  // email de confirmare (nu blocăm crearea contului dacă trimiterea eșuează)
  try {
    const token = await creazaToken(user.id, "VERIFICARE_EMAIL", 24);
    await sendEmail({
      to: email,
      subject: "Confirmă-ți adresa de email — Recrutare Directă",
      html: `<p>Bun venit pe Recrutare Directă!</p><p><a href="${urlAplicatie(`/verifica-email?token=${token}`)}">Confirmă-ți adresa de email</a> (linkul expiră în 24 de ore).</p>`,
    });
  } catch {
    // ignorăm
  }

  const token = semneazaTokenMobil(user.id, rol);
  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role: rol, numeComplet: null },
  });
}
