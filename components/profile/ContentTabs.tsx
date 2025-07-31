"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryGrid } from "./StoryGrid";
import { BoardList } from "./BoardList";
import { SubscribersList } from "./SubscribersList";
import { EmptyState } from "./EmptyState";
import { LoadingGrid } from "./LoadingGrid";
import { useRouter } from "next/navigation";

interface ContentTabsProps {
  userData: {
    user: {
      id: number;
      username: string | null;
      level?: number | null;
      nerdy_points?: number | null;
    };
    stats: {
      stories: number;
      boards: number;
    };
    content: {
      stories: Array<{
        id: number;
        title: string;
        content: string;
        media_url: string | null;
        views: number | null;
        created_at: Date | null;
        slug: string | null;
        formatted_created_at: string;
      }>;
      boards: Array<{
        id: number;
        name: string;
        description: string | null;
        avatar_url: string | null;
        is_public: boolean | null;
        member_count: number | null;
        created_at: Date | null;
        role?: string | null;
        formatted_created_at: string;
      }>;
    };
  };
  subscribers?: Array<{
    id: number;
    username: string | null;
    avatar_url: string | null;
    subscribed_at: Date;
    formatted_subscribed_at: string;
  }>;
  subscribersLoading?: boolean;
  subscriberCount?: number;
  savedStories?: Array<{
    id: number;
    title: string;
    content: string;
    media_url: string | null;
    views: number | null;
    created_at: Date | null;
    slug: string | null;
    saved_at: Date | null;
    formatted_created_at: string;
    formatted_saved_at: string;
    author: {
      id: number;
      username: string | null;
      avatar_url: string | null;
    };
  }>;
  savedStoriesLoading?: boolean;
  isAdmin?: boolean;
  showSavedTab?: boolean;
}

export function ContentTabs({
  userData,
  subscribers = [],
  subscribersLoading = false,
  subscriberCount = 0,
  savedStories = [],
  savedStoriesLoading = false,
  isAdmin = false,
  showSavedTab = false,
}: ContentTabsProps) {
  const router = useRouter();

  const tabsConfig = [
    { value: "stories", label: `Stories (${userData.stats.stories})` },
    ...(showSavedTab
      ? [{ value: "saved", label: `Saved (${savedStories.length})` }]
      : []),
    { value: "boards", label: `Boards (${userData.stats.boards})` },
    { value: "subscribers", label: `Subscribers (${subscriberCount})` },
  ];

  const gridCols = showSavedTab ? "grid-cols-4" : "grid-cols-3";

  return (
    <Tabs defaultValue="stories" className="w-full">
      <TabsList
        className={`grid ${gridCols} items-start justify-start !bg-transparent !p-0 !h-auto !rounded-none`}
      >
        {tabsConfig.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="w-fit text-xs sm:text-sm rounded-none !bg-transparent !border-none data-[state=active]:!bg-[var(--color-yellow)] data-[state=active]:!text-black data-[state=active]:!shadow-none !h-auto !py-2 !px-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="stories" className="mt-4 sm:mt-6">
        {userData.content.stories.length > 0 ? (
          <StoryGrid
            stories={userData.content.stories}
            author={userData.user}
          />
        ) : (
          <EmptyState
            title="No stories yet"
            actionLabel={isAdmin ? "Create Your First Story" : undefined}
            onAction={isAdmin ? () => router.push("/upload") : undefined}
          />
        )}
      </TabsContent>

      {showSavedTab && (
        <TabsContent value="saved" className="mt-4 sm:mt-6">
          {savedStoriesLoading ? (
            <LoadingGrid type="grid" count={3} />
          ) : savedStories.length > 0 ? (
            <StoryGrid stories={savedStories} author={userData.user} />
          ) : (
            <EmptyState
              title="No saved stories yet"
              description="Save stories you like to find them here later"
            />
          )}
        </TabsContent>
      )}

      <TabsContent value="boards" className="mt-4 sm:mt-6">
        {userData.content.boards.length > 0 ? (
          <BoardList boards={userData.content.boards} author={userData.user} />
        ) : (
          <EmptyState
            title="No boards yet"
            actionLabel={isAdmin ? "Create Your First Board" : undefined}
            onAction={isAdmin ? () => router.push("/upload") : undefined}
          />
        )}
      </TabsContent>

      <TabsContent value="subscribers" className="mt-4 sm:mt-6">
        {subscribersLoading ? (
          <LoadingGrid type="list" count={3} />
        ) : subscribers.length > 0 ? (
          <SubscribersList subscribers={subscribers} />
        ) : (
          <EmptyState
            title="No subscribers yet"
            description={
              isAdmin
                ? "Share your profile to gain subscribers!"
                : "Be the first to subscribe to this profile!"
            }
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
