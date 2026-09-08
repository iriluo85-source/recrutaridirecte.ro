import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { stareStudent, campanieActiva, zileRamaseCampanie, REDUCERE_STUDENT } from "@/lib/student";
import PageBanner from "@/components/PageBanner";
import CapturaCarnet from "./CapturaCarnet";

export async function generateMetadata() {
  const t = await getTranslations("student");
  return { title: `${t("title")} — Recrutare Directă` };
}

export default async function StudentPage() {
  const t = await getTranslations("student");
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CANDIDATE") redirect("/");

  const { stare, motivRespingere } = await stareStudent(session.user.id);
  const activa = campanieActiva();
  const zile = zileRamaseCampanie();
  const procent = Math.round(REDUCERE_STUDENT * 100);

  return (
    <main className="flex-1">
      <PageBanner
        image="/images/hero-success.jpg"
        eyebrow={activa ? t("banner.daysLeft", { count: zile }) : t("banner.ended")}
        title={t("title")}
        subtitle={t("subtitle", { percent: procent })}
        maxWidthClass="max-w-2xl"
      />

      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {stare === "VALIDAT" ? (
          <div className="card border-accent">
            <p className="text-lg font-semibold">{t("state.validTitle")}</p>
            <p className="mt-1 text-muted">{t("state.validDesc", { percent: procent })}</p>
            <Link href="/abonamente" className="btn-primary mt-4 inline-flex">
              {t("state.seePlans")}
            </Link>
          </div>
        ) : stare === "IN_ASTEPTARE" ? (
          <div className="card">
            <p className="text-lg font-semibold">{t("state.pendingTitle")}</p>
            <p className="mt-1 text-muted">{t("state.pendingDesc")}</p>
          </div>
        ) : !activa ? (
          <div className="card">
            <p className="text-lg font-semibold">{t("state.endedTitle")}</p>
            <p className="mt-1 text-muted">{t("state.endedDesc")}</p>
          </div>
        ) : (
          <>
            {stare === "RESPINS" && (
              <div className="mb-4 rounded-lg border border-amber-400/50 bg-amber-400/5 p-4">
                <p className="font-medium">{t("state.rejectedTitle")}</p>
                <p className="mt-1 text-sm text-muted">
                  {motivRespingere || t("state.rejectedDefault")}
                </p>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-semibold">{t("how.title")}</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
                <li>{t("how.step1")}</li>
                <li>{t("how.step2")}</li>
                <li>{t("how.step3")}</li>
              </ol>
            </div>

            <div className="card mt-4">
              <CapturaCarnet />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
