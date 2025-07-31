// app/api/users/[username]/boards/[boardId]/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { boards, users, board_members } from "@db/schema";
import { eq, and } from "drizzle-orm";
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
    if (!RateLimiter.check(`board-view:${clientIP}`, 30, 60000)) {
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

    // Input validation
    if (!username || !boardId) {
      return NextResponse.json(
        { error: "Username and board ID are required" },
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

    // Validate board ID
    const boardIdNum = parseInt(boardId);
    if (isNaN(boardIdNum)) {
      return NextResponse.json(
        { error: "Invalid board ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Get the board with user validation
      const boardData = await db
        .select({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
          avatar_url: boards.avatar_url,
          user_id: boards.user_id,
          user_username: users.username,
          user_avatar_url: users.avatar_url,
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

      // Check if requester is a member (if authenticated)
      let isMember = false;
      if (sessionId && userWallet) {
        try {
          const currentUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.wallet_address, userWallet))
            .limit(1);

          if (currentUser.length > 0) {
            const memberCheck = await db
              .select({ id: board_members.id })
              .from(board_members)
              .where(
                and(
                  eq(board_members.board_id, boardIdNum),
                  eq(board_members.user_id, currentUser[0].id)
                )
              )
              .limit(1);

            isMember = memberCheck.length > 0;
          }
        } catch (memberError) {
          console.error("Error checking member status:", memberError);
          // Continue without member status
        }
      }

      // Check if board is public or if user is owner/member
      if (!board.is_public && !isOwner && !isMember) {
        return NextResponse.json(
          { error: "This board is private" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Format the response
      const formattedBoard = {
        id: board.id,
        name: board.name,
        description: board.description,
        is_public: board.is_public,
        member_count: Math.max(1, board.member_count || 1),
        created_at: board.created_at?.toISOString() || new Date().toISOString(),
        user: {
          id: board.user_id,
          username: board.user_username || "Unknown",
          avatar_url: board.user_avatar_url || "/img/avatar/little_wea.png",
        },
      };

      const response = NextResponse.json({
        board: {
          ...formattedBoard,
          avatar_url: board.avatar_url || null,
        },
        isOwner,
        isMember,
        meta: {
          timestamp: new Date().toISOString(),
          requestedBy: isOwner ? "owner" : isMember ? "member" : "public",
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
      console.error("Database error fetching board:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch board" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/users/[username]/boards/[boardId]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// PATCH handler to update board
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ username: string; boardId: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`board-update:${clientIP}`, 10, 60000)) {
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

    const { username, boardId } = await params;

    // Input validation
    if (!username || !boardId) {
      return NextResponse.json(
        { error: "Username and board ID are required" },
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

    // Validate board ID
    const boardIdNum = parseInt(boardId);
    if (isNaN(boardIdNum)) {
      return NextResponse.json(
        { error: "Invalid board ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const { name, description, is_public, avatar_url } = body;

    try {
      // First, verify the board exists and belongs to the user
      const boardData = await db
        .select({
          id: boards.id,
          user_id: boards.user_id,
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
          { error: "Board not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const board = boardData[0];

      // Check if requester is the board owner
      const isOwner = Boolean(
        sessionId && userWallet && userWallet === board.user_wallet_address
      );

      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the board owner can update the board" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Validate inputs
      if (name !== undefined && (typeof name !== "string" || name.length < 2 || name.length > 100)) {
        return NextResponse.json(
          { error: "Board name must be between 2 and 100 characters" },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      if (description !== undefined && typeof description === "string" && description.length > 1000) {
        return NextResponse.json(
          { error: "Description must be under 1000 characters" },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      // Build update object with only provided fields
      const updateData: {
        name?: string;
        description?: string | null;
        is_public?: boolean;
        avatar_url?: string | null;
        updated_at: Date;
      } = {
        updated_at: new Date()
      };
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (is_public !== undefined) updateData.is_public = Boolean(is_public);
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null;

      // Update the board
      const updatedBoard = await db
        .update(boards)
        .set(updateData)
        .where(eq(boards.id, boardIdNum))
        .returning({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          avatar_url: boards.avatar_url,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
          updated_at: boards.updated_at,
        });

      if (updatedBoard.length === 0) {
        throw new Error("Failed to update board");
      }

      const response = NextResponse.json(
        {
          success: true,
          message: "Board updated successfully",
          board: updatedBoard[0],
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error updating board:", dbError);
      return NextResponse.json(
        { error: "Failed to update board" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in PATCH /api/users/[username]/boards/[boardId]:",
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
    { status: 405, headers: { Allow: "GET, PATCH", ...getSecurityHeaders() } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, PATCH", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET, PATCH", ...getSecurityHeaders() } }
  );
}
