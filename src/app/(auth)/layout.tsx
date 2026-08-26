import { getTranslations } from "next-intl/server";
import { alegeSlideAleator } from "@/lib/hero";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("home");
  const slide = alegeSlideAleator();

  return (
    <div className="flex flex-1">
      <div className="flex w-full flex-col justify-center lg:w-1/2">{children}</div>

      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <img src={slide.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgba(4,35,26,0.92) 0%, rgba(6,40,30,0.8) 40%, rgba(15,23,42,0.55) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-end gap-3 p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {t("heroEyebrow")}
          </span>
          <p className="max-w-sm text-3xl font-bold leading-tight text-white">
            {t("slogans." + slide.sloganKey)}
          </p>
          <p className="max-w-sm text-white/80">{t("heroSubtitle")}</p>
        </div>
      </div>
    </div>
  );
}
