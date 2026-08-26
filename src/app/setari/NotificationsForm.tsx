"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateNotificationPrefsAction, type FormState } from "./actions";

function Switch({
  name,
  defaultChecked,
  label,
  hint,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-4 py-2">
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      <span className="switch shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        <span className="switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}

export default function NotificationsForm({
  notificariEmail,
  notificariPush,
  emailuriDigest,
  newsletterEmail,
}: {
  notificariEmail: boolean;
  notificariPush: boolean;
  emailuriDigest: boolean;
  newsletterEmail: boolean;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateNotificationPrefsAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-4 flex flex-col divide-y divide-line">
      <Switch
        name="notificariEmail"
        defaultChecked={notificariEmail}
        label={t("notifications.emailLabel")}
        hint={t("notifications.emailHint")}
      />
      <Switch
        name="notificariPush"
        defaultChecked={notificariPush}
        label={t("notifications.pushLabel")}
        hint={t("notifications.pushHint")}
      />
      <Switch
        name="emailuriDigest"
        defaultChecked={emailuriDigest}
        label={t("notifications.digestLabel")}
        hint={t("notifications.digestHint")}
      />
      <Switch
        name="newsletterEmail"
        defaultChecked={newsletterEmail}
        label={t("notifications.newsletterLabel")}
        hint={t("notifications.newsletterHint")}
      />

      {state?.error && <p className="pt-3 text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="pt-3 text-sm text-emerald-500">{t("prefs.success")}</p>
      )}

      <div className="pt-4">
        <button type="submit" disabled={pending} className="btn-secondary self-start">
          {pending ? tc("saving") : tc("save")}
        </button>
      </div>
    </form>
  );
}
