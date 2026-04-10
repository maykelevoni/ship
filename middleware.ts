import authConfig from "@/auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/landing") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/docs") ||
    pathname.startsWith("/blog") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/webhooks/polar");

  // Never redirect API routes to HTML pages — let them handle auth themselves
  if (pathname.startsWith("/api/")) return;

  if (!isLoggedIn) {
    if (pathname === "/") {
      return Response.redirect(new URL("/landing", req.url));
    }
    if (!isPublic) {
      return Response.redirect(new URL("/login", req.url));
    }
  }

  // Onboarding guard is handled in app/(dashboard)/layout.tsx using the full
  // auth() which reads onboardingDone fresh from DB — the lite middleware config
  // has no JWT callback so the cookie value lags behind DB writes.
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
