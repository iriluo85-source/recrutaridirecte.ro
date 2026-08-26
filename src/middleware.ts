import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isAdmin = req.auth?.user?.isAdmin;

  const isCandidatRoute = nextUrl.pathname.startsWith("/candidat");
  const isAngajatorRoute = nextUrl.pathname.startsWith("/angajator");
  const isSetariRoute = nextUrl.pathname.startsWith("/setari");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  if ((isCandidatRoute || isAngajatorRoute || isSetariRoute || isAdminRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  if ((isCandidatRoute || isAngajatorRoute) && isLoggedIn && !role) {
    return NextResponse.redirect(new URL("/alege-rol", nextUrl));
  }
  if (isCandidatRoute && role !== "CANDIDATE") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  if (isAngajatorRoute && role !== "EMPLOYER") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
});

export const config = {
  matcher: ["/candidat/:path*", "/angajator/:path*", "/setari/:path*", "/admin/:path*"],
};
