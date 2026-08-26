import { getLocale } from "next-intl/server";
import { getFaq } from "@/lib/paginiInfo";
import PageBanner from "@/components/PageBanner";

export async function generateMetadata() {
  const locale = await getLocale();
  const f = getFaq(locale);
  return { title: `${f.title} — Recrutare Directă`, description: f.subtitle };
}

export default async function FaqPage() {
  const locale = await getLocale();
  const f = getFaq(locale);
  return (
    <main className="flex-1">
      <PageBanner image="/images/hero-office.jpg" title={f.title} subtitle={f.subtitle} />
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="flex flex-col gap-3">
          {f.items.map((item) => (
            <details key={item.q} className="card group">
              <summary className="cursor-pointer list-none font-medium marker:content-none">
                <span className="flex items-center justify-between gap-3">
                  {item.q}
                  <span className="text-accent transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
