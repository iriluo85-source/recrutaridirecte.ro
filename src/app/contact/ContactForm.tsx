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

  // Confirmare clară după trimitere reușită (înlocuiește formularul).
  if (state?.success) {
    return (
      <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-8 text-center">
        <div className="text-4xl" aria-hidden="true">✅</div>
        <p className="mt-3 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
          {t("successTitle")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("success")}</p>
      </div>
    );
  }

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
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("sending") : t("send")}
      </button>
    </form>
  );
}
