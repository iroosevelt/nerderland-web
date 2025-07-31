"use client";

import { useNavbarHeight } from "@/hooks/useNavbarHeight";
import { useRouter } from "next/navigation";
import { TiArrowBack } from "react-icons/ti";

export const TopBar = () => {
  const router = useRouter();
  const navbarHeight = useNavbarHeight();

  const handleClose = () => {
    router.back();
  };

  return (
    <div
      data-topbar
      className="sticky flex items-center justify-start px-4 py-2 border-b border-white/10 bg-black/90 z-20"
      style={{ top: `${navbarHeight}px` }}
    >
      <div className="flex space-x-2">
        <button
          className="text-[var(--color-yellow)] text-xs space-x-3 uppercase flex items-center font-mono"
          onClick={handleClose}
        >
          <TiArrowBack size={24} />
        </button>
      </div>
    </div>
  );
};
