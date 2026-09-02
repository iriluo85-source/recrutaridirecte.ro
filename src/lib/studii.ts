// Formatarea studiilor unui candidat pentru afișare (profil propriu, vedere angajator, CV).
// Etichetele nivelului/statusului vin din namespace-ul „common" (studii.nivel.* / studii.stare.*),
// ca să fie disponibile atât candidatului, cât și angajatorului.

export type StudiiFields = {
  studiiNivel: string | null;
  studiiSpecializare: string | null;
  studiiInstitutie: string | null;
  studiiAn: number | null;
  studiiStatus: string | null;
};

export function formatStudii(
  p: StudiiFields,
  tc: (key: string) => string
): { nivel: string; status: string | null; detalii: string } | null {
  if (!p.studiiNivel) return null;
  const detalii = [
    p.studiiSpecializare,
    p.studiiInstitutie,
    p.studiiAn ? String(p.studiiAn) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    nivel: tc("studii.nivel." + p.studiiNivel),
    status: p.studiiStatus ? tc("studii.stare." + p.studiiStatus) : null,
    detalii,
  };
}
