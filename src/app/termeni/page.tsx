import { getLocale } from "next-intl/server";
import { getTermeni } from "@/lib/legal";
import LegalDocument from "@/components/LegalDocument";

export async function generateMetadata() {
  const doc = getTermeni(await getLocale());
  return { title: `${doc.title} — Recrutare Directă` };
}

export default async function TermeniPage() {
  const doc = getTermeni(await getLocale());
  return <LegalDocument doc={doc} />;
}
