"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Avatar from "@/components/Avatar";

export type ConversationItem = {
  id: string;
  href: string;
  title: string;
  subtitle?: string | null;
  preview?: string | null;
  date?: string | null;
  badge?: string | null; // ex. „Răspuns nou · blocat"
};

export default function ConversationList({ items }: { items: ConversationItem[] }) {
  const tc = useTranslations("common");
  const [q, setQ] = useState("");

  const termen = q.trim().toLowerCase();
  const filtrate = termen
    ? items.filter((it) =>
        `${it.title} ${it.subtitle ?? ""} ${it.preview ?? ""}`.toLowerCase().includes(termen)
      )
    : items;

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tc("searchConversations")}
        className="input"
        aria-label={tc("searchConversations")}
      />

      {filtrate.length === 0 ? (
        <p className="text-sm text-muted">{tc("noSearchResults")}</p>
      ) : (
        filtrate.map((it) => (
          <Link
            key={it.id}
            href={it.href}
            className="card flex items-start gap-3 transition hover:border-accent hover:shadow-md"
          >
            <Avatar name={it.title} size={44} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{it.title}</p>
              {it.subtitle && <p className="text-sm text-muted">{it.subtitle}</p>}
              {it.preview && <p className="mt-1 truncate text-sm text-muted">{it.preview}</p>}
              {it.badge && (
                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  🔒 {it.badge}
                </span>
              )}
              {it.date && <p className="mt-2 text-xs text-muted">{it.date}</p>}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
