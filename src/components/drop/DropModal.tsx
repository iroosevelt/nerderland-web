"use client";

import Image from "next/image";
import { FiDownload, FiLock, FiUnlock } from "react-icons/fi";
import { AiOutlineFile, AiOutlineFileImage } from "react-icons/ai";
import { formatDistanceToNowStrict } from "date-fns";
import { Avatar, AvatarImage } from "../ui/avatar";
import DropCard from "../DropCard";

type DropFile = {
  name: string;
  type: string;
  size: string;
  url: string;
};

const mockFiles: DropFile[] = [
  {
    name: "Screenshot_002.png",
    type: "image/png",
    size: "1.2 MB",
    url: "#",
  },
  {
    name: "Resume_2025.pdf",
    type: "application/pdf",
    size: "300 KB",
    url: "#",
  },
  {
    name: "source-code.zip",
    type: "application/zip",
    size: "4.5 MB",
    url: "#",
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DropModal({ slug }: { slug: string }) {
  const isLocked = false; // simulate lock
  const dropCreated = new Date(); // in real use, fetch from backend

  return (
    <div className="flex w-full h-full overflow-hidden col-span-2">
      {/* LEFT: Drop Folder Files */}
      <div className="bg-black/70 p-6 overflow-y-auto flex-1 min-w-0">
        {/* Folder Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/founder.png"
              />
            </Avatar>
            <div>
              <p className="text-sm font-bold">Nerd-c930</p>
              <p className="text-xs opacity-60">
                Drop expires in{" "}
                {formatDistanceToNowStrict(
                  new Date(dropCreated.getTime() + 24 * 60 * 60 * 1000)
                )}
              </p>
            </div>
          </div>
          <div>
            {isLocked ? (
              <div className="flex items-center text-yellow-400 text-xs gap-1">
                <FiLock /> Secured
              </div>
            ) : (
              <div className="flex items-center text-green-400 text-xs gap-1">
                <FiUnlock /> Public
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        <div className="bg-black/50 border border-white/10 rounded-md divide-y divide-white/5 overflow-hidden">
          {mockFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                {file.type.includes("image") ? (
                  <AiOutlineFileImage size={24} className="text-yellow-400" />
                ) : (
                  <AiOutlineFile size={24} className="text-yellow-400" />
                )}
                <div>
                  <p className="text-sm">{file.name}</p>
                  <p className="text-xs opacity-50">{file.size}</p>
                </div>
              </div>
              <a
                href={file.url}
                download
                className="text-xs flex items-center gap-1 hover:underline"
              >
                <FiDownload /> Download
              </a>
            </div>
          ))}
        </div>

        {/* Optional: Drop Description */}
        <div className="mt-6 text-sm opacity-80">
          This drop includes assets and files shared temporarily with the
          community. Folders expire in 24 hours.
        </div>
      </div>

      {/* RIGHT: Author Info */}
      <div className="bg-black/60 p-6 border-l border-white/10 w-[320px] flex flex-col shrink-0 overflow-y-auto">
        <div className="flex flex-col items-start w-full mb-6">
          <div className="flex flex-col gap-2 mb-3">
            <Avatar className="w-12 h-12 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/founder.png"
              />
            </Avatar>
            <p className="font-bold">Nerd-c930</p>
            <p className="text-xs opacity-50">1.2K Subscribers</p>
          </div>
          <button className="bg-[var(--color-yellow)] text-black text-xs border px-2 py-1">
            Subscribe
          </button>
        </div>

        <div>
          <h4 className="text-sm mb-2 border-b border-white/10 pb-1">
            More Drops
          </h4>
          <section className="pb-8 px-0">
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {[...Array(9)].map((_, index) => (
                <DropCard key={`folder-${index}`} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
