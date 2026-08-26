import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import DigestButton from "./DigestButton";
import NewsletterButton from "./NewsletterButton";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const [candidati, angajatori, conversatii, mesaje, rapoarteNerezolvate, testimonialeInAsteptare] =
    await Promise.all([
      prisma.candidateProfile.count(),
      prisma.employerProfile.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.report.count({ where: { rezolvat: false } }),
      prisma.testimonial.count({ where: { aprobat: false } }),
    ]);

  const carduri = [
    { label: t("statCandidates"), valoare: candidati },
    { label: t("statEmployers"), valoare: angajatori },
    { label: t("statConversations"), valoare: conversatii },
    { label: t("statMessages"), valoare: mesaje },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {carduri.map((c) => (
          <div key={c.label} className="card text-center">
            <p className="text-2xl font-semibold">{c.valoare}</p>
            <p className="mt-1 text-sm text-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/admin/utilizatori" className="btn-primary">
          {t("viewAllUsers")}
        </Link>
        <Link href="/admin/documente" className="btn-secondary">
          {t("documentsButton")}
        </Link>
        <Link href="/admin/rapoarte" className="btn-secondary">
          {t("reports.button")}
          {rapoarteNerezolvate > 0 && (
            <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
              {rapoarteNerezolvate}
            </span>
          )}
        </Link>
        <Link href="/admin/testimoniale" className="btn-secondary">
          {t("testimonials.button")}
          {testimonialeInAsteptare > 0 && (
            <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
              {testimonialeInAsteptare}
            </span>
          )}
        </Link>
        <Link href="/admin/noutati" className="btn-secondary">
          {t("news.button")}
        </Link>
      </div>

      <div className="card mt-8">
        <h2 className="field-label">{t("digest.heading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("digest.description")}</p>
        <DigestButton />
      </div>

      <div className="card mt-4">
        <h2 className="field-label">{t("newsletter.heading")}</h2>
        <p className="mt-1 text-sm text-muted">{t("newsletter.description")}</p>
        <NewsletterButton />
      </div>
    </main>
  );
}
