// app/api/stories/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { stories, users, boards, board_stories } from "@db/schema";
import { eq } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`story-get:${clientIP}`, 30, 60000)) {
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

    // Validate authentication for editing
    if (!sessionId || !userWallet) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { id } = await params;

    // Validate story ID
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get user ID from wallet address
      const currentUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wallet_address, userWallet))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const userId = currentUser[0].id;

      // Get the story with user details
      const storyData = await db
        .select({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          slug: stories.slug,
          user_id: stories.user_id,
          created_at: stories.created_at,
          views: stories.views,
        })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (storyData.length === 0) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const story = storyData[0];

      // Check if user is the story owner
      if (story.user_id !== userId) {
        return NextResponse.json(
          { error: "You can only edit your own stories" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Get story boards
      const storyBoards = await db
        .select({
          board_id: board_stories.board_id,
          board_name: boards.name,
        })
        .from(board_stories)
        .innerJoin(boards, eq(board_stories.board_id, boards.id))
        .where(eq(board_stories.story_id, storyId));

      const response = NextResponse.json(
        {
          id: story.id,
          title: story.title,
          content: story.content,
          media_url: story.media_url,
          slug: story.slug,
          created_at: story.created_at?.toISOString(),
          views: story.views,
          boards: storyBoards.map((sb) => ({
            id: sb.board_id,
            name: sb.board_name,
          })),
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error fetching story:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch story" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Unexpected error in GET /api/stories/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`story-delete:${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many delete requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Validate authentication
    if (!sessionId || !userWallet) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { id } = await params;

    // Validate story ID
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get user ID from wallet address
      const currentUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wallet_address, userWallet))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const userId = currentUser[0].id;

      // Verify the story exists and belongs to the user
      const storyData = await db
        .select({
          id: stories.id,
          user_id: stories.user_id,
          title: stories.title,
        })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (storyData.length === 0) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const story = storyData[0];

      // Check if user is the story owner
      if (story.user_id !== userId) {
        return NextResponse.json(
          { error: "You can only delete your own stories" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Delete the story
      await db.delete(stories).where(eq(stories.id, storyId));

      const response = NextResponse.json(
        {
          success: true,
          message: "Story deleted successfully",
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error deleting story:", dbError);
      return NextResponse.json(
        { error: "Failed to delete story" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in DELETE /api/stories/[id]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`story-update:${clientIP}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Too many update requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    // Validate authentication
    if (!sessionId || !userWallet) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { id } = await params;
    const body = await req.json();

    // Validate story ID
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return NextResponse.json(
        { error: "Invalid story ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate required fields
    const { title, body: content, thumbnailUrl, boards: selectedBoards } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get user ID from wallet address
      const currentUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.wallet_address, userWallet))
        .limit(1);

      if (currentUser.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const userId = currentUser[0].id;

      // Verify the story exists and belongs to the user
      const existingStory = await db
        .select({
          id: stories.id,
          user_id: stories.user_id,
          slug: stories.slug,
        })
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

      if (existingStory.length === 0) {
        return NextResponse.json(
          { error: "Story not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const story = existingStory[0];

      // Check if user is the story owner
      if (story.user_id !== userId) {
        return NextResponse.json(
          { error: "You can only edit your own stories" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Update the story
      const updatedStoryData = await db
        .update(stories)
        .set({
          title,
          content,
          media_url: thumbnailUrl || null,
          updated_at: new Date(),
        })
        .where(eq(stories.id, storyId))
        .returning({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          slug: stories.slug,
          created_at: stories.created_at,
          updated_at: stories.updated_at,
        });

      if (updatedStoryData.length === 0) {
        return NextResponse.json(
          { error: "Failed to update story" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }

      const updatedStory = updatedStoryData[0];

      // Handle boards - first remove existing associations
      if (selectedBoards && Array.isArray(selectedBoards)) {
        await db
          .delete(board_stories)
          .where(eq(board_stories.story_id, storyId));

        // Add new board associations
        if (selectedBoards.length > 0) {
          const boardAssociations = selectedBoards.map((boardId: string) => ({
            story_id: storyId,
            board_id: parseInt(boardId),
            created_at: new Date(),
          }));

          await db.insert(board_stories).values(boardAssociations);
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          story: {
            id: updatedStory.id,
            title: updatedStory.title,
            content: updatedStory.content,
            media_url: updatedStory.media_url,
            slug: updatedStory.slug,
            created_at: updatedStory.created_at?.toISOString(),
            updated_at: updatedStory.updated_at?.toISOString(),
          },
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error updating story:", dbError);
      return NextResponse.json(
        { error: "Failed to update story" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Unexpected error in PUT /api/stories/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods for this endpoint
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, PUT, DELETE", ...getSecurityHeaders() } }
  );
}