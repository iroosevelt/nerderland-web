// components/board/BoardStories.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import StoryCard from "@/components/cards/StoryCard";
import { processStoryDescription } from "@/lib/utils/textUtils";
import { MessageSquare, Loader2, RefreshCw } from "lucide-react";

interface BoardStoriesProps {
  username: string;
  boardId: number;
}

type Story = {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  slug: string | null;
  views: number;
  created_at: string;
  added_to_board_at: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
};

type BoardStoriesResponse = {
  board: {
    id: number;
    name: string;
    is_public: boolean | null;
    user: {
      username: string;
    };
  };
  stories: Story[];
  pagination: {
    limit: number;
    offset: number;
    returned: number;
  };
};

export function BoardStories({
  username,
  boardId,
}: BoardStoriesProps) {
  // Fetch stories for this board
  const { data, isLoading, error, refetch } = useQuery<BoardStoriesResponse>({
    queryKey: ["boardStories", username, boardId],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${username}/boards/${boardId}/stories?limit=20`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Board not found");
        }
        if (response.status === 403) {
          throw new Error("Access denied");
        }
        throw new Error(`Failed to fetch stories: ${response.status}`);
      }

      return response.json();
    },
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });


  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-yellow)] " />
          <p className="text-gray-400">Loading stories...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="border border-gray-700 rounded-lg p-6 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-xs font-semibold text-red-400 mb-2">
            {error.message}
          </h3>
          <p className="text-gray-400 mb-4">
            Failed to load stories for this board.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {/* {(isOwner || isPublic) && (
              <Button
                onClick={handleCreatePost}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                Add Story
              </Button>
            )} */}
          </div>
        </div>
      </div>
    );
  }

  const stories = data?.stories || [];

  // Empty state
  if (stories.length === 0) {
    return (
      <div className="border border-gray-700 rounded-lg p-6 text-center">
        <div className="max-w-md mx-auto">
          <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No stories yet
          </h3>
          <p className="text-gray-500 mb-4">
            This board is waiting for its first story!
          </p>
          {/* {(isOwner || isPublic) && (
            <Button
              onClick={handleCreatePost}
              className="bg-yellow-400 text-black hover:bg-yellow-500"
            >
              Create First Story
            </Button>
          )} */}
        </div>
      </div>
    );
  }

  // Stories display
  return (
    <div className="space-y-6">
      {/* Header with action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Stories ({stories.length})
          </h2>
          <p className="text-sm text-gray-400">
            Latest stories shared to this board
          </p>
        </div>
        {/* {(isOwner || isPublic) && (
          <Button
            onClick={handleCreatePost}
            className="bg-yellow-400 text-black hover:bg-yellow-500"
          >
            Add Story
          </Button>
        )} */}
      </div>

      {/* Stories grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          <div key={story.id} className="space-y-2">
            <StoryCard
              id={story.id}
              title={story.title}
              image={story.media_url || "/img/story_placeholder.png"}
              description={processStoryDescription(story.content, 100)}
              slug={story.slug}
              user={story.user}
            />
            <div className="text-xs text-gray-500 px-2">
              Added {new Date(story.added_to_board_at).toLocaleDateString()}
              {story.views > 0 && ` • ${story.views} views`}
            </div>
          </div>
        ))}
      </div>

      {/* Load more if there are more stories */}
      {stories.length >= 20 && (
        <div className="text-center pt-6">
          <Button
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
            onClick={() => {
              // TODO: Implement pagination
              console.log("Load more stories");
            }}
          >
            Load More Stories
          </Button>
        </div>
      )}
    </div>
  );
}
