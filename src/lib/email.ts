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

const emailEnabled = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

// Adrese de test fictive (conturile de probă folosesc @test.ro / @example.com).
// Nu există cu adevărat, deci orice email către ele produce un "bounce" în Gmail.
// Le sărim: le logăm, dar nu le trimitem real.
const DOMENII_TEST = ["test.ro", "test.com", "example.com", "example.ro", "example.org", "example.net"];

function esteAdresaDeTest(to: string): boolean {
  const domain = to.split("@")[1]?.toLowerCase() ?? "";
  if (!domain) return true;
  if (DOMENII_TEST.includes(domain)) return true;
  // TLD-uri rezervate pentru testare (RFC 2606/6761)
  return /\.(test|example|invalid|localhost)$/.test(domain);
}

const transporter = emailEnabled
  ? nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  : null;

// Întoarce true dacă emailul a fost trimis efectiv, false dacă a fost sărit
// (fără credențiale / adresă de test) sau a eșuat. Apelanții „fire-and-forget"
// (notificări) pot ignora rezultatul; formularul de contact îl verifică.
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
  if (!transporter) {
    console.warn(`[email] GMAIL_USER/GMAIL_APP_PASSWORD nu sunt setate — nu trimit "${subject}" către ${to}.`);
    return false;
  }

  if (esteAdresaDeTest(to)) {
    console.warn(`[email] Adresă de test (${to}) — sar peste "${subject}", nu o trimit real (ar produce bounce).`);
    return false;
  }

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
    console.error(`[email] Trimiterea către ${to} a eșuat:`, error);
    return false;
  }
}
