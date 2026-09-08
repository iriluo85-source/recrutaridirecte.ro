import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  candidatiDinOras,
  agregheaza,
  domeniiDinSet,
  slugOras,
  oraseCuCandidati,
  PRAG_MINIM_ORAS,
} from "@/lib/disponibili";
import { estimeazaAudienta } from "@/lib/audienta";
import PageBanner from "@/components/PageBanner";
import EstimatorAudienta from "@/components/EstimatorAudienta";
import { incarcaCandidati } from "../../page";

export const dynamic = "force-dynamic";

async function gasesteOras(slug: string) {
  const toti = await incarcaCandidati();
  const aiNostri = candidatiDinOras(toti, slug);
  if (aiNostri.length < PRAG_MINIM_ORAS) return null;
  // Eticheta afișată = forma scrisă cel mai des de candidați.
  const nume =
    oraseCuCandidati(aiNostri, 1).find((o) => slugOras(o.oras) === slug.toLowerCase())?.oras ??
    aiNostri[0].locatie;
  return { toti, aiNostri, nume };
}

export async function generateMetadata({ params }: { params: Promise<{ nume: string }> }) {
  const { nume: slug } = await params;
  const gasit = await gasesteOras(slug);
  if (!gasit) return { title: "Recrutare Directă" };

  const t = await getTranslations("disponibili");
  return {
    title: `${t("cityTitle", { oras: gasit.nume })} — Recrutare Directă`,
    description: t("cityMeta", { oras: gasit.nume }),
  };
}

export default async function DisponibiliOrasPage({
  params,
}: {
  params: Promise<{ nume: string }>;
}) {
  const { nume: slug } = await params;
  const gasit = await gasesteOras(slug);
  if (!gasit) notFound();

  const t = await getTranslations("disponibili");
  const th = await getTranslations("home");

  const d = agregheaza(gasit.aiNostri);
  const domenii = domeniiDinSet(gasit.aiNostri);
  const audienta = estimeazaAudienta(gasit.aiNostri);
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
        image="/images/hero-unity.jpg"
        eyebrow={gasit.nume}
        title={t("cityTitle", { oras: gasit.nume })}
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

        <p className="mt-4 text-3xl font-semibold">{t("available", { count: d.total })}</p>

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

        {domenii.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold">{t("byDomain")}</h2>
            <div className="mt-3 flex flex-col gap-2">
              {domenii.map(({ domeniu, total }) => (
                <Link
                  key={domeniu.slug}
                  href={`/disponibili/${domeniu.slug}`}
                  className="flex items-center justify-between rounded-lg border border-line px-4 py-2.5 transition hover:border-accent"
                >
                  <span className="font-medium">
                    <span aria-hidden="true">{domeniu.emoji}</span>{" "}
                    {th("categories." + domeniu.nameKey)}
                  </span>
                  <span className="text-sm text-accent">
                    {t("available", { count: total })}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <EstimatorAudienta audienta={audienta} />

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
