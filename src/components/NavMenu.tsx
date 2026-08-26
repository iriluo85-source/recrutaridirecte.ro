"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export type NavItem = { href: string; label: string; primary?: boolean };

export default function NavMenu({
  links,
  showLogout,
  logoutLabel,
  children,
}: {
  links: NavItem[];
  showLogout: boolean;
  logoutLabel: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* Desktop: linkuri pe un rând */}
      <nav className="hidden items-center gap-5 text-sm md:flex">
        {links.map((l) =>
          l.primary ? (
            <Link key={l.href} href={l.href} className="btn-primary px-4 py-2 text-sm">
              {l.label}
            </Link>
          ) : (
            <Link key={l.href} href={l.href} className="text-muted hover:text-foreground">
              {l.label}
            </Link>
          )
        )}
        {showLogout && (
          <form action={logoutAction}>
            <button type="submit" className="text-muted hover:text-foreground">
              {logoutLabel}
            </button>
          </form>
        )}
      </nav>

      {/* Mereu vizibile: clopoțel + comutatoare */}
      {children}

      {/* Mobil: buton hamburger */}
      {links.length > 0 && (
        <button
          type="button"
          aria-label="Meniu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg md:hidden"
        >
          {open ? "✕" : "☰"}
        </button>
      )}

      {/* Mobil: panou care se deschide sub meniu */}
      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-line/50 bg-surface/80 backdrop-blur-2xl md:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col px-6 py-3 text-sm">
            {links.map((l) =>
              l.primary ? (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-2 justify-center"
                >
                  {l.label}
                </Link>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="py-2 text-muted hover:text-foreground"
                >
                  {l.label}
                </Link>
              )
            )}
            {showLogout && (
              <form action={logoutAction}>
                <button
                  type="submit"
                  onClick={() => setOpen(false)}
                  className="py-2 text-left text-muted hover:text-foreground"
                >
                  {logoutLabel}
                </button>
              </form>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
