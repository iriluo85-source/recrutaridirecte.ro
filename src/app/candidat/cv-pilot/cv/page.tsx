import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "../PrintButton";

export async function generateMetadata() {
  const t = await getTranslations("cvPilot");
  return { title: `${t("cvTitle")} — Recrutare Directă` };
}

export default async function CvPrintabilPage() {
  const t = await getTranslations("cvPilot");
  const tc = await getTranslations("common");
  const ta = await getTranslations("candidate");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.abonamentTip !== "UNLIMITED") redirect("/candidat/cv-pilot");

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.user.id },
    include: { skills: { include: { skill: true } } },
  });
  if (!profile) redirect("/candidat/cv-pilot");

  const contact = [user?.email, user?.telefon, profile.locatie]
    .filter(Boolean)
    .join("  •  ");

  const salariu =
    profile.salariuMinim || profile.salariuMaxim
      ? `${profile.salariuMinim ?? "?"} – ${profile.salariuMaxim ?? "?"} ${tc("salaryPerMonth")}`
      : null;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link href="/candidat/cv-pilot" className="text-sm text-accent hover:underline">
          {t("back")}
        </Link>
        <PrintButton label={t("downloadPdf")} />
      </div>

      <div className="cv-print mx-auto rounded-lg border border-slate-200 bg-white p-10 text-slate-900 shadow-sm">
        <header className="border-b-2 border-emerald-600 pb-4">
          <h1 className="text-3xl font-semibold text-slate-900">{profile.numeComplet}</h1>
          <p className="mt-1 text-lg text-emerald-700">{profile.titluCurent}</p>
          {contact && <p className="mt-2 text-sm text-slate-600">{contact}</p>}
        </header>

        {profile.bio && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("sectionSummary")}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {profile.bio}
            </p>
          </section>
        )}

        {profile.skills.length > 0 && (
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {t("sectionSkills")}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span
                  key={s.skill.nume}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm text-slate-700"
                >
                  {s.skill.nume}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {t("sectionDetails")}
          </h2>
          <dl className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{t("labelExperience")}</dt>
              <dd className="text-slate-800">
                {tc("yearsCount", { count: profile.aniExperienta ?? 0 })}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">{t("labelAvailability")}</dt>
              <dd className="text-slate-800">{tc("disponibilitate." + profile.disponibilitate)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{ta("location")}</dt>
              <dd className="text-slate-800">
                {profile.locatie}
                {profile.remote ? ` · ${tc("remoteOk")}` : ""}
              </dd>
            </div>
            {salariu && (
              <div>
                <dt className="text-slate-500">{t("labelSalary")}</dt>
                <dd className="text-slate-800">{salariu}</dd>
              </div>
            )}
          </dl>
        </section>

        <p className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
          {t("cvFooter")}
        </p>
      </div>
    </main>
  );
}
