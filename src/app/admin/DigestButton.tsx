"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { trimiteDigestAction, type DigestFormState } from "./actions";

export default function DigestButton() {
  const t = useTranslations("admin");
  const [state, formAction, pending] = useActionState<DigestFormState, FormData>(
    trimiteDigestAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-2">
      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? t("digest.sending") : t("digest.button")}
      </button>
      {state?.message && <p className="text-sm text-emerald-500">{state.message}</p>}
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
