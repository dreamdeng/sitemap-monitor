/**
 * Next.js Middleware
 * Handles authentication for protected routes
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "~/lib/auth";

// Protected route patterns
const protectedRoutes = ["/dashboard", "/websites", "/findings", "/settings"];

// Public routes that don't require authentication
const publicRoutes = ["/login", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check authentication
  const cookies = request.headers.get("cookie");
  const authenticated = isAuthenticated(cookies ?? undefined);

  if (!authenticated) {
    // Redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
};
