// components/forms/BoardMultiSelect.tsx

"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useUserProfile } from "@/stores/useUserProfile";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Board = {
  id: number;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  role?: string; // "owner" or "member"
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
};

interface BoardMultiSelectProps {
  selected: string[]; // Array of board IDs as strings
  setSelected: (boardIds: string[]) => void;
  disabled?: boolean;
}

export function BoardMultiSelect({
  selected,
  setSelected,
  disabled = false,
}: BoardMultiSelectProps) {
  const { user } = useUserProfile();

  // Fetch user's joined boards (both owned and member boards)
  const { data: boardsData, isLoading, error } = useQuery({
    queryKey: ["joinedBoards", user?.wallet_address],
    queryFn: async (): Promise<Board[]> => {
      if (!user?.wallet_address) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/user/joined-boards`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error(`Failed to fetch boards: ${response.status}`);
      }

      const data = await response.json();
      return data.boards || [];
    },
    enabled: !!user?.wallet_address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof Error && (
        error.message.includes("Authentication") || 
        error.message.includes("User not found") ||
        error.message.includes("401")
      )) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });

  const boards = boardsData || [];

  const toggleBoard = (boardId: string) => {
    if (disabled) return;

    const alreadySelected = selected.includes(boardId);
    if (alreadySelected) {
      setSelected(selected.filter((id) => id !== boardId));
    } else {
      setSelected([...selected, boardId]);
    }
  };

  const getSelectedBoardNames = () => {
    return boards
      .filter((board) => selected.includes(board.id.toString()))
      .map((board) => board.name);
  };

  const selectedNames = getSelectedBoardNames();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled || isLoading || !user?.wallet_address}
          className="w-full justify-between rounded-none text-xs bg-black border-white/20 text-white hover:bg-gray-900"
        >
          {!user?.wallet_address
            ? "Connect wallet to use boards"
            : error
            ? "Failed to load boards"
            : isLoading
            ? "Loading boards..."
            : selected.length === 0
            ? "Beam to boards (optional)"
            : selectedNames.length <= 2
            ? selectedNames.join(", ")
            : `${selected.length} board${
                selected.length > 1 ? "s" : ""
              } selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0 rounded-none bg-black border-white/20">
        <Command className="bg-black text-white">
          <CommandInput
            placeholder="Search your boards..."
            className="text-white"
          />
          <CommandEmpty>
            {error ? (
              <div className="p-4 text-center text-sm text-gray-400">
                <p>Failed to load boards.</p>
                <p className="text-xs mt-1">
                  {error instanceof Error && error.message.includes("Authentication") 
                    ? "Please connect your wallet."
                    : "Please try again later."}
                </p>
              </div>
            ) : boards.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                <p>No boards found.</p>
                <p className="text-xs mt-1">
                  Create a board first to add stories to it.
                </p>
              </div>
            ) : (
              "No boards found."
            )}
          </CommandEmpty>
          {boards.length > 0 && (
            <CommandGroup>
              {boards.map((board) => {
                const isSelected = selected.includes(board.id.toString());
                return (
                  <CommandItem
                    key={board.id}
                    onSelect={() => toggleBoard(board.id.toString())}
                    className="cursor-pointer text-white hover:bg-gray-800"
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/20",
                        isSelected && "bg-[var(--color-yellow)] text-black"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{board.name}</span>
                        {board.role === "owner" && (
                          <span className="text-xs bg-yellow-400 text-black px-1 rounded">
                            OWNER
                          </span>
                        )}
                      </div>
                      {board.description && (
                        <span className="text-xs text-gray-400 truncate">
                          {board.description}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        by {board.user.username}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
