"use client";

import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { useEffect, useRef } from "react";
import { use } from "react";

// Next.js 15: params is a promise, must unwrap with `use()`
export default function ProfileModalRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { open, close, isOpen } = useModalStore();
  const openedByThisRoute = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      open(<ProfileModal slug={slug} />);
      openedByThisRoute.current = true;
    }

    return () => {
      if (openedByThisRoute.current) {
        close();
      }
    };
  }, [slug]);

  return null;
}
