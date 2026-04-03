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

  if (!isLoggedIn) {
    if (pathname === "/") {
      return Response.redirect(new URL("/landing", req.url));
    }
    if (!isPublic) {
      return Response.redirect(new URL("/login", req.url));
    }
  }

  // If logged in but onboarding not done, redirect to /onboarding
  if (isLoggedIn && !pathname.startsWith("/onboarding") && !isPublic) {
    const onboardingDone = req.auth?.user?.onboardingDone;
    if (!onboardingDone) {
      return Response.redirect(new URL("/onboarding", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)",
  ],
};
