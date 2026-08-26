// ─────────────────────────────────────────────────────────────────────────────
// Generarea automată a noutăților din piața muncii (rezumat AI, o dată pe zi).
//
// STARE: SCHELET. Se activează la deploy (cron zilnic + AI real). Până atunci,
// articolele se pot adăuga manual din /admin/noutati.
//
// Reguli (importante):
//  - NU copiem articole. Doar rezumat scurt (2-3 fraze) + LINK la sursă, cu atribuire.
//  - Surse strict din domeniul muncii/angajări/legislație (Codul Muncii etc.).
//  - Preferăm surse oficiale + presă serioasă.
//  - O rulare pe zi; evităm repetițiile (dedup după sursaUrl).
//  - Ton informativ, nu sfat juridic.
// ─────────────────────────────────────────────────────────────────────────────

export const SURSE_RECOMANDATE = [
  "Monitorul Oficial",
  "Inspecția Muncii (ITM)",
  "ANPC",
  "Avocatnet",
  "Ziarul Financiar",
  "Economedia",
  "Profit.ro",
  "HotNews",
];

// Rulată de un cron zilnic la lansare.
export async function genereazaNoutatiZilnice(): Promise<{ adaugate: number }> {
  // TODO(deploy):
  //  1. preia titluri + linkuri din ~10 surse relevante (RSS/API, conform ToS).
  //  2. păstrează doar subiectele din piața muncii; elimină ce există deja (dedup după sursaUrl).
  //  3. rezumă cu AI (Claude) în 2-3 fraze, în română, ton informativ.
  //  4. salvează în prisma.articol câteva intrări noi.
  return { adaugate: 0 };
}
