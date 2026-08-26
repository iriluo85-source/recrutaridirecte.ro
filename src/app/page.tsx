import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DOMENII } from "@/lib/domenii";
import { alegeSlideAleator } from "@/lib/hero";
import Avatar from "@/components/Avatar";

// rotunjim în jos la un prag „frumos" ca „Peste N" să rămână mereu adevărat
function pestePrag(n: number): number {
  if (n < 10) return n;
  if (n < 100) return Math.floor(n / 10) * 10;
  if (n < 1000) return Math.floor(n / 50) * 50;
  return Math.floor(n / 100) * 100;
}

// regula românească: „de" se folosește la numere ale căror ultime două cifre sunt 00 sau ≥ 20
function prefixDe(n: number): string {
  const ultimele = n % 100;
  const useDe = ultimele === 0 ? n !== 0 : ultimele >= 20;
  return useDe ? "de " : "";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ "cont-sters"?: string }>;
}) {
  const t = await getTranslations("home");
  const td = await getTranslations("dashboard");
  const th = await getTranslations("howItWorks");
  const session = await auth();
  const role = session?.user.role ?? null;
  const isEmployer = role === "EMPLOYER";
  const isCandidate = role === "CANDIDATE";
  const contSters = (await searchParams)["cont-sters"] === "1";
  const slide = alegeSlideAleator();

  // numărători live pentru banda de social proof (se actualizează singure)
  const [candidatiCount, companiiCount] = await Promise.all([
    prisma.candidateProfile.count(),
    prisma.employerProfile.count(),
  ]);
  const candidatiAfisat = pestePrag(candidatiCount);
  const companiiAfisat = pestePrag(companiiCount);

  // ---- date pentru dashboard (utilizatori logați) ----
  let candDash: { hasProfile: boolean; pending: number; accepted: number; rejected: number } | null = null;
  let empDash: {
    hasProfile: boolean;
    pending: number;
    accepted: number;
    rejected: number;
    conversations: number;
    offersSent: number;
    responseRate: number;
    profilesViewed: number;
    savedCount: number;
  } | null = null;

  if (isCandidate) {
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    });
    if (profile) {
      const [pending, accepted, rejected] = await Promise.all([
        prisma.jobOffer.count({ where: { conversation: { candidateId: profile.id }, status: "PENDING" } }),
        prisma.jobOffer.count({ where: { conversation: { candidateId: profile.id }, status: "ACCEPTED" } }),
        prisma.jobOffer.count({ where: { conversation: { candidateId: profile.id }, status: "REJECTED" } }),
      ]);
      candDash = { hasProfile: true, pending, accepted, rejected };
    } else {
      candDash = { hasProfile: false, pending: 0, accepted: 0, rejected: 0 };
    }
  }

  if (isEmployer) {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: session!.user.id },
      select: { id: true },
    });
    if (employer) {
      const [pending, accepted, rejected, conversations, offersSent, profilesViewed, savedCount] =
        await Promise.all([
          prisma.jobOffer.count({ where: { conversation: { employerId: employer.id }, status: "PENDING" } }),
          prisma.jobOffer.count({ where: { conversation: { employerId: employer.id }, status: "ACCEPTED" } }),
          prisma.jobOffer.count({ where: { conversation: { employerId: employer.id }, status: "REJECTED" } }),
          prisma.conversation.count({ where: { employerId: employer.id } }),
          prisma.jobOffer.count({ where: { conversation: { employerId: employer.id } } }),
          prisma.profileView.count({ where: { employerId: employer.id, tip: "PROFIL" } }),
          prisma.savedCandidate.count({ where: { employerId: employer.id } }),
        ]);
      const responded = offersSent - pending;
      const responseRate = offersSent > 0 ? Math.round((responded / offersSent) * 100) : 0;
      empDash = {
        hasProfile: true,
        pending,
        accepted,
        rejected,
        conversations,
        offersSent,
        responseRate,
        profilesViewed,
        savedCount,
      };
    } else {
      empDash = {
        hasProfile: false,
        pending: 0,
        accepted: 0,
        rejected: 0,
        conversations: 0,
        offersSent: 0,
        responseRate: 0,
        profilesViewed: 0,
        savedCount: 0,
      };
    }
  }

  function domeniuHref(slug: string) {
    if (isEmployer) return `/angajator/cautare?domeniu=${slug}`;
    return `/inregistrare?rol=EMPLOYER`;
  }
  const alteDomeniiHref = isEmployer ? "/angajator/cautare" : "/inregistrare?rol=EMPLOYER";

  const companyCards = [
    { image: "/images/hero-office.jpg", key: "companyOffice" },
    { image: "/images/hero-factory.jpg", key: "companyFactory" },
    { image: "/images/hero-welder.jpg", key: "companyField" },
  ];
  const people = ["/images/person-1.jpg", "/images/person-2.jpg", "/images/person-3.jpg", "/images/person-4.jpg", "/images/person-5.jpg"];

  const exempleCv = [
    { nume: "A. Popescu", titlu: "Dezvoltator Frontend", loc: "Cluj-Napoca", ani: 6, skills: "React, TypeScript, CSS", scor: 92 },
    { nume: "M. Ionescu", titlu: "Contabil Senior", loc: "București", ani: 8, skills: "Excel, SAP, Fiscalitate", scor: 88 },
    { nume: "R. Radu", titlu: "Șofer categoria C", loc: "Timișoara", ani: 4, skills: "Transport, Logistică", scor: 85 },
  ];

  const stepCard = (n: number, title: string, desc: string) => (
    <div key={n} className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
        {n}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{desc}</p>
      </div>
    </div>
  );

  return (
    <main className="flex-1">
      {contSters && (
        <div className="border-b border-line bg-surface/50 px-6 py-3 text-center text-sm">
          {t("accountDeletedBanner")}
        </div>
      )}

      {/* Hero cu imagine + slogan rotativ */}
      <section className="relative isolate overflow-hidden">
        <img src={slide.image} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(105deg, rgba(4,35,26,0.94) 0%, rgba(6,40,30,0.86) 35%, rgba(15,23,42,0.62) 100%)",
          }}
        />
        <div className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t("heroEyebrow")}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              {t("slogans." + slide.sloganKey)}
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/85">{t("heroSubtitle")}</p>

            {!session && (
              <>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/inregistrare?rol=CANDIDATE" className="btn-primary">
                    {t("ctaCandidate")}
                  </Link>
                  <Link
                    href="/inregistrare?rol=EMPLOYER"
                    className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/5 px-5 py-2.5 font-medium text-white backdrop-blur transition hover:bg-white/15"
                  >
                    {t("ctaEmployer")}
                  </Link>
                </div>
                <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
                  {[t("trustDomains"), t("trustMatch"), t("trustDirect")].map((label) => (
                    <span key={label} className="inline-flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bandă social proof — numere live */}
      <section className="border-b border-line bg-surface/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-x-8 gap-y-1 px-6 py-5 text-center sm:flex-row">
          <p className="text-sm font-medium">
            <span className="mr-1.5 text-accent">👥</span>
            {t("statsCandidates", { count: candidatiAfisat, de: prefixDe(candidatiAfisat) })}
          </p>
          <span className="hidden text-line sm:inline">·</span>
          <p className="text-sm font-medium">
            <span className="mr-1.5 text-accent">🏢</span>
            {t("statsCompanies", { count: companiiAfisat, de: prefixDe(companiiAfisat) })}
          </p>
        </div>
      </section>

      {/* Dashboard candidat */}
      {candDash && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold">{td("welcome")}</h2>
          <p className="mt-1 text-muted">{td("candidateSubtitle")}</p>

          {!candDash.hasProfile ? (
            <div className="card mt-6">
              <p className="font-medium">{td("completeProfileTitle")}</p>
              <p className="mt-1 text-sm text-muted">{td("completeProfileDesc")}</p>
              <Link href="/candidat/profil/editeaza" className="btn-primary mt-4 inline-flex">
                {td("completeProfileCta")}
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { label: td("pending"), value: candDash.pending },
                { label: td("accepted"), value: candDash.accepted },
                { label: td("rejected"), value: candDash.rejected },
              ].map((s) => (
                <Link key={s.label} href="/candidat/oferte" className="card text-center transition hover:border-accent">
                  <p className="text-3xl font-semibold text-accent">{s.value}</p>
                  <p className="mt-1 text-sm text-muted">{s.label}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Dashboard angajator */}
      {empDash && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold">{td("welcome")}</h2>
          <p className="mt-1 text-muted">{td("employerSubtitle")}</p>

          {!empDash.hasProfile && (
            <div className="card mt-6">
              <p className="font-medium">{td("completeProfileTitle")}</p>
              <p className="mt-1 text-sm text-muted">{td("completeCompanyDesc")}</p>
              <Link href="/angajator/profil/editeaza" className="btn-primary mt-4 inline-flex">
                {td("completeProfileCta")}
              </Link>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: td("pending"), value: empDash.pending, href: "/angajator/mesaje" },
              { label: td("accepted"), value: empDash.accepted, href: "/angajator/mesaje" },
              { label: td("rejected"), value: empDash.rejected, href: "/angajator/mesaje" },
              { label: td("conversations"), value: empDash.conversations, href: "/angajator/mesaje" },
            ].map((s) => (
              <Link key={s.label} href={s.href} className="card text-center transition hover:border-accent">
                <p className="text-3xl font-semibold text-accent">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card text-center">
              <p className="text-3xl font-semibold">{empDash.offersSent}</p>
              <p className="mt-1 text-sm text-muted">{td("offersSent")}</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-semibold">{empDash.responseRate}%</p>
              <p className="mt-1 text-sm text-muted">{td("responseRate")}</p>
            </div>
            <div className="card text-center">
              <p className="text-3xl font-semibold">{empDash.profilesViewed}</p>
              <p className="mt-1 text-sm text-muted">{td("profilesViewed")}</p>
            </div>
            <Link
              href="/angajator/salvati"
              className="card text-center transition hover:border-accent"
            >
              <p className="text-3xl font-semibold text-accent">{empDash.savedCount}</p>
              <p className="mt-1 text-sm text-muted">{td("savedCandidates")}</p>
            </Link>
          </div>

          <Link href="/angajator/cautare" className="btn-primary mt-6 inline-flex">
            {td("searchNow")}
          </Link>
        </section>
      )}

      {/* Categorii — pentru angajatori și vizitatori */}
      {(!session || isEmployer) && (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-semibold">{t("categoriesTitle")}</h2>
          <p className="mt-1 text-muted">{t("categoriesSubtitle")}</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {DOMENII.map((d) => (
              <Link
                key={d.slug}
                href={domeniuHref(d.slug)}
                className="card flex flex-col items-center gap-2 text-center transition hover:border-accent hover:shadow-md"
              >
                <span className="text-3xl">{d.emoji}</span>
                <span className="text-sm font-medium">{t("categories." + d.nameKey)}</span>
              </Link>
            ))}
            <Link
              href={alteDomeniiHref}
              className="card flex flex-col items-center gap-2 border-dashed text-center transition hover:border-accent"
            >
              <span className="text-3xl">🔎</span>
              <span className="text-sm font-medium">{t("otherDomains")}</span>
              <span className="text-xs text-muted">{t("otherDomainsHint")}</span>
            </Link>
          </div>
        </section>
      )}

      {/* Cum funcționează + exemple CV — pentru vizitatori */}
      {!session && (
        <section id="cum-functioneaza" className="scroll-mt-20 border-t border-line bg-surface/40">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-semibold">{th("title")}</h2>
            <p className="mt-1 text-muted">{th("subtitle")}</p>

            <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2">
              <div>
                <h3 className="field-label">{th("forCandidates")}</h3>
                <div className="mt-4 flex flex-col gap-4">
                  {stepCard(1, th("c1"), th("c1d"))}
                  {stepCard(2, th("c2"), th("c2d"))}
                  {stepCard(3, th("c3"), th("c3d"))}
                </div>
              </div>
              <div>
                <h3 className="field-label">{th("forEmployers")}</h3>
                <div className="mt-4 flex flex-col gap-4">
                  {stepCard(1, th("e1"), th("e1d"))}
                  {stepCard(2, th("e2"), th("e2d"))}
                  {stepCard(3, th("e3"), th("e3d"))}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div className="flex items-center gap-3">
                <h3 className="field-label">{th("exampleTitle")}</h3>
                <span className="badge text-xs">{th("exampleNote")}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {exempleCv.map((c) => (
                  <div key={c.titlu} className="card flex items-center gap-3">
                    <Avatar name={c.nume} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{c.titlu}</p>
                      <p className="text-xs text-muted">{c.loc} · {c.ani} ani</p>
                      <p className="mt-1 truncate text-xs text-muted">{c.skills}</p>
                    </div>
                    <span className="badge shrink-0">{c.scor}%</span>
                  </div>
                ))}
              </div>
              <Link href="/inregistrare" className="btn-primary mt-8 inline-flex">
                {th("exampleCta")}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Marketing — doar pentru vizitatori */}
      {!session && (
        <>
          <section className="border-t border-line bg-surface/40">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <h2 className="text-2xl font-semibold">{t("companiesTitle")}</h2>
              <p className="mt-1 max-w-xl text-muted">{t("companiesSubtitle")}</p>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                {companyCards.map((c) => (
                  <div key={c.key} className="group relative isolate overflow-hidden rounded-2xl border border-line">
                    <img
                      src={c.image}
                      alt={t(c.key)}
                      className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(15,23,42,0.85), rgba(15,23,42,0.05) 60%)" }}
                    />
                    <span className="absolute bottom-3 left-4 text-base font-semibold text-white">{t(c.key)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-5xl px-6 py-16">
            <div className="grid items-center gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold">{t("employersTitle")}</h2>
                <p className="mt-2 text-muted">{t("employersSubtitle")}</p>
                <ul className="mt-6 flex flex-col gap-4">
                  {[
                    { t: t("benefit1Title"), d: t("benefit1Desc") },
                    { t: t("benefit2Title"), d: t("benefit2Desc") },
                    { t: t("benefit3Title"), d: t("benefit3Desc") },
                  ].map((b) => (
                    <li key={b.t} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-secondary text-xs font-bold text-accent-secondary-foreground">
                        ✓
                      </span>
                      <span>
                        <strong>{b.t}</strong> {b.d}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href="/inregistrare?rol=EMPLOYER" className="btn-primary mt-8">
                  {t("employersCta")}
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-line">
                <img src="/images/hero-success.jpg" alt="" className="aspect-[5/4] w-full object-cover" />
              </div>
            </div>
          </section>

          <section className="border-t border-line bg-surface/40">
            <div className="mx-auto max-w-5xl px-6 py-16">
              <h2 className="text-2xl font-semibold">{t("peopleTitle")}</h2>
              <p className="mt-1 max-w-xl text-muted">{t("peopleSubtitle")}</p>
              <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
                {people.map((src) => (
                  <img key={src} src={src} alt="" className="h-40 w-32 shrink-0 rounded-2xl border border-line object-cover" />
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
