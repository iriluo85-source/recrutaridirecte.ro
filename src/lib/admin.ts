// Emailuri desemnate ca admin prin configurare (variabila de mediu ADMIN_EMAILS,
// separate prin virgulă). Un cont cu unul dintre aceste emailuri devine admin
// automat la logare — pe lângă flagul isAdmin din baza de date. Astfel, adminul
// e definit prin config (util și la deploy, unde baza de date poate fi nouă).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function esteAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
