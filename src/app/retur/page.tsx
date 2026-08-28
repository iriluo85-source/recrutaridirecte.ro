import { getLocale } from "next-intl/server";
import { getRetur } from "@/lib/legal";
import LegalDocument from "@/components/LegalDocument";

export async function generateMetadata() {
  const doc = getRetur(await getLocale());
  return { title: `${doc.title} — Recrutare Directă` };
}

export default async function ReturPage() {
  const doc = getRetur(await getLocale());
  return <LegalDocument doc={doc} />;
}
