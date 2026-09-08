"use server";

import path from "node:path";
import { unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { esteAdminEmail } from "@/lib/admin";
import { trimiteEmailStudentValidat, trimiteEmailStudentRespins } from "@/lib/email";

async function cereAdmin(): Promise<string> {
  const session = await auth();
  const esteAdmin = session?.user?.isAdmin || esteAdminEmail(session?.user?.email);
  if (!session?.user || !esteAdmin) throw new Error("Neautorizat");
  return session.user.email ?? session.user.id;
}

/**
 * Aprobă sau respinge o cerere. În ambele cazuri poza se șterge de pe disc:
 * după decizie nu mai are cine să se uite la ea, iar rândul rămâne ca dovadă.
 */
export async function decideStudentAction(formData: FormData) {
  const cineDecide = await cereAdmin();

  const id = String(formData.get("id") || "");
  const decizie = String(formData.get("decizie") || "");
  const motiv = String(formData.get("motiv") || "").trim().slice(0, 300);
  if (!id || !["VALIDAT", "RESPINS"].includes(decizie)) return;

  const cerere = await prisma.studentVerificare.findUnique({
    where: { id },
    select: { fisier: true, status: true, user: { select: { email: true } } },
  });
  if (!cerere || cerere.status !== "IN_ASTEPTARE") return;

  await prisma.studentVerificare.update({
    where: { id },
    data: {
      status: decizie as "VALIDAT" | "RESPINS",
      motivRespingere: decizie === "RESPINS" ? motiv || null : null,
      fisier: null,
      decisLa: new Date(),
      decisDe: cineDecide,
    },
  });

  if (cerere.fisier) {
    await unlink(path.join(process.cwd(), "uploads", "student", cerere.fisier)).catch(() => {});
  }

  if (cerere.user?.email) {
    try {
      if (decizie === "VALIDAT") {
        await trimiteEmailStudentValidat(cerere.user.email);
      } else {
        await trimiteEmailStudentRespins(cerere.user.email, motiv || null);
      }
    } catch (e) {
      console.error("[student] Emailul de decizie nu a putut fi trimis:", e);
    }
  }

  revalidatePath("/admin/studenti");
}
