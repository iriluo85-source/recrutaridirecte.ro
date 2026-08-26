import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function creazaToken(userId: string, tip: string, oreValabilitate: number): Promise<string> {
  await prisma.token.deleteMany({ where: { userId, tip } });
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.token.create({
    data: {
      userId,
      tip,
      token,
      expiraLa: new Date(Date.now() + oreValabilitate * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function gasesteToken(token: string, tip: string) {
  const rec = await prisma.token.findUnique({ where: { token }, include: { user: true } });
  if (!rec || rec.tip !== tip || rec.expiraLa < new Date()) return null;
  return rec;
}

export async function consumaToken(token: string, tip: string) {
  const rec = await gasesteToken(token, tip);
  if (!rec) return null;
  await prisma.token.delete({ where: { id: rec.id } });
  return rec.user;
}

export function urlAplicatie(cale: string): string {
  const baza = process.env.APP_URL || "http://localhost:3000";
  return `${baza}${cale}`;
}
