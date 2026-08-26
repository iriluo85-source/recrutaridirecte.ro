"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changePasswordAction, type FormState } from "./actions";

export default function ChangePasswordForm({ areParola }: { areParola: boolean }) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    changePasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      {!areParola && (
        <p className="text-xs text-muted">{t("changePassword.setNote")}</p>
      )}
      {areParola && (
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("currentPasswordLabel")}</span>
          <input
            name="parolaCurenta"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </label>
      )}
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("changePassword.newPasswordLabel")}</span>
        <input
          name="parolaNoua"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("changePassword.confirmLabel")}</span>
        <input
          name="confirmare"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className="input"
        />
      </label>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-500">{t("changePassword.success")}</p>
      )}
      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? tc("saving") : t("changePassword.submit")}
      </button>
    </form>
  );
}
