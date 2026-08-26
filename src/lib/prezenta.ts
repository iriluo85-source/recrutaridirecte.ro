// Un utilizator e considerat „activ acum" dacă a avut activitate în ultimele 2 minute.
// „Activitatea" se actualizează la fiecare heartbeat (poll-ul clopoțelului / deschiderea unei conversații).
export const PRAG_ACTIV_MS = 2 * 60 * 1000;

export function esteActiv(ultimaActivitate: Date | string | null | undefined): boolean {
  if (!ultimaActivitate) return false;
  return Date.now() - new Date(ultimaActivitate).getTime() < PRAG_ACTIV_MS;
}
