import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  SELECT_DIRECTOR,
  companiiActive,
  filtreazaCompanii,
  esteSortareValida,
} from "@/lib/companii";

// GET /api/mobile/companii — director public de firme active.
// Aceleași reguli ca pagina web /companii (src/lib/companii.ts).
// Parametri: q, industrie, locatie, angajeaza=1, sort=recent|nume|posturi, page.

const REZULTATE_PE_PAGINA = 20;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const sortCerut = sp.get("sort") ?? "recent";
  const pageCerut = Number(sp.get("page"));
  const page = Number.isFinite(pageCerut) && pageCerut > 0 ? Math.floor(pageCerut) : 1;

  const toate = await prisma.employerProfile.findMany({
    orderBy: { updatedAt: "desc" },
    select: SELECT_DIRECTOR,
  });

  const active = companiiActive(toate);

  const rezultate = filtreazaCompanii(active, {
    q: sp.get("q") ?? "",
    industrie: sp.get("industrie") ?? "",
    locatie: sp.get("locatie") ?? "",
    doarAngajeaza: sp.get("angajeaza") === "1" || sp.get("angajeaza") === "on",
    sort: esteSortareValida(sortCerut) ? sortCerut : "recent",
  });

  const total = rezultate.length;
  const totalPagini = Math.max(1, Math.ceil(total / REZULTATE_PE_PAGINA));
  const paginaSigura = Math.min(page, totalPagini);
  const felie = rezultate.slice(
    (paginaSigura - 1) * REZULTATE_PE_PAGINA,
    paginaSigura * REZULTATE_PE_PAGINA
  );

  return NextResponse.json({
    total,
    page: paginaSigura,
    totalPagini,
    companii: felie.map((c) => ({
      id: c.id,
      numeCompanie: c.numeCompanie,
      industrie: c.industrie,
      locatie: c.locatie,
      marimeCompanie: c.marimeCompanie,
      descriere: c.descriere,
      nrPosturi: c.nrPosturi,
      verificat: c.verificat,
      promovat: c.promovat,
    })),
  });
}
