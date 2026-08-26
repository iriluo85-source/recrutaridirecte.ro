"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { salveazaNotitaAction, type NotitaState } from "./actions";

export default function NoteEditor({
  candidateId,
  notita,
}: {
  candidateId: string;
  notita: string | null;
}) {
  const t = useTranslations("employer");
  const [state, action, pending] = useActionState<NotitaState, FormData>(
    salveazaNotitaAction,
    undefined
  );

  return (
    <form action={action} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="candidateId" value={candidateId} />
      <label className="field-label text-xs">{t("saved.noteLabel")}</label>
      <textarea
        name="notita"
        rows={2}
        defaultValue={notita ?? ""}
        placeholder={t("saved.notePlaceholder")}
        className="input text-sm"
      />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-secondary text-sm">
          {pending ? t("saved.noteSaving") : t("saved.noteSave")}
        </button>
        {state?.success && (
          <span className="text-xs text-emerald-500">{t("saved.noteSaved")}</span>
        )}
        {state?.error && <span className="text-xs text-red-500">{state.error}</span>}
      </div>
    </form>
  );
}
