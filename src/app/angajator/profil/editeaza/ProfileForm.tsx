"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateEmployerProfileAction, type FormState } from "../../actions";
import { MARIME_COMPANIE_OPTIONS } from "@/lib/constants";
import { DOMENII } from "@/lib/domenii";

type ProfileData = {
  numeCompanie: string;
  industrie: string | null;
  locatie: string | null;
  marimeCompanie: string | null;
  website: string | null;
  linkedin: string | null;
  anFondare: number | null;
  beneficii: string | null;
  descriere: string | null;
  cautamGeneral: string | null;
  domeniiInteres: string | null;
};

export default function ProfileForm({ profile }: { profile: ProfileData | null }) {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const domeniiSelectate = (profile?.domeniiInteres ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateEmployerProfileAction,
    undefined
  );

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("profileEdit.companyName")}</span>
        <input name="numeCompanie" defaultValue={profile?.numeCompanie} required className="input" />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("profileEdit.industry")}</span>
          <input
            name="industrie"
            defaultValue={profile?.industrie ?? ""}
            placeholder={t("profileEdit.industryPlaceholder")}
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">{t("profileEdit.location")}</span>
          <input
            name="locatie"
            defaultValue={profile?.locatie ?? ""}
            placeholder={t("profileEdit.locationPlaceholder")}
            className="input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("profileEdit.companySize")}</span>
          <select name="marimeCompanie" defaultValue={profile?.marimeCompanie ?? ""} className="input">
            <option value="">{tc("unspecified")}</option>
            {MARIME_COMPANIE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t("profileEdit.employeesOption", { size: m })}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">{t("profileEdit.website")}</span>
          <input
            name="website"
            type="url"
            defaultValue={profile?.website ?? ""}
            placeholder="https://compania-ta.ro"
            className="input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">
            {t("profileEdit.linkedin")} <span className="text-muted">({t("profileEdit.optional")})</span>
          </span>
          <input
            name="linkedin"
            type="url"
            defaultValue={profile?.linkedin ?? ""}
            placeholder="https://linkedin.com/company/..."
            className="input"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">
            {t("profileEdit.foundedYear")} <span className="text-muted">({t("profileEdit.optional")})</span>
          </span>
          <input
            name="anFondare"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            defaultValue={profile?.anFondare ?? ""}
            placeholder="2018"
            className="input"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="field-label">
          {t("profileEdit.benefits")} <span className="text-muted">({t("profileEdit.optional")})</span>
        </span>
        <textarea
          name="beneficii"
          defaultValue={profile?.beneficii ?? ""}
          rows={3}
          placeholder={t("profileEdit.benefitsPlaceholder")}
          className="input"
        />
        <span className="text-xs text-muted">{t("profileEdit.benefitsHint")}</span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("profileEdit.aboutCompany")}</span>
        <textarea
          name="descriere"
          defaultValue={profile?.descriere ?? ""}
          rows={4}
          placeholder={t("profileEdit.aboutPlaceholder")}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("profileEdit.rolesSought")}</span>
        <textarea
          name="cautamGeneral"
          defaultValue={profile?.cautamGeneral ?? ""}
          rows={3}
          placeholder={t("profileEdit.rolesPlaceholder")}
          className="input"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="field-label">{t("profileEdit.domainsLabel")}</legend>
        <p className="text-xs text-muted">{t("profileEdit.domainsHint")}</p>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DOMENII.map((d) => (
            <label key={d.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="domenii"
                value={d.slug}
                defaultChecked={domeniiSelectate.includes(d.slug)}
                className="accent-accent"
              />
              {d.emoji} {th("categories." + d.nameKey)}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("profileEdit.savedSuccess")}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("saving") : t("profileEdit.submit")}
      </button>
    </form>
  );
}
