"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { salvezaPostAction, type FormState } from "../actions";
import { DOMENII } from "@/lib/domenii";

type PostData = {
  id: string;
  titlu: string;
  domeniuSlug: string | null;
  skills: string | null;
  experientaMin: number | null;
  experientaMax: number | null;
  salariuMin: number | null;
  salariuMax: number | null;
  locatie: string | null;
  remote: boolean;
  descriere: string | null;
  activ: boolean;
};

export default function PostForm({ post }: { post?: PostData }) {
  const t = useTranslations("posts");
  const tc = useTranslations("common");
  const th = useTranslations("home");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    salvezaPostAction,
    undefined
  );

  return (
    <form action={formAction} className="card mt-6 flex flex-col gap-4">
      {post && <input type="hidden" name="postId" value={post.id} />}

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("fieldTitle")}</span>
        <input
          name="titlu"
          defaultValue={post?.titlu ?? ""}
          required
          placeholder={t("fieldTitlePlaceholder")}
          className="input"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("fieldDomain")}</span>
          <select name="domeniuSlug" defaultValue={post?.domeniuSlug ?? ""} className="input">
            <option value="">{tc("unspecified")}</option>
            {DOMENII.map((d) => (
              <option key={d.slug} value={d.slug}>
                {th("categories." + d.nameKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("fieldLocation")}</span>
          <input name="locatie" defaultValue={post?.locatie ?? ""} className="input" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("fieldSkills")}</span>
        <input
          name="skills"
          defaultValue={post?.skills ?? ""}
          placeholder={t("fieldSkillsPlaceholder")}
          className="input"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">{t("fieldExpMin")}</span>
          <input type="number" name="experientaMin" min={0} defaultValue={post?.experientaMin ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">{t("fieldExpMax")}</span>
          <input type="number" name="experientaMax" min={0} defaultValue={post?.experientaMax ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">{t("fieldSalaryMin")}</span>
          <input type="number" name="salariuMin" min={0} defaultValue={post?.salariuMin ?? ""} className="input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label text-xs">{t("fieldSalaryMax")}</span>
          <input type="number" name="salariuMax" min={0} defaultValue={post?.salariuMax ?? ""} className="input" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="field-label">{t("fieldDescription")}</span>
        <textarea name="descriere" rows={3} defaultValue={post?.descriere ?? ""} className="input" />
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="remote" defaultChecked={post?.remote ?? false} className="accent-accent" />
          {t("fieldRemote")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activ" defaultChecked={post?.activ ?? true} className="accent-accent" />
          {t("fieldActive")}
        </label>
      </div>

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("saving") : t("save")}
      </button>
    </form>
  );
}
