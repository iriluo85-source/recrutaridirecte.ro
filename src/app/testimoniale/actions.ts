"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function trimiteTestimonialAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("testimonials");
  const session = await auth();
  if (!session?.user?.role) return { error: t("errorAuth") };

  const rating = Number(formData.get("rating") || 0);
  const text = String(formData.get("text") || "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || text.length < 10) {
    return { error: t("errorInvalid") };
  }

  // numele afișat = numele profilului (candidat sau companie)
  let nume = session.user.email?.split("@")[0] ?? "Utilizator";
  if (session.user.role === "CANDIDATE") {
    const p = await prisma.candidateProfile.findUnique({
      where: { userId: session.user.id },
      select: { numeComplet: true },
    });
    if (p?.numeComplet) nume = p.numeComplet;
  } else {
    const e = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { numeCompanie: true },
    });
    if (e?.numeCompanie) nume = e.numeCompanie;
  }

  await prisma.testimonial.create({
    data: {
      userId: session.user.id,
      nume,
      rol: session.user.role,
      rating,
      text,
      aprobat: false,
    },
  });

  revalidatePath("/testimoniale");
  return { success: true };
}
