import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// POST /api/mobile/profil — creează/actualizează profilul candidatului (fără poză; poza rămâne pe site)
// Body JSON: { numeComplet, titluCurent, locatie, remote, aniExperienta, bio, salariuMinim, salariuMaxim, disponibilitate, skills[] }
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  if (u.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Doar candidații pot edita acest profil." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const numeComplet = str(body.numeComplet);
  const locatie = str(body.locatie);
  const titluCurent = str(body.titluCurent);
  const bio = str(body.bio) || null;
  const remote = body.remote === true;

  if (numeComplet.length < 2) return NextResponse.json({ error: "Numele complet e obligatoriu." }, { status: 400 });
  if (locatie.length < 2) return NextResponse.json({ error: "Localitatea e obligatorie." }, { status: 400 });
  if (titluCurent.length < 2) return NextResponse.json({ error: "Titlul postului e obligatoriu." }, { status: 400 });

  const aniExperienta = Math.trunc(Number(body.aniExperienta));
  if (!Number.isFinite(aniExperienta) || aniExperienta < 0 || aniExperienta > 60) {
    return NextResponse.json({ error: "Ani de experiență invalizi (0–60)." }, { status: 400 });
  }

  const dispValide = ["IMEDIATA", "SUB_O_LUNA", "PESTE_O_LUNA"];
  const disponibilitate = String(body.disponibilitate || "");
  if (!dispValide.includes(disponibilitate)) {
    return NextResponse.json({ error: "Disponibilitate invalidă." }, { status: 400 });
  }

  const optInt = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  };
  const salariuMinim = optInt(body.salariuMinim);
  const salariuMaxim = optInt(body.salariuMaxim);
  if (salariuMinim !== null && salariuMaxim !== null && salariuMinim > salariuMaxim) {
    return NextResponse.json({ error: "Salariul minim nu poate depăși maximul." }, { status: 400 });
  }

  // skills: array de string-uri, deduplicat
  const skillNames: string[] = [];
  const seen = new Set<string>();
  const rawSkills = Array.isArray(body.skills)
    ? body.skills
    : typeof body.skills === "string"
      ? (body.skills as string).split(",")
      : [];
  for (const raw of rawSkills) {
    const s = String(raw).trim();
    if (s && !seen.has(s.toLowerCase())) {
      seen.add(s.toLowerCase());
      skillNames.push(s);
    }
  }

  await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidateProfile.upsert({
      where: { userId: u.sub },
      create: {
        userId: u.sub,
        numeComplet,
        locatie,
        remote,
        aniExperienta,
        titluCurent,
        bio,
        disponibilitate: disponibilitate as "IMEDIATA" | "SUB_O_LUNA" | "PESTE_O_LUNA",
        salariuMinim,
        salariuMaxim,
      },
      update: {
        numeComplet,
        locatie,
        remote,
        aniExperienta,
        titluCurent,
        bio,
        disponibilitate: disponibilitate as "IMEDIATA" | "SUB_O_LUNA" | "PESTE_O_LUNA",
        salariuMinim,
        salariuMaxim,
      },
    });

    for (const nume of skillNames) {
      await tx.skill.upsert({ where: { nume }, create: { nume }, update: {} });
    }
    const skillRecords = await tx.skill.findMany({ where: { nume: { in: skillNames } } });
    await tx.candidateSkill.deleteMany({ where: { candidateId: candidate.id } });
    if (skillRecords.length > 0) {
      await tx.candidateSkill.createMany({
        data: skillRecords.map((s) => ({ candidateId: candidate.id, skillId: s.id })),
      });
    }
  });

  return NextResponse.json({ success: true });
}
