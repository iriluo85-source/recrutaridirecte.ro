import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAction, seteazaAbonamentAction } from "../actions";

const TIPURI_ABONAMENT = ["GOLD", "PLATINUM", "UNLIMITED"] as const;

export default async function AdminUtilizatoriPage() {
  const t = await getTranslations("admin");
  const session = await auth();

  const utilizatori = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { candidateProfile: true, employerProfile: true },
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("usersTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("accountsTotal", { count: utilizatori.length })}
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {utilizatori.map((u) => {
          const nume = u.candidateProfile?.numeComplet ?? u.employerProfile?.numeCompanie;
          return (
            <div key={u.id} className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {u.email}{" "}
                    {u.isAdmin && <span className="badge ml-2">{t("adminBadge")}</span>}
                    {u.abonamentTip && (
                      <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        {u.abonamentTip}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {nume ? `${nume} · ` : ""}
                    {u.role ? t("rol." + u.role) : t("noRoleChosen")} · {t("createdOn")}{" "}
                    {new Date(u.createdAt).toLocaleDateString("ro-RO")}
                    {!u.emailVerificat && ` · ${t("emailUnconfirmed")}`}
                    {u.abonamentExpira &&
                      ` · exp. ${new Date(u.abonamentExpira).toLocaleDateString("ro-RO")}`}
                  </p>
                </div>
                {u.id !== session?.user.id && (
                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" className="text-sm text-red-500 hover:underline">
                      {t("deleteAccount")}
                    </button>
                  </form>
                )}
              </div>

              {/* Acordare/retragere abonament (conturi „comp": demo, primii angajatori gratis) */}
              <form
                action={seteazaAbonamentAction}
                className="flex flex-wrap items-center gap-2 border-t border-line pt-3"
              >
                <input type="hidden" name="userId" value={u.id} />
                <select
                  name="tip"
                  defaultValue={u.abonamentTip ?? ""}
                  className="input w-auto py-1 text-sm"
                >
                  <option value="">—</option>
                  {TIPURI_ABONAMENT.map((tip) => (
                    <option key={tip} value={tip}>
                      {tip}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  name="luni"
                  defaultValue={12}
                  min={1}
                  max={36}
                  aria-label="luni"
                  className="input w-20 py-1 text-sm"
                />
                <span className="text-xs text-muted">luni</span>
                <button type="submit" className="btn-secondary py-1 text-sm">
                  {t("setSubscription")}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </main>
  );
}
