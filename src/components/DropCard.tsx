import React from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { useRouter } from "next/navigation";

export default function DropCard() {
  const router = useRouter();

  return (
    <button className="w-[120px]" onClick={() => router.push("/drop/test")}>
      <div
        aria-label="button"
        className="flex items-center justify-center pt-10 w-[120px] h-[100px] bg-contain bg-center overflow-hidden p-4"
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
    </button>
  );
}
