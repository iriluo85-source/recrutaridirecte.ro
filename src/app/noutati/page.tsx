import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";

export async function generateMetadata() {
  const t = await getTranslations("news");
  return { title: `${t("title")} — Recrutare Directă`, description: t("subtitle") };
}

export default async function NoutatiPage() {
  const t = await getTranslations("news");
  const locale = await getLocale();

  const articole = await prisma.articol.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  const fmt = (d: Date) =>
    new Date(d).toLocaleDateString(locale === "en" ? "en-GB" : "ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <main className="flex-1">
      <PageBanner image="/images/hero-office.jpg" title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="mb-6 rounded-lg border border-line bg-surface/50 px-4 py-3 text-xs text-muted backdrop-blur-md">
          {t("disclaimer")}
        </p>

        {articole.length === 0 ? (
          <p className="text-muted">{t("empty")}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {articole.map((a) => (
              <article key={a.id} className="card">
                <div className="flex flex-wrap items-center gap-2">
                  {a.categorie && <span className="badge text-xs">{a.categorie}</span>}
                  <span className="text-xs text-muted">{fmt(a.createdAt)}</span>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{a.titlu}</h2>
                <p className="mt-1 whitespace-pre-line text-sm text-muted">{a.rezumat}</p>
                <a
                  href={a.sursaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline"
                >
                  {t("source")}: {a.sursaNume} ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
