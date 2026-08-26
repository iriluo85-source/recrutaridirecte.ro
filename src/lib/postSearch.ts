// Construiește linkul către pagina de căutare candidați, precompletată cu
// criteriile unui post. Pagina /angajator/cautare citește exact acești parametri.
type PostCriterii = {
  domeniuSlug: string | null;
  skills: string | null;
  locatie: string | null;
  experientaMin: number | null;
  experientaMax: number | null;
  salariuMin: number | null;
  salariuMax: number | null;
};

export function linkCautarePost(p: PostCriterii): string {
  const qs = new URLSearchParams();
  if (p.domeniuSlug) qs.set("domeniu", p.domeniuSlug);
  if (p.skills) qs.set("skills", p.skills);
  if (p.locatie) qs.set("locatie", p.locatie);
  if (p.experientaMin != null) qs.set("experientaMin", String(p.experientaMin));
  if (p.experientaMax != null) qs.set("experientaMax", String(p.experientaMax));
  if (p.salariuMin != null) qs.set("bugetMin", String(p.salariuMin));
  if (p.salariuMax != null) qs.set("bugetMax", String(p.salariuMax));
  const s = qs.toString();
  return s ? `/angajator/cautare?${s}` : "/angajator/cautare";
}
