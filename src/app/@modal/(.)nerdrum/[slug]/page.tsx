"use client";

import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { NerdrumModal } from "@/components/nerdrum/NerdrumModal";
import { useEffect, useRef } from "react";
import { use } from "react";

export default function NerdrumModalRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      useModalStore.getState().open(<NerdrumModal slug={slug} />);
      opened.current = true;
    }

    return () => {
      if (opened.current) {
        useModalStore.getState().close();
        opened.current = false;
      }
    };
  }, [slug]); // ✅ only slug dependency

  return null;
}
