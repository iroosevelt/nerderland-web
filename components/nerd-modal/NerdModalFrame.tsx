"use client";

import { useModalStore } from "./useModalStore";
import { useRouter } from "next/navigation";

export function NerdModalFrame({ children }: { children: React.ReactNode }) {
  const { close } = useModalStore();
  const router = useRouter();

  const handleClose = () => {
    close();
    router.back();
  };

  return (
    <div className="relative w-full max-w-[900px] h-[90vh] md:h-[80vh] mx-4 md:mx-0 bg-black/80 border border-white/10 rounded-none shadow-2xl overflow-hidden grid grid-rows-[40px_1fr] grid-cols-1">
      <div className="flex items-center justify-start px-4 h-10 border-b border-white/10 bg-black/90">
        <div className="flex space-x-2">
          <button
            className="w-3 h-3 bg-red-500 rounded-full"
            onClick={handleClose}
          />
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 h-full overflow-auto">
        {children}
      </div>
    </div>
  );
}
