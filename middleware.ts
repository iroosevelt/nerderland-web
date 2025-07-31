// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";

const RATE_LIMITS = {
  api: { requests: 100, window: 15 * 60 * 1000 },
  upload: { requests: 10, window: 60 * 60 * 1000 },
  auth: { requests: 5, window: 5 * 60 * 1000 },
  username: { requests: 20, window: 5 * 60 * 1000 },
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Fixed: Use proper way to get client IP
  const clientIP =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Security: Block suspicious requests
  if (pathname.includes("..") || pathname.includes("<script>")) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitKey = `${clientIP}:${pathname}`;
    let limit = RATE_LIMITS.api;

    if (pathname.includes("upload")) {
      limit = RATE_LIMITS.upload;
    } else if (pathname.includes("auth") || pathname.includes("user")) {
      limit = RATE_LIMITS.auth;
    } else if (pathname.includes("username/check")) {
      limit = RATE_LIMITS.username;
    }

    if (!RateLimiter.check(rateLimitKey, limit.requests, limit.window)) {
      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(limit.window / 1000).toString(),
          ...getSecurityHeaders(),
        },
      });
    }
  }

  const walletAddress = request.cookies.get("wallet-address")?.value;
  const sessionId = request.cookies.get("session-id")?.value;
  const currentUsername = request.cookies.get("username")?.value;

  if (walletAddress && !sessionId) {
    const response = NextResponse.next();
    response.cookies.delete("wallet-address");
    response.cookies.delete("username");
    return response;
  }

  const requestHeaders = new Headers(request.headers);

  if (walletAddress && sessionId) {
    requestHeaders.set("x-user-wallet", walletAddress);
    requestHeaders.set("x-session-id", sessionId);
  }

  if (currentUsername) {
    requestHeaders.set("x-current-user", currentUsername);
  }

  const usernameMatch = pathname.match(/^\/([^\/]+)(?:\/.*)?$/);

  if (usernameMatch) {
    const urlUsername = usernameMatch[1];
    const skipRoutes = [
      "_next",
      "api",
      "favicon.ico",
      "robots.txt",
      "sitemap.xml",
      "upload",
      "setup-profile",
      "login",
      "register",
      "admin",
    ];

    const isSpecialRoute = skipRoutes.some(
      (route) =>
        urlUsername.startsWith(route) ||
        urlUsername.includes(".") ||
        pathname.startsWith(`/${route}`)
    );

    if (!isSpecialRoute) {
      requestHeaders.set("x-url-username", urlUsername);
      const isOwner = currentUsername === urlUsername && !!sessionId;
      requestHeaders.set("x-is-owner", isOwner.toString());
    }
  }

  requestHeaders.set("x-request-time", new Date().toISOString());
  requestHeaders.set("x-client-ip", clientIP);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
