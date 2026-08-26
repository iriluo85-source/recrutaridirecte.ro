"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function setRoleAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = formData.get("role");
  if (role !== "CANDIDATE" && role !== "EMPLOYER") {
    return;
  }

  // termenii trebuie acceptați ca să poți finaliza contul (poarta pentru conturile OAuth)
  if (formData.get("acceptaTermeni") !== "on") {
    return;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role, termeniAcceptatiLa: new Date() },
  });

  await unstable_update({ user: { role } });

  redirect(role === "EMPLOYER" ? "/angajator/profil/editeaza" : "/candidat/profil/editeaza");
}
