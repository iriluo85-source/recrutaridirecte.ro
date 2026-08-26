import { getLocale } from "next-intl/server";
import { getConfidentialitate } from "@/lib/legal";
import LegalDocument from "@/components/LegalDocument";

export async function generateMetadata() {
  const doc = getConfidentialitate(await getLocale());
  return { title: `${doc.title} — Recrutare Directă` };
}

export default async function ConfidentialitatePage() {
  const doc = getConfidentialitate(await getLocale());
  return <LegalDocument doc={doc} />;
}
