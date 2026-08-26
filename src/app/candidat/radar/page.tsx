import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculeazaScorPotrivire } from "@/lib/matching";
import { areRadar } from "@/lib/planuri";
import PageBanner from "@/components/PageBanner";
import Avatar from "@/components/Avatar";

const PRAG_RADAR = 40;

export default async function RadarPage() {
  const t = await getTranslations("candidate");
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

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session!.user.id },
    include: { skills: { include: { skill: true } } },
  });

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="card text-center">
          <h1 className="text-2xl font-semibold">{t("radar.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("radar.noProfile")}</p>
          <Link href="/candidat/profil/editeaza" className="btn-primary mt-4 inline-flex">
            {t("radar.completeProfile")}
          </Link>
        </div>
      </main>
    );
  }

  const posturi = await prisma.post.findMany({
    where: { activ: true },
    include: { employer: { select: { numeCompanie: true } } },
    orderBy: { createdAt: "desc" },
  });

  const candidatSkills = profile.skills.map((s) => s.skill.nume);
  const potriviri = posturi
    .map((p) => {
      const { score } = calculeazaScorPotrivire(
        {
          skills: (p.skills ?? "").split(",").map((s) => s.trim()).filter(Boolean),
          locatie: p.locatie ?? undefined,
          experientaMin: p.experientaMin ?? undefined,
          experientaMax: p.experientaMax ?? undefined,
          bugetMin: p.salariuMin ?? undefined,
          bugetMax: p.salariuMax ?? undefined,
        },
        {
          locatie: profile.locatie,
          remote: profile.remote,
          aniExperienta: profile.aniExperienta,
          salariuMinim: profile.salariuMinim,
          salariuMaxim: profile.salariuMaxim,
          skills: candidatSkills,
        }
      );
      return { post: p, score };
    })
    .filter((x) => x.score >= PRAG_RADAR)
    .sort((a, b) => b.score - a.score);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-engineer.jpg"
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
            {potriviri.map(({ post, score }) => (
              <div key={post.id} className="card flex items-center gap-4">
                <Avatar name={post.employer.numeCompanie} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{post.titlu}</p>
                  <p className="text-sm text-muted">{post.employer.numeCompanie}</p>
                  <p className="mt-1 text-xs text-muted">
                    {post.locatie ? post.locatie : ""}
                    {post.locatie && post.remote ? " · " : ""}
                    {post.remote ? tc("remoteOk") : ""}
                    {(post.salariuMin || post.salariuMax) &&
                      ` · ${post.salariuMin ?? "?"} - ${post.salariuMax ?? "?"} ${tc("salaryPerMonth")}`}
                  </p>
                </div>
                <span className="badge shrink-0">{t("radar.matchBadge", { score })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
