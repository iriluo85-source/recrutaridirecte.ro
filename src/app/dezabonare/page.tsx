import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { verificaSemnaturaDezabonare } from "@/lib/newsletter";

export async function generateMetadata() {
  const t = await getTranslations("newsletter");
  return { title: `${t("unsubscribe.title")} — Recrutare Directă` };
}

export default async function DezabonarePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; s?: string }>;
}) {
  const t = await getTranslations("newsletter");
  const { u, s } = await searchParams;

  let ok = false;
  if (u && s && verificaSemnaturaDezabonare(u, s)) {
    try {
      await prisma.user.update({
        where: { id: u },
        data: { newsletterEmail: false },
      });
      ok = true;
    } catch {
      ok = false;
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <div className="card text-center">
        <h1 className="text-2xl font-semibold">
          {ok ? t("unsubscribe.doneTitle") : t("unsubscribe.errorTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {ok ? t("unsubscribe.doneDesc") : t("unsubscribe.errorDesc")}
        </p>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          {t("unsubscribe.home")}
        </Link>
      </div>
    </main>
  );
}
