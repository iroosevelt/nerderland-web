"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "../ui/avatar";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NerdrumModal({ slug }: { slug: string }) {
  const [tab, setTab] = useState<"feed" | "members">("feed");

  return (
    <div className="flex w-full h-full overflow-hidden col-span-2">
      {/* LEFT: Feed or Members */}
      <div className="flex-1 bg-black/70 p-4 overflow-y-auto">
        <div className="flex gap-4 mb-4 text-sm">
          <button
            onClick={() => setTab("feed")}
            className={
              tab === "feed"
                ? "bg-[var(--color-yellow)] text-black px-2 py-1"
                : "text-white"
            }
          >
            Feed
          </button>
          <button
            onClick={() => setTab("members")}
            className={
              tab === "members"
                ? "bg-[var(--color-yellow)] text-black px-2 py-1"
                : "text-white"
            }
          >
            Members
          </button>
        </div>

        {tab === "feed" ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-white/10 p-3 text-sm">
                <div className="flex gap-2 items-center mb-1">
                  <Avatar className="w-10 h-10 border border-white/20">
                    <AvatarImage
                      className="object-cover"
                      src="/img/avatar/founder.png"
                    />
                  </Avatar>
                  <span className="font-bold">member</span>
                  <span className="opacity-50">2h ago</span>
                </div>
                <p className="py-1">Some nerdy post content...</p>
                <button className="text-xs mt-2">Reply</button>
              </div>
            ))}
            <button className="text-center w-full text-xs">Load More</button>
          </div>
        ) : (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-b border-white/10 p-3 text-sm">
                <div className="flex gap-2 items-center mb-1">
                  <Avatar className="w-10 h-10 border border-white/20">
                    <AvatarImage
                      className="object-cover"
                      src="/img/avatar/nu-goth_2.png"
                    />
                  </Avatar>
                  <span className="font-bold">Nerd-xr9</span>
                  <span className="opacity-50">active</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Board info */}
      <div className="bg-black/50 p-4 border-l border-white/10 w-[300px] flex-shrink-0 overflow-y-auto">
        <div className="flex flex-col gap-2 mb-6">
          <Avatar className="w-12 h-12 border border-white/20">
            <AvatarImage
              className="object-cover"
              src="/img/avatar/founder.png"
            />
          </Avatar>
          <p className="font-bold">Entropy</p>
          <p className="text-xs opacity-50">32 members online</p>
          <button className="text-xs border px-2 py-1">Join</button>
        </div>
        <div>
          <h4 className="text-sm mb-2">Board Rules</h4>
          <ul className="text-xs opacity-80 space-y-1">
            <li>1. Stay Nerdy</li>
            <li>2. No spam</li>
            <li>3. Respect the rules</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
