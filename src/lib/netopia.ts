// ─────────────────────────────────────────────────────────────────────────────
// Integrarea Netopia (procesatorul de plăți ales pentru abonamente).
//
// STARE: SCHELET. Se completează cu credențialele reale DUPĂ deschiderea contului
// de comerciant Netopia (necesită CUI-ul firmei). Cât timp lipsesc credențialele,
// aplicația folosește checkout-ul demo (simulare) și `PLATI_ACTIVE` e false.
//
// Variabile de mediu necesare (vezi .env.example):
//   NETOPIA_API_KEY        — cheia de API din contul de comerciant
//   NETOPIA_POS_SIGNATURE  — semnătura POS (identificatorul punctului de vânzare)
//   NETOPIA_SANDBOX        — "true" pentru mediul de test, "false" pentru live
//
// Netopia oferă 2 modele de integrare — se alege unul la onboarding:
//   A) API v2 (REST, recomandat): trimiți un POST autentificat cu NETOPIA_API_KEY
//      și primești un `paymentURL` (unde redirecționezi userul) + o notificare
//      server-to-server (IPN) pe {APP_URL}/api/plata/netopia/confirmare.
//   B) mobilPay clasic: request RSA-criptat postat pe pagina lor + IPN criptat cu
//      cheia ta privată.
// Documentație: https://doc.netopia-payments.com
// ─────────────────────────────────────────────────────────────────────────────

// Plățile reale sunt active doar când avem credențialele Netopia setate.
export const PLATI_ACTIVE = Boolean(process.env.NETOPIA_API_KEY);

export type IntentPlata = {
  userId: string;
  planTip: string; // GOLD | PLATINUM | UNLIMITED
  suma: number; // lei
};

export type RezultatConfirmare = {
  valid: boolean; // semnătura Netopia e corectă?
  platit: boolean; // plata a fost confirmată?
  userId?: string;
  planTip?: string;
};

// Inițiază o plată la Netopia și întoarce URL-ul securizat unde redirecționăm
// utilizatorul. `orderId`-ul trebuie să codifice userId + planTip ca să le regăsim
// la confirmare.
export async function initiazaPlataNetopia(_intent: IntentPlata): Promise<string> {
  if (!PLATI_ACTIVE) {
    throw new Error("Netopia nu e configurat (lipsesc credențialele).");
  }
  // TODO(netopia): apel real către API-ul Netopia.
  //  - autentificare cu NETOPIA_API_KEY / NETOPIA_POS_SIGNATURE
  //  - trimite: suma, moneda "RON", un orderId unic (ex: `${userId}:${planTip}:${timestamp}`),
  //    confirmUrl = `${process.env.APP_URL}/api/plata/netopia/confirmare`,
  //    returnUrl  = `${process.env.APP_URL}/abonamente?activat=1`
  //  - întoarce `paymentURL` din răspunsul lor.
  throw new Error("initiazaPlataNetopia: de implementat cu API-ul Netopia.");
}

// Verifică notificarea (IPN) primită de la Netopia: validează semnătura, extrage
// statusul plății și orderId-ul, și întoarce userId + planTip.
export async function verificaConfirmareNetopia(
  _payload: unknown
): Promise<RezultatConfirmare> {
  // TODO(netopia): verifică semnătura (POS signature / cheia publică Netopia),
  //  decriptează/parsează payload-ul, confirmă statusul ("confirmed"/"paid"),
  //  extrage userId + planTip din orderId.
  return { valid: false, platit: false };
}
