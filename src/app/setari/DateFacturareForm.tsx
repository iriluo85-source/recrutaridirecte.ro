"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateDateFacturareAction, type FormState } from "./actions";

export default function DateFacturareForm({
  denumire,
  cui,
  adresa,
  esteAngajator,
}: {
  denumire: string | null;
  cui: string | null;
  adresa: string | null;
  esteAngajator: boolean;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateDateFacturareAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("billing.nameLabel")}</span>
        <input
          name="facturareDenumire"
          defaultValue={denumire ?? ""}
          placeholder={t("billing.namePlaceholder")}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("billing.cuiLabel")}</span>
        <input
          name="facturareCui"
          defaultValue={cui ?? ""}
          placeholder={t("billing.cuiPlaceholder")}
          autoCapitalize="characters"
          className="input"
        />
        {esteAngajator && (
          <span className="text-xs text-muted">{t("billing.cuiHint")}</span>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("billing.addressLabel")}</span>
        <input
          name="facturareAdresa"
          defaultValue={adresa ?? ""}
          placeholder={t("billing.addressPlaceholder")}
          className="input"
        />
      </label>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("billing.success")}</p>}

      <button type="submit" disabled={pending} className="btn-secondary self-start">
        {pending ? tc("saving") : tc("save")}
      </button>
    </form>
  );
}
