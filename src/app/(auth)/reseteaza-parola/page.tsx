import Link from "next/link";
import { getTranslations } from "next-intl/server";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ReseteazaParolaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
      <div className="card">
        <h1 className="text-2xl font-semibold">{t("resetPassword.title")}</h1>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-4 text-sm text-red-500">
            {t("resetPassword.invalidLinkPrefix")}{" "}
            <Link href="/uitat-parola" className="text-accent hover:underline">
              {t("resetPassword.resetPageLink")}
            </Link>
            .
          </p>
        )}
      </div>
    </main>
  );
}
