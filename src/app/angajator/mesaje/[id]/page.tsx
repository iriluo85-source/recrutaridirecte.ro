import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConversationForUser } from "@/lib/chat";
import { amBlocat } from "@/lib/moderare";
import MessageThread from "@/components/MessageThread";
import ModerareControls from "@/components/ModerareControls";
import OfferForm from "./OfferForm";
import {
  retrageOfertaAction,
  acceptaContraofertaAction,
  respingeContraofertaAction,
  recontraofertaAction,
} from "../../actions";

export default async function MesajThreadAngajatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tc = await getTranslations("common");
  const t = await getTranslations("employer");
  const { id } = await params;
  const session = await auth();
  const access = await getConversationForUser(id, session!.user.id);
  if (!access || !access.isEmployer) notFound();

  const offers = await prisma.jobOffer.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{access.conversation.candidate.numeComplet}</h1>
      <p className="text-muted">{access.conversation.candidate.titluCurent}</p>

      <div className="mt-6 flex flex-col gap-3">
        <OfferForm conversationId={id} />

        {offers.length > 0 && (
          <div className="flex flex-col gap-2">
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
                  <div className="mt-3 rounded-lg bg-amber-500/10 px-3 py-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {t("counter.receivedPrefix")} {o.salariuContra} {tc("salaryPerMonth")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <form action={acceptaContraofertaAction}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <button type="submit" className="btn-primary text-sm">
                          {t("counter.acceptPrefix")} {o.salariuContra} {tc("salaryPerMonth")}
                        </button>
                      </form>
                      <form action={respingeContraofertaAction}>
                        <input type="hidden" name="offerId" value={o.id} />
                        <button type="submit" className="btn-secondary text-sm">
                          {t("counter.reject")}
                        </button>
                      </form>
                    </div>
                    <details className="mt-2 text-sm">
                      <summary className="cursor-pointer font-medium text-accent hover:underline">
                        {t("counter.recounter")}
                      </summary>
                      <form action={recontraofertaAction} className="mt-2 flex items-end gap-2">
                        <input type="hidden" name="offerId" value={o.id} />
                        <label className="flex flex-col gap-1">
                          <span className="field-label text-xs">{t("counter.salaryLabel")}</span>
                          <input
                            type="number"
                            name="salariu"
                            min={1}
                            required
                            defaultValue={o.salariuContra ?? o.salariu ?? ""}
                            className="input w-40"
                          />
                        </label>
                        <button type="submit" className="btn-secondary">
                          {t("counter.recounterSubmit")}
                        </button>
                      </form>
                    </details>
                  </div>
                )}
                {o.status === "PENDING" && (
                  <form action={retrageOfertaAction} className="mt-3">
                    <input type="hidden" name="offerId" value={o.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-500 hover:underline"
                    >
                      {t("messages.withdrawOffer")}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4">
        <MessageThread conversationId={id} ownRole="EMPLOYER" />
      </div>

      <ModerareControls
        targetUserId={access.conversation.candidate.userId}
        blocat={await amBlocat(session!.user.id, access.conversation.candidate.userId)}
        cale={`/angajator/mesaje/${id}`}
      />
    </main>
  );
}
