import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { gasestePlan } from "@/lib/planuri";
import { PLATI_ACTIVE } from "@/lib/netopia";
import { activeazaAbonamentSimulareAction } from "../actions";

export async function generateMetadata() {
  const t = await getTranslations("plans");
  return { title: `${t("checkout.title")} — Recrutare Directă` };
}

export default async function PlataPage({
  searchParams,
}: {
  searchParams: Promise<{ tip?: string }>;
}) {
  const t = await getTranslations("plans");
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.role) redirect("/alege-rol");

  // Cât timp plățile reale (Netopia) nu sunt active, checkout-ul demo nu e accesibil.
  if (!PLATI_ACTIVE) redirect("/abonamente");

  const { tip } = await searchParams;
  const plan = gasestePlan(session.user.role, tip ?? "");
  if (!plan || plan.tip === "FREE") redirect("/abonamente");

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Link href="/abonamente" className="text-sm text-accent hover:underline">
        {t("checkout.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("checkout.title")}</h1>

      {/* Avertisment demo — foarte vizibil */}
      <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
        <span className="text-lg" aria-hidden="true">⚠️</span>
        <p className="text-sm text-amber-700 dark:text-amber-300">{t("checkout.demoWarning")}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_320px]">
        {/* Formular card — DEMO: câmpurile nu au name și nu sunt trimise nicăieri */}
        <div className="card">
          <h2 className="field-label">{t("checkout.cardDetails")}</h2>

          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="field-label text-xs">{t("checkout.cardName")}</span>
              <input type="text" autoComplete="off" placeholder="ex: Ion Popescu" className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="field-label text-xs">{t("checkout.cardNumber")}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="4242 4242 4242 4242"
                className="input"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="field-label text-xs">{t("checkout.cardExpiry")}</span>
                <input type="text" autoComplete="off" placeholder="12 / 34" className="input" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="field-label text-xs">{t("checkout.cardCvv")}</span>
                <input type="text" inputMode="numeric" autoComplete="off" placeholder="123" className="input" />
              </label>
            </div>
          </div>

          {/* Apple Pay — placeholder până la integrarea procesatorului */}
          <div className="mt-5 border-t border-line pt-5">
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground/90 px-4 py-2.5 text-sm font-medium text-background opacity-50"
              title={t("checkout.applePaySoon")}
            >
               {t("checkout.applePay")}
            </button>
            <p className="mt-1 text-center text-xs text-muted">{t("checkout.applePaySoon")}</p>
          </div>

          <p className="mt-5 text-xs text-muted">{t("checkout.secureNote")}</p>
        </div>

        {/* Sumar comandă + buton de „plată” (simulare, doar planul) */}
        <div className="card h-fit">
          <h2 className="field-label">{t("checkout.summary")}</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted">{t("checkout.plan")}</span>
            <span className="font-medium">{plan.nume}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-sm">
            <span className="text-muted">{t("checkout.total")}</span>
            <span className="font-semibold">
              {plan.pretLunar} {t("perMonth")}
            </span>
          </div>

          <form action={activeazaAbonamentSimulareAction} className="mt-5">
            <input type="hidden" name="tip" value={plan.tip} />
            <button type="submit" className="btn-primary w-full justify-center">
              {t("checkout.pay")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
