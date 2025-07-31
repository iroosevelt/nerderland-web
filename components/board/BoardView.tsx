// components/board/BoardView.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import { useUserProfile } from "@/stores/useUserProfile";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BoardProfile } from "./BoardProfile";
import { BoardTabs } from "./BoardTabs";
import { BoardSkeleton } from "./BoardSkeleton";
import type { BoardMember, Story, BoardResponse } from "./types";

interface BoardViewProps {
  username: string;
  boardId: number;
}

export function BoardView({ username, boardId }: BoardViewProps) {
  const { user } = useUserProfile();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  // Fetch board data
  const { data, isLoading, error, refetch } = useQuery<BoardResponse>({
    queryKey: ["board", username, boardId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${username}/boards/${boardId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Board not found");
        }
        if (response.status === 403) {
          throw new Error("This board is private");
        }
        throw new Error(`Failed to fetch board: ${response.status}`);
      }

      return response.json();
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch board members
  const { data: membersData, isLoading: membersLoading } = useQuery<{
    members: BoardMember[];
  }>({
    queryKey: ["board-members", username, boardId],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${username}/boards/${boardId}/members`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      return response.json();
    },
    enabled: !!data?.board,
  });

  // Fetch board stories for feed
  const { data: storiesData, isLoading: storiesLoading } = useQuery<{
    stories: Story[];
  }>({
    queryKey: ["board-stories", username, boardId],
    queryFn: async () => {
      const response = await fetch(
        `/api/users/${username}/boards/${boardId}/stories`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }
      return response.json();
    },
    enabled: !!data?.board,
  });

  const handleJoinBoard = async () => {
    if (!user?.wallet_address) {
      toast.error("Please connect your wallet to join this board");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch(
        `/api/users/${username}/boards/${boardId}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast.success("Joined board successfully!");
        refetch(); // Refresh board data to update member count and status
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to join board");
      }
    } catch (error) {
      console.error("Error joining board:", error);
      toast.error("Failed to join board");
    } finally {
      setIsJoining(false);
    }
  };

  // Loading state with proper skeleton
  if (isLoading) {
    return <BoardSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col bg-black lg:flex-row w-full h-full overflow-hidden">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-xs font-bold text-red-400 mb-4">
              {error.message}
            </h1>
            <p className="text-gray-400 text-xs mb-6">
              {error.message === "Board not found"
                ? "The board you're looking for doesn't exist or may have been deleted."
                : error.message === "This board is private"
                ? "This board is private and you don't have access to view it."
                : "Something went wrong while loading the board."}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Go Back
              </Button>
              <Button
                onClick={() => refetch()}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.board) {
    return (
      <div className="flex flex-col bg-black lg:flex-row w-full h-full overflow-hidden">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 text-center">
          <p className="text-gray-400">Board data not available</p>
        </div>
      </div>
    );
  }

  const { board, isOwner, isMember } = data;

  return (
    <div className="flex flex-col bg-black lg:flex-row w-full h-full overflow-hidden col-span-2">
      <BoardProfile
        board={board}
        username={username}
        boardId={boardId}
        isOwner={isOwner}
        isMember={isMember}
        isJoining={isJoining}
        onJoinBoard={handleJoinBoard}
        onRefetch={refetch}
      />

      <BoardTabs
        stories={storiesData?.stories || []}
        storiesLoading={storiesLoading}
        members={membersData?.members || []}
        membersLoading={membersLoading}
      />
    </div>
  );
}
