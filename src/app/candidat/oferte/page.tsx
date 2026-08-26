import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ConversationList, { type ConversationItem } from "@/components/ConversationList";

export default async function OferteMelePage() {
  const t = await getTranslations("candidate");
  const th = await getTranslations("history");
  const session = await auth();
  const userId = session!.user.id;

  const candidat = await prisma.candidateProfile.findUnique({ where: { userId } });

  const conversatii = candidat
    ? await prisma.conversation.findMany({
        where: { candidateId: candidat.id },
        include: { employer: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const items: ConversationItem[] = conversatii.map((c) => {
    const ultimul = c.messages[0];
    return {
      id: c.id,
      href: `/candidat/oferte/${c.id}`,
      title: c.employer.numeCompanie,
      preview: ultimul ? ultimul.continut ?? `📎 ${t("attachment")}` : null,
      date: ultimul ? new Date(ultimul.createdAt).toLocaleDateString("ro-RO") : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("myOffersTitle")}</h1>
          <p className="mt-1 text-muted">
            {t("myOffersSubtitle")}
          </p>
        </div>
        <Link
          href="/candidat/istoric"
          className="mt-1 shrink-0 whitespace-nowrap text-sm text-accent hover:underline"
        >
          {th("link")} →
        </Link>
      </div>

      {!candidat && (
        <p className="mt-4 text-sm text-muted">
          {t("completeProfilePrompt")}
        </p>
      )}

      <div className="mt-6">
        {candidat && conversatii.length === 0 ? (
          <p className="text-sm text-muted">{t("noOffersYet")}</p>
        ) : (
          candidat && <ConversationList items={items} />
        )}
      </div>
    </main>
  );
}
