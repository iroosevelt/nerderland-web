// components/BoardGrid.tsx

"use client";

import { useQuery } from "@tanstack/react-query";
import BoardCard from "./cards/BoardCard";
import Loader from "./Loader";

type Board = {
  id: number;
  name: string;
  description: string | null;
  avatar_url?: string | null;
  is_public?: boolean | null;
  member_count: number | null;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
};

interface BoardGridProps {
  username?: string; // Optional: for user-specific boards
  limit?: number;
  className?: string;
}

export const BoardGrid = ({
  username,
  limit = 6,
  className = "",
}: BoardGridProps) => {
  // Fetch boards function
  const fetchBoards = async (): Promise<Board[]> => {
    try {
      let url: string;

      if (username) {
        // Fetch user-specific boards
        url = `/api/users/${username}/boards?limit=${limit}`;
      } else {
        // Fetch all public boards
        url = `/api/boards?limit=${limit}&offset=0`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch boards: ${response.status}`);
      }

      const data = await response.json();

      // Handle different response formats and ensure we always return an array
      let boardsArray: Board[] = [];

      if (data.boards && Array.isArray(data.boards)) {
        boardsArray = data.boards;
      } else if (Array.isArray(data)) {
        boardsArray = data;
      } else {
        console.warn("Unexpected response format:", data);
        boardsArray = [];
      }

      return boardsArray;
    } catch (error) {
      console.error("Error fetching boards:", error);
      throw error;
    }
  };

  // Use React Query for caching and error handling
  const {
    data: boards = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["boards", username, limit],
    queryFn: fetchBoards,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: 1000,
  });

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`flex justify-center items-center min-h-[200px] ${className}`}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader />
          <p className="text-gray-400 text-sm">Loading boards...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex justify-center items-center min-h-[200px] ${className}`}
      >
        <div className="text-center">
          <p className="text-red-400 mb-4 text-xs">
            Failed to load boards:{" "}
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
  if (!Array.isArray(boards) || boards.length === 0) {
    return (
      <div
        className={`flex justify-center items-center min-h-[200px] ${className}`}
      >
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            {username ? `No boards found for ${username}` : "No boards found"}
          </p>
          {!username && (
            <p className="text-gray-500 text-sm">
              Be the first to create a board!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 ${className}`}
    >
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} />
      ))}
    </div>
  );
};
