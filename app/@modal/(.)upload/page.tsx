"use client";

import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { UploadModal } from "@/components/upload/UploadModal";
import { useEffect, useRef } from "react";

export default function UploadModalRoute() {
  const { isOpen } = useModalStore();
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current && !isOpen) {
      useModalStore.getState().open(<UploadModal />);
      opened.current = true;
    }

    return () => {
      if (opened.current) {
        useModalStore.getState().close();
        opened.current = false;
      }
    };
  }, []);
  return null;
}
