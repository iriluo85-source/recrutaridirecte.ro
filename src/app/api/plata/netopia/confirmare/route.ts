import { NextRequest, NextResponse } from "next/server";
import { verificaConfirmareNetopia } from "@/lib/netopia";
import { activeazaAbonament } from "@/lib/abonamente";
import { emiteFacturaAbonament } from "@/lib/oblio";

// Endpoint server-to-server apelat de Netopia după fiecare plată (IPN).
// URL public de configurat în contul Netopia: {APP_URL}/api/plata/netopia/confirmare
//
// STARE: SCHELET — `verificaConfirmareNetopia` întoarce încă `valid:false` până
// completăm integrarea cu credențialele reale. Structura de activare e deja gata:
// la o plată confirmată corect, prelungim abonamentul prin `activeazaAbonament`.
export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    // Netopia poate trimite form-urlencoded sau JSON, în funcție de model.
    const contentType = req.headers.get("content-type") ?? "";
    payload = contentType.includes("application/json")
      ? await req.json()
      : await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "payload invalid" }, { status: 400 });
  }

  const rezultat = await verificaConfirmareNetopia(payload);

  if (!rezultat.valid) {
    // semnătură incorectă → posibil apel neautentic
    return NextResponse.json({ ok: false, error: "semnătură invalidă" }, { status: 401 });
  }

  if (rezultat.platit && rezultat.userId && rezultat.planTip) {
    await activeazaAbonament(rezultat.userId, rezultat.planTip);

    // Emite automat factura în Oblio → e-Factura. Ne-blocant: dacă facturarea
    // eșuează, nu respingem plata (se poate reemite manual din Oblio).
    try {
      const factura = await emiteFacturaAbonament(rezultat.userId, rezultat.planTip);
      if (!factura.emisa && factura.eroare !== "Oblio neconfigurat") {
        console.error("[plata] Factura Oblio nu a fost emisă:", factura.eroare);
      }
    } catch (e) {
      console.error("[plata] Emiterea facturii a eșuat:", e);
    }
  }

  // TODO(netopia): întoarce răspunsul EXACT pe care îl așteaptă Netopia pentru a
  // marca notificarea drept procesată (formatul e specific modelului de integrare).
  return NextResponse.json({ ok: true });
}
