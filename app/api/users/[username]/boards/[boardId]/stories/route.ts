// app/api/users/[username]/boards/[boardId]/stories/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { boards, users, stories, board_stories } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; boardId: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`board-stories:${clientIP}`, 30, 60000)) {
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

    const { username, boardId } = await params;
    const { searchParams } = new URL(req.url);

    // Parse pagination parameters
    const limit = Math.max(
      1,
      Math.min(50, parseInt(searchParams.get("limit") || "20"))
    );
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    // Validate inputs
    if (!username || !boardId) {
      return NextResponse.json(
        { error: "Username and board ID are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const boardIdNum = parseInt(boardId);
    if (isNaN(boardIdNum)) {
      return NextResponse.json(
        { error: "Invalid board ID" },
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

    try {
      // First, verify the board exists and belongs to the user
      const boardData = await db
        .select({
          id: boards.id,
          name: boards.name,
          is_public: boards.is_public,
          user_id: boards.user_id,
          user_username: users.username,
          user_wallet_address: users.wallet_address,
        })
        .from(boards)
        .leftJoin(users, eq(boards.user_id, users.id))
        .where(
          and(eq(boards.id, boardIdNum), eq(users.username, sanitizedUsername))
        )
        .limit(1);

      if (boardData.length === 0) {
        return NextResponse.json(
          { error: "Board not found or doesn't belong to this user" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const board = boardData[0];

      // Check if requester is the board owner
      const isOwner = Boolean(
        sessionId && userWallet && userWallet === board.user_wallet_address
      );

      // Check if board is public or if user is owner
      if (!board.is_public && !isOwner) {
        return NextResponse.json(
          { error: "This board is private" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Get stories for this board
      const boardStories = await db
        .select({
          story_id: board_stories.story_id,
          story_title: stories.title,
          story_content: stories.content,
          story_media_url: stories.media_url,
          story_slug: stories.slug,
          story_views: stories.views,
          story_created_at: stories.created_at,
          story_user_id: stories.user_id,
          user_username: users.username,
          user_avatar_url: users.avatar_url,
          board_story_created_at: board_stories.created_at,
        })
        .from(board_stories)
        .leftJoin(stories, eq(board_stories.story_id, stories.id))
        .leftJoin(users, eq(stories.user_id, users.id))
        .where(eq(board_stories.board_id, boardIdNum))
        .orderBy(desc(board_stories.created_at))
        .limit(limit)
        .offset(offset);

      // Format the stories
      const formattedStories = boardStories
        .filter(
          (story) => story.story_id != null && story.story_user_id != null
        )
        .map((story) => ({
          id: story.story_id!,
          title: story.story_title || "Untitled",
          content: story.story_content || "",
          media_url: story.story_media_url,
          slug: story.story_slug,
          views: story.story_views || 0,
          created_at:
            story.story_created_at?.toISOString() || new Date().toISOString(),
          added_to_board_at:
            story.board_story_created_at?.toISOString() ||
            new Date().toISOString(),
          user: {
            id: story.story_user_id!,
            username: story.user_username || "Unknown",
            avatar_url: story.user_avatar_url || "/img/avatar/little_wea.png",
          },
        }));

      const response = NextResponse.json({
        board: {
          id: board.id,
          name: board.name,
          is_public: board.is_public,
          user: {
            username: board.user_username,
          },
        },
        stories: formattedStories,
        pagination: {
          limit,
          offset,
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

      return response;
    } catch (dbError) {
      console.error("Database error fetching board stories:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch board stories" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/users/[username]/boards/[boardId]/stories:",
      error
    );
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
