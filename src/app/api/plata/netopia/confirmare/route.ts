import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verificaConfirmareNetopia } from "@/lib/netopia";
import { activeazaAbonament } from "@/lib/abonamente";
import { emiteFacturaAbonament } from "@/lib/oblio";

// Endpoint server-to-server apelat de Netopia după fiecare plată (IPN).
// URL public de configurat în contul Netopia: {APP_URL}/api/plata/netopia/confirmare
//
// Securitate: NU ne bazăm pe statusul din payload (ar putea fi falsificat). În
// `verificaConfirmareNetopia` re-interogăm statusul direct la Netopia cu cheia noastră.
// Idempotență: activăm abonamentul + emitem factura O SINGURĂ dată per comandă
// (folosind starea din modelul Payment), chiar dacă notificarea vine de mai multe ori.
export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    payload = contentType.includes("application/json")
      ? await req.json()
      : await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "payload invalid" }, { status: 400 });
  }

  const rezultat = await verificaConfirmareNetopia(payload);
  if (!rezultat.valid) {
    return NextResponse.json({ ok: false, error: "verificare eșuată" }, { status: 400 });
  }

  if (rezultat.platit && rezultat.orderID) {
    const payment = await prisma.payment.findUnique({ where: { orderID: rezultat.orderID } });

    if (payment && payment.status !== "PAID") {
      // Marcăm PAID doar dacă e încă PENDING — câștigătorul cursei procesează o dată.
      const upd = await prisma.payment.updateMany({
        where: { orderID: rezultat.orderID, status: "PENDING" },
        data: { status: "PAID", ntpID: rezultat.ntpID },
      });

      if (upd.count === 1) {
        await activeazaAbonament(payment.userId, payment.planTip);

        // Factură automată în Oblio → e-Factura. Ne-blocant: dacă eșuează, nu
        // respingem plata (se poate reemite din Oblio).
        try {
          const factura = await emiteFacturaAbonament(payment.userId, payment.planTip);
          if (!factura.emisa && factura.eroare !== "Oblio neconfigurat") {
            console.error("[plata] Factura Oblio nu a fost emisă:", factura.eroare);
          }
        } catch (e) {
          console.error("[plata] Emiterea facturii a eșuat:", e);
        }
      }
    }
  }

  // Netopia consideră notificarea procesată dacă primește 200.
  return NextResponse.json({ errorCode: 0 });
}
