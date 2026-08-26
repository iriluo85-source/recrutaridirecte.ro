import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { deleteDocumentAction } from "../actions";
import AddDocumentForm from "./AddDocumentForm";

export default async function AdminDocumentePage() {
  const t = await getTranslations("admin");
  const tc = await getTranslations("common");
  const documente = await prisma.documentAdmin.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">{t("documentsTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("documentsSubtitle")}
      </p>

      <div className="card mt-6">
        {documente.length === 0 ? (
          <p className="text-sm text-muted">{t("noDocuments")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {documente.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-line px-3 py-2"
              >
                <div>
                  <a
                    href={`/api/documente-admin/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    {doc.eticheta}
                  </a>
                  <p className="text-xs text-muted">
                    {t("addedOn", {
                      date: new Date(doc.createdAt).toLocaleDateString("ro-RO"),
                    })}
                  </p>
                </div>
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={doc.id} />
                  <button type="submit" className="text-xs text-red-500 hover:underline">
                    {tc("delete")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <AddDocumentForm />
      </div>
    </main>
  );
}
