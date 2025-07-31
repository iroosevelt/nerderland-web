// components/MasonryGrid.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import StoryCard from "./cards/StoryCard";
import { processStoryDescription } from "@/lib/utils/textUtils";
import Loader from "./Loader";

type Story = {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  views: number;
  created_at: string;
  slug?: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  } | null;
};

interface MasonryGridProps {
  username?: string;
  limit?: number;
  className?: string;
}

export const MasonryGrid = ({
  username,
  limit = 20,
  className = "",
}: MasonryGridProps) => {
  const [columns, setColumns] = useState(2);

  // Responsive column calculation
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 768) setColumns(4); // Desktop: 4 columns
      else setColumns(2); // Mobile: 2 columns
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Fetch stories function
  const fetchStories = useCallback(async (): Promise<Story[]> => {
    try {
      let url: string;

      if (username) {
        // Fetch user-specific stories
        url = `/api/users/${username}/stories?limit=${limit}`;
      } else {
        // For general feed, fetch from general stories API
        url = `/api/stories?limit=${limit}&offset=0`;
      }

      console.log("Fetching stories from:", url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch stories: ${response.status}`);
      }

      const data = await response.json();
      console.log("Stories API response:", data);

      // Handle different response formats and ensure we always return an array
      let storiesArray: Story[] = [];

      if (data.stories && Array.isArray(data.stories)) {
        storiesArray = data.stories;
      } else if (Array.isArray(data)) {
        storiesArray = data;
      } else {
        console.warn("Unexpected response format:", data);
        storiesArray = [];
      }

      console.log("Processed stories array:", storiesArray);
      return storiesArray;
    } catch (error) {
      console.error("Error fetching stories:", error);
      throw error;
    }
  }, [username, limit]);

  // Use React Query for caching and error handling
  const {
    data: stories = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stories", username, limit],
    queryFn: fetchStories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Memoized column distribution for performance
  const columnArrays = useMemo(() => {
    const arrays = Array.from({ length: columns }, () => [] as Story[]);

    // Ensure stories is always an array before calling forEach
    if (Array.isArray(stories)) {
      stories.forEach((story, index) => {
        arrays[index % columns].push(story);
      });
    }

    return arrays;
  }, [stories, columns]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader />
          <p className="text-gray-400 text-xs">Loading stories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Failed to load stories:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-[var(--color-yellow)] text-black px-4 py-2 rounded hover:bg-[var(--color-yellow)] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!Array.isArray(stories) || stories.length === 0) {
    return (
      <div
        className={`flex justify-center items-center min-h-[400px] ${className}`}
      >
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            {username ? `No stories found for ${username}` : "No stories found"}
          </p>
          {!username && (
            <p className="text-gray-500 text-sm">
              Be the first to share a story!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-4 ${className}`}>
      {columnArrays.map((columnStories, columnIndex) => (
        <div key={columnIndex} className="flex-1 space-y-4">
          {columnStories.map((story) => (
            <StoryCard
              key={story.id}
              id={story.id}
              title={story.title}
              image={story.media_url || "/img/story_placeholder.png"}
              description={processStoryDescription(story.content, 100)}
              slug={story.slug}
              user={story.user}
              // Updated: Use the new URL pattern for story links
              href={`/${story.user?.username}/stories/${
                story.slug || story.id
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
