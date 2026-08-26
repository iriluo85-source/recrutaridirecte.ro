import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// GET /api/mobile/setari — datele contului + preferințele de notificare
export async function GET(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: u.sub },
    select: {
      email: true,
      telefon: true,
      notificariEmail: true,
      notificariPush: true,
      emailuriDigest: true,
      newsletterEmail: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Cont inexistent." }, { status: 404 });

  return NextResponse.json(user);
}

// POST /api/mobile/setari — actualizează preferințele de notificare
// Body JSON: orice subset din { notificariEmail, notificariPush, emailuriDigest, newsletterEmail }
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }

  const data: Record<string, boolean> = {};
  for (const cheie of ["notificariEmail", "notificariPush", "emailuriDigest", "newsletterEmail"]) {
    if (typeof body[cheie] === "boolean") data[cheie] = body[cheie] as boolean;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: u.sub }, data });

  return NextResponse.json({ success: true });
}
