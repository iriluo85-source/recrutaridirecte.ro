import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForUser } from "@/lib/chat";
import { amBlocat } from "@/lib/moderare";
import MessageThread from "@/components/MessageThread";
import ModerareControls from "@/components/ModerareControls";
import { acceptOfferAction, rejectOfferAction, contraofertaAction } from "../actions";

export default async function OfertaThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("candidate");
  const tc = await getTranslations("common");
  const { id } = await params;
  const session = await auth();
  const access = await getConversationForUser(id, session!.user.id);
  if (!access || !access.isCandidate) notFound();

  const offers = await prisma.jobOffer.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{access.conversation.employer.numeCompanie}</h1>
        <Link
          href={`/candidat/companie/${access.conversation.employerId}`}
          className="text-sm text-accent hover:underline"
        >
          {t("viewCompanyProfile")}
        </Link>
      </div>

      {offers.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          {offers.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{o.titluPost}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    o.status === "ACCEPTED"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : o.status === "REJECTED"
                        ? "bg-red-500/15 text-red-500"
                        : o.status === "COUNTERED"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-accent-secondary/20 text-accent-secondary-foreground"
                  }`}
                >
                  {tc("offerStatus." + o.status)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{o.descriere}</p>
              {(o.salariu || o.locatie) && (
                <p className="mt-2 text-xs text-muted">
                  {o.salariu ? `${o.salariu} ${tc("salaryPerMonth")}` : ""}
                  {o.salariu && o.locatie ? " · " : ""}
                  {o.locatie ?? ""}
                </p>
              )}
              {o.status === "COUNTERED" && (
                <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  {t("counter.proposed")} {o.salariuContra} {tc("salaryPerMonth")} — {t("counter.waiting")}
                </p>
              )}
              {o.status === "PENDING" && (
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <form action={acceptOfferAction}>
                      <input type="hidden" name="offerId" value={o.id} />
                      <button type="submit" className="btn-primary">
                        {t("accept")}
                      </button>
                    </form>
                    <form action={rejectOfferAction}>
                      <input type="hidden" name="offerId" value={o.id} />
                      <button type="submit" className="btn-secondary">
                        {t("reject")}
                      </button>
                    </form>
                  </div>
                  <details className="text-sm">
                    <summary className="cursor-pointer font-medium text-accent hover:underline">
                      {t("counter.button")}
                    </summary>
                    <form action={contraofertaAction} className="mt-2 flex items-end gap-2">
                      <input type="hidden" name="offerId" value={o.id} />
                      <label className="flex flex-col gap-1">
                        <span className="field-label text-xs">{t("counter.salaryLabel")}</span>
                        <input
                          type="number"
                          name="salariu"
                          min={1}
                          required
                          defaultValue={o.salariu ?? ""}
                          className="input w-40"
                        />
                      </label>
                      <button type="submit" className="btn-secondary">
                        {t("counter.submit")}
                      </button>
                    </form>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <MessageThread conversationId={id} ownRole="CANDIDATE" />
      </div>

      <ModerareControls
        targetUserId={access.conversation.employer.userId}
        blocat={await amBlocat(session!.user.id, access.conversation.employer.userId)}
        cale={`/candidat/oferte/${id}`}
      />
    </main>
  );
}
