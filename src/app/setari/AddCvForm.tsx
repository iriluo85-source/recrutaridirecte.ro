"use client";

import { useActionState } from "react";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { addCvAction, type FormState } from "@/app/candidat/actions";

export default function AddCvForm() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      const result = await addCvAction(prevState, formData);
      if (result?.success) formRef.current?.reset();
      return result;
    },
    undefined
  );

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
      <input
        name="eticheta"
        placeholder={t("addCv.namePlaceholder")}
        required
        className="input"
      />
      <input type="file" name="cv" accept=".pdf,.doc,.docx" required className="input" />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-500">{t("addCv.success")}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("loading") : t("addCv.submit")}
      </button>
    </form>
  );
}
