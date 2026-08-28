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
          <Link href="/livrare" className="hover:text-foreground hover:underline">
            {t("deliveryLink")}
          </Link>
          <Link href="/retur" className="hover:text-foreground hover:underline">
            {t("returnLink")}
          </Link>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-center px-6 pb-6">
        {/* Sigla oficială NETOPIA (Visa/Mastercard) — componenta din contul Netopia, cerută pentru aprobare. */}
        <div className="rounded-lg bg-white p-2 shadow-sm">
          <iframe
            src="https://mny.ro/npId.html?color=%23ffffff&version=vertical&secret=168387"
            title="NETOPIA Payments"
            loading="lazy"
            style={{ border: "none", width: 100, height: 80, display: "block" }}
          />
        </div>
      </div>
    </footer>
  );
}
