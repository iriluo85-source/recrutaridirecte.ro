import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { notificaRadarPost } from "@/lib/radar";

// GET /api/mobile/angajator/posturi — posturile companiei
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  if (!employer) return NextResponse.json({ posturi: [] });

  const posturi = await prisma.post.findMany({
    where: { employerId: employer.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ posturi });
}

// POST /api/mobile/angajator/posturi — creează sau actualizează un post (Body: { id?, titlu, ... })
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u || u.role !== "EMPLOYER") return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: u.sub },
    select: { id: true },
  });
  if (!employer) return NextResponse.json({ error: "Completează profilul companiei." }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const titlu = String(body.titlu || "").trim();
  if (titlu.length < 2) return NextResponse.json({ error: "Titlul e obligatoriu." }, { status: 400 });

  const num = (v: unknown): number | null => {
    if (v === null || v === undefined || String(v).trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
  };
  const strN = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

  const data = {
    titlu,
    skills: strN(body.skills),
    experientaMin: num(body.experientaMin),
    experientaMax: num(body.experientaMax),
    salariuMin: num(body.salariuMin),
    salariuMax: num(body.salariuMax),
    locatie: strN(body.locatie),
    remote: body.remote === true,
    descriere: strN(body.descriere),
    activ: body.activ !== false,
  };

  const postId = String(body.id || "").trim();
  if (postId) {
    const existing = await prisma.post.findUnique({ where: { id: postId }, select: { employerId: true } });
    if (!existing || existing.employerId !== employer.id) {
      return NextResponse.json({ error: "Post inexistent." }, { status: 404 });
    }
    const post = await prisma.post.update({ where: { id: postId }, data });
    return NextResponse.json({ post });
  }

  const post = await prisma.post.create({ data: { ...data, employerId: employer.id } });
  if (post.activ) {
    try {
      await notificaRadarPost(post.id);
    } catch {
      // radarul nu blochează crearea postului
    }
  }
  return NextResponse.json({ post });
}
