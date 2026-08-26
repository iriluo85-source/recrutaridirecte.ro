import { getTranslations } from "next-intl/server";
import PageBanner from "@/components/PageBanner";
import ContactForm from "./ContactForm";
import { LEGAL_CONFIG } from "@/lib/legal";

export async function generateMetadata() {
  const t = await getTranslations("contact");
  return { title: `${t("title")} — Recrutare Directă`, description: t("subtitle") };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");
  return (
    <main className="flex-1">
      <PageBanner image="/images/hero-collab.jpg" title={t("title")} subtitle={t("subtitle")} />
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="card">
          <h2 className="field-label">{t("emailLabel")}</h2>
          <a
            href={`mailto:${LEGAL_CONFIG.emailContact}`}
            className="mt-1 inline-block text-accent hover:underline"
          >
            {LEGAL_CONFIG.emailContact}
          </a>
          <p className="mt-2 text-xs text-muted">{t("companyNote")}</p>
        </div>
        <div className="card mt-4">
          <h2 className="field-label">{t("formTitle")}</h2>
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
