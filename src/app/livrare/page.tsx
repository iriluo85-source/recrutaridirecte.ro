import { getLocale } from "next-intl/server";
import { getLivrare } from "@/lib/legal";
import LegalDocument from "@/components/LegalDocument";

export async function generateMetadata() {
  const doc = getLivrare(await getLocale());
  return { title: `${doc.title} — Recrutare Directă` };
}

export default async function LivrarePage() {
  const doc = getLivrare(await getLocale());
  return <LegalDocument doc={doc} />;
}
