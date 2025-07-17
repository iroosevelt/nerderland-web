"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

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
};

const boards: Board[] = [
  { id: 1, name: "Tech Memes" },
  { id: 2, name: "AI Experiments" },
  { id: 3, name: "Nerdrum Lab" },
  { id: 4, name: "Code Scraps" },
  { id: 5, name: "Hack & Philosophy" },
];

export function BoardMultiSelect({
  selected,
  setSelected,
}: {
  selected: Board[];
  setSelected: (boards: Board[]) => void;
}) {
  const toggleBoard = (board: Board) => {
    const alreadySelected = selected.find((b) => b.id === board.id);
    if (alreadySelected) {
      setSelected(selected.filter((b) => b.id !== board.id));
    } else {
      setSelected([...selected, board]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between rounded-none text-xs"
        >
          {selected.length === 0
            ? "Beam to boards (optional)"
            : `${selected.length} board${
                selected.length > 1 ? "s" : ""
              } selected`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0 rounded-none">
        <Command>
          <CommandInput placeholder="Search boards..." />
          <CommandEmpty>No boards found.</CommandEmpty>
          <CommandGroup>
            {boards.map((board) => {
              const isSelected = selected.some((b) => b.id === board.id);
              return (
                <CommandItem
                  key={board.id}
                  onSelect={() => toggleBoard(board)}
                  className="cursor-pointer"
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-white/20",
                      isSelected && "bg-[var(--color-yellow)] text-black"
                    )}
                  >
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                  {board.name}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
