"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import MicrosoftButton from "@/components/MicrosoftButton";
import { loginAction } from "../actions";

export default function LoginForm({
  googleEnabled,
  microsoftEnabled,
}: {
  googleEnabled: boolean;
  microsoftEnabled: boolean;
}) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">{t("login.title")}</h1>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input
          name="email"
          type="email"
          placeholder={t("login.emailPlaceholder")}
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          required
          className="input"
        />
        <input
          name="password"
          type="password"
          placeholder={t("login.passwordPlaceholder")}
          autoComplete="current-password"
          required
          className="input"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="remember" defaultChecked className="accent-accent" />
            {t("login.rememberMe")}
          </label>
          <Link href="/uitat-parola" className="text-sm text-muted hover:text-accent hover:underline">
            {t("login.forgotPassword")}
          </Link>
        </div>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      {(googleEnabled || microsoftEnabled) && (
        <>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("login.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {googleEnabled && <GoogleButton />}
            {microsoftEnabled && <MicrosoftButton />}
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-muted">
        {t("login.noAccount")}{" "}
        <Link href="/inregistrare" className="text-accent hover:underline">
          {t("login.createOne")}
        </Link>
      </p>
    </div>
  );
}
