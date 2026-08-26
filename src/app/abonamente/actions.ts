"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gasestePlan } from "@/lib/planuri";
import { activeazaAbonament } from "@/lib/abonamente";

// SIMULARE — activează un abonament FĂRĂ nicio plată reală. Nu primește și nu
// stochează niciun fel de date de card. La integrarea Netopia, plata se va face
// pe pagina lor securizată, iar abonamentul se va activa prin `activeazaAbonament`
// din endpoint-ul de confirmare (src/app/api/plata/netopia/confirmare), nu de aici.
export async function activeazaAbonamentSimulareAction(formData: FormData) {
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
