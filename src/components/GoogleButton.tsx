"use client";

import { useTranslations } from "next-intl";
import { signInWithGoogleAction } from "@/app/(auth)/actions";

export default function GoogleButton() {
  const tc = useTranslations("common");
  return (
    <form action={signInWithGoogleAction}>
      <button type="submit" className="btn-secondary w-full gap-2">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2 6.9 2 2.7 6.1 2.7 11.2S6.9 20.4 12 20.4c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.3H12z"
          />
        </svg>
        {tc("continueWithGoogle")}
      </button>
    </form>
  );
}
