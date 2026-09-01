import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";

export default async function ComparareCandidatiPage() {
  const t = await getTranslations("employer");
  const tc = await getTranslations("common");
  const session = await auth();

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });

  const salvati = employer
    ? await prisma.savedCandidate.findMany({
        where: { employerId: employer.id },
        orderBy: { createdAt: "desc" },
        include: {
          candidate: {
            include: {
              skills: { include: { skill: true } },
              _count: { select: { cvFiles: true } },
            },
          },
        },
      })
    : [];

  const candidati = salvati.map((s) => ({ ...s.candidate, notita: s.notita }));

  // fiecare rând = un atribut; coloanele = candidații
  const randuri: { label: string; value: (c: (typeof candidati)[number]) => string }[] = [
    { label: t("candidate.location"), value: (c) => c.locatie + (c.remote ? ` · ${tc("remoteOk")}` : "") },
    { label: t("candidate.experience"), value: (c) => tc("yearsCount", { count: c.aniExperienta ?? 0 }) },
    { label: t("candidate.availability"), value: (c) => tc("disponibilitate." + c.disponibilitate) },
    {
      label: t("candidate.salaryExpectations"),
      value: (c) =>
        c.salariuMinim || c.salariuMaxim
          ? `${c.salariuMinim ?? "?"} - ${c.salariuMaxim ?? "?"} ${tc("salaryPerMonth")}`
          : tc("unspecified"),
    },
    { label: t("candidate.skills"), value: (c) => c.skills.map((s) => s.skill.nume).join(", ") || "—" },
    { label: t("compare.cvCount"), value: (c) => String(c._count.cvFiles) },
    { label: t("compare.note"), value: (c) => c.notita || "—" },
  ];

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        title={t("compare.title")}
        subtitle={t("compare.subtitle")}
      />
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-4">
          <Link href="/angajator/salvati" className="text-sm text-accent hover:underline">
            ← {t("saved.title")}
          </Link>
        </div>

        {candidati.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">{t("compare.empty")}</p>
            <Link href="/angajator/cautare" className="btn-primary mt-4 inline-flex">
              {t("saved.goSearch")}
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-surface/80 p-3 text-left backdrop-blur-md" />
                  {candidati.map((c) => (
                    <th key={c.id} className="min-w-[180px] border-l border-line p-3 text-left align-bottom">
                      <div className="flex flex-col items-start gap-2">
                        <Avatar name={c.numeComplet} size={40} />
                        <Link
                          href={`/angajator/candidat/${c.id}`}
                          className="font-semibold hover:text-accent hover:underline"
                        >
                          {c.titluCurent}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {randuri.map((r, i) => (
                  <tr key={r.label} className={i % 2 === 0 ? "bg-surface/30" : ""}>
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-surface/80 p-3 font-medium text-muted backdrop-blur-md">
                      {r.label}
                    </td>
                    {candidati.map((c) => (
                      <td key={c.id} className="border-l border-line p-3 align-top">
                        {r.value(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
