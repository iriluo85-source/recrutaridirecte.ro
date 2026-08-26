import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { resendVerificationAction } from "@/app/(auth)/actions";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import NotificationBell from "./NotificationBell";
import Logo from "./Logo";
import NavMenu, { type NavItem } from "./NavMenu";

export default async function Navbar() {
  const session = await auth();
  const t = await getTranslations("nav");

  let links: NavItem[] = [];
  let showLogout = false;

  if (!session) {
    links = [
      { href: "/companii", label: t("companies") },
      { href: "/#cum-functioneaza", label: t("howItWorks") },
      { href: "/abonamente", label: t("plans") },
      { href: "/login", label: t("login") },
      { href: "/inregistrare", label: t("createAccount"), primary: true },
    ];
  } else if (!session.user.role) {
    links = [
      { href: "/", label: t("home") },
      { href: "/alege-rol", label: t("chooseRole") },
    ];
    showLogout = true;
  } else if (session.user.role === "CANDIDATE") {
    links = [
      { href: "/", label: t("home") },
      { href: "/candidat/profil", label: t("myProfile") },
      { href: "/candidat/oferte", label: t("myOffers") },
      { href: "/candidat/radar", label: t("radar") },
      { href: "/candidat/cv-pilot", label: t("cvPilot") },
      { href: "/abonamente", label: t("plans") },
      { href: "/setari", label: t("settings") },
    ];
    showLogout = true;
  } else if (session.user.role === "EMPLOYER") {
    links = [
      { href: "/", label: t("home") },
      { href: "/angajator/profil", label: t("companyProfile") },
      { href: "/angajator/cautare", label: t("searchCandidates") },
      { href: "/angajator/radar", label: t("radar") },
      { href: "/angajator/salvati", label: t("savedCandidates") },
      { href: "/angajator/posturi", label: t("positions") },
      { href: "/angajator/mesaje", label: t("messages") },
      { href: "/abonamente", label: t("plans") },
      { href: "/setari", label: t("settings") },
    ];
    showLogout = true;
  }

  if (session?.user.isAdmin) {
    links.push({ href: "/admin", label: t("admin") });
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line/50 bg-surface/40 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8" />
          Recrutare Directă
        </Link>
        <NavMenu links={links} showLogout={showLogout} logoutLabel={t("logout")}>
          {session?.user.role && <NotificationBell />}
          <LanguageToggle />
          <ThemeToggle />
        </NavMenu>
      </div>

      {session?.user.role && !session.user.emailVerificat && (
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-line bg-accent-secondary/10 px-6 py-2 text-sm">
          <span>{t("verifyEmailBanner")}</span>
          <form action={resendVerificationAction}>
            <button type="submit" className="font-medium text-accent hover:underline">
              {t("resendLink")}
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
