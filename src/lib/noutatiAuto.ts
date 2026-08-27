// ─────────────────────────────────────────────────────────────────────────────
// Import automat de noutăți din fluxuri RSS oficiale (surse românești).
//
// Model LEGAL: NU copiem articole. Salvăm doar titlul + un rezumat scurt (din
// fluxul RSS, oferit chiar de sursă pentru sindicalizare) + numele sursei + LINK
// către articolul original. Exact ca un agregator (Google News etc.).
//
// Rulează zilnic (via /api/cron/noutati) și adaugă 2-3 articole noi, cu diversitate
// de surse. Deduplică după `sursaUrl` (nu re-adaugă ce există deja).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

type Sursa = { nume: string; url: string; categorie: string };

// Surse cu flux RSS verificat (2026-08). Acoperă business, economic, antreprenoriat,
// legislație și politici economice — relevant pentru candidați și angajatori.
const SURSE: Sursa[] = [
  { nume: "Profit.ro", url: "https://www.profit.ro/rss", categorie: "Economic" },
  { nume: "Ziarul Financiar", url: "https://www.zf.ro/rss/", categorie: "Business" },
  { nume: "Economedia", url: "https://economedia.ro/feed", categorie: "Economic" },
  { nume: "Economica.net", url: "https://www.economica.net/feed", categorie: "Economic" },
  { nume: "StartupCafe", url: "https://startupcafe.ro/feed", categorie: "Antreprenoriat" },
  { nume: "Curs de Guvernare", url: "https://cursdeguvernare.ro/feed", categorie: "Politici economice" },
  { nume: "Juridice.ro", url: "https://www.juridice.ro/feed", categorie: "Legislație" },
];

const UA =
  "Mozilla/5.0 (compatible; RecrutareDirectaBot/1.0; +https://www.recrutaridirecte.ro)";

function extrageTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!m) return "";
  return m[1]
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .trim();
}

// Curăță HTML + decodează entitățile de bază, taie la o lungime rezonabilă.
function curataText(html: string, maxLen = 300): string {
  let t = html.replace(/<[^>]+>/g, " ");
  t = t
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&hellip;|&#8230;/gi, "…")
    .replace(/&#8211;|&#8212;|&ndash;|&mdash;/gi, "–")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  return t;
}

type Candidat = {
  titlu: string;
  rezumat: string;
  sursaNume: string;
  sursaUrl: string;
  categorie: string;
  data: number; // timestamp pentru sortare
};

async function citesteFeed(s: Sursa): Promise<Candidat[]> {
  try {
    const res = await fetch(s.url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    const out: Candidat[] = [];
    for (const b of blocks.slice(0, 8)) {
      const titlu = curataText(extrageTag(b, "title"), 250);
      let link = extrageTag(b, "link");
      if (!link || !/^https?:/i.test(link)) {
        const m = b.match(/<link[^>]*href="([^"]+)"/i);
        if (m) link = m[1];
      }
      link = (link || "").trim();
      const descRaw = extrageTag(b, "description") || extrageTag(b, "summary") || extrageTag(b, "content:encoded");
      const rezumat = curataText(descRaw, 300) || titlu;
      const pub = extrageTag(b, "pubDate") || extrageTag(b, "published") || extrageTag(b, "updated");
      const t = pub ? Date.parse(pub) : Date.now();
      if (!titlu || !/^https?:/i.test(link)) continue;
      out.push({
        titlu,
        rezumat,
        sursaNume: s.nume,
        sursaUrl: link,
        categorie: s.categorie,
        data: Number.isNaN(t) ? 0 : t,
      });
    }
    return out;
  } catch {
    return [];
  }
}

// Importă până la `maxNoi` articole noi (implicit 3), cu diversitate de surse.
export async function importaNoutati(maxNoi = 3): Promise<{ adaugate: number; titluri: string[] }> {
  const liste = await Promise.all(SURSE.map((s) => citesteFeed(s)));
  const candidati = liste.flat();

  // deja existente în DB (după link)
  const existente = new Set(
    (await prisma.articol.findMany({ select: { sursaUrl: true } })).map((a) => a.sursaUrl)
  );

  // filtrează existente + duplicate în lot, apoi cele mai noi întâi
  const vazute = new Set<string>();
  const proaspete = candidati
    .filter((c) => {
      if (existente.has(c.sursaUrl) || vazute.has(c.sursaUrl)) return false;
      vazute.add(c.sursaUrl);
      return true;
    })
    .sort((a, b) => b.data - a.data);

  // alege cu diversitate: preferă surse diferite în același lot
  const alese: Candidat[] = [];
  const surseFolosite = new Set<string>();
  for (const c of proaspete) {
    if (surseFolosite.has(c.sursaNume)) continue;
    alese.push(c);
    surseFolosite.add(c.sursaNume);
    if (alese.length >= maxNoi) break;
  }
  // completează dacă nu sunt destule surse distincte
  if (alese.length < maxNoi) {
    for (const c of proaspete) {
      if (alese.includes(c)) continue;
      alese.push(c);
      if (alese.length >= maxNoi) break;
    }
  }

  for (const c of alese) {
    try {
      await prisma.articol.create({
        data: {
          titlu: c.titlu,
          rezumat: c.rezumat,
          sursaNume: c.sursaNume,
          sursaUrl: c.sursaUrl,
          categorie: c.categorie,
        },
      });
    } catch {
      // ignoră un articol care pică (ex. duplicat prins de o rulare paralelă)
    }
  }

  return { adaugate: alese.length, titluri: alese.map((a) => a.titlu) };
}
