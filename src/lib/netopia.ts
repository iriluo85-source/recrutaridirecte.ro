// ─────────────────────────────────────────────────────────────────────────────
// Integrarea Netopia Payments API v2 (REST) pentru plata abonamentelor.
//
// Flux HOSTED: nu atingem niciodată datele cardului. Trimitem comanda la Netopia,
// primim un `paymentURL` și redirecționăm userul pe pagina lor securizată (3DS etc.).
// După plată, Netopia ne notifică server-to-server (IPN) pe
// {APP_URL}/api/plata/netopia/confirmare, iar noi RE-INTEROGĂM statusul la Netopia
// (sursă de adevăr) înainte să activăm abonamentul — ca să nu putem fi păcăliți de
// o notificare falsă.
//
// Variabile de mediu:
//   NETOPIA_API_KEY        — cheia de API (din admin.netopia-payments.com → Securitate)
//   NETOPIA_POS_SIGNATURE  — semnătura POS (din Puncte de vânzare)
//   NETOPIA_SANDBOX        — "true" (test) / "false" (live)
//   APP_URL                — adresa publică a site-ului (pentru notifyUrl/redirectUrl)
// Documentație: https://doc.netopia-payments.com  (API v2)
// ─────────────────────────────────────────────────────────────────────────────

const SANDBOX = process.env.NETOPIA_SANDBOX !== "false"; // implicit sandbox; live doar cu "false"
const BASE = SANDBOX
  ? "https://secure.sandbox.netopia-payments.com"
  : "https://secure.netopia-payments.com";
const API_KEY = process.env.NETOPIA_API_KEY ?? "";
const POS_SIGNATURE = process.env.NETOPIA_POS_SIGNATURE ?? "";
const APP_URL = (process.env.APP_URL || process.env.AUTH_URL || "http://localhost:3000").replace(/\/$/, "");

const RO_COUNTRY = 642; // ISO 3166-1 numeric pentru România

// Plățile reale sunt active doar când avem ambele credențiale setate.
export const PLATI_ACTIVE = Boolean(API_KEY && POS_SIGNATURE);

export type BillingClient = {
  email: string;
  phone?: string | null;
  nume?: string | null; // nume complet (candidat) sau denumire firmă (angajator)
  oras?: string | null;
};

export type IntentPlata = {
  orderId: string; // id-ul comenzii (îl regăsim în IPN); îl generăm noi, unic
  planTip: string; // GOLD | PLATINUM | UNLIMITED
  suma: number; // lei (2 zecimale)
  billing: BillingClient;
};

export type RezultatConfirmare = {
  valid: boolean; // am putut verifica statusul la Netopia?
  platit: boolean; // plata e confirmată (status 3 sau 5)?
  orderID?: string;
  ntpID?: string;
};

function despartiNume(nume?: string | null): { firstName: string; lastName: string } {
  const parti = (nume ?? "").trim().split(/\s+/).filter(Boolean);
  if (parti.length === 0) return { firstName: "Client", lastName: "Recrutare Directă" };
  if (parti.length === 1) return { firstName: parti[0], lastName: parti[0] };
  return { firstName: parti[0], lastName: parti.slice(1).join(" ") };
}

// Inițiază o plată și întoarce URL-ul securizat Netopia unde redirecționăm userul.
export async function initiazaPlataNetopia(intent: IntentPlata): Promise<string> {
  if (!PLATI_ACTIVE) {
    throw new Error("Netopia nu e configurat (lipsesc credențialele).");
  }
  const { firstName, lastName } = despartiNume(intent.billing.nume);
  const oras = (intent.billing.oras || "Bucuresti").trim();

  const body = {
    config: {
      notifyUrl: `${APP_URL}/api/plata/netopia/confirmare`,
      redirectUrl: `${APP_URL}/abonamente?activat=1`,
      language: "ro",
    },
    payment: {
      options: { installments: 0, bonus: 0 },
      // fără `instrument` → flux HOSTED (cardul se introduce pe pagina Netopia)
    },
    order: {
      posSignature: POS_SIGNATURE,
      dateTime: new Date().toISOString(),
      description: `Abonament ${intent.planTip} — Recrutare Directă`,
      orderID: intent.orderId,
      amount: Number(intent.suma.toFixed(2)),
      currency: "RON",
      billing: {
        email: intent.billing.email,
        phone: (intent.billing.phone || "0700000000").trim(),
        firstName,
        lastName,
        city: oras,
        country: RO_COUNTRY,
        countryName: "Romania",
        state: oras,
        postalCode: "010001",
        details: "Abonament Recrutare Directă",
      },
    },
  };

  const res = await fetch(`${BASE}/payment/card/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: API_KEY },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);
  const url: string | undefined = data?.payment?.paymentURL || data?.customerAction?.url;
  if (!res.ok || !url) {
    const detaliu = data?.error?.message || data?.message || `HTTP ${res.status}`;
    throw new Error(`Netopia nu a întors un URL de plată: ${detaliu}`);
  }
  return url;
}

// Verifică autenticitatea unei notificări (IPN): extrage orderID/ntpID din payload
// (date NEÎNCREDERE) și RE-INTEROGHEAZĂ statusul direct la Netopia cu cheia noastră.
// Doar statusul întors de Netopia contează — o notificare falsă nu poate păcăli.
export async function verificaConfirmareNetopia(payload: unknown): Promise<RezultatConfirmare> {
  if (!PLATI_ACTIVE) return { valid: false, platit: false };

  const { orderID, ntpID } = extrageIdentificatori(payload);
  if (!orderID) return { valid: false, platit: false };

  try {
    const res = await fetch(`${BASE}/operation/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: API_KEY },
      body: JSON.stringify({ posSignature: POS_SIGNATURE, orderID, ntpID }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { valid: false, platit: false, orderID, ntpID };
    const status = Number(data?.payment?.status);
    // 3 = plătit, 5 = confirmat (settlement)
    const platit = status === 3 || status === 5;
    return { valid: true, platit, orderID, ntpID: data?.payment?.ntpID ?? ntpID };
  } catch {
    return { valid: false, platit: false, orderID, ntpID };
  }
}

// Netopia poate trimite IPN ca JSON sau form-urlencoded (FormData). Extragem doar
// identificatorii (orderID, ntpID) — statusul îl luăm autoritar din /operation/status.
function extrageIdentificatori(payload: unknown): { orderID?: string; ntpID?: string } {
  if (!payload) return {};
  if (typeof FormData !== "undefined" && payload instanceof FormData) {
    return {
      orderID: (payload.get("orderID") || payload.get("order.orderID") || undefined)?.toString(),
      ntpID: (payload.get("ntpID") || payload.get("payment.ntpID") || undefined)?.toString(),
    };
  }
  if (typeof payload === "object") {
    const p = payload as Record<string, any>;
    return {
      orderID: p.order?.orderID ?? p.orderID ?? undefined,
      ntpID: p.payment?.ntpID ?? p.ntpID ?? undefined,
    };
  }
  return {};
}
