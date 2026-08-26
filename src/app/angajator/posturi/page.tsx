import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { domeniuDupaSlug } from "@/lib/domenii";
import { linkCautarePost } from "@/lib/postSearch";
import { stergePostAction } from "../actions";

export async function generateMetadata() {
  const t = await getTranslations("posts");
  return { title: `${t("manageTitle")} — Recrutare Directă` };
}

export default async function PosturiPage() {
  const t = await getTranslations("posts");
  const tc = await getTranslations("common");
  const th = await getTranslations("home");
  const session = await auth();

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session!.user.id },
  });
  const posturi = employer
    ? await prisma.post.findMany({
        where: { employerId: employer.id },
        orderBy: [{ activ: "desc" }, { updatedAt: "desc" }],
      })
    : [];

  function metaLinie(p: (typeof posturi)[number]): string {
    const parti: string[] = [];
    if (p.experientaMin != null || p.experientaMax != null) {
      const a = p.experientaMin ?? 0;
      const b = p.experientaMax;
      parti.push(b != null ? `${a}–${b} ${t("years")}` : `${a}+ ${t("years")}`);
    }
    if (p.salariuMin != null || p.salariuMax != null) {
      const a = p.salariuMin;
      const b = p.salariuMax;
      const salariu = a != null && b != null ? `${a}–${b}` : `${a ?? b}`;
      parti.push(`${salariu} ${tc("salaryPerMonth")}`);
    }
    const loc = [p.locatie, p.remote ? tc("remoteOk") : null].filter(Boolean).join(" · ");
    if (loc) parti.push(loc);
    return parti.join(" · ");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("manageTitle")}</h1>
          <p className="mt-1 text-muted">{t("manageSubtitle")}</p>
        </div>
        <Link href="/angajator/posturi/nou" className="btn-primary shrink-0 text-sm">
          {t("addButton")}
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {posturi.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          posturi.map((p) => {
            const dom = domeniuDupaSlug(p.domeniuSlug);
            const meta = metaLinie(p);
            return (
              <div key={p.id} className={`card ${p.activ ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{p.titlu}</p>
                  {dom && <span className="badge text-xs">{th("categories." + dom.nameKey)}</span>}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.activ ? "bg-emerald-500/15 text-emerald-500" : "bg-muted/20 text-muted"
                    }`}
                  >
                    {p.activ ? t("openBadge") : t("closedBadge")}
                  </span>
                </div>
                {meta && <p className="mt-1 text-xs text-muted">{meta}</p>}
                {p.skills && <p className="mt-1 text-xs text-muted">{p.skills}</p>}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link href={linkCautarePost(p)} className="btn-primary text-sm">
                    🔍 {t("searchCandidates")}
                  </Link>
                  <Link href={`/angajator/posturi/${p.id}`} className="btn-secondary text-sm">
                    {t("edit")}
                  </Link>
                  <form action={stergePostAction}>
                    <input type="hidden" name="postId" value={p.id} />
                    <button type="submit" className="text-xs text-red-500 hover:underline">
                      {t("delete")}
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
