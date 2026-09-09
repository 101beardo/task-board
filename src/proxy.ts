import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

/**
 * Optimistic redirect only: this checks for the session cookie's presence, not
 * its validity. Every page and route handler still verifies the session on the
 * server (see src/server/session.ts).
 */
export function proxy(request: NextRequest) {
  const hasSession = getSessionCookie(request) != null;
  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (!hasSession && !isAuthRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/b/:path*", "/sign-in", "/sign-up"],
};
