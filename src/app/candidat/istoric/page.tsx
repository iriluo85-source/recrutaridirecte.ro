import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function generateMetadata() {
  const t = await getTranslations("history");
  return { title: `${t("title")} — Recrutare Directă` };
}

export default async function CandidatIstoricPage() {
  const t = await getTranslations("history");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });

  const offers = profile
    ? await prisma.jobOffer.findMany({
        where: {
          conversation: { candidateId: profile.id },
          status: { in: ["ACCEPTED", "REJECTED"] },
        },
        include: { conversation: { include: { employer: true } } },
        orderBy: [{ raspunsLa: "desc" }, { updatedAt: "desc" }],
      })
    : [];

  // Grupăm după rezultat + cine a decis (istoric, fără link către conversație)
  const sectiuni = [
    {
      title: t("accepted"),
      tone: "green" as const,
      items: offers.filter((o) => o.status === "ACCEPTED"),
    },
    {
      title: t("rejectedByMe"),
      tone: "red" as const,
      items: offers.filter((o) => o.status === "REJECTED" && o.inchisDe !== "EMPLOYER"),
    },
    {
      title: t("withdrawnByCompany"),
      tone: "red" as const,
      items: offers.filter((o) => o.status === "REJECTED" && o.inchisDe === "EMPLOYER"),
    },
  ];

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/candidat/oferte" className="text-sm text-accent hover:underline">
        {t("backCandidate")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-1 text-muted">{t("subtitleCandidate")}</p>

      {offers.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{t("empty")}</p>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {sectiuni.map((s) => (
            <section key={s.title}>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                    s.tone === "green" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                {s.title}
                <span className="text-sm font-normal text-muted">({s.items.length})</span>
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {s.items.length === 0 ? (
                  <p className="text-sm text-muted">{t("sectionEmpty")}</p>
                ) : (
                  s.items.map((o) => (
                    <div key={o.id} className="card">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">{o.titluPost}</p>
                          <p className="text-sm text-muted">
                            {o.conversation.employer.numeCompanie}
                          </p>
                        </div>
                        {o.raspunsLa && (
                          <span className="shrink-0 text-xs text-muted">{fmt(o.raspunsLa)}</span>
                        )}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-muted">{o.descriere}</p>
                      {(o.salariu || o.locatie) && (
                        <p className="mt-2 text-xs text-muted">
                          {o.salariu ? `${o.salariu} ${tc("salaryPerMonth")}` : ""}
                          {o.salariu && o.locatie ? " · " : ""}
                          {o.locatie ?? ""}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
