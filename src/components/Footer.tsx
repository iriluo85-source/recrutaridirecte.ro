import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted sm:flex-row">
        <span>{t("copyright", { year: String(new Date().getFullYear()) })}</span>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/despre" className="hover:text-foreground hover:underline">
            {t("aboutLink")}
          </Link>
          <Link href="/contact" className="hover:text-foreground hover:underline">
            {t("contactLink")}
          </Link>
          <Link href="/faq" className="hover:text-foreground hover:underline">
            {t("faqLink")}
          </Link>
          <Link href="/testimoniale" className="hover:text-foreground hover:underline">
            {t("testimonialsLink")}
          </Link>
          <Link href="/noutati" className="hover:text-foreground hover:underline">
            {t("newsLink")}
          </Link>
          <Link href="/termeni" className="hover:text-foreground hover:underline">
            {t("termsLink")}
          </Link>
          <Link href="/confidentialitate" className="hover:text-foreground hover:underline">
            {t("privacyLink")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
