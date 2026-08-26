"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changeEmailAction, type FormState } from "./actions";

export default function ChangeEmailForm({ areParola }: { areParola: boolean }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changeEmailAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("changeEmail.newEmailLabel")}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          required
          className="input"
        />
      </label>
      {areParola && (
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("currentPasswordLabel")}</span>
          <input
            name="parola"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </label>
      )}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-500">
          {t("changeEmail.success")}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? tc("saving") : t("changeEmail.submit")}
      </button>
    </form>
  );
}
