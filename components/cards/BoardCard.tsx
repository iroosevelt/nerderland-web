// components/BoardCard.tsx

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarImage } from "../ui/avatar";

interface BoardData {
  id: number;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  created_at?: string | Date;
  is_public?: boolean | null;
  member_count?: number | null;
  role?: string | null; // "owner" or "member"
  user?: {
    id: number;
    username: string;
    avatar_url: string;
  };
}

interface BoardCardProps {
  board: BoardData;
  user?: {
    id: number;
    username: string;
    avatar_url: string;
  };
  href?: string; // Optional custom href
}

export default function BoardCard({
  board,
  user: fallbackUser,
  href,
}: BoardCardProps) {
  const router = useRouter();
  
  // Use board's user data if available, otherwise fall back to provided user
  const user = board.user || fallbackUser;

  if (!user) {
    return null;
  }

  const boardUrl = href || `/${user.username}/boards/${board.id}`;

  const handleOpenBoard = () => {
    router.push(boardUrl);
  };

  return (
    <div className="flex items-center p-3 sm:p-4 bg-white text-black w-full hover:bg-gray-50 transition-colors">
      <Link href={`/${user.username}`}>
        <Avatar className="w-10 h-10 flex-shrink-0 hover:ring-2 hover:ring-gray-300 transition-all cursor-pointer">
          <AvatarImage
            src={board.avatar_url || user.avatar_url}
            alt={
              board.avatar_url
                ? `${board.name} board avatar`
                : `${user.username}'s avatar`
            }
          />
        </Avatar>
      </Link>

      <div className="px-4 flex flex-col flex-1 min-w-0">
        <h3 className="font-display font-semibold truncate" title={board.name}>
          {board.name}
        </h3>
        {/* {board.description && (
          <p
            className="font-sans text-xs text-gray-600 truncate mb-1"
            title={board.description}
          >
            {board.description}
          </p>
        )} */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-sans">
            {board.member_count || 0}{" "}
            {(board.member_count || 0) !== 1 ? "" : ""} online
          </span>
        </div>
      </div>

      <button
        className="font-bold bg-[var(--color-yellow)] px-3 py-1 hover:bg-[var(--color-yellow)] border border-black rounded-none text-sm transition-colors flex-shrink-0"
        onClick={handleOpenBoard}
        aria-label={`Open ${board.name} board`}
      >
        Open
      </button>
    </div>
  );
}
