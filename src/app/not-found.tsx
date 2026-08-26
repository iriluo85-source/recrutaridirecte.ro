import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errorPages");
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-7xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-2 text-muted">{t("notFoundDesc")}</p>
      <Link href="/" className="btn-primary mt-6">
        {t("home")}
      </Link>
    </main>
  );
}
