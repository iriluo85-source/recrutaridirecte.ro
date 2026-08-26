import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { semneazaTokenMobil } from "@/lib/mobileAuth";

// POST /api/mobile/auth/login
// Body JSON: { email, password }
// Răspuns: { token, user: { id, email, role, numeComplet } }
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Completează emailul și parola." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Email sau parolă greșite." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Email sau parolă greșite." }, { status: 401 });
  }

  if (user.role !== "CANDIDATE" && user.role !== "EMPLOYER") {
    return NextResponse.json(
      { error: "Contul nu are un rol setat. Finalizează contul pe site." },
      { status: 403 }
    );
  }

  // numele afișat: numele candidatului sau al companiei
  let numeAfisat: string | null = null;
  if (user.role === "CANDIDATE") {
    const p = await prisma.candidateProfile.findUnique({
      where: { userId: user.id },
      select: { numeComplet: true },
    });
    numeAfisat = p?.numeComplet ?? null;
  } else {
    const e = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
      select: { numeCompanie: true },
    });
    numeAfisat = e?.numeCompanie ?? null;
  }

  const token = semneazaTokenMobil(user.id, user.role);

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      numeComplet: numeAfisat,
    },
  });
}
