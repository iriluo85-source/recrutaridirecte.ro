import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role | null;
    emailVerificat?: boolean;
    isAdmin?: boolean;
    rememberMe?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role | null;
      emailVerificat: boolean;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role | null;
    emailVerificat: boolean;
    isAdmin: boolean;
    rememberMe?: boolean;
  }
}
