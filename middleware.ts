import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedPaths = [
    "/dashboard",
    "/matches",
    "/profile",
    "/admin",
    "/notifications",
    "/support",
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected) {
    const padlinkSession = request.cookies.get("padlink_session")?.value;

    let isAuthenticated = false;
    let userRole = "USER";

    // 1. Try PadLink Session (Privy)
    if (padlinkSession) {
      try {
        const { payload } = await jwtVerify(padlinkSession, key);
        isAuthenticated = true;
        userRole = (payload.role as string) || "USER";
      } catch {
        // Invalid token
      }
    }

    // 2. Try NextAuth Session (Legacy)
    if (!isAuthenticated) {
        const nextAuthToken = await getToken({ req: request, secret: SECRET_KEY });
        if (nextAuthToken) {
            isAuthenticated = true;
            userRole = (nextAuthToken.role as string) || "USER";
        }
    }

    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based access control
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      const url = request.nextUrl.clone();
      url.pathname = "/access-denied";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/matches/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/notifications/:path*",
    "/support/:path*",
  ],
};
