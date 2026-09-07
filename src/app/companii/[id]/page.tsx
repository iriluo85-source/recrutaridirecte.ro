import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { domeniuDupaSlug } from "@/lib/domenii";
import { firmaVerificata } from "@/lib/planuri";
import PageBanner from "@/components/PageBanner";
import VerifiedBadge from "@/components/VerifiedBadge";

// Profil PUBLIC de companie. Expune exact setul de câmpuri deja public prin
// /api/mobile/companii/[id]: date publicate voluntar de firmă. Emailul, telefonul
// și CUI-ul NU apar aici — telefonul rămâne doar în /candidat/companie/[id],
// adică după ce firma a deschis o conversație.
const CAMPURI_PUBLICE = {
  id: true,
  numeCompanie: true,
  industrie: true,
  locatie: true,
  marimeCompanie: true,
  website: true,
  linkedin: true,
  anFondare: true,
  beneficii: true,
  descriere: true,
  cautamGeneral: true,
  user: { select: { abonamentTip: true, isAdmin: true, email: true } },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const companie = await prisma.employerProfile.findUnique({
    where: { id },
    select: { numeCompanie: true, industrie: true, locatie: true, descriere: true },
  });
  if (!companie) return { title: "Recrutare Directă" };
  const context = [companie.industrie, companie.locatie].filter(Boolean).join(" · ");
  return {
    title: `${companie.numeCompanie} — Recrutare Directă`,
    description: companie.descriere?.slice(0, 160) || context || undefined,
  };
}

export default async function CompaniePublicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("candidate");
  const tc2 = await getTranslations("companies");
  const tp = await getTranslations("posts");
  const th = await getTranslations("home");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const { id } = await params;

  const companie = await prisma.employerProfile.findUnique({
    where: { id },
    select: CAMPURI_PUBLICE,
  });
  if (!companie) notFound();

  const posturi = await prisma.post.findMany({
    where: { employerId: id, activ: true },
    orderBy: { updatedAt: "desc" },
  });

  const verificat = firmaVerificata(companie.user);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-office.jpg"
        title={companie.numeCompanie}
        titleBadge={verificat ? <VerifiedBadge locale={locale} /> : null}
        subtitle={[companie.industrie, companie.locatie].filter(Boolean).join(" · ") || undefined}
        maxWidthClass="max-w-2xl"
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <Link href="/companii" className="text-sm text-accent hover:underline">
          ← {tc2("backToList")}
        </Link>

        <div className="card mt-4">
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {companie.industrie && (
              <div>
                <dt className="text-muted">{t("industry")}</dt>
                <dd>{companie.industrie}</dd>
              </div>
            )}
            {companie.locatie && (
              <div>
                <dt className="text-muted">{t("location")}</dt>
                <dd>{companie.locatie}</dd>
              </div>
            )}
            {companie.marimeCompanie && (
              <div>
                <dt className="text-muted">{t("companySize")}</dt>
                <dd>
                  {companie.marimeCompanie} {t("employees")}
                </dd>
              </div>
            )}
            {companie.anFondare && (
              <div>
                <dt className="text-muted">{t("foundedYear")}</dt>
                <dd>{companie.anFondare}</dd>
              </div>
            )}
            {companie.website && (
              <div>
                <dt className="text-muted">{t("website")}</dt>
                <dd>
                  <a
                    href={companie.website}
                    target="_blank"
                    rel="noreferrer nofollow"
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
                    rel="noreferrer nofollow"
                    className="text-accent hover:underline"
                  >
                    {t("linkedinLink")}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {companie.beneficii && (
            <div className="mt-6">
              <h2 className="field-label">{t("benefits")}</h2>
              <p className="mt-1 whitespace-pre-line">{companie.beneficii}</p>
            </div>
          )}

          {companie.descriere && (
            <div className="mt-6">
              <h2 className="field-label">{t("aboutCompany")}</h2>
              <p className="mt-1 whitespace-pre-line">{companie.descriere}</p>
            </div>
          )}

          {companie.cautamGeneral && (
            <div className="mt-6">
              <h2 className="field-label">{t("typicalRoles")}</h2>
              <p className="mt-1 whitespace-pre-line">{companie.cautamGeneral}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">
            {tc2("openPositionsTitle")}
            <span className="ml-2 text-sm font-normal text-muted">{posturi.length}</span>
          </h2>

          {posturi.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{tc2("noOpenPositions")}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {posturi.map((p) => {
                const dom = domeniuDupaSlug(p.domeniuSlug);
                const parti: string[] = [];
                if (p.experientaMin != null || p.experientaMax != null) {
                  const a = p.experientaMin ?? 0;
                  parti.push(
                    p.experientaMax != null
                      ? `${a}–${p.experientaMax} ${tp("years")}`
                      : `${a}+ ${tp("years")}`
                  );
                }
                if (p.salariuMin != null || p.salariuMax != null) {
                  const s =
                    p.salariuMin != null && p.salariuMax != null
                      ? `${p.salariuMin}–${p.salariuMax}`
                      : `${p.salariuMin ?? p.salariuMax}`;
                  parti.push(`${s} ${tc("salaryPerMonth")}`);
                }
                const loc = [p.locatie, p.remote ? tc("remoteOk") : null]
                  .filter(Boolean)
                  .join(" · ");
                if (loc) parti.push(loc);
                return (
                  <div key={p.id} className="card">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{p.titlu}</p>
                      {dom && (
                        <span className="badge text-xs">{th("categories." + dom.nameKey)}</span>
                      )}
                    </div>
                    {parti.length > 0 && (
                      <p className="mt-1 text-xs text-muted">{parti.join(" · ")}</p>
                    )}
                    {p.skills && <p className="mt-1 text-sm text-muted">{p.skills}</p>}
                    {p.descriere && (
                      <p className="mt-2 whitespace-pre-line text-sm text-muted">{p.descriere}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
