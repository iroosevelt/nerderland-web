// components/board/BoardFeed.tsx

"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Book } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Story } from "./types";

interface BoardFeedProps {
  stories: Story[];
  isLoading: boolean;
}

export function BoardFeed({ stories, isLoading }: BoardFeedProps) {
  const router = useRouter();


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-white/5 h-16 rounded" />
        ))}
      </div>
    );
  }

  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-gray-400">
        <Book className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <p className="mb-4">No stories in this board yet</p>
        {/* <Button
          onClick={handleCreateContent}
          className="bg-[var(--color-yellow)] text-black hover:bg-[var(--color-yellow)] text-sm"
        >
          Create First Story
        </Button> */}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stories.map((story) => (
        <div
          key={story.id}
          className="bg-white/5 rounded-lg p-4 hover:bg-white/7 transition-colors"
        >
          {/* Story Header */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarImage
                src={story.user.avatar_url}
                alt={story.user.username}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-700 text-white text-xs">
                {story.user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-medium text-white text-sm hover:text-[var(--color-yellow)]  cursor-pointer"
                  onClick={() => router.push(`/${story.user.username}`)}
                >
                  {story.user.username}
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-400 text-xs">
                  {new Date(story.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>{story.views} views</span>
              </div>
            </div>
          </div>

          {/* Story Content */}
          <div
            className="cursor-pointer"
            onClick={() =>
              router.push(`/${story.user.username}/stories/${story.slug}`)
            }
          >
            <h2 className="text-lg font-bold text-white mb-3 hover:text-[var(--color-yellow)]  transition-colors">
              {story.title}
            </h2>

            {/* Story Media */}
            {story.media_url && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img
                  src={story.media_url}
                  alt={story.title}
                  className="w-full max-h-96 object-cover"
                />
              </div>
            )}

            {/* Story Content Preview */}
            <div className="text-gray-300 text-sm leading-relaxed">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html:
                    story.content.length > 300
                      ? story.content.substring(0, 300) + "..."
                      : story.content,
                }}
              />
              {story.content.length > 300 && (
                <span className="text-[var(--color-yellow)]  hover:text-[var(--color-yellow)]  cursor-pointer font-medium mt-2 inline-block">
                  Read more
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
