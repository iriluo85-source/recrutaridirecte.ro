import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import AddCvForm from "@/app/setari/AddCvForm";

export default async function CandidatProfilEditeazaPage() {
  const t = await getTranslations("candidate");
  const session = await auth();
  const userId = session!.user.id;

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { skills: { include: { skill: true } } },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("profileTitle")}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {t("editIntro")}
      </p>
      <ProfileForm profile={profile} />

      <div className="card mt-4">
        <h2 className="field-label">{t("addCv")}</h2>
        {profile ? (
          <>
            <p className="mt-1 text-sm text-muted">
              {t("manageCvsHint")}
            </p>
            <AddCvForm />
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {t("saveProfileFirst")}
          </p>
        )}
      </div>
    </main>
  );
}
