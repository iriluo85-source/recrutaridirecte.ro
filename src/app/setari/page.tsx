import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteCvAction } from "@/app/candidat/actions";
import AddCvForm from "./AddCvForm";
import ChangeEmailForm from "./ChangeEmailForm";
import ChangePasswordForm from "./ChangePasswordForm";
import AccountPrefsForm from "./AccountPrefsForm";
import NotificationsForm from "./NotificationsForm";
import DateFacturareForm from "./DateFacturareForm";
import DeleteAccountForm from "./DeleteAccountForm";

export default async function SetariPage() {
  const t = await getTranslations("settings");
  const tc = await getTranslations("common");
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const candidat =
    session!.user.role === "CANDIDATE"
      ? await prisma.candidateProfile.findUnique({
          where: { userId },
          include: { cvFiles: { orderBy: { createdAt: "desc" } } },
        })
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      <div className="card mt-6">
        <h2 className="field-label">{t("account.heading")}</h2>
        <p className="mt-2 text-sm">{user?.email}</p>
        {!user?.passwordHash && (
          <p className="mt-1 text-xs text-muted">
            {t("account.externalProviderNote")}
          </p>
        )}
        <ChangeEmailForm areParola={Boolean(user?.passwordHash)} />
      </div>

      <div className="card mt-4">
        <h2 className="field-label">{t("changePassword.heading")}</h2>
        <ChangePasswordForm areParola={Boolean(user?.passwordHash)} />
      </div>

      <div className="card mt-4">
        <h2 className="field-label">{t("prefs.heading")}</h2>
        <AccountPrefsForm telefon={user?.telefon ?? null} />
      </div>

      <div className="card mt-4">
        <h2 className="field-label">{t("notifications.heading")}</h2>
        <NotificationsForm
          notificariEmail={user?.notificariEmail ?? true}
          notificariPush={user?.notificariPush ?? false}
          emailuriDigest={user?.emailuriDigest ?? false}
          newsletterEmail={user?.newsletterEmail ?? false}
        />
      </div>

      <div className="card mt-4">
        <h2 className="field-label">{t("billing.heading")}</h2>
        <p className="mt-2 text-sm text-muted">{t("billing.description")}</p>
        <DateFacturareForm
          denumire={user?.facturareDenumire ?? null}
          cui={user?.facturareCui ?? null}
          adresa={user?.facturareAdresa ?? null}
          esteAngajator={session!.user.role === "EMPLOYER"}
        />
      </div>

      {session!.user.role === "CANDIDATE" && (
        <div className="card mt-4">
          <h2 className="field-label">{t("cvs.heading")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("cvs.description")}
          </p>

          {!candidat && (
            <p className="mt-4 text-sm text-muted">
              {t("cvs.completeProfileFirst")}
            </p>
          )}

          {candidat && candidat.cvFiles.length === 0 && (
            <p className="mt-4 text-sm text-muted">{t("cvs.noCvsYet")}</p>
          )}

          {candidat && candidat.cvFiles.length > 0 && (
            <ul className="mt-4 flex flex-col gap-2">
              {candidat.cvFiles.map((cv) => (
                <li
                  key={cv.id}
                  className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
                >
                  <div>
                    <a
                      href={`/api/cv/${cv.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-accent hover:underline"
                    >
                      {cv.eticheta}
                    </a>
                    <p className="text-xs text-muted">
                      {t("cvs.addedOn", {
                        date: new Date(cv.createdAt).toLocaleDateString("ro-RO"),
                      })}
                    </p>
                  </div>
                  <form action={deleteCvAction}>
                    <input type="hidden" name="cvId" value={cv.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      {tc("delete")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}

          {candidat && <AddCvForm />}
        </div>
      )}

      <div className="card mt-4">
        <h2 className="field-label">{t("data.heading")}</h2>
        <p className="mt-2 text-sm text-muted">
          {t("data.description")}
        </p>
        <a
          href="/api/exporta-date"
          download
          className="btn-secondary mt-4 self-start"
        >
          {t("data.download")}
        </a>
      </div>

      <div className="card mt-4 border-red-500/40">
        <h2 className="field-label text-red-500">{t("dangerZone.heading")}</h2>
        <DeleteAccountForm
          areParola={Boolean(user?.passwordHash)}
          isAdmin={Boolean(user?.isAdmin)}
        />
      </div>
    </main>
  );
}
