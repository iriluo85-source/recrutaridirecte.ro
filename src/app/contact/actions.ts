"use server";

import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { sendEmail } from "@/lib/email";
import { LEGAL_CONFIG } from "@/lib/legal";

export type FormState = { error?: string; success?: boolean } | undefined;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function trimiteContactAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const t = await getTranslations("contact");
  const schema = z.object({
    nume: z.string().trim().min(2),
    email: z.string().email(),
    mesaj: z.string().trim().min(10),
  });
  const parsed = schema.safeParse({
    nume: formData.get("nume"),
    email: formData.get("email"),
    mesaj: formData.get("mesaj"),
  });
  if (!parsed.success) return { error: t("errorInvalid") };

  const { nume, email, mesaj } = parsed.data;
  const trimis = await sendEmail({
    to: LEGAL_CONFIG.emailContact,
    subject: `Mesaj de contact de la ${nume}`,
    html: `<p><strong>De la:</strong> ${esc(nume)} (${esc(email)})</p><p>${esc(mesaj).replace(/\n/g, "<br/>")}</p>`,
    replyTo: email,
  });
  if (!trimis) {
    return { error: t("errorSend") };
  }
  return { success: true };
}
