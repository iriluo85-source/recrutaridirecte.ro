import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculeazaScorPotrivire, treceFiltrele, type MatchCriteria } from "@/lib/matching";
import { domeniuDupaSlug } from "@/lib/domenii";
import { boostCautare } from "@/lib/planuri";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";
import { salveazaCautareAction, stergeCautareAction } from "./actions";

function parseIntParam(v: string | undefined): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Relevanța minimă (0-100) de la care un candidat cu abonament e „Promovat" (boost de
// vizibilitate). Sub acest prag nu se promovează, ca să nu apară abonați total nepotriviți sus.
const PRAG_PROMOVARE = 25;

type SearchParams = Record<string, string | string[] | undefined>;

export default async function CautarePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("employer");
  const tc = await getTranslations("common");
  const th = await getTranslations("home");
  const params = await searchParams;
  const skillsInput = typeof params.skills === "string" ? params.skills : "";
  const locatie = typeof params.locatie === "string" ? params.locatie : "";
  const experientaMin = parseIntParam(typeof params.experientaMin === "string" ? params.experientaMin : undefined);
  const experientaMax = parseIntParam(typeof params.experientaMax === "string" ? params.experientaMax : undefined);
  const bugetMin = parseIntParam(typeof params.bugetMin === "string" ? params.bugetMin : undefined);
  const bugetMax = parseIntParam(typeof params.bugetMax === "string" ? params.bugetMax : undefined);
  const filtruPermis = params.permis === "on";
  const filtruDeplasari = params.deplasari === "on";

  const domeniu = domeniuDupaSlug(typeof params.domeniu === "string" ? params.domeniu : undefined);

  const skillsManual = skillsInput
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  // dacă utilizatorul tastează skill-uri, acelea au prioritate; altfel folosim
  // skill-urile domeniului selectat de pe prima pagină
  const skills = skillsManual.length > 0 ? skillsManual : domeniu ? domeniu.skills : [];

  const session = await auth();
  const employer = session?.user?.id
    ? await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
    : null;
  const savedIds = employer
    ? new Set(
        (
          await prisma.savedCandidate.findMany({
            where: { employerId: employer.id },
            select: { candidateId: true },
          })
        ).map((s) => s.candidateId)
      )
    : new Set<string>();

  const savedSearches = employer
    ? await prisma.savedSearch.findMany({
        where: { employerId: employer.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const candidati = await prisma.candidateProfile.findMany({
    include: {
      skills: { include: { skill: true } },
      _count: { select: { cvFiles: true } },
      user: { select: { abonamentTip: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const criterii: MatchCriteria = {
    skills,
    locatie: locatie || undefined,
    experientaMin,
    experientaMax,
    bugetMin,
    bugetMax,
  };

  const rezultate = candidati
    .map((c) => {
      const result = calculeazaScorPotrivire(criterii, {
        locatie: c.locatie,
        remote: c.remote,
        aniExperienta: c.aniExperienta,
        salariuMinim: c.salariuMinim,
        salariuMaxim: c.salariuMaxim,
        skills: c.skills.map((s) => s.skill.nume),
      });
      // Abonamentele Platinum/Unlimited sunt AVANTAJATE: primesc un boost de vizibilitate
      // și apar printre primii — cu condiția să aibă o relevanță minimă (măcar câteva filtre
      // comune, PRAG_PROMOVARE). Astfel un abonat complet nepotrivit nu urcă artificial peste
      // un candidat foarte potrivit, dar unul relevant e clar promovat.
      const boost = boostCautare(c.user.abonamentTip);
      const promovat = boost > 0 && result.score >= PRAG_PROMOVARE;
      return {
        candidat: c,
        score: result.score,
        prioritar: promovat,
        scorSortare: result.score + (promovat ? boost : 0),
      };
    })
    .sort((a, b) => b.scorSortare - a.scorSortare)
    .filter((r) => {
      // Filtre dure: locație (oraș sau remote), interval de experiență, buget.
      if (!treceFiltrele(criterii, r.candidat)) return false;
      if (filtruPermis && !r.candidat.permisConducere) return false;
      if (filtruDeplasari && !r.candidat.dispusDeplasari) return false;
      return true;
    });

  const REZULTATE_PE_PAGINA = 10;
  const pageCurent = Math.max(1, parseIntParam(typeof params.page === "string" ? params.page : undefined) ?? 1);
  const totalPagini = Math.max(1, Math.ceil(rezultate.length / REZULTATE_PE_PAGINA));
  const rezultatePagina = rezultate.slice(
    (pageCurent - 1) * REZULTATE_PE_PAGINA,
    pageCurent * REZULTATE_PE_PAGINA
  );

  function construiesteLinkPagina(page: number) {
    const qs = new URLSearchParams();
    if (domeniu) qs.set("domeniu", domeniu.slug);
    if (skillsInput) qs.set("skills", skillsInput);
    if (locatie) qs.set("locatie", locatie);
    if (experientaMin !== undefined) qs.set("experientaMin", String(experientaMin));
    if (experientaMax !== undefined) qs.set("experientaMax", String(experientaMax));
    if (bugetMin !== undefined) qs.set("bugetMin", String(bugetMin));
    if (bugetMax !== undefined) qs.set("bugetMax", String(bugetMax));
    if (filtruPermis) qs.set("permis", "on");
    if (filtruDeplasari) qs.set("deplasari", "on");
    qs.set("page", String(page));
    return `/angajator/cautare?${qs.toString()}`;
  }

  function linkCautareSalvata(s: (typeof savedSearches)[number]) {
    const qs = new URLSearchParams();
    if (s.domeniu) qs.set("domeniu", s.domeniu);
    if (s.skills) qs.set("skills", s.skills);
    if (s.locatie) qs.set("locatie", s.locatie);
    if (s.experientaMin != null) qs.set("experientaMin", String(s.experientaMin));
    if (s.experientaMax != null) qs.set("experientaMax", String(s.experientaMax));
    if (s.bugetMin != null) qs.set("bugetMin", String(s.bugetMin));
    if (s.bugetMax != null) qs.set("bugetMax", String(s.bugetMax));
    return `/angajator/cautare?${qs.toString()}`;
  }

  const areFiltreActive = Boolean(
    skillsInput ||
      locatie ||
      experientaMin !== undefined ||
      experientaMax !== undefined ||
      bugetMin !== undefined ||
      bugetMax !== undefined ||
      filtruPermis ||
      filtruDeplasari ||
      domeniu
  );

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        title={t("search.title")}
        subtitle={t("search.subtitle")}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {domeniu && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5">
          <span className="text-sm font-medium">
            {domeniu.emoji} {t("search.domainActive", { domeniu: th("categories." + domeniu.nameKey) })}
          </span>
          <Link href="/angajator/cautare" className="text-sm text-accent hover:underline">
            {t("search.searchFreely")}
          </Link>
        </div>
      )}

      <form className="card mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {domeniu && <input type="hidden" name="domeniu" value={domeniu.slug} />}
        <label className="col-span-1 flex flex-col gap-1 sm:col-span-2">
          <span className="field-label">{t("search.skillsLabel")}</span>
          <input
            name="skills"
            defaultValue={skillsInput}
            placeholder={t("search.skillsPlaceholder")}
            className="input"
          />
        </label>
        <label className="col-span-1 flex flex-col gap-1 sm:col-span-2">
          <span className="field-label">{t("search.locationLabel")}</span>
          <input
            name="locatie"
            defaultValue={locatie}
            placeholder={t("search.locationPlaceholder")}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("search.expMinLabel")}</span>
          <input
            type="number"
            name="experientaMin"
            defaultValue={experientaMin ?? ""}
            min={0}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("search.expMaxLabel")}</span>
          <input
            type="number"
            name="experientaMax"
            defaultValue={experientaMax ?? ""}
            min={0}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("search.budgetMinLabel")}</span>
          <input
            type="number"
            name="bugetMin"
            defaultValue={bugetMin ?? ""}
            min={0}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">{t("search.budgetMaxLabel")}</span>
          <input
            type="number"
            name="bugetMax"
            defaultValue={bugetMax ?? ""}
            min={0}
            className="input"
          />
        </label>
        <div className="col-span-1 flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="permis" value="on" defaultChecked={filtruPermis} className="accent-accent" />
            🚗 {tc("atribute.permisConducere")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="deplasari" value="on" defaultChecked={filtruDeplasari} className="accent-accent" />
            🧳 {tc("atribute.deplasari")}
          </label>
        </div>
        <button type="submit" className="btn-primary col-span-1 sm:col-span-2">
          {t("search.searchButton")}
        </button>
      </form>

      {/* Căutări salvate + salvare căutare curentă */}
      <div className="mt-4 flex flex-col gap-3">
        {savedSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">{t("savedSearch.title")}:</span>
            {savedSearches.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-sm backdrop-blur-md"
              >
                <Link href={linkCautareSalvata(s)} className="font-medium hover:text-accent">
                  {s.nume}
                </Link>
                <form action={stergeCautareAction} className="flex">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    aria-label={t("savedSearch.delete")}
                    className="leading-none text-muted hover:text-red-500"
                  >
                    ×
                  </button>
                </form>
              </span>
            ))}
          </div>
        )}

        {areFiltreActive && (
          <form action={salveazaCautareAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="skills" value={skillsInput} />
            <input type="hidden" name="locatie" value={locatie} />
            <input type="hidden" name="experientaMin" value={experientaMin ?? ""} />
            <input type="hidden" name="experientaMax" value={experientaMax ?? ""} />
            <input type="hidden" name="bugetMin" value={bugetMin ?? ""} />
            <input type="hidden" name="bugetMax" value={bugetMax ?? ""} />
            <input type="hidden" name="domeniu" value={domeniu?.slug ?? ""} />
            <input
              name="nume"
              required
              placeholder={t("savedSearch.namePlaceholder")}
              className="input max-w-xs"
            />
            <button type="submit" className="btn-secondary text-sm">
              {t("savedSearch.save")}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-accent/20 bg-accent-secondary px-5 py-4 text-center">
        <p className="text-base font-semibold text-accent-secondary-foreground sm:text-lg">
          🤝 {t("search.motivBanner")}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {rezultate.length === 0 && (
          <p className="text-sm text-muted">{t("search.noCandidates")}</p>
        )}
        {rezultatePagina.map(({ candidat, score, prioritar }) => (
          <Link
            key={candidat.id}
            href={`/angajator/candidat/${candidat.id}`}
            className={`card flex items-center gap-4 transition hover:border-accent hover:shadow-md ${
              prioritar ? "border-amber-400/70 bg-amber-400/5 ring-1 ring-amber-400/30" : ""
            }`}
          >
            <Avatar name={candidat.numeComplet} size={48} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{candidat.titluCurent}</p>
                {prioritar && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-amber-950">
                    🚀 {t("search.priority")}
                  </span>
                )}
                {savedIds.has(candidat.id) && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    ★ {t("saved.savedBadge")}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted">
                {candidat.locatie} {candidat.remote ? `· ${tc("remoteOk")}` : ""} ·{" "}
                {t("search.yearsExperience", { count: candidat.aniExperienta })}
              </p>
              <p className="mt-1 text-xs text-muted">
                {candidat.skills.map((s) => s.skill.nume).join(", ")}
              </p>
              {candidat._count.cvFiles > 0 && (
                <p className="mt-1 text-xs text-accent">
                  📎 {candidat._count.cvFiles === 1 ? t("search.cvAttachedOne") : t("search.cvAttachedMany", { count: candidat._count.cvFiles })}
                </p>
              )}
            </div>
            <span className="badge shrink-0">{t("search.matchBadge", { score })}</span>
          </Link>
        ))}
      </div>

      {totalPagini > 1 && (
        <div className="mt-6 flex items-center justify-between">
          {pageCurent > 1 ? (
            <Link href={construiesteLinkPagina(pageCurent - 1)} className="btn-secondary">
              ← {t("search.previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">
            {t("search.pageOf", { current: pageCurent, total: totalPagini })}
          </span>
          {pageCurent < totalPagini ? (
            <Link href={construiesteLinkPagina(pageCurent + 1)} className="btn-secondary">
              {t("search.next")} →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
      </div>
    </main>
  );
}
