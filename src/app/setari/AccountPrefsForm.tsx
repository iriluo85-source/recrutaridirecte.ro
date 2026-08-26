"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateAccountPrefsAction, type FormState } from "./actions";

export default function AccountPrefsForm({ telefon }: { telefon: string | null }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateAccountPrefsAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("prefs.phoneLabel")}</span>
        <input
          name="telefon"
          type="tel"
          defaultValue={telefon ?? ""}
          placeholder={t("prefs.phonePlaceholder")}
          className="input"
        />
      </label>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("prefs.success")}</p>}

      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? tc("saving") : tc("save")}
      </button>
    </form>
  );
}
