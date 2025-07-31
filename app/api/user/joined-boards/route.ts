// app/api/user/joined-boards/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { boards, users, board_members } from "@db/schema";
import { eq } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

type BoardResponse = {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  member_count: number | null;
  created_at: string;
  role: string; // "owner" or "member"
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
};

export async function GET() {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    try {
      const userId = auth.user.id;

      // Get all boards the user is a member of (including owned boards)
      const joinedBoards = await db
        .select({
          board_id: boards.id,
          board_name: boards.name,
          board_description: boards.description,
          board_avatar_url: boards.avatar_url,
          board_is_public: boards.is_public,
          board_member_count: boards.member_count,
          board_created_at: boards.created_at,
          board_owner_id: boards.user_id,
          owner_username: users.username,
          owner_avatar_url: users.avatar_url,
          member_role: board_members.role,
        })
        .from(board_members)
        .innerJoin(boards, eq(board_members.board_id, boards.id))
        .innerJoin(users, eq(boards.user_id, users.id))
        .where(eq(board_members.user_id, userId));

      // Format response
      const formattedBoards: BoardResponse[] = joinedBoards.map((board) => ({
        id: board.board_id,
        name: board.board_name,
        description: board.board_description,
        avatar_url: board.board_avatar_url,
        is_public: board.board_is_public,
        member_count: board.board_member_count,
        created_at:
          board.board_created_at?.toISOString() || new Date().toISOString(),
        role: board.member_role || "member",
        user: {
          id: board.board_owner_id!,
          username: board.owner_username || "Unknown",
          avatar_url: board.owner_avatar_url || "/img/avatar/little_wea.png",
        },
      }));

      const response = NextResponse.json({
        boards: formattedBoards,
        meta: {
          timestamp: new Date().toISOString(),
          total: formattedBoards.length,
        },
      });

      return response;
    } catch (dbError) {
      console.error("Database error fetching joined boards:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch joined boards" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/user/joined-boards:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Block other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET" } }
  );
}