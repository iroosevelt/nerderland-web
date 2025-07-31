// app/api/users/[username]/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { users, stories, boards } from "@db/schema";
import { eq, count } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

interface UserProfile {
  id: number;
  username: string;
  avatar_url: string | null;
  nerdy_points: number | null;
  level: number | null;
  created_at: Date | null;
  stats: {
    stories: number;
    boards: number;
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`user-profile:${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const { username } = await params;

    // Input validation
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Sanitize username
    const sanitizedUsername = username
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 20);
    if (sanitizedUsername !== username || sanitizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get user data
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
          nerdy_points: users.nerdy_points,
          level: users.level,
          created_at: users.created_at,
          wallet_address: users.wallet_address, // For ownership check
        })
        .from(users)
        .where(eq(users.username, sanitizedUsername))
        .limit(1);

      if (userResult.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const user = userResult[0];

      // Check if requester is the profile owner
      const isOwner = Boolean(
        sessionId && userWallet && userWallet === user.wallet_address
      );

      // Get content counts
      const [storiesCount, boardsCount] = await Promise.all([
        db
          .select({ count: count() })
          .from(stories)
          .where(eq(stories.user_id, user.id)),

        db
          .select({ count: count() })
          .from(boards)
          .where(eq(boards.user_id, user.id)),
      ]);

      // Create response with appropriate data based on ownership
      const profileData: UserProfile = {
        id: user.id,
        username: user.username || "Unknown",
        avatar_url: user.avatar_url || "/img/avatar/little_wea.png",
        nerdy_points: Math.max(0, user.nerdy_points || 0),
        level: Math.max(1, user.level || 1),
        created_at: user.created_at,
        stats: {
          stories: Math.max(0, storiesCount[0]?.count || 0),
          boards: Math.max(0, boardsCount[0]?.count || 0),
        },
      };

      const response = NextResponse.json({
        user: profileData,
        isOwner,
        meta: {
          timestamp: new Date().toISOString(),
          requestedBy: isOwner ? "owner" : "public",
        },
      });

      // Apply security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Cache headers
      if (isOwner) {
        response.headers.set("Cache-Control", "private, no-cache");
      } else {
        response.headers.set(
          "Cache-Control",
          "public, max-age=300, stale-while-revalidate=60"
        );
      }

      return response;
    } catch (dbError) {
      console.error("Database error in user profile API:", dbError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("User profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}
