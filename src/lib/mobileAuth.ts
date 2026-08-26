import crypto from "node:crypto";
import type { NextRequest } from "next/server";

// Autentificare pentru aplicația mobilă (Expo / React Native).
// Aplicația nativă nu poate folosi cookie-urile de sesiune ale site-ului, așa că
// emitem un token JWT semnat (HS256) cu același secret ca restul aplicației.
// Tokenul e trimis de aplicație în antetul `Authorization: Bearer <token>`.

const SECRET = process.env.AUTH_SECRET || "dev-secret-schimba-in-productie";
const DURATA_ZILE = 30;

export type TokenMobil = {
  sub: string; // id-ul utilizatorului
  role: string; // "CANDIDATE" | "EMPLOYER"
  exp: number; // expirare (secunde unix)
};

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

export function semneazaTokenMobil(userId: string, role: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + DURATA_ZILE * 24 * 60 * 60;
  const payload: TokenMobil = { sub: userId, role, exp };
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const semnatura = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${semnatura}`;
}

export function verificaTokenMobil(token: string): TokenMobil | null {
  const parti = token.split(".");
  if (parti.length !== 3) return null;
  const [h, p, semnatura] = parti;
  const data = `${h}.${p}`;
  const asteptat = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

  // comparație în timp constant (împotriva atacurilor de tip timing)
  const a = Buffer.from(semnatura);
  const b = Buffer.from(asteptat);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(p, "base64url").toString()) as TokenMobil;
    if (!payload.sub || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expirat
    return payload;
  } catch {
    return null;
  }
}

export function tokenDinRequest(req: NextRequest): string | null {
  const antet = req.headers.get("authorization");
  if (!antet) return null;
  const m = antet.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// Întoarce payload-ul tokenului valid din request sau null dacă lipsește/e invalid.
export function utilizatorDinRequest(req: NextRequest): TokenMobil | null {
  const token = tokenDinRequest(req);
  if (!token) return null;
  return verificaTokenMobil(token);
}
