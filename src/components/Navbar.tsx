"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage } from "./ui/avatar";

export const Navbar = () => {
  const router = useRouter();

  const handleOpenProfile = () => {
    router.push("/profile/me"); // triggers @modal route
  };

  const handleOpenUpload = () => {
    router.push("/upload");
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-[#FF31E2]">
      <div className="container max-w-5xl mx-auto flex justify-between items-center px-4 py-4 tracking-wider">
        {/* Left: Logo and UFO */}
        <div className="flex items-center space-x-4">
          <Image
            src="/img/911.gif"
            alt="Spinning UFO"
            width={50}
            height={50}
            priority
          />
          <Link href="/" aria-label="Go to homepage">
            <Image
              src="/logo.svg"
              alt="Nerderland Logo"
              width={199}
              height={68}
              priority
            />
          </Link>
        </div>

        {/* Center: Tagline */}
        <p className="text-sm text-[#FFF200] hidden md:block">
          “Inside every mystery, mystery...”
        </p>

        {/* Right: Actions */}
        <div className="flex items-center space-x-5">
          <Button
            className="rounded-none bg-[#FFF200] text-black hover:bg-[#FFF200]"
            onClick={handleOpenUpload}
          >
            Nerdy stuff
          </Button>

          {/* Avatar (opens profile modal) */}
          <button
            onClick={handleOpenProfile}
            className="bg-black rounded-full overflow-hidden w-[35px] h-[35px] p-[1.5px] flex items-center justify-center"
            aria-label="Open Profile"
          >
            <Avatar className="">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/little_wea.png"
              />
            </Avatar>
          </button>
        </div>
      </div>
    </nav>
  );
};
