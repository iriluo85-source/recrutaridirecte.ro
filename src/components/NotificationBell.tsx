"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Notificare = {
  id: string;
  tip: string;
  titlu: string;
  continut: string | null;
  link: string;
  citit: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const t = useTranslations("nav");
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Notificare[]>([]);
  const [deschis, setDeschis] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  async function refetch() {
    try {
      const res = await fetch("/api/notificari", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setCount(data.count);
      setItems(data.items);
    } catch {
      // rețea indisponibilă temporar — reîncercăm la următorul interval
    }
  }

  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 10000);
    // actualizare instantanee când utilizatorul revine pe tab/fereastră
    const onFocus = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDeschis(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function marcheazaTot() {
    await fetch("/api/notificari", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    refetch();
  }

  async function deschideNotificare(n: Notificare) {
    if (!n.citit) {
      await fetch("/api/notificari", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
    }
    setDeschis(false);
    refetch();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setDeschis((v) => !v)}
        aria-label={t("notifications")}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line text-sm transition hover:bg-surface"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-secondary px-1 text-[10px] font-bold text-accent-secondary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {deschis && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface/70 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="text-sm font-semibold">{t("notifications")}</span>
            {count > 0 && (
              <button
                type="button"
                onClick={marcheazaTot}
                className="text-xs text-accent hover:underline"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">
                {t("noNotifications")}
              </p>
            ) : (
              <ul className="flex flex-col">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.link}
                      onClick={() => deschideNotificare(n)}
                      className={`block border-b border-line px-4 py-3 transition hover:bg-surface ${
                        n.citit ? "" : "bg-accent/5"
                      }`}
                    >
                      <p className="text-sm font-medium">{n.titlu}</p>
                      {n.continut && (
                        <p className="mt-0.5 truncate text-xs text-muted">{n.continut}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted">
                        {new Date(n.createdAt).toLocaleString("ro-RO")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
