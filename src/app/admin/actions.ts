"use server";

import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stergeFisiereleUtilizatorului } from "@/lib/gdprCleanup";
import { trimiteDigestAngajatori } from "@/lib/digest";
import { trimiteNewsletter } from "@/lib/newsletter";

export async function deleteUserAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const userId = String(formData.get("userId") || "");
  if (!userId || userId === session.user.id) return;

  await stergeFisiereleUtilizatorului(userId);
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/utilizatori");
}

export async function rezolvaRaportAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  await prisma.report.update({
    where: { id },
    data: { rezolvat: true },
  });
  revalidatePath("/admin/rapoarte");
}

export async function aprobaTestimonialAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.testimonial.update({ where: { id }, data: { aprobat: true } });
  revalidatePath("/admin/testimoniale");
  revalidatePath("/testimoniale");
}

export async function stergeTestimonialAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.testimonial.delete({ where: { id } });
  revalidatePath("/admin/testimoniale");
  revalidatePath("/testimoniale");
}

export async function adaugaArticolAction(_prev: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return { error: "Neautorizat." };
  const titlu = String(formData.get("titlu") || "").trim();
  const rezumat = String(formData.get("rezumat") || "").trim();
  const sursaNume = String(formData.get("sursaNume") || "").trim();
  const sursaUrl = String(formData.get("sursaUrl") || "").trim();
  const categorie = String(formData.get("categorie") || "").trim() || null;
  if (!titlu || !rezumat || !sursaNume || !sursaUrl) {
    return { error: "Completează titlu, rezumat, sursă și link." };
  }
  await prisma.articol.create({ data: { titlu, rezumat, sursaNume, sursaUrl, categorie } });
  revalidatePath("/admin/noutati");
  revalidatePath("/noutati");
  return { success: true };
}

export async function stergeArticolAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.articol.delete({ where: { id } });
  revalidatePath("/admin/noutati");
  revalidatePath("/noutati");
}

export type DigestFormState = { message?: string; error?: string } | undefined;

export async function trimiteDigestAction(
  _prevState: DigestFormState,
  _formData: FormData
): Promise<DigestFormState> {
  const session = await auth();
  if (!session?.user?.isAdmin) return { error: "Neautorizat." };

  const t = await getTranslations("admin");
  const rezultat = await trimiteDigestAngajatori();
  return {
    message: t("digest.result", { trimise: rezultat.trimise, total: rezultat.totalOptIn }),
  };
}

export async function trimiteNewsletterAction(
  _prevState: DigestFormState,
  _formData: FormData
): Promise<DigestFormState> {
  const session = await auth();
  if (!session?.user?.isAdmin) return { error: "Neautorizat." };

  const t = await getTranslations("admin");
  const rezultat = await trimiteNewsletter();
  return {
    message: t("newsletter.result", { trimise: rezultat.trimise, total: rezultat.totalOptIn }),
  };
}

export type DocumentFormState = { error?: string; success?: boolean } | undefined;

const DOCUMENT_EXTENSII_PERMISE = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export async function addDocumentAction(
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return { error: t("errorUnauthorized") };
  }

  const eticheta = String(formData.get("eticheta") || "").trim();
  if (!eticheta) {
    return { error: t("errorNoName") };
  }

  const fisier = formData.get("fisier");
  if (!(fisier instanceof File) || fisier.size === 0) {
    return { error: t("errorNoFile") };
  }

  const ext = path.extname(fisier.name).toLowerCase();
  if (!DOCUMENT_EXTENSII_PERMISE.includes(ext)) {
    return { error: t("errorInvalidType") };
  }
  if (fisier.size > DOCUMENT_MAX_BYTES) {
    return { error: t("errorTooLarge") };
  }

  const uploadsDir = path.join(process.cwd(), "uploads", "admin");
  await mkdir(uploadsDir, { recursive: true });
  const fisierNume = `${Date.now()}${ext}`;
  const buffer = Buffer.from(await fisier.arrayBuffer());
  await writeFile(path.join(uploadsDir, fisierNume), buffer);

  await prisma.documentAdmin.create({ data: { eticheta, fisierNume } });

  revalidatePath("/admin/documente");
  return { success: true };
}

export async function deleteDocumentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  const doc = await prisma.documentAdmin.findUnique({ where: { id } });
  if (!doc) return;

  await prisma.documentAdmin.delete({ where: { id } });

  try {
    await unlink(path.join(process.cwd(), "uploads", "admin", doc.fisierNume));
  } catch {
    // fișierul poate fi deja lipsă
  }

  revalidatePath("/admin/documente");
}

// Setează manual abonamentul unui utilizator (admin). Folosit pentru conturi
// „comp" — ex. oferta „primii angajatori gratuit" sau conturi de demo.
// tip gol = fără abonament; altfel GOLD | PLATINUM | UNLIMITED, valabil `luni` luni.
export async function seteazaAbonamentAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.isAdmin) return;

  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  const tip = String(formData.get("tip") || "").trim();
  const TIPURI = ["GOLD", "PLATINUM", "UNLIMITED"];
  const luni = Math.min(36, Math.max(1, Number(formData.get("luni")) || 12));

  if (!tip) {
    await prisma.user.updateMany({
      where: { id: userId },
      data: { abonamentTip: null, abonamentExpira: null },
    });
  } else if (TIPURI.includes(tip)) {
    const expira = new Date(Date.now() + luni * 30 * 24 * 60 * 60 * 1000);
    await prisma.user.updateMany({
      where: { id: userId },
      data: { abonamentTip: tip, abonamentExpira: expira },
    });
  }

  revalidatePath("/admin/utilizatori");
}
