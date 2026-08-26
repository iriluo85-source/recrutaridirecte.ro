import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculeazaScorPotrivire, type MatchCriteria } from "@/lib/matching";
import { areRadar } from "@/lib/planuri";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";

const PRAG_RADAR = 40;

export default async function RadarAngajatorPage() {
  const t = await getTranslations("employer");
  const tc = await getTranslations("common");
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { abonamentTip: true },
  });

  if (!areRadar(user?.abonamentTip)) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="card text-center">
          <span className="badge">Prestige</span>
          <h1 className="mt-3 text-2xl font-semibold">{t("radar.title")}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("radar.locked")}</p>
          <Link href="/abonamente" className="btn-primary mt-4 inline-flex">
            {t("radar.upgrade")}
          </Link>
        </div>
      </main>
    );
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });

  const posturi = employer
    ? await prisma.post.findMany({
        where: { employerId: employer.id, activ: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  if (posturi.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="card text-center">
          <h1 className="text-2xl font-semibold">{t("radar.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("radar.noPosts")}</p>
          <Link href="/angajator/posturi/nou" className="btn-primary mt-4 inline-flex">
            {t("radar.addPost")}
          </Link>
        </div>
      </main>
    );
  }

  const candidati = await prisma.candidateProfile.findMany({
    include: {
      skills: { include: { skill: true } },
      _count: { select: { cvFiles: true } },
    },
  });

  // pentru fiecare candidat: cel mai bun scor față de oricare post activ
  const potriviri = candidati
    .map((c) => {
      let best = { score: 0, postTitlu: "" };
      for (const p of posturi) {
        const criterii: MatchCriteria = {
          skills: (p.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
          locatie: p.locatie ?? undefined,
          experientaMin: p.experientaMin ?? undefined,
          experientaMax: p.experientaMax ?? undefined,
          bugetMin: p.salariuMin ?? undefined,
          bugetMax: p.salariuMax ?? undefined,
        };
        const { score } = calculeazaScorPotrivire(criterii, {
          locatie: c.locatie,
          remote: c.remote,
          aniExperienta: c.aniExperienta,
          salariuMinim: c.salariuMinim,
          salariuMaxim: c.salariuMaxim,
          skills: c.skills.map((s) => s.skill.nume),
        });
        if (score > best.score) best = { score, postTitlu: p.titlu };
      }
      return { candidat: c, ...best };
    })
    .filter((x) => x.score >= PRAG_RADAR)
    .sort((a, b) => b.score - a.score);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-team.jpg"
        title={t("radar.title")}
        subtitle={t("radar.subtitle")}
        maxWidthClass="max-w-3xl"
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        {potriviri.length === 0 ? (
          <div className="card text-center">
            <p className="text-muted">{t("radar.empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {potriviri.map(({ candidat, score, postTitlu }) => (
              <Link
                key={candidat.id}
                href={`/angajator/candidat/${candidat.id}`}
                className="card flex items-center gap-4 transition hover:border-accent hover:shadow-md"
              >
                <Avatar name={candidat.numeComplet} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{candidat.titluCurent}</p>
                  <p className="text-sm text-muted">
                    {candidat.locatie} {candidat.remote ? `· ${tc("remoteOk")}` : ""} ·{" "}
                    {t("search.yearsExperience", { count: candidat.aniExperienta })}
                  </p>
                  <p className="mt-1 text-xs text-accent">
                    {t("radar.forPost", { post: postTitlu })}
                  </p>
                </div>
                <span className="badge shrink-0">{t("search.matchBadge", { score })}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
