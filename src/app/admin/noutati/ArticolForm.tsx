"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { adaugaArticolAction } from "../actions";

type State = { error?: string; success?: boolean } | undefined;

export default function ArticolForm() {
  const t = useTranslations("admin");
  const [state, action, pending] = useActionState<State, FormData>(
    adaugaArticolAction as (p: State, f: FormData) => Promise<State>,
    undefined
  );

  return (
    <form action={action} className="card mt-4 flex flex-col gap-3">
      <h2 className="field-label">{t("news.addTitle")}</h2>
      <input name="titlu" required placeholder={t("news.titlu")} className="input" />
      <textarea name="rezumat" required rows={3} placeholder={t("news.rezumat")} className="input" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input name="sursaNume" required placeholder={t("news.sursaNume")} className="input" />
        <input name="categorie" placeholder={t("news.categorie")} className="input" />
      </div>
      <input name="sursaUrl" type="url" required placeholder="https://sursa.ro/articol" className="input" />
      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("news.added")}</p>}
      <button type="submit" disabled={pending} className="btn-primary self-start">
        {t("news.addButton")}
      </button>
    </form>
  );
}
