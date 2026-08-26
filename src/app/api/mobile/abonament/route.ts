import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";
import { planuriPentruRol, PERIOADE_ABONAMENT } from "@/lib/planuri";
import { PLATI_ACTIVE } from "@/lib/netopia";

// GET /api/mobile/abonament — abonamentul curent + planurile disponibile pentru rol
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: u.sub },
    select: { abonamentTip: true, abonamentExpira: true },
  });

  const planuri = planuriPentruRol(u.role).map((p) => ({
    tip: p.tip,
    nume: p.nume,
    pretLunar: p.pretLunar,
    evidentiat: Boolean(p.evidentiat),
    beneficii: p.beneficii,
  }));

  return NextResponse.json({
    curent: {
      tip: user?.abonamentTip ?? "FREE",
      expira: user?.abonamentExpira ?? null,
    },
    planuri,
    perioade: PERIOADE_ABONAMENT.map((p) => ({
      id: p.id,
      luni: p.luni,
      reducere: Math.round(p.reducere * 100),
    })),
    platiActive: PLATI_ACTIVE,
  });
}
