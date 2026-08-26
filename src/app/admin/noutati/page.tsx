import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { stergeArticolAction } from "../actions";
import ArticolForm from "./ArticolForm";

export default async function AdminNoutatiPage() {
  const t = await getTranslations("admin");
  const articole = await prisma.articol.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("news.title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("news.desc")}</p>

      <ArticolForm />

      <div className="mt-6 flex flex-col gap-2">
        {articole.map((a) => (
          <div key={a.id} className="card flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.titlu}</p>
              <p className="mt-1 text-sm text-muted">{a.rezumat}</p>
              <a href={a.sursaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent hover:underline">
                {a.sursaNume} ↗
              </a>
            </div>
            <form action={stergeArticolAction}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="text-sm font-medium text-red-500 hover:underline">
                {t("news.delete")}
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
