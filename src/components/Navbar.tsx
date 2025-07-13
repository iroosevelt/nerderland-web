"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";

export const Navbar = () => {
  return (
    <nav className="fixed flex items-center top-0 bg-[#FF31E2] justify-center container max-w-full inset-x-0 z-50 mx-auto">
      <ul className="flex container max-w-5xl px-4 py-4 tracking-wider justify-between items-center">
        <div className="flex items-center space-x-4">
          <Image
            src="/img/911.gif"
            alt="UFO"
            aria-label="hidden"
            width={50}
            height={50}
          />
          <Link href="/">
            <Image src="/logo.svg" alt="Logo" width={199} height={68} />
          </Link>
        </div>
        <li>
          <p className="text-sm text-[#FFF200]">
            “Inside every mystery, mystery...”
          </p>
        </li>

        <ul className="flex items-center space-x-5">
          <li>
            <Link href="/ops-unit" className="">
              <Button
                // variant="ghost"
                className="rounded-none bg-[#FFF200] text-black hover:bg-[#FFF200] cursor-pointer"
              >
                Nerdy post
              </Button>
            </Link>
          </li>
          <li className="bg-black rounded-full overflow-hidden">
            <Image
              src="/img/avatar/little_wea.png"
              alt="Avatar"
              aria-label="hidden"
              className="contain object-contain p-[1.5px]"
              width={35}
              height={35}
            />
          </li>
        </ul>
      </ul>
    </nav>
  );
};
