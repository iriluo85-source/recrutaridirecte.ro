import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { firmaVerificata } from "@/lib/planuri";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

export async function generateMetadata() {
  const t = await getTranslations("companies");
  return { title: `${t("title")} — Recrutare Directă` };
}

export default async function CompaniiPage() {
  const t = await getTranslations("companies");
  const tp = await getTranslations("posts");
  const locale = await getLocale();

  const companii = await prisma.employerProfile.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      numeCompanie: true,
      industrie: true,
      locatie: true,
      marimeCompanie: true,
      descriere: true,
      posturi: { where: { activ: true }, select: { id: true } },
      user: { select: { abonamentTip: true, isAdmin: true, email: true } },
    },
  });

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-office.jpg"
        eyebrow={t("count", { count: companii.length })}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        {companii.length === 0 ? (
          <p className="text-sm text-muted">{t("none")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {companii.map((c) => (
              <div key={c.id} className="card flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={c.numeCompanie} size={44} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 font-medium">
                      <span className="truncate">{c.numeCompanie}</span>
                      {firmaVerificata(c.user) && <VerifiedBadge locale={locale} className="h-4 w-4" />}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[c.industrie, c.locatie].filter(Boolean).join(" · ") || " "}
                    </p>
                  </div>
                </div>
                {c.descriere && (
                  <p className="line-clamp-3 text-sm text-muted">{c.descriere}</p>
                )}
                {c.posturi.length > 0 && (
                  <p className="mt-auto text-xs font-medium text-accent">
                    {tp("openCount", { count: c.posturi.length })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
