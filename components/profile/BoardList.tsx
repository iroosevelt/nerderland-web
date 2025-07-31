"use client";

import BoardCard from "@/components/cards/BoardCard";
import { getAvatarFromLevel } from "@/components/NerdityLevel"; // cSpell:ignore Nerdity

interface Board {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_public: boolean | null;
  member_count: number | null;
  created_at: Date | null;
  role?: string | null;
  formatted_created_at: string;
  user?: {
    id: number;
    username: string;
    avatar_url: string;
  };
}

interface Author {
  id: number;
  username: string | null;
  level?: number | null;
  nerdy_points?: number | null;
}

interface BoardListProps {
  boards: Board[];
  author: Author;
}

export function BoardList({ boards, author }: BoardListProps) {
  return (
    <div className="space-y-2">
      {boards.map((board) => (
        <BoardCard
          key={board.id}
          board={{
            ...board,
            created_at: board.created_at?.toISOString(),
          }}
          user={
            board.user || {
              id: author.id,
              username: author.username || "Anonymous",
              avatar_url: getAvatarFromLevel(
                author.level || 1,
                author.nerdy_points || 0
              ),
            }
          }
        />
      ))}
    </div>
  );
}