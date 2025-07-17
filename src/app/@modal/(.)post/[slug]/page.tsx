"use client";

import { PostModal } from "@/components/post/PostModal";
import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { useEffect, useRef } from "react";
import { use } from "react";

export default function PostModalRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      useModalStore.getState().open(<PostModal slug={slug} />);
      opened.current = true;
    }

    return () => {
      if (opened.current) {
        useModalStore.getState().close();
        opened.current = false;
      }
    };
  }, [slug]);

  return null;
}
