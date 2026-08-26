"use client";

import { useTranslations } from "next-intl";
import {
  salveazaCandidatAction,
  eliminaCandidatSalvatAction,
} from "@/app/angajator/salvati/actions";

export default function SaveCandidateButton({
  candidateId,
  saved,
  cale,
}: {
  candidateId: string;
  saved: boolean;
  cale: string;
}) {
  const t = useTranslations("employer");

  if (saved) {
    return (
      <form action={eliminaCandidatSalvatAction}>
        <input type="hidden" name="candidateId" value={candidateId} />
        <input type="hidden" name="cale" value={cale} />
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-500/20 dark:text-amber-400"
        >
          ★ {t("saved.savedButton")}
        </button>
      </form>
    );
  }

  return (
    <form action={salveazaCandidatAction}>
      <input type="hidden" name="candidateId" value={candidateId} />
      <input type="hidden" name="cale" value={cale} />
      <button type="submit" className="btn-secondary inline-flex items-center gap-2">
        ☆ {t("saved.saveButton")}
      </button>
    </form>
  );
}
