import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";
import NoteEditor from "./NoteEditor";
import { eliminaCandidatSalvatAction } from "./actions";

export default async function CandidatiSalvatiPage() {
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

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        title={t("saved.title")}
        subtitle={t("saved.subtitle")}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {salvati.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">{t("saved.empty")}</p>
            <Link href="/angajator/cautare" className="btn-primary mt-4 inline-flex">
              {t("saved.goSearch")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {salvati.length > 1 && (
              <div className="flex justify-end">
                <Link href="/angajator/salvati/comparare" className="btn-secondary text-sm">
                  {t("compare.button")}
                </Link>
              </div>
            )}
            {salvati.map((s) => {
              const c = s.candidate;
              return (
                <div key={s.id} className="card">
                  <div className="flex items-start gap-4">
                    <Avatar name={c.numeComplet} size={48} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/angajator/candidat/${c.id}`}
                        className="font-medium hover:text-accent hover:underline"
                      >
                        {c.titluCurent}
                      </Link>
                      <p className="text-sm text-muted">
                        {c.locatie} {c.remote ? `· ${tc("remoteOk")}` : ""} ·{" "}
                        {t("search.yearsExperience", { count: c.aniExperienta })}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {c.skills.map((cs) => cs.skill.nume).join(", ")}
                      </p>
                      {c._count.cvFiles > 0 && (
                        <p className="mt-1 text-xs text-accent">
                          📎{" "}
                          {c._count.cvFiles === 1
                            ? t("search.cvAttachedOne")
                            : t("search.cvAttachedMany", { count: c._count.cvFiles })}
                        </p>
                      )}
                    </div>
                    <form action={eliminaCandidatSalvatAction}>
                      <input type="hidden" name="candidateId" value={c.id} />
                      <input type="hidden" name="cale" value="/angajator/salvati" />
                      <button
                        type="submit"
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        {t("saved.remove")}
                      </button>
                    </form>
                  </div>
                  <NoteEditor candidateId={c.id} notita={s.notita} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
