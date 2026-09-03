import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TEMPORAR — agregare candidați pentru țintire marketing. Bearer CRON_SECRET. De șters.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const cands = await prisma.candidateProfile.findMany({
    select: {
      titluCurent: true,
      locatie: true,
      aniExperienta: true,
      skills: { select: { skill: { select: { nume: true } } } },
    },
  });
  const norm = (s: string) => s.trim();
  const countBy = (arr: string[]) => {
    const m: Record<string, number> = {};
    for (const x of arr) { const k = norm(x); if (k) m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const titluri = countBy(cands.map((c) => c.titluCurent));
  const locatii = countBy(cands.map((c) => c.locatie));
  const skills = countBy(cands.flatMap((c) => c.skills.map((s) => s.skill.nume)));
  return NextResponse.json({
    total: cands.length,
    titluri,
    locatii,
    skills: skills.slice(0, 40),
  });
}
