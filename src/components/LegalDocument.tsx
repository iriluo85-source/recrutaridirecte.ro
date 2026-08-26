import Link from "next/link";
import type { LegalBlock, LegalDoc } from "@/lib/legal";

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return (
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          {block.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case "sub":
      return <h3 className="mt-1 font-semibold text-foreground">{block.text}</h3>;
    case "box":
      return (
        <div
          className={
            block.variant === "key"
              ? "rounded-lg border border-accent-secondary/50 bg-accent-secondary/15 px-4 py-3"
              : "rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3"
          }
        >
          {block.text}
        </div>
      );
    case "link":
      return (
        <Link href={block.href} className="text-accent hover:underline">
          {block.text}
        </Link>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="rounded-tl-lg bg-foreground px-3 py-2 text-background">{block.head[0]}</th>
                <th className="rounded-tr-lg bg-foreground px-3 py-2 text-background">{block.head[1]}</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-line align-top">
                  <td className="px-3 py-2 font-medium">{row[0]}</td>
                  <td className="px-3 py-2 text-muted">{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="card">
        <h1 className="text-2xl font-semibold">{doc.title}</h1>
        <p className="mt-1 text-sm text-muted">{doc.updated}</p>

        <div className="mt-5 rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm">
          {doc.intro}
        </div>

        <div className="mt-6 flex flex-col gap-7 text-sm leading-relaxed">
          {doc.sections.map((section, i) => (
            <section key={i}>
              <h2 className="border-t border-line pt-4 text-base font-semibold text-accent">
                {section.title}
              </h2>
              <div className="mt-2 flex flex-col gap-3">
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-line pt-4 text-xs text-muted">{doc.footer}</p>
      </div>
    </main>
  );
}
