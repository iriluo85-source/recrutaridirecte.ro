import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { analizeazaProfil, CV_PILOT_NUME } from "@/lib/cvPilot";
import { abonamentEfectiv } from "@/lib/planuri";

export async function generateMetadata() {
  return { title: `${CV_PILOT_NUME} — Recrutare Directă` };
}

export default async function CvPilotPage() {
  const t = await getTranslations("cvPilot");
  const session = await auth();
  const userId = session!.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const esteUnlimited = abonamentEfectiv(user) === "UNLIMITED";

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      _count: { select: { skills: true, cvFiles: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg text-accent-foreground">
          ✈️
        </span>
        <div>
          <h1 className="text-2xl font-semibold">{CV_PILOT_NUME}</h1>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
      </div>

      {!esteUnlimited ? (
        <div className="card mt-8 text-center">
          <p className="text-lg font-medium">{t("lockedTitle")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("lockedDesc")}</p>
          <Link href="/abonamente" className="btn-primary mt-5 inline-flex">
            {t("seePlans")}
          </Link>
        </div>
      ) : !profile ? (
        <div className="card mt-8">
          <p className="text-sm text-muted">{t("noProfile")}</p>
          <Link href="/candidat/profil/editeaza" className="btn-primary mt-4 inline-flex">
            {t("completeProfile")}
          </Link>
        </div>
      ) : (
        (() => {
          const analiza = analizeazaProfil({
            bio: profile.bio,
            aniExperienta: profile.aniExperienta,
            salariuMinim: profile.salariuMinim,
            salariuMaxim: profile.salariuMaxim,
            telefon: user?.telefon ?? null,
            nrSkills: profile._count.skills,
            nrCvFiles: profile._count.cvFiles,
          });
          return (
            <>
              {/* Scor de profil */}
              <div className="card mt-8 flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-accent">
                  <span className="text-2xl font-semibold text-accent">{analiza.scor}</span>
                  <span className="text-[10px] text-muted">/ 100</span>
                </div>
                <div>
                  <p className="font-medium">{t("scoreTitle")}</p>
                  <p className="mt-1 text-sm text-muted">{t("scoreHint")}</p>
                </div>
              </div>

              {/* Sugestii */}
              <div className="card mt-4">
                <h2 className="field-label">{t("suggestionsTitle")}</h2>
                {analiza.sugestii.length === 0 ? (
                  <p className="mt-3 text-sm text-emerald-500">{t("allGood")}</p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {analiza.sugestii.map((s) => (
                      <li
                        key={s.cheie}
                        className="flex items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm"
                      >
                        <span className={s.important ? "text-amber-500" : "text-muted"}>
                          {s.important ? "●" : "○"}
                        </span>
                        <span>{s.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/candidat/profil/editeaza"
                  className="mt-4 inline-block text-sm text-accent hover:underline"
                >
                  {t("editProfile")}
                </Link>
              </div>

              {/* Generare CV PDF */}
              <div className="card mt-4">
                <h2 className="field-label">{t("generateTitle")}</h2>
                <p className="mt-2 text-sm text-muted">{t("generateDesc")}</p>
                <Link href="/candidat/cv-pilot/cv" className="btn-primary mt-4 inline-flex">
                  {t("generateButton")}
                </Link>
                <p className="mt-3 text-xs text-muted">{t("aiNote")}</p>
              </div>
            </>
          );
        })()
      )}
    </main>
  );
}
