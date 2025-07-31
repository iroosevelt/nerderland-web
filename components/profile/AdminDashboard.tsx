// components/profile/AdminDashboard.tsx

"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { ContentTabs } from "./ContentTabs";

interface AdminDashboardProps {
  userData: {
    user: {
      id: number;
      username: string | null;
      email: string | null;
      avatar_url: string | null;
      nerdy_points: number | null;
      level: number | null;
      created_at: Date | null;
      wallet_address: string;
      dob: string | null;
      formatted_created_at: string;
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
}

type SavedStory = {
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
};

export function AdminDashboard({ userData }: AdminDashboardProps) {
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [savedStoriesLoading, setSavedStoriesLoading] = useState(false);
  const [subscribers, setSubscribers] = useState<Array<{
    id: number;
    username: string | null;
    avatar_url: string | null;
    subscribed_at: Date;
    formatted_subscribed_at: string;
  }>>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  const loadSavedStories = async () => {
    setSavedStoriesLoading(true);
    try {
      const response = await fetch("/api/user/saved-stories");
      if (response.ok) {
        const data = await response.json();
        setSavedStories(data.savedStories || []);
      } else {
        console.error("Failed to load saved stories");
      }
    } catch (error) {
      console.error("Error loading saved stories:", error);
    } finally {
      setSavedStoriesLoading(false);
    }
  };

  const loadSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      if (!userData.user.username) {
        console.error("No username available");
        return;
      }
      const response = await fetch(
        `/api/users/${userData.user.username}/subscribers`
      );
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers || []);
      } else {
        const errorData = await response.text();
        console.error("Failed to load subscribers:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    loadSavedStories();
    loadSubscribers();
  }, []);


  return (
    <div className="flex flex-col lg:flex-row bg-black w-full min-h-screen overflow-hidden">
      <AdminSidebar userData={userData} />
      <div className="flex-1 lg:order-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <ContentTabs
            userData={userData}
            subscribers={subscribers}
            subscribersLoading={subscribersLoading}
            subscriberCount={subscribers.length}
            savedStories={savedStories}
            savedStoriesLoading={savedStoriesLoading}
            isAdmin={true}
            showSavedTab={true}
          />
        </div>
      </div>
    </div>
  );
}
