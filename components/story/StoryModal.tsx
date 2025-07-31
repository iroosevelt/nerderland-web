// components/StoryModal.tsx

"use client";

import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import StoryCard from "../cards/StoryCard";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Loader from "../Loader";
import { Comments } from "./Comments";
import { useWalletUser } from "@/hooks/useWalletUser";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SubscribeButton from "@/components/SubscribeButton";
import { getAvatarFromLevel } from "@/components/NerdityLevel";

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

// Helper function to strip HTML tags and get plain text
const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  if (typeof window !== "undefined") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "").trim();
  }
  // Server-side fallback
  return html.replace(/<[^>]*>/g, "").trim();
};

// Helper function to truncate text
const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

interface StoryModalProps {
  slug: string;
  username?: string; // Optional: if we know the username from the route
}

export function StoryModal({ slug, username }: StoryModalProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [moreStories, setMoreStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useWalletUser();
  const router = useRouter();

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      setColumns(width >= 600 ? 2 : 1);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);

        let storyUrl: string;

        if (username) {
          // Use the user-specific story API route
          storyUrl = `/api/users/${username}/stories/${slug}`;
        } else {
          // Fallback to general story API (we might need to create this)
          storyUrl = `/api/stories/${slug}`;
        }

        // Load main story
        const storyRes = await fetch(storyUrl);
        if (!storyRes.ok) throw new Error("Story not found");
        const storyData = await storyRes.json();
        setStory(storyData);

        // Load more stories from the general feed
        const moreRes = await fetch("/api/stories?limit=6&offset=0");
        if (moreRes.ok) {
          const moreData = await moreRes.json();
          const stories = moreData.stories || moreData;
          setMoreStories(stories.filter((s: Story) => s.id !== storyData.id));
        }

        // Load reactions count
        const reactionsRes = await fetch(
          `/api/stories/${storyData.id}/reactions`
        );
        if (reactionsRes.ok) {
          const reactionsData = await reactionsRes.json();
          setReactionCount(reactionsData.reactions.good_stuff || 0);
        }

        // Check if story is saved (if user is logged in)
        if (user) {
          const savedRes = await fetch(
            `/api/stories/${storyData.id}/save/check`
          );
          if (savedRes.ok) {
            const savedData = await savedRes.json();
            setIsSaved(savedData.saved);
          }
        }
      } catch (err) {
        console.error("Error loading story:", err);
        toast.error("Failed to load story");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadStory();
    }
  }, [slug, username, user]);

  const handleGoodStuffReaction = async () => {
    if (!user || !story || isReacting) return;

    // Prevent tipping own story
    if (story.user?.id === user.id) {
      toast.error("You cannot tip your own story");
      return;
    }

    setIsReacting(true);
    try {
      const response = await fetch(`/api/stories/${story.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "good_stuff" }),
      });

      if (response.ok) {
        const data = await response.json();
        setReactionCount((prev) => prev + 1);
        toast.success(
          `Tipped 1 nerdy point! ${data.points_remaining} points remaining`
        );
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to react");
      }
    } catch {
      toast.error("Failed to react");
    } finally {
      setIsReacting(false);
    }
  };

  const handleSaveStory = async () => {
    if (!user || !story) return;

    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await fetch(`/api/stories/${story.id}/save`, { method });

      if (response.ok) {
        setIsSaved(!isSaved);
        toast.success(isSaved ? "Story removed from saved" : "Story saved!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save story");
      }
    } catch {
      toast.error("Failed to save story");
    }
  };

  const handleEditStory = () => {
    if (!story) return;
    // Navigate to edit page
    router.push(`/upload?edit=${story.id}`);
  };

  const handleDeleteStory = async () => {
    if (!story || !user) return;

    // Confirm deletion
    if (
      !confirm(
        "Are you sure you want to delete this story? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Story deleted successfully");
        // Navigate back to user profile
        router.push(`/${story.user?.username || user.username}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete story");
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast.error("Failed to delete story");
    } finally {
      setIsDeleting(false);
    }
  };

  // Check if current user is the story owner
  const isStoryOwner = user && story && story.user?.id === user.id;

  if (loading) {
    return <Loader />;
  }

  if (!story) {
    return (
      <div className="flex w-full h-full items-center justify-center py-20">
        <p className="text-gray-400 uppercase text-sm">Story not found</p>
      </div>
    );
  }

  // Distribute more stories across columns
  const columnArrays = Array.from({ length: columns }, () => [] as Story[]);
  moreStories.forEach((story, index) => {
    columnArrays[index % columns].push(story);
  });

  return (
    <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden col-span-2">
      {/* LEFT: Story and comments */}
      <div className="flex-1 bg-black/70 p-4 sm:p-6 overflow-y-auto">
        {/* Author info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link href={`/${story.user?.username}`}>
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border border-white/20 hover:border-white/40 transition-colors cursor-pointer">
                <AvatarImage
                  className="object-cover"
                  src={getAvatarFromLevel(1, 0)} // Will be updated when we get level data
                />
              </Avatar>
            </Link>
            <div>
              <Link href={`/${story.user?.username}`}>
                <p className="text-sm font-bold hover:text-[var(--color-yellow)] transition-colors cursor-pointer">
                  {story.user?.username || "Anonymous"}
                </p>
              </Link>
              <p className="text-xs opacity-50">
                {new Date(story.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {isStoryOwner ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 h-auto text-gray-400 hover:text-white"
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-black border-white/10 text-white rounded-none"
              >
                <DropdownMenuItem
                  onClick={handleEditStory}
                  className="cursor-pointer hover:bg-[var(--color-pink)] rounded-none"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Story
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteStory}
                  disabled={isDeleting}
                  className="cursor-pointer hover:bg-red-600/20 rounded-none text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Story"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto text-gray-400 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Story content */}
        <div className="space-y-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {story.title}
          </h1>

          {story.media_url && (
            <Image
              src={story.media_url}
              alt={story.title}
              width={600}
              height={400}
              className="w-full rounded-lg object-cover"
              unoptimized={
                story.media_url.toLowerCase().includes(".gif") ||
                story.media_url.toLowerCase().includes("image/gif")
              }
            />
          )}

          <div
            className="prose prose-invert text-white max-w-none"
            dangerouslySetInnerHTML={{ __html: story.content }}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <p className="text-xs opacity-50">{story.views || 0} Views</p>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={handleGoodStuffReaction}
              disabled={!user || isReacting || story.user?.id === user?.id}
              className="flex items-center text-xs bg-[var(--color-blue)] text-[var(--color-yellow)] px-2 py-1 hover:bg-[var(--color-blue)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image
                aria-label="hidden"
                src="/img/coin.gif"
                alt="Coin"
                width={20}
                height={20}
                className={`sm:w-[28px] sm:h-[28px] ${
                  isReacting ? "animate-spin duration-300" : ""
                }`}
                unoptimized
              />
              <span className="hidden sm:inline">
                {isReacting ? "Tipping..." : "Good Stuff"}
              </span>
              {reactionCount > 0 && (
                <span className="ml-2 text-[var(--color-yellow)] font-bold px-1 py-0.5 rounded-none text-xs">
                  [{reactionCount}]
                </span>
              )}
            </button>
            <button
              onClick={handleSaveStory}
              disabled={!user}
              className={`text-xs px-2 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isSaved
                  ? "bg-[var(--color-pink)] text-white"
                  : "hover:bg-white/10"
              }`}
            >
              💾 {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* Comments section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          <Comments storyId={story.id} />
        </div>
      </div>

      {/* RIGHT: Author info and more stories */}
      <div className="w-full lg:w-[320px] bg-black/50 p-4 border-t lg:border-t-0 lg:border-l border-white/10 flex-shrink-0 overflow-y-auto">
        {/* Author section */}
        <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start w-full mb-6">
          <div className="flex lg:flex-col items-center lg:items-start gap-2 lg:gap-2 lg:mb-3">
            <Link href={`/${story.user?.username}`}>
              <Avatar className="w-10 h-10 lg:w-12 lg:h-12 border border-white/20 hover:border-white/40 transition-colors cursor-pointer">
                <AvatarImage
                  className="object-cover"
                  src={story.user?.avatar_url || "/img/avatar/little_wea.png"}
                />
              </Avatar>
            </Link>
            <div className="lg:text-center lg:w-full">
              <Link href={`/${story.user?.username}`}>
                <p className="font-bold hover:text-yellow-300 transition-colors cursor-pointer">
                  {story.user?.username || "Anonymous"}
                </p>
              </Link>
              <p className="text-xs opacity-50">Nerd Level 1</p>
            </div>
          </div>
          {story.user && (
            <SubscribeButton
              targetUserId={story.user.id}
              targetUsername={story.user.username}
              size="sm"
              className="text-xs"
            />
          )}
        </div>

        {/* More Stories */}
        {moreStories.length > 0 && (
          <div>
            <h4 className="text-xs mb-3 text-gray-300 font-medium">
              More Stories
            </h4>
            <div className="columns-2 lg:columns-2 gap-2 space-y-0">
              {moreStories.map((story) => (
                <div key={story.id} className="break-inside-avoid mb-2">
                  <StoryCard
                    id={story.id}
                    image={story.media_url || "/img/story_placeholder.png"}
                    title={story.title}
                    description={truncateText(stripHtmlTags(story.content))}
                    slug={story.slug}
                    user={story.user}
                    href={`/${story.user?.username}/stories/${
                      story.slug || story.id
                    }`}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
