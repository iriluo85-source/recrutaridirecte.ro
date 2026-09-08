import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { celMaiBunSalt, type Audienta } from "@/lib/audienta";

/**
 * Curba „câți candidați ating cu bugetul meu”. Gratuită prin design: e momentul
 * în care firma înțelege că platforma știe ceva ce ea nu știe, înainte să
 * plătească orice. Se ascunde singură când nu are ce spune.
 */
export default async function EstimatorAudienta({
  audienta,
  linkPentruBuget,
}: {
  audienta: Audienta;
  /** Construiește linkul care re-caută cu bugetul respectiv. */
  linkPentruBuget?: (salariu: number) => string;
}) {
  const t = await getTranslations("audienta");

  if (audienta.praguri.length < 2) return null;

  const maxim = Math.max(...audienta.praguri.map((p) => p.candidati));
  if (maxim === 0) return null;

  const salt = celMaiBunSalt(audienta);
  const fmt = (n: number) => new Intl.NumberFormat("ro-RO").format(n);

  return (
    <section className="card mt-6">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-4 flex flex-col gap-2">
        {audienta.praguri.map((p) => {
          const lat = Math.max(3, Math.round((p.candidati / maxim) * 100));
          const esteVarf = p.candidati === maxim;
          const bara = (
            <>
              <span className="w-24 shrink-0 text-right text-sm tabular-nums text-muted">
                {fmt(p.salariu)} lei
              </span>
              <span className="h-6 flex-1 overflow-hidden rounded-sm bg-line/40">
                <span
                  className={`block h-full rounded-sm ${esteVarf ? "bg-accent" : "bg-accent/60"}`}
                  style={{ width: `${lat}%` }}
                />
              </span>
              <span className="w-28 shrink-0 text-sm font-medium tabular-nums">
                {t("candidates", { count: p.candidati })}
              </span>
            </>
          );

          return linkPentruBuget ? (
            <Link
              key={p.salariu}
              href={linkPentruBuget(p.salariu)}
              className="flex items-center gap-3 rounded-md px-1 py-0.5 transition hover:bg-surface"
              title={t("applyBudget", { salariu: fmt(p.salariu) })}
            >
              {bara}
            </Link>
          ) : (
            <div key={p.salariu} className="flex items-center gap-3 px-1 py-0.5">
              {bara}
            </div>
          );
        })}
      </div>

      {salt && salt.la.candidati > salt.de.candidati && (
        <p className="mt-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
          {t("insight", {
            de: fmt(salt.de.salariu),
            la: fmt(salt.la.salariu),
            castig: salt.la.candidati - salt.de.candidati,
          })}
        </p>
      )}

      {audienta.faraSalariu > 0 && (
        <p className="mt-2 text-xs text-muted">
          {t("noSalaryNote", { count: audienta.faraSalariu })}
        </p>
      )}
    </section>
  );
}
