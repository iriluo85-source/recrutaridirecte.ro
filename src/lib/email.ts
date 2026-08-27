import nodemailer from "nodemailer";

// Escapează textul controlat de utilizator înainte de a-l pune în HTML-ul emailurilor,
// ca să prevină injecția de HTML/linkuri (phishing) în emailurile de notificare.
export function escapeHtml(input: string | null | undefined): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────────────────────
// Trimitere email. În PRODUCȚIE folosim Resend (API HTTP, port 443) fiindcă
// platformele cloud (Railway) blochează SMTP. LOCAL, dacă nu e Resend, cădem pe
// Gmail SMTP (merge de pe calculator).
//   RESEND_API_KEY  — cheia de la resend.com
//   RESEND_FROM     — adresa expeditor (ex: "Recrutare Directă <noreply@recrutaridirecte.ro>")
//   GMAIL_USER / GMAIL_APP_PASSWORD — fallback SMTP pentru dezvoltare locală
// ─────────────────────────────────────────────────────────────────────────────

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM || "Recrutare Directă <noreply@recrutaridirecte.ro>";

const smtpEnabled = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

// Adrese de test fictive (conturile de probă folosesc @test.ro / @example.com).
// Nu există cu adevărat, deci orice email către ele produce un "bounce".
const DOMENII_TEST = ["test.ro", "test.com", "example.com", "example.ro", "example.org", "example.net"];

function esteAdresaDeTest(to: string): boolean {
  const domain = to.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return true;
  if (DOMENII_TEST.includes(domain)) return true;
  return /\.(test|example|invalid|localhost)$/.test(domain);
}

const transporter = smtpEnabled
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;

async function trimitePrinResend(
  to: string,
  subject: string,
  html: string,
  replyTo?: string
): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [to],
        subject,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const detalii = await res.text().catch(() => "");
      console.error(`[email] Resend a răspuns ${res.status} pentru ${to}: ${detalii.slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] Resend a eșuat către ${to}:`, error);
    return false;
  }
}

// Întoarce true dacă emailul a fost trimis efectiv, false dacă a fost sărit
// (fără configurare / adresă de test) sau a eșuat.
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  if (esteAdresaDeTest(to)) {
    console.warn(`[email] Adresă de test (${to}) — sar peste "${subject}".`);
    return false;
  }

  // Preferăm Resend (merge din cloud). SMTP e doar fallback local.
  if (RESEND_API_KEY) {
    return trimitePrinResend(to, subject, html, replyTo);
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `Recrutare Directă <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        ...(replyTo ? { replyTo } : {}),
      });
      return true;
    } catch (error) {
      console.error(`[email] SMTP către ${to} a eșuat:`, error);
      return false;
    }
  }

  console.warn(`[email] Niciun transport configurat (RESEND_API_KEY / GMAIL_*) — nu trimit "${subject}" către ${to}.`);
  return false;
}
