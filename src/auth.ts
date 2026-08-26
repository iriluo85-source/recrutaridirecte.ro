import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { encode as defaultEncode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { esteAdminEmail } from "@/lib/admin";

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
// Cerem lungime plauzibilă (nu doar „non-gol"), ca să nu apară butonul Microsoft
// când în .env sunt doar valori placeholder (ex. „x"). Credențialele reale sunt lungi.
const microsoftEnabled =
  (process.env.MICROSOFT_CLIENT_ID?.length ?? 0) > 10 &&
  (process.env.MICROSOFT_CLIENT_SECRET?.length ?? 0) > 10;

const OAUTH_PROVIDERS = ["google", "microsoft-entra-id"];

const SESIUNE_LUNGA_SECUNDE = 60 * 60 * 24 * 30; // 30 zile ("ține-mă minte" bifat)
const SESIUNE_SCURTA_SECUNDE = 60 * 60 * 24; // 1 zi ("ține-mă minte" debifat)

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt", maxAge: SESIUNE_LUNGA_SECUNDE },
  jwt: {
    encode: async (params) => {
      const maxAge = params.token?.rememberMe === false ? SESIUNE_SCURTA_SECUNDE : SESIUNE_LUNGA_SECUNDE;
      return defaultEncode({ ...params, maxAge });
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        remember: {},
      },
      authorize: async (credentials) => {
        const emailRaw = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!emailRaw || !password) return null;
        // normalizăm emailul (telefoanele pun majusculă/spații) — căutarea e case-insensitive
        const email = emailRaw.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerificat: user.emailVerificat,
          isAdmin: user.isAdmin,
          rememberMe: credentials?.remember === "true",
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
    ...(microsoftEnabled
      ? [
          MicrosoftEntraID({
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt: async ({ token, user, account, trigger, session }) => {
      if (trigger === "update" && session?.user) {
        if (session.user.role) token.role = session.user.role;
        if (typeof session.user.emailVerificat === "boolean") {
          token.emailVerificat = session.user.emailVerificat;
        }
        if (session.user.email) token.email = session.user.email;
        return token;
      }
      if (account?.provider && OAUTH_PROVIDERS.includes(account.provider)) {
        // normalizăm emailul (lowercase) ca la înregistrarea cu parolă,
        // ca să nu creăm un cont duplicat dacă providerul întoarce alt case
        const email = token.email?.toLowerCase();
        if (email) {
          let dbUser = await prisma.user.findUnique({ where: { email } });
          if (!dbUser) {
            dbUser = await prisma.user.create({ data: { email, role: null, emailVerificat: true } });
          } else if (!dbUser.emailVerificat) {
            // dacă Google/Microsoft a confirmat deja emailul, îl considerăm verificat și la noi
            dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { emailVerificat: true } });
          }
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.emailVerificat = dbUser.emailVerificat;
          token.isAdmin = dbUser.isAdmin || esteAdminEmail(dbUser.email);
        }
        return token;
      }
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.emailVerificat = user.emailVerificat ?? false;
        token.isAdmin = (user.isAdmin ?? false) || esteAdminEmail(user.email);
        token.rememberMe = user.rememberMe ?? true;
      }
      return token;
    },
  },
});

export { googleEnabled, microsoftEnabled };
