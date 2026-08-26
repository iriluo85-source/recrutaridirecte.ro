// ─────────────────────────────────────────────────────────────────────────────
// Integrarea Oblio: facturare automată + trimitere în e-Factura (ANAF/SPV).
//
// STARE: SCHELET FUNCȚIONAL. Se activează când sunt setate variabilele de mediu
// (vezi .env.example). Cât timp lipsesc, emiterea facturii e no-op (nu blochează
// plata). Programul de facturare a fost ales împreună cu contabila (SIZ Consulting).
//
// Variabile de mediu:
//   OBLIO_EMAIL   — emailul contului Oblio (client_id pentru API)
//   OBLIO_SECRET  — secretul de API din Oblio (Setări → Date cont → API)
//   OBLIO_CIF     — CIF-ul firmei EMITENTE (SOFT CRUTING S.R.L.)
//   OBLIO_SERIE   — seria facturilor (ex: "RD") — DE CONFIRMAT cu contabila
//   OBLIO_TVA     — cota TVA (0 dacă firma e NEplătitoare de TVA; 19 dacă e plătitoare) — DE CONFIRMAT
//   OBLIO_GESTIUNE — (opțional) numele gestiunii, dacă e cerut
//
// DE CONFIRMAT cu contabila / documentația Oblio actuală (https://www.oblio.eu/api):
//   • statusul de TVA al firmei (neplătitor → factură fără TVA) și numele cotei în Oblio;
//   • seria de facturi folosită;
//   • dacă trimiterea în e-Factura se face automat din contul Oblio sau prin parametrul din API.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { gasestePlan } from "@/lib/planuri";

export const FACTURARE_ACTIVA = Boolean(
  process.env.OBLIO_EMAIL && process.env.OBLIO_SECRET && process.env.OBLIO_CIF
);

const OBLIO_BASE = "https://www.oblio.eu/api";
const SERIE_FACTURA = process.env.OBLIO_SERIE || "RD";
const TVA_PROCENT = Number(process.env.OBLIO_TVA ?? "0"); // 0 = firmă neplătitoare de TVA
const TVA_NUME = TVA_PROCENT > 0 ? "Normala" : "SFDD"; // SFDD ≈ scutit; DE CONFIRMAT în Oblio

// Token OAuth cache-uit în memorie (expiră ~1h la Oblio).
let tokenCache: { token: string; expira: number } | null = null;

async function obtineToken(): Promise<string | null> {
  if (tokenCache && tokenCache.expira > Date.now()) return tokenCache.token;
  try {
    const r = await fetch(`${OBLIO_BASE}/authorize/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.OBLIO_EMAIL as string,
        client_secret: process.env.OBLIO_SECRET as string,
      }),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { access_token?: string; expires_in?: number };
    if (!d.access_token) return null;
    tokenCache = {
      token: d.access_token,
      expira: Date.now() + (Number(d.expires_in ?? 3600) - 60) * 1000,
    };
    return d.access_token;
  } catch (e) {
    console.error("[oblio] autentificare eșuată:", e);
    return null;
  }
}

export type DateFactura = {
  numeClient: string;
  emailClient?: string | null;
  cifClient?: string | null; // CUI cumpărător (B2B); gol la persoane fizice
  adresaClient?: string | null;
  denumireProdus: string; // ex: „Abonament Platinum (angajator) — lunar”
  pretCuTva: number; // suma încasată (lei, cu TVA inclus)
};

export type RezultatFactura = {
  emisa: boolean;
  serie?: string;
  numar?: number;
  eroare?: string;
};

// Emite o factură în Oblio (care o trimite mai departe în e-Factura).
export async function emiteFactura(date: DateFactura): Promise<RezultatFactura> {
  if (!FACTURARE_ACTIVA) return { emisa: false, eroare: "Oblio neconfigurat" };

  const token = await obtineToken();
  if (!token) return { emisa: false, eroare: "autentificare Oblio eșuată" };

  try {
    const azi = new Date().toISOString().slice(0, 10);
    const body = {
      cif: process.env.OBLIO_CIF,
      client: {
        name: date.numeClient,
        email: date.emailClient ?? "",
        cif: date.cifClient ?? "",
        vatPayer: date.cifClient ? 1 : 0,
        address: date.adresaClient ?? "",
      },
      issueDate: azi,
      seriesName: SERIE_FACTURA,
      language: "RO",
      products: [
        {
          name: date.denumireProdus,
          price: date.pretCuTva,
          measuringUnit: "buc",
          currency: "RON",
          vatName: TVA_NUME,
          vatPercentage: TVA_PROCENT,
          vatIncluded: 1,
          quantity: 1,
        },
      ],
      // trimitere automată în e-Factura (SPV). Numele exact al parametrului se
      // confirmă în contul Oblio; multe conturi trimit automat, fără parametru.
      sendToEinvoice: 1,
    };

    const r = await fetch(`${OBLIO_BASE}/docs/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const d = (await r.json().catch(() => null)) as
      | { status?: number; statusMessage?: string; data?: { seriesName?: string; number?: number } }
      | null;

    if (!r.ok || d?.status !== 200) {
      return { emisa: false, eroare: d?.statusMessage || `HTTP ${r.status}` };
    }
    return { emisa: true, serie: d?.data?.seriesName, numar: d?.data?.number };
  } catch (e) {
    console.error("[oblio] emitere factură eșuată:", e);
    return { emisa: false, eroare: e instanceof Error ? e.message : "eroare Oblio" };
  }
}

// Emite factura pentru un abonament plătit: adună datele cumpărătorului din DB
// și cheamă emiteFactura. Non-blocking pentru fluxul de plată (erorile se loghează).
export async function emiteFacturaAbonament(
  userId: string,
  planTip: string,
  suma?: number
): Promise<RezultatFactura> {
  if (!FACTURARE_ACTIVA) return { emisa: false, eroare: "Oblio neconfigurat" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      role: true,
      facturareDenumire: true,
      facturareCui: true,
      facturareAdresa: true,
      candidateProfile: { select: { numeComplet: true } },
      employerProfile: { select: { numeCompanie: true } },
    },
  });
  if (!user) return { emisa: false, eroare: "utilizator inexistent" };

  const esteAngajator = user.role === "EMPLOYER";
  // Preferăm datele de facturare completate în Setări; altfel numele din profil.
  const numeClient =
    user.facturareDenumire ||
    (esteAngajator
      ? user.employerProfile?.numeCompanie || user.email
      : user.candidateProfile?.numeComplet || user.email);

  const plan = gasestePlan(user.role, planTip);
  const pret = suma ?? plan?.pretLunar ?? 0;
  const rolText = esteAngajator ? "angajator" : "candidat";

  return emiteFactura({
    numeClient,
    emailClient: user.email,
    cifClient: user.facturareCui ?? null, // CUI cumpărător (firme) din datele de facturare
    adresaClient: user.facturareAdresa ?? null,
    denumireProdus: `Abonament ${plan?.nume ?? planTip} (${rolText})`,
    pretCuTva: pret,
  });
}
