"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import { useWalletUser } from "@/hooks/useWalletUser";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

type Comment = {
  id: number;
  content: string;
  created_at: string;
  parent_id: number | null;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  } | null;
  replies: Comment[];
  replyingTo?: string; // For flattened display
};

interface CommentsProps {
  storyId: number;
}

interface CommentComponentProps {
  comment: Comment;
  isReply?: boolean;
  user: {
    id: number;
    username: string | null;
    wallet_address: string;
    avatar_url: string | null;
  } | null;
  onReply: (comment: Comment) => void;
  formatDate: (dateString: string) => string;
  depth?: number;
  replyingToUsername?: string;
}

// Function to count total replies recursively
const getTotalReplyCount = (replies: Comment[]): number => {
  let count = 0;
  for (const reply of replies) {
    count += 1; // Count this reply
    if (reply.replies && reply.replies.length > 0) {
      count += getTotalReplyCount(reply.replies); // Count nested replies
    }
  }
  return count;
};

// Function to flatten nested replies into a single thread
const flattenReplies = (replies: Comment[], replyingTo?: string): Comment[] => {
  const flattened: Comment[] = [];

  for (const reply of replies) {
    // Add the current reply
    flattened.push({
      ...reply,
      replyingTo: replyingTo,
      replies: [], // Remove nested replies to prevent further nesting
    });

    // If this reply has sub-replies, flatten them too
    if (reply.replies && reply.replies.length > 0) {
      const subReplies = flattenReplies(
        reply.replies,
        reply.user?.username || "Anonymous"
      );
      flattened.push(...subReplies);
    }
  }

  return flattened;
};

