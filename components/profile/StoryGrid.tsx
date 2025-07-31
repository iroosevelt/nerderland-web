"use client";

import StoryCard from "@/components/cards/StoryCard";
import { processStoryDescription } from "@/lib/utils/textUtils";
import { getAvatarFromLevel } from "@/components/NerdityLevel";

interface Story {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  views: number | null;
  created_at: Date | null;
  slug: string | null;
  formatted_created_at: string;
}

interface Author {
  id: number;
  username: string | null;
  avatar_url?: string | null;
  level?: number | null;
  nerdy_points?: number | null;
}

interface StoryGridProps {
  stories: Story[];
  author: Author;
}

export function StoryGrid({ stories, author }: StoryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          id={story.id}
          title={story.title}
          image={story.media_url || "/img/story_placeholder.png"}
          description={processStoryDescription(story.content, 100)}
          slug={story.slug}
          user={{
            id: author.id,
            username: author.username || "Anonymous",
            avatar_url: author.avatar_url || 
              getAvatarFromLevel(
                author.level || 1,
                author.nerdy_points || 0
              ),
          }}
        />
      ))}
    </div>
  );
}