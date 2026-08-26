"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccountAction, type FormState } from "./actions";

export default function DeleteAccountForm({
  areParola,
  isAdmin,
}: {
  areParola: boolean;
  isAdmin: boolean;
}) {
  const t = useTranslations("settings");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    deleteAccountAction,
    undefined
  );

  if (isAdmin) {
    return (
      <p className="mt-4 text-sm text-muted">
        {t("delete.adminCannotDelete")}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <p className="text-sm text-muted">
        {t.rich("delete.warning", {
          phrase: "ȘTERGE CONTUL",
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
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
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("delete.confirmationLabel")}</span>
        <input name="confirmare" type="text" required className="input" />
      </label>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-secondary self-start border-red-500 text-red-500 hover:bg-red-500/10"
      >
        {pending ? t("delete.deleting") : t("delete.submit")}
      </button>
    </form>
  );
}
