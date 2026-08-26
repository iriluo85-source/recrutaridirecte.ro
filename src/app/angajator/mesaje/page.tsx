import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ConversationList, { type ConversationItem } from "@/components/ConversationList";

export default async function MesajeAngajatorPage() {
  const session = await auth();
  const userId = session!.user.id;
  const t = await getTranslations("employer");
  const th = await getTranslations("history");

  const employer = await prisma.employerProfile.findUnique({ where: { userId } });

  const conversatii = employer
    ? await prisma.conversation.findMany({
        where: { employerId: employer.id },
        include: { candidate: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const items: ConversationItem[] = conversatii.map((c) => {
    const ultimul = c.messages[0];
    return {
      id: c.id,
      href: `/angajator/mesaje/${c.id}`,
      title: c.candidate.numeComplet,
      subtitle: c.candidate.titluCurent,
      preview: ultimul ? ultimul.continut ?? t("messages.attachment") : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("messages.title")}</h1>
          <p className="mt-1 text-muted">{t("messages.subtitle")}</p>
        </div>
        <Link
          href="/angajator/istoric"
          className="mt-1 shrink-0 whitespace-nowrap text-sm text-accent hover:underline"
        >
          {th("link")} →
        </Link>
      </div>

      {!employer && (
        <p className="mt-4 text-sm text-muted">
          {t("messages.completeProfileFirst")}
        </p>
      )}

      <div className="mt-6">
        {employer && conversatii.length === 0 ? (
          <p className="text-sm text-muted">{t("messages.noConversations")}</p>
        ) : (
          employer && <ConversationList items={items} />
        )}
      </div>
    </main>
  );
}
