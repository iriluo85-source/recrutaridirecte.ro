import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/angajator/profil — profilul companiei + emailul contului
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii au acces." }, { status: 403 });
  }

  const [user, profil] = await Promise.all([
    prisma.user.findUnique({ where: { id: u.sub }, select: { email: true, telefon: true } }),
    prisma.employerProfile.findUnique({ where: { userId: u.sub } }),
  ]);

  return NextResponse.json({
    email: user?.email ?? null,
    telefon: user?.telefon ?? null,
    profil: profil
      ? {
          numeCompanie: profil.numeCompanie,
          industrie: profil.industrie,
          locatie: profil.locatie,
          marimeCompanie: profil.marimeCompanie,
          website: profil.website,
          linkedin: profil.linkedin,
          anFondare: profil.anFondare,
          beneficii: profil.beneficii,
          descriere: profil.descriere,
          cautamGeneral: profil.cautamGeneral,
          domeniiInteres: profil.domeniiInteres,
        }
      : null,
  });
}

// POST /api/mobile/angajator/profil — creează/actualizează profilul companiei
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Doar angajatorii pot edita acest profil." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const strNull = (v: unknown) => str(v) || null;

  const numeCompanie = str(body.numeCompanie);
  if (numeCompanie.length < 2) {
    return NextResponse.json({ error: "Numele companiei e obligatoriu." }, { status: 400 });
  }

  let anFondare: number | null = null;
  if (body.anFondare !== null && body.anFondare !== undefined && String(body.anFondare).trim() !== "") {
    const n = Math.trunc(Number(body.anFondare));
    if (Number.isFinite(n) && n >= 1800 && n <= 2100) anFondare = n;
  }

  const date = {
    numeCompanie,
    industrie: strNull(body.industrie),
    locatie: strNull(body.locatie),
    marimeCompanie: strNull(body.marimeCompanie),
    website: strNull(body.website),
    linkedin: strNull(body.linkedin),
    anFondare,
    beneficii: strNull(body.beneficii),
    descriere: strNull(body.descriere),
    cautamGeneral: strNull(body.cautamGeneral),
    domeniiInteres: strNull(body.domeniiInteres),
  };

  await prisma.employerProfile.upsert({
    where: { userId: u.sub },
    create: { userId: u.sub, ...date },
    update: date,
  });

  return NextResponse.json({ success: true });
}
