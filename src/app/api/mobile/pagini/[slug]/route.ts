import { NextRequest, NextResponse } from "next/server";
import { getTermeni, getConfidentialitate, type LegalDoc, LEGAL_CONFIG } from "@/lib/legal";

// Structură simplă pentru afișare în aplicație.
type PaginaMobil = {
  title: string;
  updated?: string;
  intro?: string;
  sections: { title: string; paragrafe: string[] }[];
};

// Transformă un document legal (blocuri) în paragrafe simple pentru mobil.
function dinLegalDoc(doc: LegalDoc): PaginaMobil {
  return {
    title: doc.title,
    updated: doc.updated,
    intro: doc.intro,
    sections: doc.sections.map((s) => {
      const paragrafe: string[] = [];
      for (const b of s.blocks) {
        switch (b.kind) {
          case "p":
          case "box":
            paragrafe.push(b.text);
            break;
          case "sub":
            paragrafe.push(b.text);
            break;
          case "ul":
            for (const item of b.items) paragrafe.push(`• ${item}`);
            break;
          case "table":
            for (const [a, c] of b.rows) paragrafe.push(`• ${a} — ${c}`);
            break;
          case "link":
            paragrafe.push(b.text);
            break;
        }
      }
      return { title: s.title, paragrafe };
    }),
  };
}

const C = LEGAL_CONFIG;

const DESPRE: PaginaMobil = {
  title: "Despre noi",
  intro: `${C.numeSite} este o platformă de recrutare directă: angajatorii caută candidați potriviți după criterii și îi contactează direct, iar candidații își publică profilul ca să fie găsiți — fără anunțuri de tip job-board și fără intermediari.`,
  sections: [
    {
      title: "Ce ne face diferiți",
      paragrafe: [
        "• Căutare directă: angajatorul te găsește pe tine, nu invers.",
        "• Scor de potrivire calculat automat după criteriile fiecărui angajator.",
        "• Contact direct și transparent, prin mesaje private.",
        "• Controlezi ce date sunt vizibile și îți poți șterge oricând contul.",
      ],
    },
    {
      title: "Cine suntem",
      paragrafe: [
        `Platforma este administrată de ${C.denumireFirma} ${C.formaJuridica}.`,
        `Ne poți contacta la: ${C.emailContact}.`,
      ],
    },
  ],
};

const FAQ: PaginaMobil = {
  title: "Întrebări frecvente",
  sections: [
    {
      title: "Cum mă găsesc angajatorii?",
      paragrafe: [
        "Completează-ți profilul și adaugă un CV. Angajatorii caută după competențe, experiență și locație, iar profilul tău apare în rezultate cu un scor de potrivire.",
      ],
    },
    {
      title: "Datele mele sunt private?",
      paragrafe: [
        "Emailul contului nu e vizibil angajatorilor. Conversațiile sunt private, doar între tine și angajator. Vezi Politica de confidențialitate pentru detalii.",
      ],
    },
    {
      title: "Ce înseamnă o „ofertă”?",
      paragrafe: [
        "Un angajator îți poate trimite o ofertă (post + salariu). O poți accepta, refuza sau trimite o contraofertă (alt salariu).",
      ],
    },
    {
      title: "Costă ceva?",
      paragrafe: [
        "Pentru candidați, folosirea platformei este gratuită. Eventualele servicii plătite se adresează angajatorilor și vor fi afișate clar înainte de plată.",
      ],
    },
    {
      title: "Cum îmi șterg contul?",
      paragrafe: [
        "Din Setări → Șterge contul. Ștergerea este definitivă și include profilul, CV-urile și mesajele.",
      ],
    },
  ],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let pagina: PaginaMobil | null = null;
  switch (slug) {
    case "termeni":
      pagina = dinLegalDoc(getTermeni("ro"));
      break;
    case "confidentialitate":
      pagina = dinLegalDoc(getConfidentialitate("ro"));
      break;
    case "despre":
      pagina = DESPRE;
      break;
    case "faq":
      pagina = FAQ;
      break;
  }
  if (!pagina) {
    return NextResponse.json({ error: "Pagină inexistentă." }, { status: 404 });
  }
  return NextResponse.json(pagina);
}
