"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// Afișează o imagine care, la click, se mărește într-un overlay pe tot ecranul.
// Închidere: click pe fundal / butonul × / tasta Esc.
export default function PhotoZoom({
  src,
  alt = "",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        aria-label={alt || "Mărește imaginea"}
      >
        <img src={src} alt={alt} className={className} />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={tc("close")}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white backdrop-blur hover:bg-white/25"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
