import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { consumaToken } from "@/lib/tokens";

export default async function VerificaEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  let succes = false;
  if (token) {
    const user = await consumaToken(token, "VERIFICARE_EMAIL");
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerificat: true } });
      succes = true;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="card text-center">
        {succes ? (
          <>
            <h1 className="text-2xl font-semibold">{t("verifyEmail.successTitle")}</h1>
            <p className="mt-2 text-sm text-muted">
              {t("verifyEmail.successMessage")}
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold">{t("verifyEmail.invalidTitle")}</h1>
            <p className="mt-2 text-sm text-muted">
              {t("verifyEmail.invalidMessage")}
            </p>
          </>
        )}
        <Link href="/" className="btn-primary mt-6 inline-flex">
          {t("verifyEmail.goHome")}
        </Link>
      </div>
    </main>
  );
}
