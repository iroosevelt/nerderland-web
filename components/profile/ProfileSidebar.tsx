"use client";

import { ProfileHeader } from "./ProfileHeader";

interface ProfileSidebarProps {
  userData: {
    user: {
      username: string | null;
      level: number | null;
      nerdy_points: number | null;
      formatted_created_at: string;
    };
    stats: {
      stories: number;
      boards: number;
      subscribers?: number;
    };
  };
  children?: React.ReactNode;
  className?: string;
}

export function ProfileSidebar({ 
  userData, 
  children,
  className = ""
}: ProfileSidebarProps) {
  return (
    <div className={`w-full lg:w-[320px] bg-black/50 p-3 ml-auto sm:p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 overflow-y-auto lg:order-2 ${className}`}>
      <ProfileHeader
        username={userData.user.username}
        level={userData.user.level || 1}
        nerdy_points={userData.user.nerdy_points || 0}
        formatted_created_at={userData.user.formatted_created_at}
        stats={userData.stats}
      >
        {children}
      </ProfileHeader>
    </div>
  );
}