"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { addDocumentAction, type DocumentFormState } from "../actions";

export default function AddDocumentForm() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<DocumentFormState, FormData>(
    async (prevState, formData) => {
      const result = await addDocumentAction(prevState, formData);
      if (result?.success) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
      <input
        name="eticheta"
        placeholder={t("documentNamePlaceholder")}
        required
        className="input"
      />
      <input
        type="file"
        name="fisier"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        required
        className="input"
      />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-500">{t("documentAddedSuccess")}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("loading") : t("addDocument")}
      </button>
    </form>
  );
}
