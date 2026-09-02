"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { updateCandidateProfileAction, type FormState } from "../../actions";
import { pentruInputData } from "@/lib/varsta";

const DISPONIBILITATE_VALUES = ["IMEDIATA", "SUB_O_LUNA", "PESTE_O_LUNA"] as const;
const SEX_VALUES = ["Masculin", "Feminin", "Altul"] as const;
const STUDII_NIVEL_VALUES = ["LICEU", "POSTLICEAL", "LICENTA", "MASTER", "DOCTORAT", "ALTELE"] as const;
const STUDII_STATUS_VALUES = ["IN_CURS", "FINALIZAT"] as const;

type ProfileData = {
  id: string;
  numeComplet: string;
  locatie: string;
  remote: boolean;
  aniExperienta: number;
  titluCurent: string;
  bio: string | null;
  salariuMinim: number | null;
  salariuMaxim: number | null;
  dataNasterii: Date | string | null;
  sex: string | null;
  studiiNivel: string | null;
  studiiSpecializare: string | null;
  studiiInstitutie: string | null;
  studiiAn: number | null;
  studiiStatus: string | null;
  pozaFisier: string | null;
  disponibilitate: string;
  skills: { skill: { nume: string } }[];
};

export default function ProfileForm({ profile }: { profile: ProfileData | null }) {
  const t = useTranslations("candidate");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateCandidateProfileAction,
    undefined
  );

  const skillsValue = profile?.skills.map((s) => s.skill.nume).join(", ") ?? "";

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="field-label">{t("fullName")}</span>
        <input name="numeComplet" defaultValue={profile?.numeComplet} required className="input" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("currentTitle")}</span>
        <input
          name="titluCurent"
          defaultValue={profile?.titluCurent}
          required
          placeholder={t("currentTitlePlaceholder")}
          className="input"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("location")}</span>
          <input
            name="locatie"
            defaultValue={profile?.locatie}
            required
            placeholder={t("locationPlaceholder")}
            className="input"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5">
          <input type="checkbox" name="remote" defaultChecked={profile?.remote} className="accent-accent" />
          <span className="text-sm">{t("availableForRemote")}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("yearsExperience")}</span>
          <input
            type="number"
            name="aniExperienta"
            min={0}
            max={60}
            defaultValue={profile?.aniExperienta ?? 0}
            required
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("availability")}</span>
          <select
            name="disponibilitate"
            defaultValue={profile?.disponibilitate ?? "SUB_O_LUNA"}
            className="input"
          >
            {DISPONIBILITATE_VALUES.map((v) => (
              <option key={v} value={v}>
                {tc("disponibilitate." + v)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("minSalary")}</span>
          <input
            type="number"
            name="salariuMinim"
            min={0}
            defaultValue={profile?.salariuMinim ?? ""}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("maxSalary")}</span>
          <input
            type="number"
            name="salariuMaxim"
            min={0}
            defaultValue={profile?.salariuMaxim ?? ""}
            className="input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("birthDate")} <span className="text-muted">({t("optional")})</span></span>
          <input
            type="date"
            name="dataNasterii"
            defaultValue={pentruInputData(profile?.dataNasterii)}
            className="input"
          />
          <span className="text-xs text-muted">{t("birthDateHint")}</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("sex")} <span className="text-muted">({t("optional")})</span></span>
          <select name="sex" defaultValue={profile?.sex ?? ""} className="input">
            <option value="">{tc("unspecified")}</option>
            {SEX_VALUES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="field-label px-1">
          {tc("studii.title")} <span className="text-muted">({t("optional")})</span>
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">{tc("studii.level")}</span>
            <select name="studiiNivel" defaultValue={profile?.studiiNivel ?? ""} className="input">
              <option value="">{tc("unspecified")}</option>
              {STUDII_NIVEL_VALUES.map((v) => (
                <option key={v} value={v}>
                  {tc("studii.nivel." + v)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">{tc("studii.status")}</span>
            <select
              name="studiiStatus"
              defaultValue={profile?.studiiStatus ?? "FINALIZAT"}
              className="input"
            >
              {STUDII_STATUS_VALUES.map((v) => (
                <option key={v} value={v}>
                  {tc("studii.stare." + v)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="field-label">{tc("studii.field")}</span>
          <input
            name="studiiSpecializare"
            defaultValue={profile?.studiiSpecializare ?? ""}
            placeholder={tc("studii.fieldPlaceholder")}
            className="input"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">{tc("studii.institution")}</span>
            <input
              name="studiiInstitutie"
              defaultValue={profile?.studiiInstitutie ?? ""}
              placeholder={tc("studii.institutionPlaceholder")}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">{tc("studii.year")}</span>
            <input
              type="number"
              name="studiiAn"
              min={1950}
              max={new Date().getFullYear() + 10}
              defaultValue={profile?.studiiAn ?? ""}
              placeholder="2024"
              className="input"
            />
          </label>
        </div>
      </fieldset>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("photo")} <span className="text-muted">({t("optional")})</span></span>
        {profile?.pozaFisier && (
          <img
            src={`/api/poza/${profile.id}`}
            alt=""
            className="mb-1 h-20 w-20 rounded-full border border-line object-cover"
          />
        )}
        <input type="file" name="poza" accept="image/*" className="input" />
        <span className="text-xs text-muted">{t("photoHint")}</span>
        {profile?.pozaFisier && (
          <label className="mt-1 flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" name="stergePoza" className="accent-accent" />
            {t("deletePhoto")}
          </label>
        )}
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("skillsCommaSeparated")}</span>
        <input
          name="skills"
          defaultValue={skillsValue}
          placeholder={t("skillsPlaceholder")}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("aboutYou")}</span>
        <textarea name="bio" defaultValue={profile?.bio ?? ""} rows={4} className="input" />
      </label>

      <p className="text-sm text-muted">
        {t("cvsManagedSeparately")}{" "}
        <Link href="/setari" className="text-accent hover:underline">
          {t("settingsLink")}
        </Link>
        .
      </p>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-500">{t("profileSaved")}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("saving") : t("saveProfileButton")}
      </button>
    </form>
  );
}
