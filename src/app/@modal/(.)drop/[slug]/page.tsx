"use client";

import { DropModal } from "@/components/drop/DropModal";
import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { use, useEffect, useRef } from "react";

export default function DropModalRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      useModalStore.getState().open(<DropModal slug={slug} />);
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
