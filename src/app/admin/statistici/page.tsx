import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { normalizeazaText } from "@/lib/matching";

// Statistici de admin — tablou de bord pentru decizii (funnel, matching, bani, cerere/ofertă).
// Doar agregări pe datele existente: fără tracking nou, fără cookies.
export const dynamic = "force-dynamic";

const ZI_MS = 24 * 60 * 60 * 1000;

function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

// Grupează valori text (locații etc.) ignorând diacriticele și majusculele.
function grupeaza(valori: (string | null)[], top = 6) {
  const m = new Map<string, { eticheta: string; n: number }>();
  for (const v of valori) {
    const s = (v ?? "").trim();
    if (!s) continue;
    const k = normalizeazaText(s);
    const cur = m.get(k);
    if (cur) cur.n++;
    else m.set(k, { eticheta: s, n: 1 });
  }
  return [...m.values()].sort((a, b) => b.n - a.n).slice(0, top);
}

function Stat({
  eticheta,
  valoare,
  sub,
}: {
  eticheta: string;
  valoare: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-semibold">{valoare}</p>
      <p className="mt-1 text-xs text-muted">{eticheta}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  );
}

function Funnel({ pasi }: { pasi: { eticheta: string; n: number }[] }) {
  const baza = pasi[0]?.n ?? 0;
  return (
    <div className="mt-3 flex flex-col gap-2.5">
      {pasi.map((p, i) => {
        const procent = pct(p.n, baza);
        return (
          <div key={p.eticheta}>
            <div className="flex items-center justify-between text-sm">
              <span>{p.eticheta}</span>
              <span className="font-medium">
                {p.n}
                {i > 0 && <span className="ml-2 text-xs text-muted">{procent}%</span>}
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-accent/10">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${procent}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Lista({ titlu, randuri }: { titlu: string; randuri: { eticheta: string; n: number }[] }) {
  return (
    <div className="card">
      <h3 className="field-label">{titlu}</h3>
      {randuri.length === 0 ? (
        <p className="mt-2 text-sm text-muted">—</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {randuri.map((r) => (
            <li key={r.eticheta} className="flex items-center justify-between gap-3">
              <span className="truncate">{r.eticheta}</span>
              <span className="shrink-0 font-medium text-muted">{r.n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AdminStatisticiPage() {
  const t = await getTranslations("admin");
  const acum = Date.now();
  const de30 = new Date(acum - 30 * ZI_MS);
  const de7 = new Date(acum - 7 * ZI_MS);

  const [
    useriNoi,
    activi7,
    contCand,
    profCand,
    cuCv,
    vazutiGrup,
    contactatiCand,
    cuOfertaCand,
    contAng,
    profAng,
    cuCui,
    cuPost,
    angConv,
    angOferta,
    convTotal,
    conv30,
    msgGrup,
    convCuRaspuns,
    oferteGrup,
    oferteRaspunse,
    salOferit,
    salAcceptat,
    inchiseGrup,
    platiTotal,
    plati30,
    aboGrup,
    totalUseri,
    skills,
    locatiiCand,
    posturiActive,
    locatiiPost,
    rapoarte,
    testimoniale,
    viewsProfil,
    viewsCv,
  ] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: de30 } }, select: { createdAt: true, role: true } }),
    prisma.user.count({ where: { ultimaActivitate: { gte: de7 } } }),

    prisma.user.count({ where: { role: "CANDIDATE" } }),
    prisma.candidateProfile.count(),
    prisma.candidateProfile.count({ where: { cvFiles: { some: {} } } }),
    prisma.profileView.groupBy({ by: ["candidateId"] }),
    prisma.candidateProfile.count({ where: { conversations: { some: {} } } }),
    prisma.candidateProfile.count({ where: { conversations: { some: { offers: { some: {} } } } } }),

    prisma.user.count({ where: { role: "EMPLOYER" } }),
    prisma.employerProfile.count(),
    prisma.employerProfile.count({ where: { NOT: { cui: null } } }),
    prisma.employerProfile.count({ where: { posturi: { some: {} } } }),
    prisma.employerProfile.count({ where: { conversations: { some: {} } } }),
    prisma.employerProfile.count({ where: { conversations: { some: { offers: { some: {} } } } } }),

    prisma.conversation.count(),
    prisma.conversation.count({ where: { createdAt: { gte: de30 } } }),
    prisma.message.groupBy({ by: ["trimisDe"], _count: { _all: true } }),
    prisma.conversation.count({ where: { messages: { some: { trimisDe: "CANDIDATE" } } } }),

    prisma.jobOffer.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.jobOffer.findMany({
      where: { NOT: { raspunsLa: null } },
      select: { createdAt: true, raspunsLa: true },
    }),
    prisma.jobOffer.aggregate({ _avg: { salariu: true } }),
    prisma.jobOffer.aggregate({ _avg: { salariu: true }, where: { status: "ACCEPTED" } }),
    prisma.jobOffer.groupBy({
      by: ["inchisDe"],
      _count: { _all: true },
      where: { NOT: { inchisDe: null } },
    }),

    prisma.payment.aggregate({ _sum: { suma: true }, _count: { _all: true }, where: { status: "PAID" } }),
    prisma.payment.aggregate({ _sum: { suma: true }, where: { status: "PAID", createdAt: { gte: de30 } } }),
    prisma.user.groupBy({
      by: ["abonamentTip"],
      _count: { _all: true },
      where: { NOT: { abonamentTip: null } },
    }),
    prisma.user.count(),

    prisma.skill.findMany({ select: { nume: true, _count: { select: { candidates: true } } } }),
    prisma.candidateProfile.findMany({ select: { locatie: true } }),
    prisma.post.count({ where: { activ: true } }),
    prisma.post.findMany({ where: { activ: true }, select: { locatie: true } }),

    prisma.report.count({ where: { rezolvat: false } }),
    prisma.testimonial.count({ where: { aprobat: false } }),
    prisma.profileView.aggregate({ _sum: { viewCount: true }, where: { tip: "PROFIL" } }),
    prisma.profileView.aggregate({ _sum: { viewCount: true }, where: { tip: "CV" } }),
  ]);

  // ── Puls: înscrieri pe zi (ultimele 30) ──────────────────────────────────
  const zile = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(acum - (29 - i) * ZI_MS);
    return { eticheta: `${d.getDate()}.${d.getMonth() + 1}`, cand: 0, ang: 0 };
  });
  for (const u of useriNoi) {
    const idx = 29 - Math.floor((acum - new Date(u.createdAt).getTime()) / ZI_MS);
    if (idx >= 0 && idx < 30) {
      if (u.role === "EMPLOYER") zile[idx].ang++;
      else zile[idx].cand++;
    }
  }
  const maxZi = Math.max(1, ...zile.map((z) => z.cand + z.ang));

  // ── Oferte ───────────────────────────────────────────────────────────────
  const nrStatus = (s: string) => oferteGrup.find((g) => g.status === s)?._count._all ?? 0;
  const oPending = nrStatus("PENDING");
  const oAcceptate = nrStatus("ACCEPTED");
  const oRefuzate = nrStatus("REJECTED");
  const oContra = nrStatus("COUNTERED");
  const oTotal = oPending + oAcceptate + oRefuzate + oContra;
  const rataAcceptare = pct(oAcceptate, oAcceptate + oRefuzate);

  const durate = oferteRaspunse.map(
    (o) => new Date(o.raspunsLa as Date).getTime() - new Date(o.createdAt).getTime()
  );
  const medieMs = durate.length ? durate.reduce((a, b) => a + b, 0) / durate.length : 0;
  const medieRaspuns = !medieMs
    ? "—"
    : medieMs < ZI_MS
      ? `${Math.max(1, Math.round(medieMs / 3600000))} h`
      : `${(medieMs / ZI_MS).toFixed(1)} zile`;

  const inchiseDe = (r: string) => inchiseGrup.find((g) => g.inchisDe === r)?._count._all ?? 0;

  // ── Mesaje ───────────────────────────────────────────────────────────────
  const nrMsg = (r: string) => msgGrup.find((g) => g.trimisDe === r)?._count._all ?? 0;
  const msgTotal = nrMsg("CANDIDATE") + nrMsg("EMPLOYER");

  // ── Bani ─────────────────────────────────────────────────────────────────
  const venitTotal = platiTotal._sum.suma ?? 0;
  const venit30 = plati30._sum.suma ?? 0;
  const abonatiActivi = aboGrup.reduce((s, g) => s + g._count._all, 0);

  const topSkills = skills
    .map((s) => ({ eticheta: s.nume, n: s._count.candidates }))
    .filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("stats.title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("stats.subtitle")}</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm">
          {t("dashboardTitle")}
        </Link>
      </div>

      {/* 1. Puls */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("stats.sectionPulse")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.candidates")} valoare={contCand} />
          <Stat eticheta={t("stats.employers")} valoare={contAng} />
          <Stat eticheta={t("stats.activeUsers7")} valoare={activi7} />
          <Stat eticheta={t("stats.conversations")} valoare={convTotal} sub={`+${conv30} / 30z`} />
        </div>

        <div className="card mt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="field-label">{t("stats.signupsPerDay")}</h3>
            <p className="text-xs text-muted">
              <span className="mr-3">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />
                {t("stats.candidates")}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                {t("stats.employers")}
              </span>
            </p>
          </div>
          {useriNoi.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted">{t("stats.noData")}</p>
          ) : (
          <div className="mt-3 flex h-28 items-end gap-[3px]">
            {zile.map((z, i) => (
              <div
                key={i}
                className="flex flex-1 flex-col justify-end"
                title={`${z.eticheta}: ${z.cand} + ${z.ang}`}
              >
                <div className="w-full rounded-t bg-amber-400" style={{ height: `${(z.ang / maxZi) * 100}%` }} />
                <div className="w-full bg-accent" style={{ height: `${(z.cand / maxZi) * 100}%` }} />
              </div>
            ))}
          </div>
          )}
          <p className="mt-2 text-right text-[11px] text-muted">{t("stats.last30")}</p>
        </div>
      </section>

      {/* 2 + 3. Funnels */}
      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold">{t("stats.sectionFunnelCand")}</h2>
          <Funnel
            pasi={[
              { eticheta: t("stats.fCandAccounts"), n: contCand },
              { eticheta: t("stats.fCandProfile"), n: profCand },
              { eticheta: t("stats.fCandCv"), n: cuCv },
              { eticheta: t("stats.fCandViewed"), n: vazutiGrup.length },
              { eticheta: t("stats.fCandContacted"), n: contactatiCand },
              { eticheta: t("stats.fCandOffer"), n: cuOfertaCand },
            ]}
          />
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold">{t("stats.sectionFunnelEmp")}</h2>
          <Funnel
            pasi={[
              { eticheta: t("stats.fEmpAccounts"), n: contAng },
              { eticheta: t("stats.fEmpProfile"), n: profAng },
              { eticheta: t("stats.fEmpCui"), n: cuCui },
              { eticheta: t("stats.fEmpPost"), n: cuPost },
              { eticheta: t("stats.fEmpConv"), n: angConv },
              { eticheta: t("stats.fEmpOffer"), n: angOferta },
            ]}
          />
        </div>
      </section>

      {/* 4. Matching & oferte */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("stats.sectionMatching")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.messages")} valoare={msgTotal} />
          <Stat eticheta={t("stats.replyRate")} valoare={`${pct(convCuRaspuns, convTotal)}%`} />
          <Stat eticheta={t("stats.offersTotal")} valoare={oTotal} />
          <Stat eticheta={t("stats.acceptRate")} valoare={`${rataAcceptare}%`} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.offerPending")} valoare={oPending} />
          <Stat eticheta={t("stats.offerAccepted")} valoare={oAcceptate} />
          <Stat eticheta={t("stats.offerRejected")} valoare={oRefuzate} />
          <Stat eticheta={t("stats.offerCountered")} valoare={oContra} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.avgResponse")} valoare={medieRaspuns} />
          <Stat
            eticheta={t("stats.avgSalaryOffered")}
            valoare={salOferit._avg.salariu ? Math.round(salOferit._avg.salariu) : "—"}
          />
          <Stat
            eticheta={t("stats.avgSalaryAccepted")}
            valoare={salAcceptat._avg.salariu ? Math.round(salAcceptat._avg.salariu) : "—"}
          />
          <Stat
            eticheta={t("stats.closedByCandidate")}
            valoare={inchiseDe("CANDIDATE")}
            sub={`${t("stats.closedByEmployer")}: ${inchiseDe("EMPLOYER")}`}
          />
        </div>
      </section>

      {/* 6. Cerere vs ofertă */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("stats.sectionDemand")}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Lista titlu={t("stats.topLocationsCand")} randuri={grupeaza(locatiiCand.map((c) => c.locatie))} />
          <Lista
            titlu={`${t("stats.topLocationsPost")} (${posturiActive})`}
            randuri={grupeaza(locatiiPost.map((p) => p.locatie))}
          />
          <Lista titlu={t("stats.topSkills")} randuri={topSkills} />
        </div>
      </section>

      {/* 5. Bani */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("stats.sectionMoney")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.revenueTotal")} valoare={`${venitTotal.toFixed(2)} lei`} />
          <Stat eticheta={t("stats.revenue30")} valoare={`${venit30.toFixed(2)} lei`} />
          <Stat eticheta={t("stats.paymentsCount")} valoare={platiTotal._count._all} />
          <Stat
            eticheta={t("stats.activeSubs")}
            valoare={abonatiActivi}
            sub={aboGrup.map((g) => `${g.abonamentTip}: ${g._count._all}`).join(" · ") || undefined}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {t("stats.conversionPaid")}: {pct(abonatiActivi, totalUseri)}%
        </p>
      </section>

      {/* 7. Operațional */}
      <section className="mt-8 mb-4">
        <h2 className="text-lg font-semibold">{t("stats.sectionOps")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat eticheta={t("stats.profileViews")} valoare={viewsProfil._sum.viewCount ?? 0} />
          <Stat eticheta={t("stats.cvDownloads")} valoare={viewsCv._sum.viewCount ?? 0} />
          <Stat eticheta={t("stats.unresolvedReports")} valoare={rapoarte} />
          <Stat eticheta={t("stats.pendingTestimonials")} valoare={testimoniale} />
        </div>
      </section>
    </main>
  );
}
