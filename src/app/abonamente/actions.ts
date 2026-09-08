"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gasestePlan, perioadaValida, pretPerioada } from "@/lib/planuri";
import { activeazaAbonament } from "@/lib/abonamente";
import { platiActive, initiazaPlataNetopia } from "@/lib/netopia";
import { gasestePachet } from "@/lib/credite";
import { reducereStudent, cuReducereStudent } from "@/lib/student";

// Inițiază o plată reală prin Netopia: creează comanda (Payment PENDING), cere un
// paymentURL securizat și redirecționează userul pe pagina Netopia. Abonamentul se
// activează DOAR la confirmarea plății (IPN), în src/app/api/plata/netopia/confirmare.
export async function initiazaPlataNetopiaAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!platiActive()) redirect("/abonamente");

  const tip = String(formData.get("tip") || "");
  const plan = gasestePlan(session.user.role, tip);
  if (!plan || plan.tip === "FREE") redirect("/abonamente");

  // Se încasează TOTALUL pe perioada aleasă, nu prețul unei luni. Aceleași funcții
  // ca pe pagina de prețuri (pretPerioada + cuReducereStudent), ca suma afișată și
  // cea trasă de pe card să fie identice.
  const perioada = perioadaValida(String(formData.get("perioada") || ""));
  const pretRedus = cuReducereStudent(plan.pretLunar, await reducereStudent(session.user.id));
  const pp = pretPerioada(pretRedus, perioada);
  const suma = pp.total;
  const orderId = `RD${Date.now()}${Math.random().toString(36).slice(2, 8)}`; // unic, alfanumeric

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { candidateProfile: true, employerProfile: true },
  });
  if (!user) redirect("/login");

  const nume = user.candidateProfile?.numeComplet || user.employerProfile?.numeCompanie || null;
  const oras = user.candidateProfile?.locatie || user.employerProfile?.locatie || null;

  await prisma.payment.create({
    data: { orderID: orderId, userId: user.id, planTip: plan.tip, suma, luni: pp.luni, status: "PENDING" },
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

// Cumpărarea unui pachet de credite (răspunsuri deblocate). Merge pe exact
// același drum ca abonamentul — Payment PENDING → Netopia → IPN — doar că la
// confirmare se adaugă credite în loc să se activeze un abonament.
export async function initiazaPlataCrediteAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "EMPLOYER") redirect("/abonamente");
  if (!platiActive()) redirect("/abonamente");

  const pachet = gasestePachet(String(formData.get("pachet") || ""));
  if (!pachet) redirect("/abonamente");

  const orderId = `RD${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { employerProfile: true },
  });
  if (!user) redirect("/login");

  // Creditele se atașează profilului de companie. Fără el, plata ar trece, factura
  // ar pleca, iar creditele n-ar avea unde să se ducă — firma ar rămâne cu paguba.
  // Oprim ÎNAINTE de plată, nu după.
  if (!user.employerProfile) redirect("/angajator/profil/editeaza?nevoie=credite");

  await prisma.payment.create({
    data: {
      orderID: orderId,
      userId: user.id,
      planTip: pachet.id,
      suma: pachet.pret,
      status: "PENDING",
    },
  });

  let url: string | null = null;
  try {
    url = await initiazaPlataNetopia({
      orderId,
      planTip: pachet.id,
      suma: pachet.pret,
      billing: {
        email: user.email,
        phone: user.telefon,
        nume: user.employerProfile?.numeCompanie ?? null,
        oras: user.employerProfile?.locatie ?? null,
      },
    });
  } catch (e) {
    console.error("[plata] Inițierea Netopia pentru credite a eșuat:", e);
    await prisma.payment
      .update({ where: { orderID: orderId }, data: { status: "FAILED" } })
      .catch(() => {});
  }

  if (!url) redirect("/abonamente?eroare=plata");
  redirect(url);
}

// SIMULARE — activează un abonament FĂRĂ plată reală. Folosită DOAR cât timp plățile
// reale (Netopia) NU sunt configurate. Când PLATI_ACTIVE e true, e dezactivată complet
// (altfel ar fi o portiță de abonament gratis).
export async function activeazaAbonamentSimulareAction(formData: FormData) {
  if (platiActive()) return;

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
