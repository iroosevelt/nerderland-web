// components/Navbar.tsx
"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useWalletUser } from "@/hooks/useWalletUser";
import { Avatar, AvatarImage } from "./ui/avatar";
import { ConnectDialog } from "./wallet/ConnectDialog";
import { getAvatarFromLevel } from "./NerdityLevel";

const Navbar = memo(() => {
  const router = useRouter();
  const { isConnected, user, hasUsername } = useWalletUser();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [postConnectAction, setPostConnectAction] = useState<
    (() => void) | null
  >(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 10) {
        // Always show when near top
        setIsScrolled(false);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide hideable section
        setIsScrolled(true);
      } else {
        // Scrolling up - show hideable section
        setIsScrolled(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProtectedClick = useCallback(
    (callback: () => void) => {
      if (isConnected) {
        callback();
      } else {
        setPostConnectAction(() => callback);
        setShowConnectDialog(true);
      }
    },
    [isConnected]
  );

  const handleProfileClick = useCallback(() => {
    if (isConnected && user) {
      if (hasUsername && user.username) {
        router.push(`/${user.username}`);
      } else {
        router.push(`/setup-profile`);
      }
    } else {
      setShowConnectDialog(true);
    }
  }, [isConnected, user, hasUsername, router]);

  const closeDialog = useCallback(() => {
    setShowConnectDialog(false);
  }, []);

  const handleConnected = useCallback(() => {
    setShowConnectDialog(false);
    postConnectAction?.();
    setPostConnectAction(null);
  }, [postConnectAction]);


  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#FF31E2]">
        {/* Desktop/Tablet Layout - Always visible */}
        <div className="hidden md:block">
          <div className="container max-w-5xl mx-auto flex justify-between items-center px-4 sm:px-6 py-3 sm:py-2">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src="/img/911.gif"
                  alt="UFO"
                  fill
                  className="object-contain"
                  unoptimized
                  priority
                />
              </div>
              <Link href="/" prefetch={false} className="relative">
                <div className="relative w-50 h-11 sm:w-55 sm:h-11">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            <p className="text-xs text-[var(--color-yellow)] px-4">
              Inside every mystery, mystery...
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  handleProtectedClick(() => router.push("/upload"))
                }
                className="rounded-none bg-[#FFF200] py-2 px-4 text-black hover:bg-yellow-300 transition-colors text-sm font-medium"
                type="button"
              >
                Nerdy stuff
              </button>

              <button
                onClick={handleProfileClick}
                type="button"
                aria-label="Profile"
                className="flex-shrink-0"
              >
                <Avatar className="w-10 h-10 sm:w-11 sm:h-11 bg-black/10">
                  <AvatarImage
                    src={
                      user
                        ? getAvatarFromLevel(
                            user.level || 1,
                            user.nerdy_points || 0
                          )
                        : "/img/avatar/little_wea.png"
                    }
                    className="object-cover"
                    alt="Avatar"
                  />
                </Avatar>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top section - hideable on scroll */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              isScrolled ? "max-h-0 opacity-0" : "max-h-32 opacity-100"
            }`}
          >
            <div className="container max-w-5xl mx-auto flex justify-between items-center px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/img/911.gif"
                    alt="UFO"
                    fill
                    className="object-contain"
                    unoptimized
                    priority
                  />
                </div>
                <Link href="/" prefetch={false} className="relative">
                  <div className="relative w-50 h-11">
                    <Image
                      src="/logo.svg"
                      alt="Logo"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                </Link>
              </div>

              <button
                onClick={handleProfileClick}
                type="button"
                aria-label="Profile"
                className="flex-shrink-0"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={
                      user
                        ? getAvatarFromLevel(
                            user.level || 1,
                            user.nerdy_points || 0
                          )
                        : "/img/avatar/little_wea.png"
                    }
                    className="object-cover"
                    alt="Avatar"
                  />
                </Avatar>
              </button>
            </div>
            <div className="flex flex-col px-1 text-center space-y-1 pb-1">
              <p className="text-xs text-[var(--color-yellow)] px-4">
                Inside every mystery, mystery...
              </p>
            </div>
          </div>

          {/* Bottom section - always sticky */}
          <div className="flex flex-col px-1 text-center py-1">
            <button
              onClick={() => handleProtectedClick(() => router.push("/upload"))}
              className="w-full rounded-none bg-[var(--color-yellow)] py-2 px-4 text-black hover:bg-[var(--color-yellow)] transition-colors text-sm font-medium"
              type="button"
            >
              Nerdy stuff
            </button>
          </div>
        </div>
      </nav>

      <ConnectDialog
        open={showConnectDialog}
        onClose={closeDialog}
        onConnected={handleConnected}
      />
    </>
  );
});

Navbar.displayName = "Navbar";

export { Navbar };
