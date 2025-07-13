import React from "react";
import { Avatar, AvatarImage } from "./ui/avatar";

export default function FolderCard() {
  return (
    <div className="w-[120px]">
      <div
        aria-label="button"
        className="flex items-center justify-center pt-10 w-[120px] h-[100px] bg-contain bg-center overflow-hidden p-4 cursor-pointer"
        style={{
          backgroundImage: 'url("/img/folder.svg")',
          backgroundRepeat: "no-repeat",
        }}
      >
        <Avatar className="">
          <AvatarImage src="/img/avatar/little_wea.png" />
        </Avatar>
      </div>
      <h4 className="text-xs py-1 truncate w-full">Folder Title</h4>
    </div>
  );
}
