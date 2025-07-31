// app/api/users/[username]/stories/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { users, stories } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

type StoryResponse = {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  views: number;
  created_at: string;
  slug: string | null;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
};

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
    if (!RateLimiter.check(`user-stories:${clientIP}`, 50, 60000)) {
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
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get("limit") || "20"))
    );
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

    // Calculate offset from page if provided
    const finalOffset = searchParams.get("page") ? (page - 1) * limit : offset;

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
      // First, get the user to validate they exist
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
          wallet_address: users.wallet_address,
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

      // Get user's stories
      const userStories = await db
        .select({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          views: stories.views,
          created_at: stories.created_at,
          slug: stories.slug,
        })
        .from(stories)
        .where(eq(stories.user_id, user.id))
        .orderBy(desc(stories.created_at))
        .limit(limit)
        .offset(finalOffset);

      // Format response
      const formattedStories: StoryResponse[] = userStories.map((story) => ({
        id: story.id,
        title: story.title,
        content: story.content,
        media_url: story.media_url,
        views: Math.max(0, story.views || 0),
        created_at: story.created_at?.toISOString() || new Date().toISOString(),
        slug: story.slug,
        user: {
          id: user.id,
          username: user.username || "Unknown",
          avatar_url: user.avatar_url || "/img/avatar/little_wea.png",
        },
      }));

      // Get total count for pagination (only if page parameter is used)
      let totalCount = undefined;
      let totalPages = undefined;

      if (searchParams.get("page")) {
        const countResult = await db
          .select()
          .from(stories)
          .where(eq(stories.user_id, user.id));

        totalCount = countResult.length;
        totalPages = Math.ceil(totalCount / limit);
      }

      const response = NextResponse.json({
        stories: formattedStories,
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url || "/img/avatar/little_wea.png",
        },
        pagination: searchParams.get("page")
          ? {
              page,
              limit,
              total: totalCount,
              totalPages,
              hasNext: page < (totalPages || 1),
              hasPrev: page > 1,
            }
          : {
              limit,
              offset: finalOffset,
              returned: formattedStories.length,
            },
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
        response.headers.set("Cache-Control", "private, max-age=60");
      } else {
        response.headers.set(
          "Cache-Control",
          "public, max-age=300, stale-while-revalidate=60"
        );
      }

      response.headers.set(
        "X-Total-Stories",
        formattedStories.length.toString()
      );

      return response;
    } catch (dbError) {
      console.error("Database error in user stories API:", dbError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("User stories API error:", error);
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
