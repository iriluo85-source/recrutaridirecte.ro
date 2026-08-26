"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { resetPasswordAction } from "../actions";

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState(resetPasswordAction, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <input
        name="password"
        type="password"
        placeholder={t("resetPassword.passwordPlaceholder")}
        autoComplete="new-password"
        required
        minLength={6}
        className="input"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? tc("saving") : t("resetPassword.submit")}
      </button>
    </form>
  );
}
