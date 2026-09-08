import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { platiActive, esteSandbox } from "@/lib/netopia";
import { estePachetCredite, gasestePachet } from "@/lib/credite";

export const dynamic = "force-dynamic";

export const metadata = { title: "Plăți — Admin" };

function data(d: Date) {
  return new Date(d).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function lei(n: number) {
  return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2 }).format(n);
}

function descriereProdus(planTip: string, luni: number) {
  if (estePachetCredite(planTip)) {
    const p = gasestePachet(planTip);
    return p ? `${p.credite} răspunsuri` : planTip;
  }
  return luni > 1 ? `Abonament ${planTip} · ${luni} luni` : `Abonament ${planTip}`;
}

export default async function AdminPlatiPage() {
  const sandbox = esteSandbox();
  const active = platiActive();

  const [plati, totalPaid] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.payment.aggregate({ _sum: { suma: true }, _count: { _all: true }, where: { status: "PAID" } }),
  ]);

  const emailuri = new Map<string, string>();
  if (plati.length > 0) {
    const useri = await prisma.user.findMany({
      where: { id: { in: Array.from(new Set(plati.map((p) => p.userId))) } },
      select: { id: true, email: true },
    });
    useri.forEach((u) => emailuri.set(u.id, u.email));
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/admin" className="text-sm text-accent hover:underline">
        ← Admin
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Plăți</h1>

      {/* Diagnosticul care contează: în sandbox plata pare reușită, abonamentul se
          activează, dar niciun ban real nu se mișcă. */}
      <div
        className={`mt-6 rounded-lg border p-5 ${
          sandbox
            ? "border-red-500/50 bg-red-500/10"
            : "border-emerald-500/40 bg-emerald-500/10"
        }`}
      >
        <p className="text-lg font-semibold">
          {sandbox ? "⚠ Mod TEST (sandbox) — banii NU sunt reali" : "✓ Mod LIVE — banii sunt reali"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {sandbox
            ? "Plățile trec, abonamentele se activează și Netopia trimite email, dar nu se încasează nimic în contul firmei. Ca să treci pe LIVE, setează pe Railway variabila NETOPIA_SANDBOX exact la textul „false” (cu litere mici) și repornește aplicația."
            : "Plățile confirmate ajung la Netopia, care le virează în contul firmei conform termenelor din contract."}
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">NETOPIA_SANDBOX</dt>
            <dd className="font-mono">{process.env.NETOPIA_SANDBOX ?? "(nesetat)"}</dd>
          </div>
          <div>
            <dt className="text-muted">Cheie API</dt>
            <dd>{process.env.NETOPIA_API_KEY ? "prezentă" : "LIPSEȘTE"}</dd>
          </div>
          <div>
            <dt className="text-muted">Semnătură POS</dt>
            <dd>{process.env.NETOPIA_POS_SIGNATURE ? "prezentă" : "LIPSEȘTE"}</dd>
          </div>
        </dl>
        {!active && (
          <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
            Plățile sunt oprite: lipsește cheia API sau semnătura POS.
          </p>
        )}
      </div>

      <p className="mt-6 text-sm text-muted">
        {totalPaid._count._all} plăți confirmate · {lei(totalPaid._sum.suma ?? 0)} lei încasați
        prin Netopia (înainte de comision).
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4 font-normal">Când</th>
              <th className="py-2 pr-4 font-normal">Cont</th>
              <th className="py-2 pr-4 font-normal">Produs</th>
              <th className="py-2 pr-4 font-normal">Sumă</th>
              <th className="py-2 pr-4 font-normal">Stare</th>
              <th className="py-2 font-normal">Comandă</th>
            </tr>
          </thead>
          <tbody>
            {plati.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-muted">
                  Nicio plată încă.
                </td>
              </tr>
            )}
            {plati.map((p) => (
              <tr key={p.id} className="border-b border-line/60">
                <td className="py-2 pr-4 whitespace-nowrap text-muted">{data(p.createdAt)}</td>
                <td className="py-2 pr-4">{emailuri.get(p.userId) ?? "cont șters"}</td>
                <td className="py-2 pr-4">{descriereProdus(p.planTip, p.luni)}</td>
                <td className="py-2 pr-4 whitespace-nowrap tabular-nums">{lei(p.suma)} lei</td>
                <td className="py-2 pr-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === "PAID"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : p.status === "FAILED"
                          ? "bg-red-500/15 text-red-500"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="py-2 font-mono text-xs text-muted">{p.orderID}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
