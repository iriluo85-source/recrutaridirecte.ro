"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  raporteazaUtilizatorAction,
  blocheazaUtilizatorAction,
  deblocheazaUtilizatorAction,
  type FormState,
} from "@/app/moderare/actions";

export default function ModerareControls({
  targetUserId,
  blocat,
  cale,
}: {
  targetUserId: string;
  blocat: boolean;
  cale: string;
}) {
  const t = useTranslations("moderare");
  const [state, action, pending] = useActionState<FormState, FormData>(
    raporteazaUtilizatorAction,
    undefined
  );

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-sm">
      <div className="flex flex-wrap items-center gap-4">
        {blocat ? (
          <form action={deblocheazaUtilizatorAction}>
            <input type="hidden" name="targetUserId" value={targetUserId} />
            <input type="hidden" name="cale" value={cale} />
            <button type="submit" className="text-muted hover:text-foreground">
              {t("unblock")}
            </button>
          </form>
        ) : (
          <form action={blocheazaUtilizatorAction}>
            <input type="hidden" name="targetUserId" value={targetUserId} />
            <input type="hidden" name="cale" value={cale} />
            <button type="submit" className="text-red-500 hover:underline">
              {t("block")}
            </button>
          </form>
        )}

        <details>
          <summary className="cursor-pointer text-muted hover:text-foreground">
            {t("report")}
          </summary>
          <form action={action} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="targetUserId" value={targetUserId} />
            <select name="motiv" required className="input">
              <option value="">{t("reasonPlaceholder")}</option>
              <option value={t("reason.spam")}>{t("reason.spam")}</option>
              <option value={t("reason.harassment")}>{t("reason.harassment")}</option>
              <option value={t("reason.fake")}>{t("reason.fake")}</option>
              <option value={t("reason.other")}>{t("reason.other")}</option>
            </select>
            <textarea
              name="detalii"
              rows={2}
              placeholder={t("detailsPlaceholder")}
              className="input"
            />
            {state?.error && <p className="text-red-500">{state.error}</p>}
            {state?.success && <p className="text-emerald-500">{t("reportSuccess")}</p>}
            <button type="submit" disabled={pending} className="btn-secondary self-start">
              {t("sendReport")}
            </button>
          </form>
        </details>
      </div>
      {blocat && <p className="text-xs text-muted">{t("blockedNote")}</p>}
    </div>
  );
}
