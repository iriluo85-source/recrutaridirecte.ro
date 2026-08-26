"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/i18n/actions";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function schimba() {
    const next = locale === "ro" ? "en" : "ro";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={schimba}
      disabled={pending}
      aria-label="Schimbă limba / Change language"
      className="flex h-9 items-center justify-center rounded-lg border border-line px-2 text-xs font-semibold uppercase transition hover:bg-surface disabled:opacity-50"
    >
      {locale === "ro" ? "EN" : "RO"}
    </button>
  );
}
