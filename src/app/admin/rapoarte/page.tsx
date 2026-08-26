import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { rezolvaRaportAction } from "../actions";

export default async function AdminRapoartePage() {
  const t = await getTranslations("admin");

  const rapoarte = await prisma.report.findMany({
    orderBy: [{ rezolvat: "asc" }, { createdAt: "desc" }],
    include: {
      reporter: {
        select: {
          email: true,
          candidateProfile: { select: { numeComplet: true } },
          employerProfile: { select: { numeCompanie: true } },
        },
      },
      target: {
        select: {
          email: true,
          candidateProfile: { select: { numeComplet: true } },
          employerProfile: { select: { numeCompanie: true } },
        },
      },
    },
  });

  const nume = (u: {
    email: string;
    candidateProfile: { numeComplet: string } | null;
    employerProfile: { numeCompanie: string } | null;
  }) =>
    u.candidateProfile?.numeComplet ?? u.employerProfile?.numeCompanie ?? u.email;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("reports.title")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("reports.total", { count: rapoarte.length })}
      </p>

      {rapoarte.length === 0 ? (
        <p className="mt-6 text-muted">{t("reports.empty")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {rapoarte.map((r) => (
            <div
              key={r.id}
              className={`card flex flex-wrap items-start justify-between gap-3 ${
                r.rezolvat ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {r.motiv}
                  {r.rezolvat && (
                    <span className="badge ml-2">{t("reports.resolved")}</span>
                  )}
                </p>
                {r.detalii && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted">
                    {r.detalii}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {t("reports.reporter")}: {nume(r.reporter)} ({r.reporter.email})
                  {" · "}
                  {t("reports.target")}: {nume(r.target)} ({r.target.email})
                </p>
                <p className="text-xs text-muted">
                  {new Date(r.createdAt).toLocaleString("ro-RO")}
                </p>
              </div>
              {!r.rezolvat && (
                <form action={rezolvaRaportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {t("reports.markResolved")}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
