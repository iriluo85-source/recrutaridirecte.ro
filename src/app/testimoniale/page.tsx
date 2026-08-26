import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";
import TestimonialForm from "./TestimonialForm";

export async function generateMetadata() {
  const t = await getTranslations("testimonials");
  return { title: `${t("title")} — Recrutare Directă`, description: t("subtitle") };
}

function Stele({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400" aria-label={`${rating}/5`}>
      {"★".repeat(rating)}
      <span className="text-muted/40">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function TestimonialePage() {
  const t = await getTranslations("testimonials");
  const session = await auth();

  const testimoniale = await prisma.testimonial.findMany({
    where: { aprobat: true },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return (
    <main className="flex-1">
      <PageBanner image="/images/hero-collab.jpg" title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {testimoniale.length === 0 ? (
          <p className="text-muted">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {testimoniale.map((rec) => (
              <div key={rec.id} className="card flex flex-col gap-2">
                <Stele rating={rec.rating} />
                <p className="flex-1 whitespace-pre-line text-sm">{rec.text}</p>
                <div className="flex items-center gap-2 border-t border-line pt-3">
                  <Avatar name={rec.nume} size={32} />
                  <div>
                    <p className="text-sm font-medium">{rec.nume}</p>
                    <p className="text-xs text-muted">
                      {rec.rol === "EMPLOYER" ? t("roleEmployer") : t("roleCandidate")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {session?.user?.role ? (
          <TestimonialForm />
        ) : (
          <p className="mt-6 text-sm text-muted">{t("loginToReview")}</p>
        )}
      </div>
    </main>
  );
}
