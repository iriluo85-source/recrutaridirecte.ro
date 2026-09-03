"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gasestePlan } from "@/lib/planuri";
import { activeazaAbonament } from "@/lib/abonamente";
import { PLATI_ACTIVE, initiazaPlataNetopia } from "@/lib/netopia";

// Inițiază o plată reală prin Netopia: creează comanda (Payment PENDING), cere un
// paymentURL securizat și redirecționează userul pe pagina Netopia. Abonamentul se
// activează DOAR la confirmarea plății (IPN), în src/app/api/plata/netopia/confirmare.
export async function initiazaPlataNetopiaAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!PLATI_ACTIVE) redirect("/abonamente");

  const tip = String(formData.get("tip") || "");
  const plan = gasestePlan(session.user.role, tip);
  if (!plan || plan.tip === "FREE") redirect("/abonamente");

  const suma = plan.pretLunar; // deocamdată abonament lunar
  const orderId = `RD${Date.now()}${Math.random().toString(36).slice(2, 8)}`; // unic, alfanumeric

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { candidateProfile: true, employerProfile: true },
  });
  if (!user) redirect("/login");

  const nume = user.candidateProfile?.numeComplet || user.employerProfile?.numeCompanie || null;
  const oras = user.candidateProfile?.locatie || user.employerProfile?.locatie || null;

  await prisma.payment.create({
    data: { orderID: orderId, userId: user.id, planTip: plan.tip, suma, status: "PENDING" },
  });

  let url: string | null = null;
  try {
    url = await initiazaPlataNetopia({
      orderId,
      planTip: plan.tip,
      suma,
      billing: { email: user.email, phone: user.telefon, nume, oras },
    });
  } catch (e) {
    console.error("[plata] Inițierea Netopia a eșuat:", e);
    await prisma.payment.update({ where: { orderID: orderId }, data: { status: "FAILED" } }).catch(() => {});
  }

  if (!url) redirect("/abonamente?eroare=plata");
  redirect(url); // → pagina securizată Netopia (cardul nu atinge site-ul nostru)
}

// SIMULARE — activează un abonament FĂRĂ plată reală. Folosită DOAR cât timp plățile
// reale (Netopia) NU sunt configurate. Când PLATI_ACTIVE e true, e dezactivată complet
// (altfel ar fi o portiță de abonament gratis).
export async function activeazaAbonamentSimulareAction(formData: FormData) {
  if (PLATI_ACTIVE) return;

  const session = await auth();
  if (!session?.user) return;

  const tip = String(formData.get("tip") || "");
  const plan = gasestePlan(session.user.role, tip);
  if (!plan) return;

  await activeazaAbonament(session.user.id, plan.tip);

  revalidatePath("/abonamente");
  redirect("/abonamente?activat=1");
}

export async function anuleazaAbonamentAction() {
  const session = await auth();
  if (!session?.user) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { abonamentTip: null, abonamentExpira: null },
  });

  revalidatePath("/abonamente");
  redirect("/abonamente?anulat=1");
}
