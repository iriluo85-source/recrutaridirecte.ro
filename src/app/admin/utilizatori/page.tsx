import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteUserAction } from "../actions";

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
            <div
              key={u.id}
              className="card flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium">
                  {u.email}{" "}
                  {u.isAdmin && <span className="badge ml-2">{t("adminBadge")}</span>}
                </p>
                <p className="text-xs text-muted">
                  {nume ? `${nume} · ` : ""}
                  {u.role ? t("rol." + u.role) : t("noRoleChosen")} · {t("createdOn")}{" "}
                  {new Date(u.createdAt).toLocaleDateString("ro-RO")}
                  {!u.emailVerificat && ` · ${t("emailUnconfirmed")}`}
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
          );
        })}
      </div>
    </main>
  );
}
