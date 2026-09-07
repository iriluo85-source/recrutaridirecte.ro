import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import {
  SELECT_DIRECTOR,
  companiiActive,
  filtreazaCompanii,
  esteSortareValida,
} from "@/lib/companii";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";
import VerifiedBadge from "@/components/VerifiedBadge";

export async function generateMetadata() {
  const t = await getTranslations("companies");
  return { title: `${t("title")} — Recrutare Directă` };
}

const REZULTATE_PE_PAGINA = 12;

type SearchParams = Record<string, string | string[] | undefined>;

function parseIntParam(v: string | undefined): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function text(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : "";
}

export default async function CompaniiPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("companies");
  const tp = await getTranslations("posts");
  const locale = await getLocale();
  const params = await searchParams;

  const q = text(params.q);
  const industrie = text(params.industrie);
  const locatie = text(params.locatie);
  const doarAngajeaza = params.angajeaza === "on";
  const sortCerut = text(params.sort);
  const sort = esteSortareValida(sortCerut) ? sortCerut : "recent";
  const pageCurent = Math.max(1, parseIntParam(text(params.page)) ?? 1);

  // O firmă intră în director dacă are un semn de viață: fie un post deschis,
  // fie un profil completat de un om (nu un cont gol rămas de la înregistrare).
  const toate = await prisma.employerProfile.findMany({
    orderBy: { updatedAt: "desc" },
    select: SELECT_DIRECTOR,
  });

  const active = companiiActive(toate);

  const rezultate = filtreazaCompanii(active, {
    q,
    industrie,
    locatie,
    doarAngajeaza,
    sort,
    locale,
  });

  const totalPagini = Math.max(1, Math.ceil(rezultate.length / REZULTATE_PE_PAGINA));
  const paginaSigura = Math.min(pageCurent, totalPagini);
  const rezultatePagina = rezultate.slice(
    (paginaSigura - 1) * REZULTATE_PE_PAGINA,
    paginaSigura * REZULTATE_PE_PAGINA
  );

  const areFiltreActive = Boolean(q || industrie || locatie || doarAngajeaza || sort !== "recent");

  function construiesteLinkPagina(page: number) {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (industrie) qs.set("industrie", industrie);
    if (locatie) qs.set("locatie", locatie);
    if (doarAngajeaza) qs.set("angajeaza", "on");
    if (sort !== "recent") qs.set("sort", sort);
    qs.set("page", String(page));
    return `/companii?${qs.toString()}`;
  }

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-office.jpg"
        eyebrow={t("count", { count: active.length })}
        title={t("title")}
        subtitle={t("subtitle")}
        maxWidthClass="max-w-4xl"
      />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <form className="card grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="field-label">{t("searchLabel")}</span>
            <input
              name="q"
              defaultValue={q}
              placeholder={t("searchPlaceholder")}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">{t("locationLabel")}</span>
            <input
              name="locatie"
              defaultValue={locatie}
              placeholder={t("locationPlaceholder")}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">{t("industryLabel")}</span>
            <input
              name="industrie"
              defaultValue={industrie}
              placeholder={t("industryPlaceholder")}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="field-label">{t("sortLabel")}</span>
            <select name="sort" defaultValue={sort} className="input">
              <option value="recent">{t("sortRecent")}</option>
              <option value="posturi">{t("sortPositions")}</option>
              <option value="nume">{t("sortName")}</option>
            </select>
          </label>
          <label className="col-span-1 flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="angajeaza"
              value="on"
              defaultChecked={doarAngajeaza}
              className="accent-accent"
            />
            {t("onlyHiringLabel")}
          </label>
          <button type="submit" className="btn-primary col-span-1 sm:col-span-2">
            {t("filterButton")}
          </button>
        </form>

        {active.length === 0 ? (
          <p className="mt-6 text-sm text-muted">{t("none")}</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {t("resultsCount", { count: rezultate.length })}
              </p>
              {areFiltreActive && (
                <Link href="/companii" className="text-sm text-accent hover:underline">
                  {t("resetFilters")}
                </Link>
              )}
            </div>

            {rezultate.length === 0 ? (
              <div className="mt-4">
                <p className="text-sm">{t("noResults")}</p>
                <p className="mt-1 text-sm text-muted">{t("noResultsHint")}</p>
                <Link href="/companii" className="btn-secondary mt-4 inline-flex">
                  {t("resetFilters")}
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {rezultatePagina.map((c) => (
                  <Link
                    key={c.id}
                    href={`/companii/${c.id}`}
                    className={`card flex flex-col gap-3 transition hover:border-accent hover:shadow-md ${
                      c.promovat ? "border-amber-400/70 ring-1 ring-amber-400/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={c.numeCompanie} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 font-medium">
                          <span className="truncate">{c.numeCompanie}</span>
                          {c.verificat && (
                            <VerifiedBadge locale={locale} className="h-4 w-4 shrink-0" />
                          )}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {[c.industrie, c.locatie].filter(Boolean).join(" · ") || " "}
                        </p>
                      </div>
                      {c.promovat && (
                        <span className="badge shrink-0 bg-amber-400/15 text-xs text-amber-600 dark:text-amber-400">
                          {t("promoted")}
                        </span>
                      )}
                    </div>

                    {c.descriere && (
                      <p className="line-clamp-3 text-sm text-muted">{c.descriere}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      {c.nrPosturi > 0 ? (
                        <span className="text-xs font-medium text-accent">
                          {tp("openCount", { count: c.nrPosturi })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">{t("noOpenPositions")}</span>
                      )}
                      <span className="text-xs font-medium text-accent">
                        {t("viewProfile")} →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPagini > 1 && (
              <div className="mt-6 flex items-center justify-between">
                {paginaSigura > 1 ? (
                  <Link
                    href={construiesteLinkPagina(paginaSigura - 1)}
                    className="btn-secondary"
                  >
                    ← {paginaSigura - 1}
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-muted">
                  {paginaSigura} / {totalPagini}
                </span>
                {paginaSigura < totalPagini ? (
                  <Link
                    href={construiesteLinkPagina(paginaSigura + 1)}
                    className="btn-secondary"
                  >
                    {paginaSigura + 1} →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
