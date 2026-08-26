import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/angajator/cautari — căutările salvate
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const employer = await prisma.employerProfile.findUnique({ where: { userId: u.sub }, select: { id: true } });
  if (!employer) return NextResponse.json({ cautari: [] });

  const cautari = await prisma.savedSearch.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ cautari });
}

// POST /api/mobile/angajator/cautari — salvează o căutare (Body: { nume, skills?, locatie?, experientaMin?, bugetMax? ... })
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const employer = await prisma.employerProfile.findUnique({ where: { userId: u.sub }, select: { id: true } });
  if (!employer) return NextResponse.json({ error: "Completează profilul companiei." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const nume = String(body.nume || "").trim();
  if (!nume) return NextResponse.json({ error: "Dă un nume căutării." }, { status: 400 });

  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const strN = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

  const cautare = await prisma.savedSearch.create({
    data: {
      employerId: employer.id,
      nume,
      skills: strN(body.skills),
      locatie: strN(body.locatie),
      experientaMin: num(body.experientaMin),
      experientaMax: num(body.experientaMax),
      bugetMin: num(body.bugetMin),
      bugetMax: num(body.bugetMax),
      domeniu: strN(body.domeniu),
    },
  });
  return NextResponse.json({ cautare });
}
