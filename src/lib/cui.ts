// Validare CUI/CIF românesc (cu cifra de control oficială ANAF).
// Acceptă cu sau fără prefix „RO" și spații; verifică formatul + cifra de control,
// ca să nu se poată introduce numere inventate la înregistrarea unui angajator.

// Normalizează: scoate „RO", spațiile și punctele, majuscule.
export function normalizeazaCui(input: string): string {
  return input.trim().toUpperCase().replace(/^RO/, "").replace(/[\s.]/g, "");
}

export function valideazaCui(input: string): boolean {
  const cui = normalizeazaCui(input);
  if (!/^\d{2,10}$/.test(cui)) return false;

  const control = Number(cui[cui.length - 1]);
  const numar = cui.slice(0, -1).padStart(9, "0"); // aliniere la cheia de 9 cifre
  const cheie = "753217532";

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    suma += Number(numar[i]) * Number(cheie[i]);
  }
  let calc = (suma * 10) % 11;
  if (calc === 10) calc = 0;

  return calc === control;
}
