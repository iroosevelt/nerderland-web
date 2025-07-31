// components/board/BoardTabs.tsx

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BoardFeed } from "./BoardFeed";
import { BoardMembers } from "./BoardMembers";
import type { Story, BoardMember } from "./types";

interface BoardTabsProps {
  stories: Story[];
  storiesLoading: boolean;
  members: BoardMember[];
  membersLoading: boolean;
}

export function BoardTabs({
  stories,
  storiesLoading,
  members,
  membersLoading,
}: BoardTabsProps) {
  return (
    <div className="max-w-6xl p-4 sm:p-6 lg:order-1">
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid grid-cols-2 items-start justify-start !bg-transparent !p-0 !h-auto !rounded-none">
          <TabsTrigger
            value="feed"
            className="text-xs rounded-none sm:text-sm !bg-transparent !border-none data-[state=active]:!bg-[var(--color-yellow)]  data-[state=active]:!text-black data-[state=active]:!shadow-none !h-auto !py-2 !px-3"
          >
            Feed
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="text-xs rounded-none sm:text-sm !bg-transparent !border-none data-[state=active]:!bg-[var(--color-yellow)]  data-[state=active]:!text-black data-[state=active]:!shadow-none !h-auto !py-2 !px-3"
          >
            Members ({members?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 sm:mt-6">
          <BoardFeed stories={stories} isLoading={storiesLoading} />
        </TabsContent>

        <TabsContent value="members" className="mt-4 sm:mt-6">
          <BoardMembers members={members} isLoading={membersLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
