"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { startConversationAction, type FormState } from "../../actions";

export default function InterestForm({ candidateId }: { candidateId: string }) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    startConversationAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 border-t border-line pt-6">
      <input type="hidden" name="candidateId" value={candidateId} />
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("interest.label")}</span>
        <textarea
          name="mesaj"
          rows={4}
          required
          placeholder={t("interest.placeholder")}
          className="input"
        />
      </label>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("sending") : t("interest.submit")}
      </button>
    </form>
  );
}
