// app/api/username/check/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { getSecurityHeaders } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {

    // No rate limiting for username checks - frontend debouncing handles spam prevention

    const body = await req.json();
    const { username } = body;

    // Validate input
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { available: false, error: "Username is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Sanitize and validate username format
    const sanitizedUsername = username.trim().toLowerCase();

    // Basic format validation
    if (sanitizedUsername.length < 2 || sanitizedUsername.length > 20) {
      return NextResponse.json(
        {
          available: false,
          error: "Username must be between 2 and 20 characters",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(sanitizedUsername)) {
      return NextResponse.json(
        {
          available: false,
          error: "Username can only contain letters, numbers, and underscores",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (sanitizedUsername.startsWith("_") || sanitizedUsername.endsWith("_")) {
      return NextResponse.json(
        {
          available: false,
          error: "Username cannot start or end with an underscore",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Reserved usernames (add more as needed)
    const reservedUsernames = [
      "admin",
      "api",
      "www",
      "mail",
      "ftp",
      "localhost",
      "root",
      "support",
      "help",
      "about",
      "contact",
      "privacy",
      "terms",
      "login",
      "signup",
      "register",
      "dashboard",
      "profile",
      "settings",
      "upload",
      "download",
      "search",
      "explore",
      "trending",
      "popular",
      "feed",
      "home",
      "index",
      "assets",
      "static",
      "public",
      "cdn",
      "blog",
      "news",
      "docs",
      "wiki",
    ];

    if (reservedUsernames.includes(sanitizedUsername)) {
      return NextResponse.json(
        {
          available: false,
          error: "This username is reserved",
        },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Check if username exists in database
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, sanitizedUsername))
        .limit(1);

      const isAvailable = existingUser.length === 0;

      const response = NextResponse.json(
        {
          available: isAvailable,
          username: sanitizedUsername,
          message: isAvailable
            ? "Username is available"
            : "Username is already taken",
        },
        {
          status: 200,
          headers: getSecurityHeaders(),
        }
      );

      // Cache headers for username checks
      response.headers.set(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );

      return response;
    } catch (dbError) {
      console.error("Database error in username check:", dbError);
      return NextResponse.json(
        {
          available: false,
          error: "Unable to check username availability",
        },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Username check API error:", error);
    return NextResponse.json(
      {
        available: false,
        error: "Internal server error",
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}
