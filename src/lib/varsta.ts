// Calculează vârsta (ani împliniți) dintr-o dată de naștere.
export function calculeazaVarsta(dataNasterii: Date): number {
  const azi = new Date();
  let ani = azi.getFullYear() - dataNasterii.getFullYear();
  const luna = azi.getMonth() - dataNasterii.getMonth();
  if (luna < 0 || (luna === 0 && azi.getDate() < dataNasterii.getDate())) {
    ani--;
  }
  return ani;
}

// Formatează o dată ca „yyyy-mm-dd" pentru un <input type="date">.
export function pentruInputData(d: Date | string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}
