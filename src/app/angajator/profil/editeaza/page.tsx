import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";

export default async function AngajatorProfilEditeazaPage() {
  const session = await auth();
  const userId = session!.user.id;
  const t = await getTranslations("employer");

  const profile = await prisma.employerProfile.findUnique({ where: { userId } });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("profileEdit.title")}</h1>
      <p className="mt-1 text-sm text-gray-600">
        {t("profileEdit.subtitle")}
      </p>
      <ProfileForm profile={profile} />
    </main>
  );
}