const CommentComponent = ({
  comment,
  isReply = false,
  user,
  onReply,
  formatDate,
  depth = 0,
  replyingToUsername,
}: CommentComponentProps) => {
  const [showReplies, setShowReplies] = useState(true);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(20); // Show 20 initially
  const totalReplyCount = getTotalReplyCount(comment.replies || []);

  // Simple 2-level threading: root comments and one level of replies
  const getIndentClass = () => {
    if (!isReply) return ""; // Root comments
    return "ml-6 md:ml-8 border-l border-white/10 pl-4"; // All replies at same level
  };

  return (
    <div className={getIndentClass()}>
      <div className="flex gap-3 mb-3">
        <Link href={`/${comment.user?.username}`} className="flex-shrink-0">
          <Avatar className="w-8 h-8 border border-white/20 hover:border-white/40 transition-colors">
            <AvatarImage
              src={comment.user?.avatar_url || "/img/avatar/little_wea.png"}
              alt={`${comment.user?.username}'s avatar`}
              className="object-cover"
            />
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <Link
              href={`/${comment.user?.username}`}
              className="text-sm font-medium text-white hover:text-[var(--color-yellow)] transition-colors truncate"
            >
              {comment.user?.username || "Anonymous"}
            </Link>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatDate(comment.created_at)}
            </span>
          </div>
          {/* Show "replying to @username" for deep replies */}
          {replyingToUsername && (
            <p className="text-xs text-gray-400 mb-1 break-words">
              Replying to{" "}
              <span className="text-[var(--color-yellow)] break-words">
                @{replyingToUsername}
              </span>
            </p>
          )}
          <p className="text-sm text-gray-200 leading-relaxed mb-2 break-words whitespace-pre-wrap overflow-wrap-anywhere">
            {comment.content}
          </p>
          <div className="flex items-center gap-3">
            {user && (
              <Button
                onClick={() => onReply(comment)}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-white h-auto p-1"
              >
                Reply
              </Button>
            )}
            {!user && (
              <span className="text-xs text-gray-400">Sign in to reply</span>
            )}

            {/* Show/Hide replies toggle */}
            {totalReplyCount > 0 && (
              <Button
                onClick={() => {
                  setShowReplies(!showReplies);
                  // Reset pagination when showing replies again
                  if (!showReplies) {
                    setVisibleRepliesCount(20);
                  }
                }}
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-white h-auto p-1 flex items-center gap-1"
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide {totalReplyCount}{" "}
                    {totalReplyCount === 1 ? "reply" : "replies"}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Show {totalReplyCount}{" "}
                    {totalReplyCount === 1 ? "reply" : "replies"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Render replies - only for root comments (depth 0) */}
      {depth === 0 &&
        comment.replies &&
        comment.replies.length > 0 &&
        showReplies && (
          <div className="mt-4 space-y-4">
            {flattenReplies(comment.replies)
              .slice(0, visibleRepliesCount)
              .map((flatReply) => (
                <CommentComponent
                  key={flatReply.id}
                  comment={flatReply}
                  isReply={true}
                  user={user}
                  onReply={onReply}
                  formatDate={formatDate}
                  depth={1}
                  replyingToUsername={flatReply.replyingTo}
                />
              ))}

            {/* Show more replies button */}
            {totalReplyCount > visibleRepliesCount && (
              <div className="ml-6 md:ml-8">
                <Button
                  onClick={() => setVisibleRepliesCount((prev) => prev + 20)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white h-auto p-1 flex items-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  Show {Math.min(
                    20,
                    totalReplyCount - visibleRepliesCount
                  )}{" "}
                  more{" "}
                  {Math.min(20, totalReplyCount - visibleRepliesCount) === 1
                    ? "reply"
                    : "replies"}
                </Button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export function Comments({ storyId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const { user } = useWalletUser();

  useEffect(() => {
    loadComments();
  }, [storyId]);

  // Auto-refresh comments every 30 seconds to show new replies from other users
  useEffect(() => {
    const interval = setInterval(() => {
      loadComments();
    }, 30000); // 30 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [storyId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/stories/${storyId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        toast.success("Comment added!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add comment");
      }
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !replyingTo) return;

    try {
      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parent_id: replyingTo.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add reply to the appropriate parent comment (handle nested replies)
        const addReplyToComment = (comment: Comment): Comment => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [{ ...data.comment, replies: [] }, ...comment.replies],
            };
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(addReplyToComment),
            };
          }
          return comment;
        };

        setComments(comments.map(addReplyToComment));
        setReplyContent("");
        setReplyingTo(null);
        setReplyDialogOpen(false);
        toast.success("Reply added!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add reply");
      }
    } catch {
      toast.error("Failed to add reply");
    }
  };

  const openReplyDialog = (comment: Comment) => {
    setReplyingTo(comment);
    setReplyDialogOpen(true);
    setReplyContent("");
  };

  const closeReplyDialog = () => {
    setReplyDialogOpen(false);
    setReplyingTo(null);
    setReplyContent("");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-white/5 h-20 rounded"></div>
        <div className="animate-pulse bg-white/5 h-16 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment}>
          <div className="flex gap-3">
            <Avatar className="w-8 h-8 border border-white/20 flex-shrink-0">
              <AvatarImage
                src={user.avatar_url || "/img/avatar/little_wea.png"}
                alt="Your avatar"
                className="object-cover"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-black/30 border border-white/10 px-4 py-3 rounded-none text-sm min-h-[80px] resize-none focus:border-white/20 focus:outline-none break-words"
              />
              <div className="mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="bg-[var(--color-yellow)] text-black px-4 py-2 text-sm rounded-none disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-yellow)] transition-colors"
                >
                  Beam it!
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-400 text-sm">Sign in to comment</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentComponent
              key={comment.id}
              comment={comment}
              user={user}
              onReply={openReplyDialog}
              formatDate={formatDate}
              depth={0}
            />
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="bg-[#141415] border-white/5 text-white rounded-none">
          <DialogHeader>
            <DialogTitle className="text-sm font-display">
              Replying to
            </DialogTitle>
            {replyingTo && (
              <div className="flex gap-3 mt-2 p-3 bg-white/10 rounded-none border border-white/5">
                <Avatar className="w-6 h-6 border border-white/20 flex-shrink-0">
                  <AvatarImage
                    src={
                      replyingTo.user?.avatar_url ||
                      "/img/avatar/little_wea.png"
                    }
                    alt={`${replyingTo.user?.username}'s avatar`}
                    className="object-cover"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 font-medium truncate">
                    {replyingTo.user?.username || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-2 mt-1 break-words">
                    {replyingTo.content}
                  </p>
                </div>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmitReply} className="space-y-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full bg-transparent border border-white/10 px-3 py-3 rounded-none text-sm min-h-[100px] resize-none focus:border-[var(--color-yellow)] focus:outline-none text-white placeholder-gray-400 break-words"
              autoFocus
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeReplyDialog}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 rounded-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!replyContent.trim()}
                className="bg-[var(--color-yellow)] text-black hover:bg-[var(--color-blue)] hover:text-[var(--color-yellow)] disabled:opacity-50 rounded-none"
              >
                Beam it!
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
