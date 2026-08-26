"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getEmployerId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.role !== "EMPLOYER") return null;
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return employer?.id ?? null;
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export async function salveazaCautareAction(formData: FormData) {
  const employerId = await getEmployerId();
  if (!employerId) return;

  const nume = strOrNull(formData.get("nume"));
  if (!nume) return;

  await prisma.savedSearch.create({
    data: {
      employerId,
      nume,
      skills: strOrNull(formData.get("skills")),
      locatie: strOrNull(formData.get("locatie")),
      experientaMin: intOrNull(formData.get("experientaMin")),
      experientaMax: intOrNull(formData.get("experientaMax")),
      bugetMin: intOrNull(formData.get("bugetMin")),
      bugetMax: intOrNull(formData.get("bugetMax")),
      domeniu: strOrNull(formData.get("domeniu")),
    },
  });
  revalidatePath("/angajator/cautare");
}

export async function stergeCautareAction(formData: FormData) {
  const employerId = await getEmployerId();
  if (!employerId) return;
  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.savedSearch.deleteMany({ where: { id, employerId } });
  revalidatePath("/angajator/cautare");
}
