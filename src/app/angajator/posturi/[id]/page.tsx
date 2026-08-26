import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PostForm from "../PostForm";

export async function generateMetadata() {
  const t = await getTranslations("posts");
  return { title: `${t("editTitle")} — Recrutare Directă` };
}

export default async function PostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("posts");
  const { id } = await params;
  const session = await auth();

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: session!.user.id },
  });
  const post = employer
    ? await prisma.post.findUnique({ where: { id } })
    : null;
  if (!post || !employer || post.employerId !== employer.id) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/angajator/posturi" className="text-sm text-accent hover:underline">
        {t("backToList")}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{t("editTitle")}</h1>
      <PostForm post={post} />
    </main>
  );
}
