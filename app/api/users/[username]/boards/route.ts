// app/api/users/[username]/boards/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { users, boards } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

type BoardResponse = {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  member_count: number | null;
  created_at: string;
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
    if (!RateLimiter.check(`user-boards:${clientIP}`, 50, 60000)) {
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
    if (sanitizedUsername !== username || sanitizedUsername.length < 2) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

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

    // Get user's boards
    const userBoards = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        avatar_url: boards.avatar_url,
        is_public: boards.is_public,
        member_count: boards.member_count,
        created_at: boards.created_at,
      })
      .from(boards)
      .where(eq(boards.user_id, user.id))
      .orderBy(desc(boards.created_at))
      .limit(limit)
      .offset(finalOffset);

    // Filter boards based on visibility (only show public boards unless owner)
    const visibleBoards = isOwner
      ? userBoards
      : userBoards.filter((board) => board.is_public);

    // Format response
    const formattedBoards: BoardResponse[] = visibleBoards.map((board) => ({
      id: board.id,
      name: board.name,
      description: board.description,
      avatar_url: board.avatar_url,
      is_public: board.is_public,
      member_count: Math.max(1, board.member_count || 1),
      created_at: board.created_at?.toISOString() || new Date().toISOString(),
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
        .from(boards)
        .where(eq(boards.user_id, user.id));

      const visibleCount = isOwner
        ? countResult.length
        : countResult.filter((board) => board.is_public).length;

      totalCount = visibleCount;
      totalPages = Math.ceil(totalCount / limit);
    }

    const response = NextResponse.json({
      boards: formattedBoards,
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
            returned: formattedBoards.length,
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

    response.headers.set("X-Total-Boards", formattedBoards.length.toString());

    return response;
  } catch (error) {
    console.error("User boards API error:", error);
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
