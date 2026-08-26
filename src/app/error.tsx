"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errorPages");
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-6xl font-bold text-red-500">!</p>
      <h1 className="mt-4 text-2xl font-semibold">{t("errorTitle")}</h1>
      <p className="mt-2 text-muted">{t("errorDesc")}</p>
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className="btn-primary">
          {t("retry")}
        </button>
        <Link href="/" className="btn-secondary">
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
