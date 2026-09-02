import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  planuriPentruRol,
  gasestePlan,
  perioadaValida,
  pretPerioada,
  numePlan,
  abonamentEfectiv,
  PERIOADE_ABONAMENT,
} from "@/lib/planuri";
import { anuleazaAbonamentAction } from "./actions";
import { PLATI_ACTIVE } from "@/lib/netopia";

export async function generateMetadata() {
  const t = await getTranslations("plans");
  return { title: `${t("title")} — Recrutare Directă` };
}

export default async function AbonamentePage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; activat?: string; anulat?: string; perioada?: string }>;
}) {
  const t = await getTranslations("plans");
  const locale = await getLocale();
  const sp = await searchParams;
  const perioada = perioadaValida(sp.perioada);
  const session = await auth();

  const user = session?.user
    ? await prisma.user.findUnique({ where: { id: session.user.id } })
    : null;

  // Planul efectiv (adminul are Nelimitat din oficiu) — pentru evidențierea planului curent.
  const tipCurent = abonamentEfectiv(user);

  // Rolul pentru care afișăm planurile: dacă e logat, rolul lui; altfel din ?rol=
  const rolAfisat = session?.user.role ?? (sp.rol === "angajator" ? "EMPLOYER" : "CANDIDATE");
  const planuri = planuriPentruRol(rolAfisat);
  const esteVizitator = !session?.user.role;

  const fmtData = (d: Date) =>
    new Date(d).toLocaleDateString(locale === "ro" ? "ro-RO" : "en-GB");

  // Formatează prețurile cu 2 zecimale (virgulă la RO, punct la EN).
  const fmtPret = (n: number) =>
    new Intl.NumberFormat(locale === "ro" ? "ro-RO" : "en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">{t("title")}</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted">{t("subtitle")}</p>
        <div className="mx-auto mt-4 flex max-w-xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted">
          {[t("reassure1"), t("reassure2"), t("reassure3")].map((r) => (
            <span key={r} className="inline-flex items-center gap-1.5">
              <span className="text-accent">✓</span>
              {r}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-full border border-line bg-surface/60 p-1 backdrop-blur-md">
        {PERIOADE_ABONAMENT.map((p) => {
          const activ = p.id === perioada;
          const qs = new URLSearchParams();
          if (sp.rol) qs.set("rol", sp.rol);
          qs.set("perioada", p.id);
          return (
            <Link
              key={p.id}
              href={`/abonamente?${qs.toString()}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activ ? "bg-accent text-accent-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {t("period." + p.id)}
              {p.reducere > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activ ? "bg-white/25 text-white" : "bg-accent/15 text-accent"
                  }`}
                >
                  −{Math.round(p.reducere * 100)}%
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {sp.activat && (
        <div className="mt-6 rounded-lg border border-accent/30 bg-accent-secondary px-4 py-3 text-center text-sm font-medium text-accent-secondary-foreground">
          {t("activatedBanner")}
        </div>
      )}
      {sp.anulat && (
        <div className="mt-6 rounded-lg border border-line bg-surface/50 px-4 py-3 text-center text-sm text-muted backdrop-blur-md">
          {t("canceledBanner")}
        </div>
      )}

      {user?.abonamentTip && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4">
          <p className="text-sm">
            {t("activeBanner", {
              plan: (() => {
                const pl = gasestePlan(rolAfisat, user.abonamentTip!);
                return pl ? numePlan(pl, locale) : user.abonamentTip!;
              })(),
              date: user.abonamentExpira ? fmtData(user.abonamentExpira) : "-",
            })}
          </p>
          <form action={anuleazaAbonamentAction}>
            <button type="submit" className="text-sm text-red-500 hover:underline">
              {t("cancel")}
            </button>
          </form>
        </div>
      )}

      {esteVizitator && (
        <div className="mt-8 flex justify-center gap-2">
          <Link
            href="/abonamente?rol=candidat"
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              rolAfisat === "CANDIDATE" ? "bg-accent text-accent-foreground" : "border border-line text-muted"
            }`}
          >
            {t("forCandidates")}
          </Link>
          <Link
            href="/abonamente?rol=angajator"
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              rolAfisat === "EMPLOYER" ? "bg-accent text-accent-foreground" : "border border-line text-muted"
            }`}
          >
            {t("forEmployers")}
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {planuri.map((plan) => {
          const planCurent = tipCurent ?? "FREE";
          const estePlanulMeu = planCurent === plan.tip;
          return (
            <div
              key={plan.tip}
              className={`card flex flex-col ${
                plan.evidentiat ? "border-2 border-accent" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${plan.clasaAccent}`}>
                  {numePlan(plan, locale)}
                </span>
                {plan.evidentiat && (
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {t("popular")}
                  </span>
                )}
              </div>

              {plan.pretLunar === 0 ? (
                <p className="mt-4">
                  <span className="text-3xl font-semibold">{t("free")}</span>
                </p>
              ) : (
                (() => {
                  const pp = pretPerioada(plan.pretLunar, perioada);
                  return (
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-semibold">{fmtPret(pp.total)}</span>
                        <span className="text-sm text-muted">
                          {t("currencyPer." + perioada)}
                        </span>
                      </div>
                      {perioada !== "lunar" && (
                        <p className="mt-1 text-xs text-muted">
                          {t("perMonthEquiv", { pret: fmtPret(pp.perLuna) })}{" "}
                          <span className="font-semibold text-accent">· −{pp.reducere}%</span>
                        </p>
                      )}
                    </div>
                  );
                })()
              )}

              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {plan.beneficii.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-0.5 text-accent">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {estePlanulMeu ? (
                  <span className="btn-secondary pointer-events-none w-full justify-center opacity-70">
                    {t("currentPlan")}
                  </span>
                ) : plan.tip !== "FREE" && !PLATI_ACTIVE ? (
                  <span className="btn-secondary pointer-events-none w-full justify-center opacity-60">
                    {t("comingSoon")}
                  </span>
                ) : esteVizitator ? (
                  <Link href="/inregistrare" className="btn-secondary w-full justify-center">
                    {t("needAccount")}
                  </Link>
                ) : plan.tip === "FREE" ? (
                  <form action={anuleazaAbonamentAction}>
                    <button type="submit" className="btn-secondary w-full justify-center">
                      {t("downgradeFree")}
                    </button>
                  </form>
                ) : (
                  <Link
                    href={`/abonamente/plata?tip=${plan.tip}`}
                    className={`w-full justify-center ${plan.evidentiat ? "btn-primary" : "btn-secondary"}`}
                  >
                    {t("choose")}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="mx-auto mt-12 max-w-2xl">
        <h2 className="text-center text-xl font-semibold">{t("faqTitle")}</h2>
        <div className="mt-4 flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <details key={i} className="card">
              <summary className="cursor-pointer font-medium">{t(`faqQ${i}`)}</summary>
              <p className="mt-2 text-sm text-muted">{t(`faqA${i}`)}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted">
        {t("placeholderNote")}
      </p>
    </main>
  );
}
