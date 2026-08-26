import Link from "next/link";
import { getTranslations } from "next-intl/server";
import PostForm from "../PostForm";

export async function generateMetadata() {
  const t = await getTranslations("posts");
  return { title: `${t("newTitle")} — Recrutare Directă` };
}

export default async function PostNouPage() {
  const t = await getTranslations("posts");
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/angajator/posturi" className="text-sm text-accent hover:underline">
        {t("backToList")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("newTitle")}</h1>
      <PostForm />
    </main>
  );
}
