// Sursă unică de adevăr pentru domeniile de recrutare — folosită de homepage,
// pagina de căutare și emailurile digest. Un "domeniu" e o etichetă + o listă de
// skill-uri; algoritmul de matching (src/lib/matching.ts) primește skill-urile ca
// `criterii.skills`.

export type Domeniu = {
  slug: string;
  emoji: string;
  nameKey: string; // cheie i18n: home.categories.<nameKey>
  skills: string[];
};

export const DOMENII: Domeniu[] = [
  { slug: "it", emoji: "💻", nameKey: "it", skills: ["React", "Node.js", "SQL", "Python", "Java", "TypeScript"] },
  { slug: "contabilitate", emoji: "📊", nameKey: "accounting", skills: ["Contabilitate", "Excel", "SAP", "Fiscalitate"] },
  { slug: "vanzari", emoji: "📈", nameKey: "sales", skills: ["Vânzări", "Marketing", "CRM", "Negociere"] },
  { slug: "constructii", emoji: "🏗️", nameKey: "construction", skills: ["Construcții", "AutoCAD", "Instalații"] },
  { slug: "horeca", emoji: "🍽️", nameKey: "horeca", skills: ["Ospătar", "Bucătar", "Barista", "HoReCa"] },
  { slug: "logistica", emoji: "🚚", nameKey: "logistics", skills: ["Logistică", "Transport", "Șofer", "Depozit"] },
  { slug: "educatie", emoji: "🎓", nameKey: "education", skills: ["Predare", "Educație", "Meditații"] },
  { slug: "sanatate", emoji: "🏥", nameKey: "health", skills: ["Asistent medical", "Îngrijire", "Farmacie"] },
  { slug: "curatenie", emoji: "🧹", nameKey: "cleaning", skills: ["Curățenie", "Menaj", "Igienizare"] },
  { slug: "sport", emoji: "🏋️", nameKey: "sport", skills: ["Antrenor", "Fitness", "Sport"] },
];

export function domeniuDupaSlug(slug?: string | null): Domeniu | undefined {
  if (!slug) return undefined;
  return DOMENII.find((d) => d.slug === slug);
}
