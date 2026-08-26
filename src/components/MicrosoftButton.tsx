"use client";

import { useTranslations } from "next-intl";
import { signInWithMicrosoftAction } from "@/app/(auth)/actions";

export default function MicrosoftButton() {
  const tc = useTranslations("common");
  return (
    <form action={signInWithMicrosoftAction}>
      <button type="submit" className="btn-secondary w-full gap-2">
        <svg viewBox="0 0 23 23" className="h-4 w-4" aria-hidden="true">
          <rect x="1" y="1" width="10" height="10" fill="#F25022" />
          <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
          <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
          <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
        </svg>
        {tc("continueWithMicrosoft")}
      </button>
    </form>
  );
}
