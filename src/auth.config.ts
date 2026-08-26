import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/generated/prisma/client";

export const authConfig = {
  // Acceptă cererile de autentificare și de pe alte host-uri decât localhost
  // (ex: IP-ul din rețea 172.20.10.2 când testezi de pe telefon, sau domeniul de producție).
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.emailVerificat = user.emailVerificat ?? false;
        token.isAdmin = user.isAdmin ?? false;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.role = token.role as Role | null;
      session.user.emailVerificat = Boolean(token.emailVerificat);
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
} satisfies NextAuthConfig;
