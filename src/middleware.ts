import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/trade",
  "/markets",
  "/positions",
  "/history",
  "/bankroll",
  "/bots",
  "/earnings",
  "/academy",
];

// Routes that should NOT be accessible when authenticated
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie
  const hasSession = request.cookies.has("deriv_session");

  // Redirect authenticated users away from auth pages → dashboard
  if (hasSession && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected routes → login
  if (
    !hasSession &&
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    )
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/trade/:path*",
    "/markets/:path*",
    "/positions/:path*",
    "/history/:path*",
    "/bankroll/:path*",
    "/bots/:path*",
    "/earnings/:path*",
    "/academy/:path*",
    "/login",
    "/register",
  ],
};
