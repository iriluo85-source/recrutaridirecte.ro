import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { aprobaTestimonialAction, stergeTestimonialAction } from "../actions";

export default async function AdminTestimonialePage() {
  const t = await getTranslations("admin");

  const testimoniale = await prisma.testimonial.findMany({
    orderBy: [{ aprobat: "asc" }, { createdAt: "desc" }],
  });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("testimonials.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("testimonials.total", { count: testimoniale.length })}</p>

      {testimoniale.length === 0 ? (
        <p className="mt-6 text-muted">{t("testimonials.empty")}</p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {testimoniale.map((rec) => (
            <div
              key={rec.id}
              className={`card flex flex-wrap items-start justify-between gap-3 ${
                rec.aprobat ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-amber-400">
                  {"★".repeat(rec.rating)}
                  <span className="text-muted/40">{"★".repeat(5 - rec.rating)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">{rec.text}</p>
                <p className="mt-2 text-xs text-muted">
                  {rec.nume} · {rec.rol === "EMPLOYER" ? t("testimonials.roleEmployer") : t("testimonials.roleCandidate")}
                  {rec.aprobat && ` · ${t("testimonials.approved")}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!rec.aprobat && (
                  <form action={aprobaTestimonialAction}>
                    <input type="hidden" name="id" value={rec.id} />
                    <button type="submit" className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400">
                      {t("testimonials.approve")}
                    </button>
                  </form>
                )}
                <form action={stergeTestimonialAction}>
                  <input type="hidden" name="id" value={rec.id} />
                  <button type="submit" className="text-sm font-medium text-red-500 hover:underline">
                    {t("testimonials.delete")}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
