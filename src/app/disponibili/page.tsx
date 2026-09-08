import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  domeniiCuCandidati,
  oraseCuCandidati,
  slugOras,
  agregheaza,
  type CandidatAgregat,
} from "@/lib/disponibili";
import PageBanner from "@/components/PageBanner";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("disponibili");
  return {
    title: `${t("indexTitle")} — Recrutare Directă`,
    description: t("indexSubtitle"),
  };
}

export async function incarcaCandidati(): Promise<CandidatAgregat[]> {
  const bruti = await prisma.candidateProfile.findMany({
    select: {
      locatie: true,
      remote: true,
      aniExperienta: true,
      salariuMinim: true,
      permisConducere: true,
      dispusDeplasari: true,
      skills: { select: { skill: { select: { nume: true } } } },
    },
  });
  return bruti.map((c) => ({
    locatie: c.locatie,
    remote: c.remote,
    aniExperienta: c.aniExperienta,
    salariuMinim: c.salariuMinim,
    permisConducere: c.permisConducere,
    dispusDeplasari: c.dispusDeplasari,
    skills: c.skills.map((s) => s.skill.nume),
  }));
}

export default async function DisponibiliIndexPage() {
  const t = await getTranslations("disponibili");
  const th = await getTranslations("home");

  const candidati = await incarcaCandidati();
  const domenii = domeniiCuCandidati(candidati);
  const total = agregheaza(candidati);
  const orase = oraseCuCandidati(candidati);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        eyebrow={t("countBadge", { count: total.total })}
        title={t("indexTitle")}
        subtitle={t("indexSubtitle")}
        maxWidthClass="max-w-3xl"
      />

      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {domenii.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{t("byDomain")}</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {domenii.map(({ domeniu, total: n }) => (
              <Link
                key={domeniu.slug}
                href={`/disponibili/${domeniu.slug}`}
                className="card flex items-center gap-4 transition hover:border-accent hover:shadow-md"
              >
                <span className="text-3xl" aria-hidden="true">
                  {domeniu.emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{th("categories." + domeniu.nameKey)}</p>
                  <p className="text-sm text-accent">{t("available", { count: n })}</p>
                </div>
              </Link>
            ))}
            </div>
          </>
        )}

        {/* Orașele acoperă TOȚI candidații, nu doar pe cei ale căror skill-uri se
            potrivesc cu un domeniu — locația e obligatorie la înregistrare. */}
        {orase.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">{t("byCityAll")}</h2>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {orase.map((o) => (
                <Link
                  key={o.oras}
                  href={`/disponibili/oras/${slugOras(o.oras)}`}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 transition hover:border-accent"
                >
                  <span className="font-medium">{o.oras}</span>
                  <span className="text-sm text-accent">
                    {t("available", { count: o.candidati })}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="card mt-8 border-accent/40 bg-accent/5">
          <p className="font-medium">{t("ctaTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("ctaDesc")}</p>
          <Link href="/inregistrare?rol=EMPLOYER" className="btn-primary mt-4 inline-flex">
            {t("ctaButton")}
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted">{t("privacyNote")}</p>
      </div>
    </main>
  );
}
