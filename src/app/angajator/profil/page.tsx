import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { domeniuDupaSlug } from "@/lib/domenii";
import PageBanner from "@/components/PageBanner";
import PlanBadge from "@/components/PlanBadge";
import { abonamentEfectiv } from "@/lib/planuri";

export default async function AngajatorProfilPage() {
  const session = await auth();
  const userId = session!.user.id;
  const t = await getTranslations("employer");
  const tp = await getTranslations("posts");
  const th = await getTranslations("home");

  const [companie, user] = await Promise.all([
    prisma.employerProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  const locale = await getLocale();

  if (!companie) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
        <div className="card">
          <h1 className="text-2xl font-semibold">{t("profileView.title")}</h1>
          <p className="mt-2 text-sm text-muted">
            {t("profileView.emptyDesc")}
          </p>
          <Link href="/angajator/profil/editeaza" className="btn-primary mt-4 inline-flex">
            {t("profileView.completeProfile")}
          </Link>
        </div>
      </main>
    );
  }

  const posturi = await prisma.post.findMany({
    where: { employerId: companie.id },
    orderBy: [{ activ: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-office.jpg"
        eyebrow={t("profileView.title")}
        title={companie.numeCompanie}
        titleBadge={<PlanBadge role="EMPLOYER" tip={abonamentEfectiv(user)} locale={locale} />}
        subtitle={[companie.industrie, companie.locatie].filter(Boolean).join(" · ") || undefined}
        maxWidthClass="max-w-xl"
      >
        <Link
          href="/angajator/profil/editeaza"
          className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15"
        >
          {t("profileView.editProfile")}
        </Link>
      </PageBanner>

      <div className="mx-auto w-full max-w-xl px-6 py-10">
      <div className="card">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {companie.cui && (
            <div>
              <dt className="text-muted">{t("profileView.cui")}</dt>
              <dd>{companie.cui}</dd>
            </div>
          )}
          {companie.industrie && (
            <div>
              <dt className="text-muted">{t("profileView.industry")}</dt>
              <dd>{companie.industrie}</dd>
            </div>
          )}
          {companie.locatie && (
            <div>
              <dt className="text-muted">{t("profileView.location")}</dt>
              <dd>{companie.locatie}</dd>
            </div>
          )}
          {companie.marimeCompanie && (
            <div>
              <dt className="text-muted">{t("profileView.companySize")}</dt>
              <dd>{t("profileView.employeesValue", { size: companie.marimeCompanie })}</dd>
            </div>
          )}
          {companie.anFondare && (
            <div>
              <dt className="text-muted">{t("profileView.foundedYear")}</dt>
              <dd>{companie.anFondare}</dd>
            </div>
          )}
          {user?.telefon && (
            <div>
              <dt className="text-muted">{t("profileView.phone")}</dt>
              <dd>{user.telefon}</dd>
            </div>
          )}
          {companie.website && (
            <div>
              <dt className="text-muted">{t("profileView.website")}</dt>
              <dd>
                <a
                  href={companie.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {companie.website}
                </a>
              </dd>
            </div>
          )}
          {companie.linkedin && (
            <div>
              <dt className="text-muted">LinkedIn</dt>
              <dd>
                <a
                  href={companie.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  {t("profileView.linkedinLink")}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {companie.beneficii && (
          <div className="mt-6">
            <h2 className="field-label">{t("profileView.benefits")}</h2>
            <p className="mt-1 whitespace-pre-line">{companie.beneficii}</p>
          </div>
        )}

        {companie.descriere && (
          <div className="mt-6">
            <h2 className="field-label">{t("profileView.aboutCompany")}</h2>
            <p className="mt-1 whitespace-pre-line">{companie.descriere}</p>
          </div>
        )}

        {companie.cautamGeneral && (
          <div className="mt-6">
            <h2 className="field-label">{t("profileView.rolesSought")}</h2>
            <p className="mt-1 whitespace-pre-line">{companie.cautamGeneral}</p>
          </div>
        )}
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            {tp("sectionTitle")}
            <span className="ml-2 text-sm font-normal text-muted">
              {posturi.filter((p) => p.activ).length}
            </span>
          </h2>
          <Link href="/angajator/posturi" className="text-sm text-accent hover:underline">
            {tp("manageLink")} →
          </Link>
        </div>

        {posturi.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            {tp("empty")}{" "}
            <Link href="/angajator/posturi/nou" className="text-accent hover:underline">
              {tp("addButton")}
            </Link>
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {posturi.map((p) => {
              const dom = domeniuDupaSlug(p.domeniuSlug);
              return (
                <li
                  key={p.id}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm ${
                    p.activ ? "" : "opacity-60"
                  }`}
                >
                  <span className="font-medium">{p.titlu}</span>
                  {dom && <span className="text-xs text-muted">· {th("categories." + dom.nameKey)}</span>}
                  {!p.activ && <span className="text-xs text-muted">· {tp("closedBadge")}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>
    </main>
  );
}
