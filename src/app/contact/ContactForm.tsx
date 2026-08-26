"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { trimiteContactAction, type FormState } from "./actions";

export default function ContactForm() {
  const t = useTranslations("contact");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState<FormState, FormData>(
    trimiteContactAction,
    undefined
  );

  return (
    <form action={action} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("name")}</span>
        <input name="nume" required className="input" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("email")}</span>
        <input
          name="email"
          type="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          required
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("message")}</span>
        <textarea name="mesaj" rows={5} required className="input" />
      </label>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("success")}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("sending") : t("send")}
      </button>
    </form>
  );
}
