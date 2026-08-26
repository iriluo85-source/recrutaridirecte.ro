import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/testimoniale — testimonialele aprobate (public)
export async function GET() {
  const items = await prisma.testimonial.findMany({
    where: { aprobat: true },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, nume: true, rol: true, rating: true, text: true, createdAt: true },
  });
  return NextResponse.json({ testimoniale: items });
}

// POST /api/mobile/testimoniale — trimite un testimonial (se afișează după aprobarea adminului)
// Body JSON: { rating, text }
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: { rating?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const rating = Number(body.rating || 0);
  const text = String(body.text || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 10) {
    return NextResponse.json(
      { error: "Alege un rating (1–5) și scrie cel puțin 10 caractere." },
      { status: 400 }
    );
  }

  // numele afișat = numele profilului
  let nume = (await prisma.user.findUnique({ where: { id: u.sub }, select: { email: true } }))
    ?.email?.split("@")[0] ?? "Utilizator";
  if (u.role === "CANDIDATE") {
    const p = await prisma.candidateProfile.findUnique({
      where: { userId: u.sub },
      select: { numeComplet: true },
    });
    if (p?.numeComplet) nume = p.numeComplet;
  } else {
    const e = await prisma.employerProfile.findUnique({
      where: { userId: u.sub },
      select: { numeCompanie: true },
    });
    if (e?.numeCompanie) nume = e.numeCompanie;
  }

  await prisma.testimonial.create({
    data: { userId: u.sub, nume, rol: u.role, rating, text, aprobat: false },
  });

  return NextResponse.json({ success: true });
}
