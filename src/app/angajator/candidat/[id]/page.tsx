import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PageBanner from "@/components/PageBanner";
import PhotoZoom from "@/components/PhotoZoom";
import SaveCandidateButton from "@/components/SaveCandidateButton";
import InterestForm from "./InterestForm";
import RecordProfileView from "./RecordProfileView";

export default async function CandidatDetaliuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("employer");
  const tc = await getTranslations("common");
  const { id } = await params;

  const candidat = await prisma.candidateProfile.findUnique({
    where: { id },
    include: {
      skills: { include: { skill: true } },
      cvFiles: { orderBy: { createdAt: "desc" } },
      user: { select: { telefon: true } },
    },
  });

  if (!candidat) notFound();

  const session = await auth();
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session!.user.id },
  });
  const conversatieExistenta = employer
    ? await prisma.conversation.findUnique({
        where: {
          employerId_candidateId: { employerId: employer.id, candidateId: candidat.id },
        },
      })
    : null;
  const salvat = employer
    ? await prisma.savedCandidate.findUnique({
        where: {
          employerId_candidateId: { employerId: employer.id, candidateId: candidat.id },
        },
      })
    : null;

  return (
    <main className="flex-1">
      <RecordProfileView candidateId={candidat.id} />
      <PageBanner
        image="/images/hero-collab.jpg"
        title={candidat.numeComplet}
        subtitle={candidat.titluCurent}
        maxWidthClass="max-w-2xl"
      />
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="card">
        {employer && (
          <div className="mb-4 flex justify-end">
            <SaveCandidateButton
              candidateId={candidat.id}
              saved={!!salvat}
              cale={`/angajator/candidat/${id}`}
            />
          </div>
        )}
        {candidat.pozaFisier && (
          <div className="mb-4 flex justify-center">
            <PhotoZoom
              src={`/api/poza/${candidat.id}`}
              alt={candidat.numeComplet}
              className="h-24 w-24 rounded-full border border-line object-cover"
            />
          </div>
        )}
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">{t("candidate.location")}</dt>
            <dd>
              {candidat.locatie} {candidat.remote ? `· ${tc("remoteOk")}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted">{t("candidate.experience")}</dt>
            <dd>{tc("yearsCount", { count: candidat.aniExperienta ?? 0 })}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("candidate.availability")}</dt>
            <dd>{tc("disponibilitate." + candidat.disponibilitate)}</dd>
          </div>
          <div>
            <dt className="text-muted">{t("candidate.salaryExpectations")}</dt>
            <dd>
              {candidat.salariuMinim || candidat.salariuMaxim
                ? `${candidat.salariuMinim ?? "?"} - ${candidat.salariuMaxim ?? "?"} ${tc("salaryPerMonth")}`
                : tc("unspecified")}
            </dd>
          </div>
          {candidat.user.telefon && (
            <div>
              <dt className="text-muted">{t("candidate.phone")}</dt>
              <dd>{candidat.user.telefon}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h2 className="field-label">{t("candidate.skills")}</h2>
          <p className="mt-1">
            {candidat.skills.map((s) => s.skill.nume).join(", ") || "-"}
          </p>
        </div>

        {candidat.bio && (
          <div className="mt-6">
            <h2 className="field-label">{t("candidate.about")}</h2>
            <p className="mt-1 whitespace-pre-line">{candidat.bio}</p>
          </div>
        )}

        {candidat.cvFiles.length > 0 && (
          <div className="mt-6">
            <h2 className="field-label">{t("candidate.cvs")}</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {candidat.cvFiles.map((cv) => (
                <li key={cv.id}>
                  <a
                    href={`/api/cv/${cv.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    📎 {cv.eticheta}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {conversatieExistenta ? (
          <div className="mt-6 border-t border-line pt-6">
            <Link href={`/angajator/mesaje/${conversatieExistenta.id}`} className="btn-primary">
              {t("candidate.continueConversation")}
            </Link>
          </div>
        ) : (
          <InterestForm candidateId={candidat.id} />
        )}
      </div>
      </div>
    </main>
  );
}
