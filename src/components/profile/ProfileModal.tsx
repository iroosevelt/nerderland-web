"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/stores/useUserProfile";
import { Avatar, AvatarImage } from "../ui/avatar";

const nerdityLevels = [
  {
    level: "Little Wea",
    avatars: ["little_wea", "little_wea_2"],
  },
  {
    level: "Laper",
    avatars: ["laper", "laper_2"],
  },
  {
    level: "Nu-Goth",
    avatars: ["nu-goth", "nu-goth_2"],
  },
  {
    level: "Thriller",
    avatars: ["thriller", "thriller_2"],
  },
  {
    level: "Algo Hacker",
    avatars: ["algo_hacker", "algo_hacker_2"],
  },
  {
    level: "Prophet",
    avatars: ["prophet", "prophet_2"],
  },
  {
    level: "Observer",
    avatars: ["observer", "observer_2"],
  },
  {
    level: "Founder",
    avatars: ["founder", "founder_2"],
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProfileModal({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState("Profile");
  const { address, avatar, username, setAddress, setAvatar, setUsername } =
    useUserProfile();

  const handleSave = () => {
    // You could later send this to your API here
    console.log("Saved:", { address, avatar });
  };

  return (
    <>
      {/* LEFT PANEL */}
      <div className="bg-black/90 border-r border-white/10 h-auto flex flex-col w-full max-w-[460px] text-white overflow-hidden">
        <div className="flex flex-col px-6 py-4">
          {/* Tabs */}
          <div className="flex items-center space-x-4 mb-4">
            {["Profile", "Subs", "Nerdrums", "Saved Stuff"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 text-sm cursor-pointer transition ${
                  activeTab === tab
                    ? "bg-[#FF31E2] text-black font-bold"
                    : "opacity-40"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Avatars */}
          <div className="pb-20 h-[60vh] overflow-y-auto">
            <div className="flex items-center space-x-2 overflow-x-auto mb-6">
              {nerdityLevels[0].avatars.map((name) => (
                <button key={name} onClick={() => setAvatar(name)}>
                  <Avatar
                    className={`rounded-full border-2 ${
                      avatar === name ? "border-[#FFF200]" : "border-white/10"
                    } cursor-pointer`}
                  >
                    <AvatarImage
                      className="object-cover"
                      src={`/img/avatar/${name}.png`}
                    />
                  </Avatar>
                </button>
              ))}
            </div>

            {/* Username Input */}
            <label className="text-xs text-white/60 mb-1 block">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-black border border-white/10 text-sm px-3 py-2 mb-3 w-full"
              placeholder="Trouper"
            />
            {/* Crypto Input */}
            <label className="text-xs text-white/60 mb-1 block">
              Enter Crypto Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="bg-black border border-white/10 text-sm px-3 py-2 mb-3 w-full"
              placeholder="0x2840...159A"
            />

            <div className="flex flex-col space-y-4 mb-4">
              <button className="text-[#1129FF] w-fit font-mono text-xs cursor-pointer">
                Reset code
              </button>
              <button
                onClick={handleSave}
                className="bg-[#FFF200] font-mono w-fit text-[#1129FF] px-3 py-1 text-xs rounded-none cursor-pointer"
              >
                Save
              </button>
            </div>

            {/* Nerdy Points */}
            <div className="flex items-center text-sm mb-2 font-display">
              <Image
                aria-label="hidden"
                src="/img/coin.gif"
                alt="Coin"
                width={28}
                height={28}
              />
              NERDY POINTS
            </div>
            <div className="bg-[#00FF47]/20 h-4 w-full mb-4 overflow-hidden">
              <div className="bg-[#00FF47] h-full w-[23%]" />
            </div>

            {/* Nerdity Levels */}
            <div className="text-sm mb-4 font-display">LEVEL OF NERDITY</div>
            <ul className="space-y-4 text-sm font-display">
              {nerdityLevels.map(({ level, avatars }) => (
                <li key={level} className="flex items-center space-x-1">
                  <div className="flex items-center space-x-1">
                    {avatars.map((avatarName) => (
                      <Image
                        key={avatarName}
                        src={`/img/avatar/${avatarName}.png`}
                        alt={avatarName}
                        width={30}
                        height={30}
                        className="rounded-full border border-white/10"
                      />
                    ))}
                    <span className="text-white">{level}</span>
                  </div>
                  <div className="flex items-center ml-auto">
                    <Image
                      aria-label="hidden"
                      className="ml-auto"
                      src="/img/question.gif"
                      alt="what?"
                      width={24}
                      height={24}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="bg-black/80 h-auto w-full overflow-y-auto px-6 py-4 text-white">
        {activeTab === "Profile" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <Image
                  src={`/img/avatar/${avatar}.png`}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <div className="text-[#FF31E2] font-display">{username}</div>
                  <div className="text-xs opacity-60">0 Subscribers</div>
                </div>
              </div>
              <Button className="bg-[#FFF200] text-black text-xs px-2 py-1 rounded-none">
                Share
              </Button>
            </div>

            <div className="mt-6">
              <h3 className="text-sm mb-2">MY STUFF</h3>
              <div className="text-xs text-white/50 mb-4">You got nothing!</div>
              <Button className="bg-[#FFF200] text-black text-xs px-2 py-1 rounded-none">
                Create
              </Button>
            </div>
          </>
        )}

        {activeTab === "Subs" && (
          <div className="text-sm">Subscribed boards go here...</div>
        )}
        {activeTab === "Nerdrums" && (
          <div className="text-sm">Your nerdrums go here...</div>
        )}
        {activeTab === "Saved Stuff" && (
          <div className="text-sm">Saved folders/posts show here...</div>
        )}
      </div>
    </>
  );
}
