// components/profile/PublicProfile.tsx

"use client";

import { useState, useEffect } from "react";
import { ProfileSidebar } from "./ProfileSidebar";
import { ContentTabs } from "./ContentTabs";
import SubscribeButton from "@/components/SubscribeButton";

interface PublicProfileProps {
  userData: {
    user: {
      id: number;
      username: string | null;
      avatar_url: string | null;
      nerdy_points: number | null;
      level: number | null;
      created_at: Date | null;
      formatted_created_at: string; // Pre-formatted date
    };
    stats: {
      stories: number;
      boards: number;
      subscribers?: number;
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
}

export function PublicProfile({ userData }: PublicProfileProps) {
  const [subscribers, setSubscribers] = useState<Array<{
    id: number;
    username: string | null;
    avatar_url: string | null;
    subscribed_at: Date;
    formatted_subscribed_at: string;
  }>>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(
    userData.stats.subscribers || 0
  );
  const [isSubscribed, setIsSubscribed] = useState(false);

  const publicStories = userData.content.stories;
  const publicBoards = userData.content.boards.filter(
    (board) => board.is_public
  );

  const loadSubscribers = async () => {
    if (!userData.user.username) return;

    setSubscribersLoading(true);
    try {
      const response = await fetch(
        `/api/users/${userData.user.username}/subscribers`
      );
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
        setSubscriberCount(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!userData.user.username) return;

    try {
      const response = await fetch(
        `/api/users/${userData.user.username}/subscribe`
      );
      if (response.ok) {
        const data = await response.json();
        console.log(
          "Subscription status for",
          userData.user.username,
          ":",
          data
        );
        setIsSubscribed(data.subscribed || false);
      } else {
        console.log("Failed to check subscription status:", response.status);
      }
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  useEffect(() => {
    loadSubscribers();
    checkSubscriptionStatus();
  }, [userData.user.username]);

  const publicUserDataWithSubscriberCount = {
    ...userData,
    stats: {
      ...userData.stats,
      subscribers: subscriberCount,
      boards: publicBoards.length
    },
    content: {
      stories: publicStories,
      boards: publicBoards
    }
  };

  return (
    <div className="flex flex-col bg-black lg:flex-row w-full h-full overflow-hidden col-span-2">
      <ProfileSidebar userData={publicUserDataWithSubscriberCount}>
        {userData.user.username && (
          <SubscribeButton
            targetUsername={userData.user.username}
            initialSubscribed={isSubscribed}
            size="sm"
            className="px-3 py-1 text-xs sm:text-sm font-bold rounded-none w-full sm:w-auto max-w-32"
            onSubscriptionChange={(subscribed) => {
              setIsSubscribed(subscribed);
              setSubscriberCount((prev) =>
                subscribed ? prev + 1 : prev - 1
              );
            }}
          />
        )}
      </ProfileSidebar>
      <div className="max-w-6xl p-4 sm:p-6 lg:order-1">
        <ContentTabs
          userData={publicUserDataWithSubscriberCount}
          subscribers={subscribers}
          subscribersLoading={subscribersLoading}
          subscriberCount={subscriberCount}
          isAdmin={false}
          showSavedTab={false}
        />
      </div>
    </div>
  );
}
