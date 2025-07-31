// components/cards/ProfileCard.tsx

import Link from "next/link";
import { Avatar, AvatarImage } from "../ui/avatar";
import { getAvatarFromLevel } from "../NerdityLevel";

interface ProfileCardProps {
  user: {
    id: number;
    username: string | null;
    avatar_url?: string | null;
    level?: number | null;
    nerdy_points?: number | null;
  };
  subscribedAt?: Date | string | null;
  showSubscriptionDate?: boolean;
}

export default function ProfileCard({
  user,
  subscribedAt,
  showSubscriptionDate = true,
}: ProfileCardProps) {
  const avatarUrl =
    user.avatar_url ||
    getAvatarFromLevel(user.level || 1, user.nerdy_points || 0);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-none hover:bg-white/10 transition-colors">
      <Link href={`/${user.username}`} className="flex-shrink-0">
        <Avatar className="w-12 h-12 border border-white/20 hover:ring-2 hover:ring-[var(--color-yellow)] transition-all cursor-pointer">
          <AvatarImage
            src={avatarUrl}
            alt={`${user.username}'s avatar`}
            className="object-cover"
          />
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/${user.username}`}>
            <p className="font-medium text-white hover:text-[var(--color-yellow)] transition-colors cursor-pointer truncate">
              {user.username}
            </p>
          </Link>
          {user.level && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              Level {user.level}
            </span>
          )}
        </div>
        {user.nerdy_points !== undefined && (
          <p className="text-xs text-gray-400">
            {user.nerdy_points} nerdy points
          </p>
        )}
      </div>

      {showSubscriptionDate && subscribedAt && (
        <div className="text-xs text-gray-400 flex-shrink-0">
          {formatDate(subscribedAt)}
        </div>
      )}
    </div>
  );
}
