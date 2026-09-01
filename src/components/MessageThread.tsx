"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Mesaj = {
  id: string;
  trimisDe: "CANDIDATE" | "EMPLOYER";
  continut: string | null;
  atasamentNume: string | null;
  createdAt: string;
};

type Prezenta = { activ: boolean; ultimaActivitate: string | null };

const IMAGINE_EXTENSII = [".jpg", ".jpeg", ".png", ".webp"];

function esteImagine(nume: string) {
  return IMAGINE_EXTENSII.some((ext) => nume.toLowerCase().endsWith(ext));
}

export default function MessageThread({
  conversationId,
  ownRole,
}: {
  conversationId: string;
  ownRole: "CANDIDATE" | "EMPLOYER";
}) {
  const t = useTranslations("chat");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [mesaje, setMesaje] = useState<Mesaj[]>([]);
  const [prezenta, setPrezenta] = useState<Prezenta | null>(null);
  const [seenLa, setSeenLa] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fisier, setFisier] = useState<File | null>(null);
  const [eroare, setEroare] = useState<string | null>(null);
  const [seTrimite, setSeTrimite] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refetch() {
    const res = await fetch(`/api/mesaje/${conversationId}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setMesaje(data.messages);
    setPrezenta(data.prezenta ?? null);
    setSeenLa(data.seenLa ?? null);
  }

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mesaje]);

  // id-ul ultimului mesaj trimis de mine pe care celălalt l-a citit deja → afișăm „Văzut"
  const ultimulVazutId = useMemo(() => {
    if (!seenLa) return null;
    const prag = new Date(seenLa).getTime();
    for (let i = mesaje.length - 1; i >= 0; i--) {
      const m = mesaje[i];
      if (m.trimisDe === ownRole && new Date(m.createdAt).getTime() <= prag) return m.id;
    }
    return null;
  }, [mesaje, seenLa, ownRole]);

  function formatCand(iso: string) {
    return new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "ro-RO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function trimite(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !fisier) return;

    setSeTrimite(true);
    setEroare(null);

    const formData = new FormData();
    formData.set("continut", text.trim());
    if (fisier) formData.set("fisier", fisier);

    const res = await fetch(`/api/mesaje/${conversationId}`, {
      method: "POST",
      body: formData,
    });

    setSeTrimite(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setEroare(data?.error ?? t("sendFailed"));
      return;
    }

    setText("");
    setFisier(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    refetch();
  }

  return (
    <div className="card flex h-[70vh] flex-col">
      {prezenta && (
        <div className="mb-3 flex items-center gap-2 border-b border-line pb-2.5 text-xs">
          <span
            className={`h-2 w-2 rounded-full ${
              prezenta.activ ? "bg-emerald-500" : "bg-muted/40"
            }`}
          />
          <span
            className={
              prezenta.activ
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : "text-muted"
            }
          >
            {prezenta.activ
              ? t("activNow")
              : prezenta.ultimaActivitate
                ? t("lastSeen", { when: formatCand(prezenta.ultimaActivitate) })
                : t("offline")}
          </span>
        </div>
      )}

      <p className="mb-3 flex items-center gap-1.5 text-[11px] text-muted">
        <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 018 0v3" />
        </svg>
        {t("privateNote")}
      </p>

      <div ref={listaRef} className="flex-1 overflow-y-auto pr-1">
        {mesaje.length === 0 && (
          <p className="text-sm text-muted">{t("noMessages")}</p>
        )}
        <div className="flex flex-col gap-3">
          {mesaje.map((m) => {
            const esteAlMeu = m.trimisDe === ownRole;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${esteAlMeu ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    esteAlMeu
                      ? "bg-accent text-accent-foreground"
                      : "border border-line bg-surface/60 backdrop-blur-md"
                  }`}
                >
                  {m.continut && <p className="whitespace-pre-line">{m.continut}</p>}
                  {m.atasamentNume && (
                    <div className="mt-2">
                      {esteImagine(m.atasamentNume) ? (
                        <a href={`/api/atasament/${m.id}`} target="_blank" rel="noreferrer">
                          <img
                            src={`/api/atasament/${m.id}`}
                            alt={t("attachmentAlt")}
                            className="max-h-48 rounded-lg border border-line"
                          />
                        </a>
                      ) : (
                        <a
                          href={`/api/atasament/${m.id}`}
                          className={`text-xs underline ${esteAlMeu ? "text-accent-foreground" : "text-accent"}`}
                        >
                          📎 {m.atasamentNume.replace(/^\d+-/, "")}
                        </a>
                      )}
                    </div>
                  )}
                  <p
                    className={`mt-1 text-[10px] ${esteAlMeu ? "text-accent-foreground/70" : "text-muted"}`}
                  >
                    {new Date(m.createdAt).toLocaleString("ro-RO")}
                  </p>
                </div>
                {m.id === ultimulVazutId && (
                  <span className="mt-0.5 pr-1 text-[10px] text-muted">✓✓ {t("seen")}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={trimite} className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={t("placeholder")}
          className="input"
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setFisier(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("attach")}
            title={t("attach")}
            className="btn-secondary shrink-0 px-3"
          >
            📎
          </button>
          <span className="min-w-0 flex-1 truncate text-xs text-muted">
            {fisier ? fisier.name : ""}
          </span>
          <button type="submit" disabled={seTrimite} className="btn-primary shrink-0">
            {seTrimite ? tc("sending") : t("send")}
          </button>
        </div>
        {eroare && <p className="text-sm text-red-500">{eroare}</p>}
      </form>
    </div>
  );
}
