"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import NerdityLevel, { getAvatarFromLevel } from "@/components/NerdityLevel";
import Image from "next/image";

const nerdityLevels = [
  {
    level: "Little Wea",
    avatars: ["little_wea", "little_wea_2"],
  },
  {
    level: "Laper",
    avatars: ["laper", "laper_2"],
  },
  {
    level: "Nu-Goth",
    avatars: ["nu-goth", "nu-goth_2"],
  },
  {
    level: "Thriller",
    avatars: ["thriller", "thriller_2"],
  },
  {
    level: "Algo Hacker",
    avatars: ["algo_hacker", "algo_hacker_2"],
  },
  {
    level: "Prophet",
    avatars: ["prophet", "prophet_2"],
  },
  {
    level: "Observer",
    avatars: ["observer", "observer_2"],
  },
  {
    level: "Founder",
    avatars: ["founder", "founder_2"],
  },
];

interface ProfileHeaderProps {
  username: string | null;
  level: number;
  nerdy_points: number;
  formatted_created_at: string;
  stats: {
    stories: number;
    boards: number;
    subscribers?: number;
  };
  showProgress?: boolean;
  children?: React.ReactNode;
}

export function ProfileHeader({
  username,
  level,
  nerdy_points,
  formatted_created_at,
  stats,
  showProgress = true,
  children,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-col items-center lg:items-start w-full mb-4 sm:mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row w-full items-center sm:items-start justify-center sm:justify-between gap-4">
        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 border border-white/20">
          <AvatarImage
            className="object-cover"
            src={getAvatarFromLevel(level, nerdy_points)}
          />
        </Avatar>
        {children}
      </div>

      <div className="text-center lg:text-left w-full">
        <div className="mb-3">
          <h1 className="text-sm sm:text-base font-display text-[var(--color-green)] font-bold">
            {username}
          </h1>
        </div>

        {stats.subscribers !== undefined && (
          <div className="text-xs sm:text-sm mb-3">
            <strong>{stats.subscribers}</strong> Subscribers
          </div>
        )}

        <div className="flex flex-row gap-3 sm:gap-4 text-xs sm:text-sm mb-3 justify-center lg:justify-start">
          <span>
            <strong>{stats.stories}</strong> stories
          </span>
          <span>
            <strong>{stats.boards}</strong> boards
          </span>
        </div>

        <div className="mb-3">
          <NerdityLevel
            userPoints={nerdy_points}
            userLevel={level}
            showProgress={showProgress}
            showAvatar={false}
          />
        </div>

        <div className="text-gray-400 text-xs space-y-1">
          <p>Member since {formatted_created_at}</p>
        </div>
      </div>
      <div className="text-sm mb-4 font-display">LEVEL OF NERDITY</div>
      <ul className="space-y-4 text-sm font-display">
        {nerdityLevels.map(({ level, avatars }) => (
          <li key={level} className="flex items-center space-x-1">
            <div className="flex items-center space-x-1">
              {avatars.map((avatarName) => (
                <Image
                  key={avatarName}
                  src={`/img/avatar/${avatarName}.png`}
                  alt={avatarName}
                  width={30}
                  height={30}
                  className="rounded-full border border-white/10"
                />
              ))}
              <span className="text-white">{level}</span>
            </div>
            <div className="flex items-center ml-auto">
              <Image
                aria-label="hidden"
                className="ml-auto"
                src="/img/question.gif"
                alt="what?"
                width={24}
                height={24}
                unoptimized
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
