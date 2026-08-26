import { getLocale } from "next-intl/server";
import { getDespre } from "@/lib/paginiInfo";
import PageBanner from "@/components/PageBanner";

export async function generateMetadata() {
  const locale = await getLocale();
  const d = getDespre(locale);
  return { title: `${d.title} — Recrutare Directă`, description: d.subtitle };
}

export default async function DesprePage() {
  const locale = await getLocale();
  const d = getDespre(locale);
  return (
    <main className="flex-1">
      <PageBanner image="/images/hero-team.jpg" title={d.title} subtitle={d.subtitle} />
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="flex flex-col gap-4">
          {d.sectiuni.map((s) => (
            <div key={s.titlu} className="card">
              <h2 className="text-lg font-semibold">{s.titlu}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
