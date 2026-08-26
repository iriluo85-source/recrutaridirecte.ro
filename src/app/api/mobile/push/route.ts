import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { utilizatorDinRequest } from "@/lib/mobileAuth";

// POST /api/mobile/push — salvează tokenul Expo al telefonului + activează push
// Body JSON: { token }
export async function POST(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cerere invalidă." }, { status: 400 });
  }
  const token = (body.token || "").trim();
  if (!/^Expo(nent)?PushToken\[/.test(token)) {
    return NextResponse.json({ error: "Token invalid." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: u.sub },
    data: { pushToken: token, notificariPush: true },
  });
  return NextResponse.json({ success: true });
}

// DELETE /api/mobile/push — șterge tokenul (la deconectare)
export async function DELETE(req: NextRequest) {
  const u = utilizatorDinRequest(req);
  if (!u) return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  await prisma.user.update({ where: { id: u.sub }, data: { pushToken: null } });
  return NextResponse.json({ success: true });
}
