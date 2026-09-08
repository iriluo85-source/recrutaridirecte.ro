import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConversationForUser } from "@/lib/chat";
import { deblocheazaConversatie, areRaspunsDeLaCandidat } from "@/lib/credite";

// POST /api/mesaje/[id]/deblocheaza — consumă un credit (sau cota gratuită
// lunară) ca să deschidă răspunsurile candidatului din conversație.
// Deblocarea e explicită: firma apasă un buton, nu e taxată fiindcă a dat
// din greșeală click pe o conversație.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
  }

  const { id } = await params;
  const access = await getConversationForUser(id, session.user.id);
  if (!access || !access.isEmployer) {
    return NextResponse.json({ error: "Neautorizat" }, { status: 403 });
  }

  // Nu lăsăm o firmă să cheltuiască un credit pe o conversație în care nimeni
  // nu i-a răspuns încă — n-ar avea ce debloca.
  if (!(await areRaspunsDeLaCandidat(id))) {
    return NextResponse.json({ error: "Nu există niciun răspuns." }, { status: 400 });
  }

  const rezultat = await deblocheazaConversatie(access.conversation.employerId, id);

  if (!rezultat.ok) {
    return NextResponse.json({ error: "FARA_CREDITE" }, { status: 402 });
  }

  return NextResponse.json({ ok: true, cost: rezultat.cost, soldCredite: rezultat.soldRamas });
}
