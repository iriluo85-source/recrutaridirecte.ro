import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";
import PlanBadge from "@/components/PlanBadge";
import PhotoZoom from "@/components/PhotoZoom";
import { formatStudii } from "@/lib/studii";
import { abonamentEfectiv } from "@/lib/planuri";

export default async function CandidatProfilPage() {
  const t = await getTranslations("candidate");
  const tc = await getTranslations("common");
  const session = await auth();
  const userId = session!.user.id;

  const [profile, user] = await Promise.all([
    prisma.candidateProfile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        cvFiles: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  const locale = await getLocale();
  const vizualizari = profile
    ? await prisma.profileView.findMany({
        where: { candidateId: profile.id },
        include: { employer: { select: { numeCompanie: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  // număr de angajatori unici care au văzut profilul sau CV-ul
  const companiiUnice = Array.from(
    new Set(vizualizari.map((v) => v.employer.numeCompanie))
  );

  // statistici agregate pentru cardul „cine te-a văzut"
  const totalProfil = vizualizari
    .filter((v) => v.tip === "PROFIL")
    .reduce((s, v) => s + v.viewCount, 0);
  const totalCv = vizualizari
    .filter((v) => v.tip === "CV")
    .reduce((s, v) => s + v.viewCount, 0);
  const ultimaVizualizare = vizualizari[0]?.updatedAt ?? null;

  const perCompanie = new Map<string, { profil: number; cv: number; last: Date }>();
  for (const v of vizualizari) {
    const cur = perCompanie.get(v.employer.numeCompanie) ?? {
      profil: 0,
      cv: 0,
      last: v.updatedAt,
    };
    if (v.tip === "CV") cur.cv += v.viewCount;
    else cur.profil += v.viewCount;
    if (v.updatedAt > cur.last) cur.last = v.updatedAt;
    perCompanie.set(v.employer.numeCompanie, cur);
  }
  const listaCompanii = Array.from(perCompanie.entries())
    .map(([nume, d]) => ({ nume, ...d }))
    .sort((a, b) => b.last.getTime() - a.last.getTime());

  const fmtData = (d: Date) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent-secondary px-5 py-4 text-center">
          <p className="text-base font-semibold text-accent-secondary-foreground sm:text-lg">
            ✨ {t("motivBanner")}
          </p>
        </div>
        <div className="card">
          <h1 className="text-2xl font-semibold">{t("profileTitle")}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("noProfileYet")}
          </p>
          <Link href="/candidat/profil/editeaza" className="btn-primary mt-4 inline-flex">
            {t("completeProfile")}
          </Link>
        </div>
      </main>
    );
  }

  const studii = formatStudii(profile, tc);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-engineer.jpg"
        title={profile.numeComplet}
        titleBadge={<PlanBadge role="CANDIDATE" tip={abonamentEfectiv(user)} locale={locale} />}
        subtitle={profile.titluCurent}
        maxWidthClass="max-w-2xl"
      >
        <Link
          href="/candidat/profil/editeaza"
          className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
        >
          {t("editProfile")}
        </Link>
      </PageBanner>

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 rounded-xl border border-accent/20 bg-accent-secondary px-5 py-4 text-center">
        <p className="text-base font-semibold text-accent-secondary-foreground sm:text-lg">
          ✨ {t("motivBanner")}
        </p>
      </div>
      <div className="card">
        {profile.pozaFisier && (
          <div className="mb-4 flex justify-center">
            <PhotoZoom
              src={`/api/poza/${profile.id}`}
              alt={profile.numeComplet}
              className="h-28 w-28 rounded-full border border-line object-cover"
            />
          </div>
        )}
        <div className="rounded-lg border border-line bg-surface/50 px-4 py-4 backdrop-blur-md">
          {companiiUnice.length === 0 ? (
            <p className="text-sm text-muted">{t("noViewsYet")}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-2xl font-semibold text-accent">{companiiUnice.length}</p>
                  <p className="text-xs text-muted">{t("viewsCompaniesLabel")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-accent">{totalProfil}</p>
                  <p className="text-xs text-muted">{t("viewsProfileLabel")}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-accent">{totalCv}</p>
                  <p className="text-xs text-muted">{t("viewsCvLabel")}</p>
                </div>
              </div>

              {ultimaVizualizare && (
                <p className="mt-3 text-center text-xs text-muted">
                  {t("viewsLastSeen", { date: fmtData(ultimaVizualizare) })}
                </p>
              )}

              <div className="mt-4 border-t border-line pt-3">
                <p className="field-label text-xs">{t("viewsWhoTitle")}</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {listaCompanii.map((c) => (
                    <li
                      key={c.nume}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-sm"
                    >
                      <span className="font-medium">{c.nume}</span>
                      <span className="text-xs text-muted">
                        {c.profil > 0 && t("viewsProfileCount", { count: c.profil })}
                        {c.profil > 0 && c.cv > 0 && " · "}
                        {c.cv > 0 && t("viewsCvCount", { count: c.cv })}
                        {" · "}
                        {fmtData(c.last)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("location")}</dt>
            <dd>
              {profile.locatie} {profile.remote ? `· ${tc("remoteOk")}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("experience")}</dt>
            <dd>{tc("yearsCount", { count: profile.aniExperienta ?? 0 })}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("availability")}</dt>
            <dd>{tc("disponibilitate." + profile.disponibilitate)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("salaryExpectations")}</dt>
            <dd>
              {profile.salariuMinim || profile.salariuMaxim
                ? `${profile.salariuMinim ?? "?"} - ${profile.salariuMaxim ?? "?"} ${tc("salaryPerMonth")}`
                : tc("unspecified")}
            </dd>
          </div>
          {profile.varsta != null && (
            <div>
              <dt className="text-muted">{t("age")}</dt>
              <dd>{tc("yearsCount", { count: profile.varsta ?? 0 })}</dd>
            </div>
          )}
          {profile.sex && (
            <div>
              <dt className="text-muted">{t("sex")}</dt>
              <dd>{profile.sex}</dd>
            </div>
          )}
          {user?.telefon && (
            <div>
              <dt className="text-muted">{t("phone")}</dt>
              <dd>{user.telefon}</dd>
            </div>
          )}
        </dl>

        {(profile.permisConducere || profile.dispusDeplasari) && (
          <div className="mt-6 flex flex-wrap gap-2">
            {profile.permisConducere && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-secondary px-2.5 py-1 text-xs font-medium text-accent-secondary-foreground">
                🚗 {tc("atribute.permisConducere")}
              </span>
            )}
            {profile.dispusDeplasari && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-secondary px-2.5 py-1 text-xs font-medium text-accent-secondary-foreground">
                🧳 {tc("atribute.deplasari")}
              </span>
            )}
          </div>
        )}

        <div className="mt-6">
          <h2 className="field-label">{t("skills")}</h2>
          <p className="mt-1">
            {profile.skills.map((s) => s.skill.nume).join(", ") || "-"}
          </p>
        </div>

        {studii && (
          <div className="mt-6">
            <h2 className="field-label">{tc("studii.title")}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="font-medium">{studii.nivel}</span>
              {studii.status && (
                <span className="rounded-full bg-accent-secondary px-2 py-0.5 text-xs font-medium text-accent-secondary-foreground">
                  {studii.status}
                </span>
              )}
            </p>
            {studii.detalii && <p className="mt-0.5 text-sm text-muted">{studii.detalii}</p>}
          </div>
        )}

        {profile.bio && (
          <div className="mt-6">
            <h2 className="field-label">{t("about")}</h2>
            <p className="mt-1 whitespace-pre-line">{profile.bio}</p>
          </div>
        )}

        <div className="mt-6">
          <h2 className="field-label">{t("cvs")}</h2>
          {profile.cvFiles.length === 0 ? (
            <p className="mt-1 text-sm text-muted">
              {t("noCvUploaded")}{" "}
              <Link href="/setari" className="text-accent hover:underline">
                {t("addFromSettings")}
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {profile.cvFiles.map((cv) => (
                <li key={cv.id}>
                  <a
                    href={`/api/cv/${cv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    📎 {cv.eticheta}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      </div>
    </main>
  );
}
