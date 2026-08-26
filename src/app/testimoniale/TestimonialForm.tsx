"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { trimiteTestimonialAction, type FormState } from "./actions";

export default function TestimonialForm() {
  const t = useTranslations("testimonials");
  const tc = useTranslations("common");
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState<FormState, FormData>(
    trimiteTestimonialAction,
    undefined
  );

  return (
    <form action={action} className="card mt-4 flex flex-col gap-3">
      <h2 className="field-label">{t("formTitle")}</h2>

      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t("ratingLabel")}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n}`}
            className={`text-2xl leading-none transition ${
              n <= rating ? "text-amber-400" : "text-muted/40"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="text"
        rows={4}
        required
        placeholder={t("textPlaceholder")}
        className="input"
      />

      {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-500">{t("submitSuccess")}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? tc("sending") : t("submit")}
      </button>
    </form>
  );
}
