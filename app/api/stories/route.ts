// app/api/stories/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { users, stories, board_stories, boards } from "@db/schema";
import { eq, desc, inArray } from "drizzle-orm";
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

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`stories-feed:${clientIP}`, 50, 60000)) {
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

    try {
      // Get all stories from all users with user information
      const allStories = await db
        .select({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          views: stories.views,
          created_at: stories.created_at,
          slug: stories.slug,
          user_id: stories.user_id,
          user_username: users.username,
          user_avatar_url: users.avatar_url,
        })
        .from(stories)
        .leftJoin(users, eq(stories.user_id, users.id))
        .orderBy(desc(stories.created_at))
        .limit(limit)
        .offset(finalOffset);

      // Format response to match the expected format
      const formattedStories: StoryResponse[] = allStories
        .filter((story) => story.user_id != null) // Filter out stories without valid user IDs
        .map((story) => ({
          id: story.id,
          title: story.title,
          content: story.content,
          media_url: story.media_url,
          views: Math.max(0, story.views || 0),
          created_at:
            story.created_at?.toISOString() || new Date().toISOString(),
          slug: story.slug,
          user: {
            id: story.user_id!,
            username: story.user_username || "Unknown",
            avatar_url: story.user_avatar_url || "/img/avatar/little_wea.png",
          },
        }));

      // Get total count for pagination (only if page parameter is used)
      let totalCount = undefined;
      let totalPages = undefined;

      if (searchParams.get("page")) {
        const countResult = await db.select().from(stories);
        totalCount = countResult.length;
        totalPages = Math.ceil(totalCount / limit);
      }

      const response = NextResponse.json({
        stories: formattedStories,
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
          requestedBy: sessionId ? "authenticated" : "public",
          type: "feed",
        },
      });

      // Apply security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Cache headers for general feed
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=60"
      );

      response.headers.set(
        "X-Total-Stories",
        formattedStories.length.toString()
      );

      return response;
    } catch (dbError) {
      console.error("Database error in stories feed API:", dbError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Stories feed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";

    // Rate limiting for story creation
    if (!RateLimiter.check(`create-story:${clientIP}`, 5, 300000)) {
      // 5 requests per 5 minutes
      return NextResponse.json(
        { error: "Too many story creation requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "300",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const {
      title,
      body: content,
      thumbnailUrl,
      boards: selectedBoards, // Array of board IDs as strings
      walletAddress,
      slug,
    } = body;

    // Validate required fields
    if (!title || !content || !walletAddress) {
      return NextResponse.json(
        { error: "Title, content, and wallet address are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate content length
    if (title.length > 200 || content.length > 50000) {
      return NextResponse.json(
        { error: "Title or content too long" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate boards array if provided
    if (selectedBoards && !Array.isArray(selectedBoards)) {
      return NextResponse.json(
        { error: "Boards must be an array of board IDs" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get user by wallet address
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          wallet_address: users.wallet_address,
          avatar_url: users.avatar_url,
        })
        .from(users)
        .where(eq(users.wallet_address, walletAddress))
        .limit(1);

      if (userResult.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const user = userResult[0];

      // Generate unique slug if not provided
      let finalSlug = slug;
      if (!finalSlug) {
        finalSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }

      // Ensure slug is unique
      const existingStory = await db
        .select({ id: stories.id })
        .from(stories)
        .where(eq(stories.slug, finalSlug))
        .limit(1);

      if (existingStory.length > 0) {
        finalSlug = `${finalSlug}-${Date.now()}`;
      }

      // Validate selected boards belong to user or are public
      let validatedBoards: number[] = [];
      if (selectedBoards && selectedBoards.length > 0) {
        const boardIds = selectedBoards
          .map((id: string) => parseInt(id))
          .filter((id: number) => !isNaN(id));

        if (boardIds.length > 0) {
          const userBoards = await db
            .select({
              id: boards.id,
              user_id: boards.user_id,
              is_public: boards.is_public,
            })
            .from(boards)
            .where(inArray(boards.id, boardIds));

          // Filter boards that the user owns or are public (for posting)
          validatedBoards = userBoards
            .filter((board) => board.user_id === user.id || board.is_public)
            .map((board) => board.id);
        }
      }

      // Create the story
      const newStory = await db
        .insert(stories)
        .values({
          title: title.trim(),
          content: content.trim(),
          media_url: thumbnailUrl || null,
          slug: finalSlug,
          user_id: user.id,
          views: 0,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          slug: stories.slug,
          views: stories.views,
          created_at: stories.created_at,
        });

      if (newStory.length === 0) {
        throw new Error("Failed to create story");
      }

      const createdStory = newStory[0];

      // Add story to validated boards
      if (validatedBoards.length > 0) {
        try {
          const boardStoryInserts = validatedBoards.map((boardId) => ({
            board_id: boardId,
            story_id: createdStory.id,
            created_at: new Date(),
          }));

          await db.insert(board_stories).values(boardStoryInserts);
        } catch (boardError) {
          console.error("Error linking story to boards:", boardError);
          // Don't fail the story creation if board linking fails
        }
      }

      // Format response
      const response = NextResponse.json({
        success: true,
        story: {
          id: createdStory.id,
          title: createdStory.title,
          content: createdStory.content,
          media_url: createdStory.media_url,
          slug: createdStory.slug,
          views: createdStory.views,
          created_at: createdStory.created_at?.toISOString(),
          user: {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url || "/img/avatar/little_wea.png",
          },
        },
        boards_added: validatedBoards.length,
        message: "Story created successfully",
      });

      // Apply security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (dbError) {
      console.error("Database error creating story:", dbError);
      return NextResponse.json(
        { error: "Failed to create story" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Story creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, POST", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, POST", ...getSecurityHeaders() } }
  );
}
