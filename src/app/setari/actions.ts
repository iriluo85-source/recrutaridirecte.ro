"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut, unstable_update } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { creazaToken, urlAplicatie } from "@/lib/tokens";
import { stergeFisiereleUtilizatorului } from "@/lib/gdprCleanup";
import { Prisma } from "@/generated/prisma/client";

export type FormState = { error?: string; success?: boolean } | undefined;

const changeEmailSchema = z.object({
  email: z.string().email("Email invalid"),
});

export async function changeEmailAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  const parsed = changeEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: t("errors.invalidEmail") };
  }
  const emailNou = parsed.data.email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: t("errors.accountNotFound") };
  }

  if (emailNou === user.email) {
    return { error: t("errors.emailAlreadyYours") };
  }

  const existing = await prisma.user.findUnique({ where: { email: emailNou } });
  if (existing) {
    return { error: t("errors.emailInUse") };
  }

  if (user.passwordHash) {
    const parola = String(formData.get("parola") || "");
    const valid = await bcrypt.compare(parola, user.passwordHash);
    if (!valid) {
      return { error: t("errors.incorrectPassword") };
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: emailNou, emailVerificat: false },
  });

  try {
    const token = await creazaToken(user.id, "VERIFICARE_EMAIL", 24);
    await sendEmail({
      to: emailNou,
      subject: t("changeEmail.emailSubject"),
      html: `<p>${t("changeEmail.emailIntro")}</p><p><a href="${urlAplicatie(`/verifica-email?token=${token}`)}">${t("changeEmail.emailConfirmLinkText")}</a> (${t("changeEmail.emailExpiryNote")}).</p>`,
    });
  } catch {
    // nu blocăm schimbarea emailului dacă trimiterea eșuează
  }

  await unstable_update({ user: { email: emailNou, emailVerificat: false } });

  return { success: true };
}

// Schimbarea parolei din cont (logat). Diferit de resetarea prin email.
// Pentru conturile fără parolă (Google), permite setarea unei parole noi.
export async function changePasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: t("errors.accountNotFound") };
  }

  const parolaNoua = String(formData.get("parolaNoua") || "");
  const confirmare = String(formData.get("confirmare") || "");

  if (parolaNoua.length < 6) {
    return { error: t("errors.passwordMin6") };
  }
  if (parolaNoua !== confirmare) {
    return { error: t("errors.passwordsDontMatch") };
  }

  if (user.passwordHash) {
    const parolaCurenta = String(formData.get("parolaCurenta") || "");
    const valid = await bcrypt.compare(parolaCurenta, user.passwordHash);
    if (!valid) {
      return { error: t("errors.incorrectPassword") };
    }
    const identica = await bcrypt.compare(parolaNoua, user.passwordHash);
    if (identica) {
      return { error: t("errors.passwordMustDiffer") };
    }
  }

  const passwordHash = await bcrypt.hash(parolaNoua, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { success: true };
}

const prefsSchema = z.object({
  telefon: z.string().trim().max(30).optional(),
});

export async function updateAccountPrefsAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  const parsed = prefsSchema.safeParse({
    telefon: formData.get("telefon") || undefined,
  });
  if (!parsed.success) {
    return { error: t("errors.invalidData") };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        telefon: parsed.data.telefon || null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: t("errors.phoneInUse") };
    }
    throw error;
  }

  revalidatePath("/setari");
  return { success: true };
}

export async function updateDateFacturareAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  const str = (k: string) => String(formData.get(k) || "").trim();
  const denumire = str("facturareDenumire");
  const cui = str("facturareCui");
  const adresa = str("facturareAdresa");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      facturareDenumire: denumire || null,
      facturareCui: cui || null,
      facturareAdresa: adresa || null,
    },
  });

  revalidatePath("/setari");
  return { success: true };
}

export async function updateNotificationPrefsAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      notificariEmail: formData.get("notificariEmail") === "on",
      notificariPush: formData.get("notificariPush") === "on",
      emailuriDigest: formData.get("emailuriDigest") === "on",
      newsletterEmail: formData.get("newsletterEmail") === "on",
    },
  });

  revalidatePath("/setari");
  return { success: true };
}

const CONFIRMARE_STERGERE_CONT = "ȘTERGE CONTUL";

export async function deleteAccountAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("settings");
  const session = await auth();
  if (!session?.user) {
    return { error: t("errors.mustBeAuthenticated") };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { error: t("errors.accountNotFound") };
  }

  if (user.isAdmin) {
    return { error: t("errors.adminCannotDelete") };
  }

  const confirmare = String(formData.get("confirmare") || "").trim();
  if (confirmare !== CONFIRMARE_STERGERE_CONT) {
    return { error: t("errors.mustTypeExact", { phrase: CONFIRMARE_STERGERE_CONT }) };
  }

  if (user.passwordHash) {
    const parola = String(formData.get("parola") || "");
    const valid = await bcrypt.compare(parola, user.passwordHash);
    if (!valid) {
      return { error: t("errors.incorrectPassword") };
    }
  }

  await stergeFisiereleUtilizatorului(user.id);
  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirect: false });
  redirect("/?cont-sters=1");
}
