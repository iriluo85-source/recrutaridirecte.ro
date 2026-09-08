import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { campanieActiva, zileRamaseCampanie, REDUCERE_STUDENT } from "@/lib/student";

/**
 * Bannerul campaniei Back to School. Se ascunde singur când campania se încheie,
 * ca să nu rămână pe prima pagină o reducere care nu se mai aplică.
 */
export default async function BannerBackToSchool({
  href = "/candidat/student",
}: {
  href?: string;
}) {
  if (!campanieActiva()) return null;

  const t = await getTranslations("backToSchool");
  const zile = zileRamaseCampanie();
  const procent = Math.round(REDUCERE_STUDENT * 100);

  return (
    <section className="relative overflow-hidden border-y border-emerald-900/40 bg-[#0b2b22]">
      {/* Fundal: cercuri concentrice difuze, nu o imagine — se încarcă instant */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-20 h-[24rem] w-[24rem] rounded-full bg-amber-300/10 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-12 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            {t("eyebrow", { count: zile })}
          </span>

          <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Back to School,
            <span className="block text-emerald-300">Forward to Work</span>
          </h2>

          <p className="mt-4 max-w-xl text-lg text-white/85">{t("subtitle")}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 font-semibold text-[#0b2b22] transition hover:bg-emerald-50"
            >
              {t("cta")}
            </Link>
            <span className="text-sm text-white/70">{t("ctaNote")}</span>
          </div>
        </div>

        {/* Discul cu reducerea — elementul pe care îl reține ochiul */}
        <div className="shrink-0 self-center lg:self-auto">
          <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-2 border-amber-300/60 bg-amber-300/10 sm:h-48 sm:w-48">
            <span className="text-5xl font-bold leading-none tracking-tight text-amber-300 sm:text-6xl">
              −{procent}%
            </span>
            <span className="mt-2 px-4 text-center text-sm font-medium uppercase tracking-wider text-white/85">
              {t("discountLabel")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
