"use client";

import { useActionState, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { sendOfferAction } from "../../actions";
import type { FormState } from "../../actions";

export default function OfferForm({ conversationId }: { conversationId: string }) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const [deschis, setDeschis] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const result = await sendOfferAction(prevState, formData);
      if (result?.success) {
        formRef.current?.reset();
        setDeschis(false);
      }
      return result;
    },
    undefined
  );

  if (!deschis) {
    return (
      <button type="button" onClick={() => setDeschis(true)} className="btn-primary self-start">
        {t("offer.openButton")}
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="card flex flex-col gap-3">
      <h2 className="field-label">{t("offer.heading")}</h2>
      <input type="hidden" name="conversationId" value={conversationId} />
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("offer.jobTitle")}</span>
        <input name="titluPost" required placeholder={t("offer.jobTitlePlaceholder")} className="input" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("offer.description")}</span>
        <textarea
          name="descriere"
          rows={4}
          required
          placeholder={t("offer.descriptionPlaceholder")}
          className="input"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("offer.salaryLabel")}</span>
          <input name="salariu" type="number" min="0" placeholder={t("offer.salaryPlaceholder")} className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("offer.location")}</span>
          <input name="locatie" placeholder={t("offer.locationPlaceholder")} className="input" />
        </label>
      </div>
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? tc("sending") : t("offer.submit")}
        </button>
        <button
          type="button"
          onClick={() => setDeschis(false)}
          className="btn-secondary self-start"
        >
          {tc("cancel")}
        </button>
      </div>
    </form>
  );
}
