import React from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";

export default function BoardCard() {
  return (
    <div className="flex items-center p-4 bg-white text-black w-[300px]">
      <Avatar className="w-10 h-10">
        <AvatarImage src="https://github.com/shadcn.png" />
      </Avatar>
      <div className="px-4 flex flex-col flex-1">
        <h3 className="font-display">Entropy</h3>
        <p className="font-sans text-xs">100 online</p>
      </div>
      <Button
        size="sm"
        className="font-bold bg-[var(--color-yellow)] hover:bg-[var(--color-yellow)] border border-black rounded-none cursor-pointer"
      >
        Open
      </Button>
    </div>
  );
}
