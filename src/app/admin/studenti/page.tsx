import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { campanieActiva, zileRamaseCampanie } from "@/lib/student";
import { decideStudentAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Verificări student — Admin" };

const ETICHETE_DOC: Record<string, string> = {
  LEGITIMATIE_STUDENT: "Legitimație de student",
  CARNET_ELEV: "Carnet de elev",
};

function data(d: Date) {
  return new Date(d).toLocaleString("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminStudentiPage() {
  const [inAsteptare, decise, validate] = await Promise.all([
    prisma.studentVerificare.findMany({
      where: { status: "IN_ASTEPTARE" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { email: true, candidateProfile: { select: { numeComplet: true } } } } },
    }),
    prisma.studentVerificare.findMany({
      where: { status: { in: ["VALIDAT", "RESPINS"] } },
      orderBy: { decisLa: "desc" },
      take: 30,
      include: { user: { select: { email: true } } },
    }),
    prisma.studentVerificare.count({ where: { status: "VALIDAT" } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Link href="/admin" className="text-sm text-accent hover:underline">
        ← Admin
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">Verificări student</h1>
      <p className="mt-1 text-muted">
        {campanieActiva()
          ? `Campania Back to School e activă — mai sunt ${zileRamaseCampanie()} zile.`
          : "Campania Back to School s-a încheiat."}{" "}
        {validate} conturi validate până acum.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          În așteptare
          <span className="ml-2 text-sm font-normal text-muted">{inAsteptare.length}</span>
        </h2>

        {inAsteptare.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nicio cerere în așteptare.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {inAsteptare.map((c) => (
              <div key={c.id} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {c.user.candidateProfile?.numeComplet || c.user.email}
                  </p>
                  <span className="text-xs text-muted">{data(c.createdAt)}</span>
                </div>
                <p className="text-sm text-muted">{c.user.email}</p>
                <p className="mt-1 text-sm">
                  {ETICHETE_DOC[c.tipDocument] ?? c.tipDocument}
                  {c.institutie ? ` · ${c.institutie}` : ""}
                </p>

                {c.fisier && (
                  <a
                    href={`/api/student/poza/${c.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/student/poza/${c.id}`}
                      alt="Legitimația trimisă"
                      className="max-h-80 w-full rounded-lg border border-line object-contain"
                    />
                  </a>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <form action={decideStudentAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decizie" value="VALIDAT" />
                    <button type="submit" className="btn-primary">
                      Validează
                    </button>
                  </form>

                  <form action={decideStudentAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="decizie" value="RESPINS" />
                    <label className="flex flex-col gap-1">
                      <span className="field-label text-xs">Motiv (apare în email)</span>
                      <input
                        name="motiv"
                        placeholder="ex: poza e neclară"
                        className="input w-64"
                      />
                    </label>
                    <button type="submit" className="btn-secondary">
                      Respinge
                    </button>
                  </form>
                </div>

                <p className="mt-3 text-xs text-muted">
                  Poza se șterge de pe server imediat ce apeși una dintre butoane.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Decise recent</h2>
        {decise.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nicio decizie încă.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 pr-4 font-normal">Email</th>
                  <th className="py-2 pr-4 font-normal">Rezultat</th>
                  <th className="py-2 pr-4 font-normal">Motiv</th>
                  <th className="py-2 font-normal">Când</th>
                </tr>
              </thead>
              <tbody>
                {decise.map((d) => (
                  <tr key={d.id} className="border-b border-line/60">
                    <td className="py-2 pr-4">{d.user.email}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          d.status === "VALIDAT"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-500"
                        }`}
                      >
                        {d.status === "VALIDAT" ? "Validat" : "Respins"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-muted">{d.motivRespingere || "—"}</td>
                    <td className="py-2 text-muted">{d.decisLa ? data(d.decisLa) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
