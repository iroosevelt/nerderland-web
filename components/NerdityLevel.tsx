// components/NerdityLevel.tsx

"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

export interface NerdityLevelData {
  level: string;
  avatars: string[];
  pointsRequired: number;
  nextLevel?: string;
}

export const nerdityLevels: NerdityLevelData[] = [
  {
    level: "Little Wea",
    avatars: ["little_wea", "little_wea_2"],
    pointsRequired: 0,
    nextLevel: "Laper",
  },
  {
    level: "Laper",
    avatars: ["laper", "laper_2"],
    pointsRequired: 100,
    nextLevel: "Nu-Goth",
  },
  {
    level: "Nu-Goth",
    avatars: ["nu-goth", "nu-goth_2"],
    pointsRequired: 500,
    nextLevel: "Thriller",
  },
  {
    level: "Thriller",
    avatars: ["thriller", "thriller_2"],
    pointsRequired: 1500,
    nextLevel: "Algo Hacker",
  },
  {
    level: "Algo Hacker",
    avatars: ["algo_hacker", "algo_hacker_2"],
    pointsRequired: 3500,
    nextLevel: "Prophet",
  },
  {
    level: "Prophet",
    avatars: ["prophet", "prophet_2"],
    pointsRequired: 7500,
    nextLevel: "Observer",
  },
  {
    level: "Observer",
    avatars: ["observer", "observer_2"],
    pointsRequired: 15000,
    nextLevel: "Founder",
  },
  {
    level: "Founder",
    avatars: ["founder", "founder_2"],
    pointsRequired: 30000,
  },
];

interface NerdityLevelProps {
  userPoints: number;
  userLevel?: number;
  showProgress?: boolean;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg";
  className?: string;
}

export function getNerdityLevelFromPoints(points: number): NerdityLevelData {
  for (let i = nerdityLevels.length - 1; i >= 0; i--) {
    if (points >= nerdityLevels[i].pointsRequired) {
      return nerdityLevels[i];
    }
  }
  return nerdityLevels[0]; // Default to Little Wea
}

export function getAvatarFromLevel(
  levelIndex: number,
  points: number = 0
): string {
  const level = nerdityLevels[levelIndex - 1] || nerdityLevels[0];
  // Choose avatar based on points within the level for variety
  const avatarIndex = Math.floor(points / 50) % level.avatars.length;
  return `/img/avatar/${level.avatars[avatarIndex]}.png`;
}

export function NerdityLevel({
  userPoints,
  showProgress = true,
  showAvatar = false,
  avatarSize = "md",
  className = "",
}: NerdityLevelProps) {
  const currentLevelData = getNerdityLevelFromPoints(userPoints);
  const currentLevelIndex = nerdityLevels.findIndex(
    (l) => l.level === currentLevelData.level
  );
  const nextLevelData = nerdityLevels[currentLevelIndex + 1];

  // Calculate progress to next level
  const currentLevelPoints = currentLevelData.pointsRequired;
  const nextLevelPoints = nextLevelData?.pointsRequired || currentLevelPoints;
  const pointsInCurrentLevel = userPoints - currentLevelPoints;
  const pointsNeededForNextLevel = nextLevelPoints - currentLevelPoints;
  const progressPercentage = nextLevelData
    ? Math.min((pointsInCurrentLevel / pointsNeededForNextLevel) * 100, 100)
    : 100;

  const avatarSizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showAvatar && (
        <Avatar
          className={`${avatarSizeClasses[avatarSize]} border border-white/20`}
        >
          <AvatarImage
            src={getAvatarFromLevel(currentLevelIndex + 1, userPoints)}
            alt={`${currentLevelData.level} avatar`}
            className="object-cover"
          />
        </Avatar>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-display text-white">
            {currentLevelData.level}
          </span>
          <div className="flex items-center text-sm font-display">
            <Image
              aria-label="hidden"
              src="/img/coin.gif"
              alt="Coin"
              width={28}
              height={28}
              className="hover:animate-spin duration-300"
              unoptimized
            />
            <span className="text-xs text-gray-400">{userPoints} points</span>
          </div>
        </div>

        {showProgress && nextLevelData && (
          <div className="space-y-1">
            <div className="bg-gray-700 h-4 rounded-none overflow-hidden">
              <div
                className="bg-[#00FF47] h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                {pointsInCurrentLevel}/{pointsNeededForNextLevel}
              </span>
              <span>Next: {nextLevelData.level}</span>
            </div>
          </div>
        )}

        {showProgress && !nextLevelData && (
          <div className="text-xs text-[var(--color-yellow)] font-medium">
            Max Level Reached! 🏆
          </div>
        )}
      </div>
    </div>
  );
}

export default NerdityLevel;
