"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import MicrosoftButton from "@/components/MicrosoftButton";
import { registerAction } from "../actions";

export default function RegisterForm({
  defaultRole,
  googleEnabled,
  microsoftEnabled,
}: {
  defaultRole: "CANDIDATE" | "EMPLOYER";
  googleEnabled: boolean;
  microsoftEnabled: boolean;
}) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <div className="card">
      <h1 className="text-2xl font-semibold">{t("register.title")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("register.subtitle")}
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <fieldset className="flex gap-3">
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input
              type="radio"
              name="role"
              value="CANDIDATE"
              defaultChecked={defaultRole === "CANDIDATE"}
              className="accent-accent"
            />
            {t("register.iAmCandidate")}
          </label>
          <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input
              type="radio"
              name="role"
              value="EMPLOYER"
              defaultChecked={defaultRole === "EMPLOYER"}
              className="accent-accent"
            />
            {t("register.iAmEmployer")}
          </label>
        </fieldset>

        <input
          name="email"
          type="email"
          placeholder={t("register.emailPlaceholder")}
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
          placeholder={t("register.passwordPlaceholder")}
          autoComplete="new-password"
          required
          minLength={6}
          className="input"
        />

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptaTermeni"
            required
            className="mt-0.5 accent-accent"
          />
          <span>
            {t("register.agreePrefix")}{" "}
            <Link href="/termeni" target="_blank" className="text-accent hover:underline">
              {t("register.termsLink")}
            </Link>{" "}
            {t("register.and")}{" "}
            <Link href="/confidentialitate" target="_blank" className="text-accent hover:underline">
              {t("register.privacyLink")}
            </Link>
            .
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="newsletter" className="mt-0.5 accent-accent" />
          <span>{t("register.newsletter")}</span>
        </label>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? t("register.submitting") : t("register.submit")}
        </button>
      </form>

      {(googleEnabled || microsoftEnabled) && (
        <>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("register.or")}
            <span className="h-px flex-1 bg-line" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {googleEnabled && <GoogleButton />}
            {microsoftEnabled && <MicrosoftButton />}
          </div>
        </>
      )}

      <p className="mt-4 text-sm text-muted">
        {t("register.haveAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("register.signIn")}
        </Link>
      </p>
    </div>
  );
}
