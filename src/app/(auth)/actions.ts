"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth, signIn, signOut } from "@/auth";
import { sendEmail } from "@/lib/email";
import { creazaToken, gasesteToken, urlAplicatie } from "@/lib/tokens";

export type FormState = { error?: string; success?: boolean } | undefined;

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("auth");
  const registerSchema = z.object({
    email: z.string().email(t("errors.emailInvalid")),
    password: z.string().min(6, t("errors.passwordMin6")),
    role: z.enum(["CANDIDATE", "EMPLOYER"]),
  });

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  if (formData.get("acceptaTermeni") !== "on") {
    return { error: t("errors.mustAcceptTerms") };
  }

  const email = parsed.data.email.toLowerCase();
  const { password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: t("errors.emailTaken") };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      termeniAcceptatiLa: new Date(),
      newsletterEmail: formData.get("newsletter") === "on",
    },
  });

  try {
    const token = await creazaToken(user.id, "VERIFICARE_EMAIL", 24);
    await sendEmail({
      to: email,
      subject: "Confirmă-ți adresa de email — Recrutare Directă",
      html: `<p>Bun venit pe Recrutare Directă!</p><p><a href="${urlAplicatie(`/verifica-email?token=${token}`)}">Confirmă-ți adresa de email</a> (linkul expiră în 24 de ore).</p>`,
    });
  } catch {
    // trimiterea email-ului de confirmare nu trebuie să blocheze crearea contului
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("errors.autoLoginFailed") };
    }
    throw error;
  }

  redirect(role === "EMPLOYER" ? "/angajator/profil/editeaza" : "/candidat/profil/editeaza");
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("auth");
  const loginSchema = z.object({
    email: z.string().email(t("errors.emailInvalid")),
    password: z.string().min(1, t("errors.enterPassword")),
  });

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const email = parsed.data.email.toLowerCase();
  const { password } = parsed.data;
  const remember = formData.get("remember") === "on";

  const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });

  try {
    await signIn("credentials", { email, password, remember: String(remember), redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("errors.invalidCredentials") };
    }
    throw error;
  }

  redirect(user?.role === "EMPLOYER" ? "/angajator/profil" : "/candidat/profil");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogleAction() {
  await signIn("google", { redirectTo: "/alege-rol" });
}

export async function signInWithMicrosoftAction() {
  await signIn("microsoft-entra-id", { redirectTo: "/alege-rol" });
}

export async function requestPasswordResetAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("auth");
  const forgotPasswordSchema = z.object({
    email: z.string().email(t("errors.emailInvalid")),
  });

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    try {
      const token = await creazaToken(user.id, "RESET_PAROLA", 1);
      await sendEmail({
        to: email,
        subject: "Resetează-ți parola — Recrutare Directă",
        html: `<p>Ai cerut resetarea parolei.</p><p><a href="${urlAplicatie(`/reseteaza-parola?token=${token}`)}">Setează o parolă nouă</a> (linkul expiră în 1 oră).</p><p>Dacă nu ai cerut tu asta, ignoră acest email.</p>`,
      });
    } catch {
      // nu dezvăluim rezultatul trimiterii - mesajul afișat rămâne generic
    }
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("auth");
  const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(6, t("errors.passwordMin6")),
  });

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("errors.invalidData") };
  }

  const tokenRec = await gasesteToken(parsed.data.token, "RESET_PAROLA");
  if (!tokenRec) {
    return { error: t("errors.resetLinkExpired") };
  }
  const { user } = tokenRec;

  if (user.passwordHash) {
    const identica = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (identica) {
      return { error: t("errors.passwordMustDiffer") };
    }
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.token.delete({ where: { id: tokenRec.id } }),
  ]);

  redirect("/login");
}

export async function resendVerificationAction() {
  const session = await auth();
  if (!session?.user) return;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.emailVerificat) return;

  const token = await creazaToken(user.id, "VERIFICARE_EMAIL", 24);
  await sendEmail({
    to: user.email,
    subject: "Confirmă-ți adresa de email — Recrutare Directă",
    html: `<p><a href="${urlAplicatie(`/verifica-email?token=${token}`)}">Confirmă-ți adresa de email</a> (linkul expiră în 24 de ore).</p>`,
  });
}
