// app/api/users/[username]/boards/[boardId]/members/route.ts

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
    if (!RateLimiter.check(`board-members:${clientIP}`, 30, 60000)) {
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
      // First verify the board exists and get owner information
      const boardData = await db
        .select({
          id: boards.id,
          is_public: boards.is_public,
          user_wallet_address: users.wallet_address,
          owner_id: users.id,
          owner_username: users.username,
          owner_avatar_url: users.avatar_url,
          owner_level: users.level,
          owner_nerdy_points: users.nerdy_points,
          created_at: boards.created_at,
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

      // Check if board is public or if user is owner
      const isOwner = Boolean(
        sessionId && userWallet && userWallet === board.user_wallet_address
      );

      if (!board.is_public && !isOwner) {
        return NextResponse.json(
          { error: "This board is private" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Get all board members (excluding the owner from board_members table)
      const boardMembers = await db
        .select({
          id: board_members.id,
          role: board_members.role,
          joined_at: board_members.joined_at,
          user_id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
          level: users.level,
          nerdy_points: users.nerdy_points,
        })
        .from(board_members)
        .innerJoin(users, eq(board_members.user_id, users.id))
        .where(eq(board_members.board_id, boardIdNum))
        .orderBy(board_members.joined_at);

      // Start with the board owner as the first member
      const allMembers = [];
      
      // Add the board owner first
      if (board.owner_id) {
        allMembers.push({
          id: 0, // Use 0 for owner to distinguish from board_members IDs
          user: {
            id: board.owner_id,
            username: board.owner_username,
            avatar_url: board.owner_avatar_url || "/img/avatar/little_wea.png",
            level: board.owner_level || 1,
            nerdy_points: board.owner_nerdy_points || 0,
          },
          joined_at: board.created_at?.toISOString() || new Date().toISOString(),
          role: "owner",
        });
      }

      // Add all other members
      const formattedMembers = boardMembers.map((member) => ({
        id: member.id,
        user: {
          id: member.user_id,
          username: member.username,
          avatar_url: member.avatar_url || "/img/avatar/little_wea.png",
          level: member.level || 1,
          nerdy_points: member.nerdy_points || 0,
        },
        joined_at: member.joined_at?.toISOString() || new Date().toISOString(),
        role: member.role || "member",
      }));

      // Combine owner and members
      allMembers.push(...formattedMembers);

      const response = NextResponse.json({
        members: allMembers,
        meta: {
          timestamp: new Date().toISOString(),
          requestedBy: isOwner ? "owner" : "public",
          total: allMembers.length,
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
      console.error("Database error fetching board members:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch board members" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/users/[username]/boards/[boardId]/members:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// POST handler to join board
export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string; boardId: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`board-join:${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many join requests" },
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

      // Verify the board exists and is public or check ownership
      const boardData = await db
        .select({
          id: boards.id,
          is_public: boards.is_public,
          user_wallet_address: users.wallet_address,
          member_count: boards.member_count,
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
      const isOwner = userWallet === board.user_wallet_address;

      // Prevent owner from joining their own board
      if (isOwner) {
        return NextResponse.json(
          { error: "Cannot join your own board - you are the owner" },
          { status: 400, headers: getSecurityHeaders() }
        );
      }

      // Check if board is joinable (public or user is owner)
      if (!board.is_public) {
        return NextResponse.json(
          { error: "This board is private" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Check if user is already a member
      const existingMembership = await db
        .select()
        .from(board_members)
        .where(
          and(eq(board_members.board_id, boardIdNum), eq(board_members.user_id, userId))
        )
        .limit(1);

      if (existingMembership.length > 0) {
        return NextResponse.json(
          { error: "Already a member of this board" },
          { status: 409, headers: getSecurityHeaders() }
        );
      }

      // Add user to board (only non-owners can reach this point)
      await db.insert(board_members).values({
        board_id: boardIdNum,
        user_id: userId,
        role: "member",
      });

      // Update member count
      await db
        .update(boards)
        .set({
          member_count: (board.member_count || 0) + 1,
          updated_at: new Date(),
        })
        .where(eq(boards.id, boardIdNum));

      const response = NextResponse.json(
        {
          success: true,
          message: "Successfully joined board",
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error joining board:", dbError);
      return NextResponse.json(
        { error: "Failed to join board" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/users/[username]/boards/[boardId]/members:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
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