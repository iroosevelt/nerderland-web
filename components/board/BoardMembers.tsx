// components/board/BoardMembers.tsx

"use client";

import { Users } from "lucide-react";
import ProfileCard from "../cards/ProfileCard";
import type { BoardMember } from "./types";

interface BoardMembersProps {
  members: BoardMember[];
  isLoading: boolean;
}

export function BoardMembers({ members, isLoading }: BoardMembersProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse bg-white/5 h-20 rounded"
          />
        ))}
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-gray-400">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="mb-4">No members yet</p>
        <p className="text-sm">Invite people to join this board!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <ProfileCard
          key={member.id}
          user={{
            id: member.user.id,
            username: member.user.username,
            level: member.user.level,
            nerdy_points: member.user.nerdy_points,
            avatar_url: member.user.avatar_url,
          }}
          subscribedAt={member.joined_at}
          showSubscriptionDate={true}
        />
      ))}
    </div>
  );
}