"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { requestPasswordResetAction } from "../actions";

export default function UitatParolaPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-semibold">{t("forgotPassword.title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("forgotPassword.subtitle")}
        </p>

        {state?.success ? (
          <p className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
            {t("forgotPassword.successMessage")}
          </p>
        ) : (
          <form action={formAction} className="mt-6 flex flex-col gap-4">
            <input
              name="email"
              type="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              required
              className="input"
            />
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? tc("sending") : t("forgotPassword.submit")}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">
            {t("forgotPassword.backToLogin")}
          </Link>
        </p>
      </div>
    </main>
  );
}
