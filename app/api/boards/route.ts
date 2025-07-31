// app/api/boards/route.ts

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

export async function GET(req: Request) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const sessionId = headersList.get("x-session-id");

    // Rate limiting
    if (!RateLimiter.check(`boards-feed:${clientIP}`, 50, 60000)) {
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
      // Get all public boards with user information
      const allBoards = await db
        .select({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          avatar_url: boards.avatar_url,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
          user_id: boards.user_id,
          user_username: users.username,
          user_avatar_url: users.avatar_url,
        })
        .from(boards)
        .leftJoin(users, eq(boards.user_id, users.id))
        .where(eq(boards.is_public, true)) // Only public boards
        .orderBy(desc(boards.created_at))
        .limit(limit)
        .offset(finalOffset);

      // Format response to match the expected format
      const formattedBoards: BoardResponse[] = allBoards
        .filter((board) => board.user_id != null) // Filter out boards without valid user IDs
        .map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          avatar_url: board.avatar_url,
          is_public: board.is_public,
          member_count: Math.max(1, board.member_count || 1),
          created_at:
            board.created_at?.toISOString() || new Date().toISOString(),
          user: {
            id: board.user_id!,
            username: board.user_username || "Unknown",
            avatar_url: board.user_avatar_url || "/img/avatar/little_wea.png",
          },
        }));

      // Get total count for pagination (only if page parameter is used)
      let totalCount = undefined;
      let totalPages = undefined;

      if (searchParams.get("page")) {
        const countResult = await db
          .select()
          .from(boards)
          .where(eq(boards.is_public, true));
        totalCount = countResult.length;
        totalPages = Math.ceil(totalCount / limit);
      }

      const response = NextResponse.json({
        boards: formattedBoards,
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

      response.headers.set("X-Total-Boards", formattedBoards.length.toString());

      return response;
    } catch (dbError) {
      console.error("Database error in boards feed API:", dbError);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Boards feed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// POST handler to create new boards
export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";

    // Rate limiting for board creation
    if (!RateLimiter.check(`create-board:${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many board creation requests. Please wait a minute." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
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

    const { name, description, rules, avatarUrl, isPublic, walletAddress } =
      body;

    // Validation
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Board name must be between 2 and 100 characters" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate description length if provided
    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: "Description must be under 1000 characters" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate rules length if provided
    if (rules && rules.length > 2000) {
      return NextResponse.json(
        { error: "Rules must be under 2000 characters" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // First, get the user ID from the wallet address
      const userResult = await db
        .select({
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
        })
        .from(users)
        .where(eq(users.wallet_address, walletAddress))
        .limit(1);

      if (userResult.length === 0) {
        return NextResponse.json(
          { error: "User not found. Please ensure your wallet is connected." },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const user = userResult[0];

      // Create the board
      const newBoard = await db
        .insert(boards)
        .values({
          name: name.trim(),
          description: description?.trim() || null,
          rules: rules?.trim() || null,
          avatar_url: avatarUrl || null,
          is_public: Boolean(isPublic),
          user_id: user.id,
          member_count: 1, // Creator is the first member
          created_at: new Date(),
        })
        .returning({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          rules: boards.rules,
          avatar_url: boards.avatar_url,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
        });

      if (newBoard.length === 0) {
        throw new Error("Failed to create board");
      }

      const createdBoard = newBoard[0];

      // Format the response
      const response = NextResponse.json(
        {
          success: true,
          message: "Board created successfully",
          board: {
            id: createdBoard.id,
            name: createdBoard.name,
            description: createdBoard.description,
            rules: createdBoard.rules,
            avatar_url: createdBoard.avatar_url,
            is_public: createdBoard.is_public,
            member_count: createdBoard.member_count,
            created_at:
              createdBoard.created_at?.toISOString() ||
              new Date().toISOString(),
            user: {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url || "/img/avatar/little_wea.png",
            },
          },
        },
        { status: 201, headers: getSecurityHeaders() }
      );

      return response;
    } catch (dbError) {
      console.error("Database error creating board:", dbError);

      // Check for specific database errors
      if (dbError instanceof Error) {
        if (
          dbError.message.includes("unique") ||
          dbError.message.includes("duplicate")
        ) {
          return NextResponse.json(
            { error: "A board with this name already exists for your account" },
            { status: 409, headers: getSecurityHeaders() }
          );
        }
      }

      return NextResponse.json(
        { error: "Failed to create board due to database error" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error("Board creation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods
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
