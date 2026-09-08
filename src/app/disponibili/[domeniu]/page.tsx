import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { domeniuDupaSlug, DOMENII } from "@/lib/domenii";
import { candidatiInDomeniu, agregheaza } from "@/lib/disponibili";
import { estimeazaAudienta } from "@/lib/audienta";
import PageBanner from "@/components/PageBanner";
import EstimatorAudienta from "@/components/EstimatorAudienta";
import { incarcaCandidati } from "../page";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return DOMENII.map((d) => ({ domeniu: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domeniu: string }>;
}) {
  const { domeniu: slug } = await params;
  const domeniu = domeniuDupaSlug(slug);
  if (!domeniu) return { title: "Recrutare Directă" };

  const t = await getTranslations("disponibili");
  const th = await getTranslations("home");
  const nume = th("categories." + domeniu.nameKey);

  return {
    title: `${t("pageTitle", { domeniu: nume })} — Recrutare Directă`,
    description: t("metaDesc", { domeniu: nume }),
  };
}

export default async function DisponibiliDomeniuPage({
  params,
}: {
  params: Promise<{ domeniu: string }>;
}) {
  const { domeniu: slug } = await params;
  const domeniu = domeniuDupaSlug(slug);
  if (!domeniu) notFound();

  const t = await getTranslations("disponibili");
  const th = await getTranslations("home");
  const nume = th("categories." + domeniu.nameKey);

  const toti = await incarcaCandidati();
  const aiNostri = candidatiInDomeniu(toti, domeniu);
  const d = agregheaza(aiNostri);
  const audienta = estimeazaAudienta(aiNostri);

  const fmt = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

  const cifre = [
    d.medianaSalariu != null && {
      eticheta: t("stats.median"),
      valoare: `${fmt(d.medianaSalariu)} lei`,
    },
    d.experientaMedie != null && {
      eticheta: t("stats.experience"),
      valoare: t("stats.years", { count: d.experientaMedie }),
    },
    d.cuPermis > 0 && { eticheta: t("stats.licence"), valoare: String(d.cuPermis) },
    d.dispusiDeplasari > 0 && { eticheta: t("stats.travel"), valoare: String(d.dispusiDeplasari) },
    d.remote > 0 && { eticheta: t("stats.remote"), valoare: String(d.remote) },
  ].filter(Boolean) as { eticheta: string; valoare: string }[];

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        eyebrow={`${domeniu.emoji} ${nume}`}
        title={t("pageTitle", { domeniu: nume })}
        subtitle={
          d.intervalSalariu
            ? t("salaryRange", {
                min: fmt(d.intervalSalariu[0]),
                max: fmt(d.intervalSalariu[1]),
              })
            : undefined
        }
        maxWidthClass="max-w-3xl"
      />

      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link href="/disponibili" className="text-sm text-accent hover:underline">
          ← {t("backToIndex")}
        </Link>

        {d.total === 0 ? (
          <p className="mt-4 text-sm text-muted">{t("emptyDomain")}</p>
        ) : (
          <>
            <p className="mt-4 text-3xl font-semibold">
              {t("available", { count: d.total })}
            </p>

            {cifre.length > 0 && (
              <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {cifre.map((c) => (
                  <div key={c.eticheta} className="card">
                    <dt className="text-xs uppercase tracking-wide text-muted">{c.eticheta}</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums">{c.valoare}</dd>
                  </div>
                ))}
              </dl>
            )}

            {d.orase.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold">{t("byCity")}</h2>
                <div className="mt-3 flex flex-col gap-2">
                  {d.orase.map((o) => (
                    <div
                      key={o.oras}
                      className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5"
                    >
                      <span className="font-medium">{o.oras}</span>
                      <span className="text-sm text-accent">
                        {t("available", { count: o.candidati })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <EstimatorAudienta audienta={audienta} />
          </>
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
